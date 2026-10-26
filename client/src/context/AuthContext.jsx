import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/auth.service.js';
import { sessionHandlers } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [offline, setOffline] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowCount = useRef(0);

  const token = () => localStorage.getItem('pd_token');

  const clearSession = useCallback(() => {
    localStorage.removeItem('pd_token');
    localStorage.removeItem('pd_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Bootstrap session from stored token.
  useEffect(() => {
    const boot = async () => {
      if (!token()) {
        setBooting(false);
        return;
      }
      try {
        const { user: me } = await authService.me();
        setUser(me);
        localStorage.setItem('pd_user', JSON.stringify(me));
      } catch {
        clearSession();
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, [clearSession]);

  // Wire global session/network handlers.
  useEffect(() => {
    sessionHandlers.onUnauthorized = (message) => {
      clearSession();
      setSessionExpired(message || 'Your session has expired. Please log in again.');
    };
    sessionHandlers.onOffline = () => setOffline(true);
    sessionHandlers.onSlowNetwork = (isSlow) => {
      slowCount.current += isSlow ? 1 : -1;
      setSlow(slowCount.current > 0);
    };
    const online = () => setOffline(false);
    const offlineFn = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offlineFn);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offlineFn);
    };
  }, [clearSession]);

  // Live notifications over Socket.IO (non-critical; app polls on load too).
  const { connected } = useSocket(user ? token() : null, (payload) => {
    setNotifications((prev) => [payload, ...prev].slice(0, 30));
    setUnreadCount((c) => c + 1);
  });

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { notificationService } = await import('../services/dashboard.service.js');
      const { notifications: list, unread } = await notificationService.list();
      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      /* non-critical */
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshNotifications();
  }, [user, refreshNotifications]);

  const login = useCallback(async (email, password, role) => {
    const data = await authService.login({ email, password, role });
    localStorage.setItem('pd_token', data.token);
    localStorage.setItem('pd_user', JSON.stringify(data.user));
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem('pd_token', data.token);
    localStorage.setItem('pd_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionExpired(false);
  }, [clearSession]);

  // Merge refreshed profile data (e.g. after a photo upload) into the session.
  const updateUser = useCallback((updated) => {
    setUser((prev) => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      if (next) localStorage.setItem('pd_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const { notificationService } = await import('../services/dashboard.service.js');
      await notificationService.markRead(id);
    } catch {
      /* non-critical */
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      logout,
      updateUser,
      sessionExpired,
      dismissSessionExpired,
      offline,
      slow,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      socketConnected: connected,
    }),
    [
      user,
      booting,
      login,
      register,
      logout,
      updateUser,
      sessionExpired,
      dismissSessionExpired,
      offline,
      slow,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      connected,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
