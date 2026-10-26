import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, ClipboardCheck, Activity, User, Settings, LogOut,
  Menu, X, Bell, WifiOff, ChevronRight,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { formatDateTime } from '../utils/format.js';

const NAV = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/project/access', label: 'My Project', icon: FolderKanban },
    { to: '/student/team', label: 'My Team', icon: Users },
    { to: '/student/team/join', label: 'Join Team', icon: ClipboardCheck },
    { to: '/student/status', label: 'Project Status', icon: Activity },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ],
  faculty: [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/projects', label: 'Projects', icon: FolderKanban },
    { to: '/faculty/teams', label: 'Teams', icon: Users },
    { to: '/faculty/approvals', label: 'Approvals', icon: ClipboardCheck },
    { to: '/faculty/monitoring', label: 'Monitoring', icon: Activity },
    { to: '/faculty/profile', label: 'Profile', icon: User },
    { to: '/faculty/settings', label: 'Settings', icon: Settings },
  ],
};

function SidebarContent({ role, onNavigate }) {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();

  const items = NAV[role] || [];
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="min-w-0">
          <Logo h={24} withText textClass="text-white" />
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-navy-200 leading-none">
            {role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/student/dashboard' || to === '/faculty/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-teal-300' : 'text-navy-300 group-hover:text-navy-100'} aria-hidden />
                <span className="flex-1">{label}</span>
                {label === 'Approvals' && unreadCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-navy-900">
                    {unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-navy-300">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/?loggedOut=1');
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-white/5 hover:text-white focus-ring"
        >
          <LogOut size={17} aria-hidden />
          Logout
        </button>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useState(null);

  return (
    <div className="relative" ref={(el) => ref && (ref.current = el)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-ring"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-2 w-[min(88vw,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-overlay"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-navy-900">Notifications</p>
                {unreadCount > 0 && <Badge tone="amber">{unreadCount} new</Badge>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id || n.id}
                      onClick={() => markNotificationRead(n._id || n.id)}
                      className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        !n.read ? 'bg-brand-50/50' : ''
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-navy-900">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />}
                      </span>
                      <span className="line-clamp-2 text-xs text-slate-500">{n.message}</span>
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardLayout({ role }) {
  const { user, offline, socketConnected } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the drawer on navigation.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  // Redirect if the wrong role opens this layout.
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.role !== role) {
      navigate(user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  const current = (NAV[role] || []).find((i) => location.pathname.startsWith(i.to));

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-950 lg:block" aria-label="Sidebar">
        <SidebarContent role={role} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 w-72 bg-navy-950 shadow-overlay"
              aria-label="Navigation drawer"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-navy-300 hover:bg-white/10 hover:text-white focus-ring"
              >
                <X size={18} />
              </button>
              <SidebarContent role={role} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-ring lg:hidden"
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb" className="hidden sm:block">
              <ol className="flex items-center gap-1 text-sm text-slate-500">
                <li>{role === 'faculty' ? 'Faculty' : 'Student'}</li>
                {current && (
                  <>
                    <li aria-hidden><ChevronRight size={13} className="text-slate-300" /></li>
                    <li className="font-medium text-navy-900" aria-current="page">{current.label}</li>
                  </>
                )}
              </ol>
            </nav>
            <p className="text-sm font-semibold text-navy-900 sm:hidden">{current?.label || 'ProjectDesk'}</p>
          </div>
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium md:inline-flex ${
              socketConnected ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
            }`}
            title={socketConnected ? 'Live updates connected' : 'Live updates reconnecting…'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-teal-500' : 'bg-slate-300'}`} aria-hidden />
            {socketConnected ? 'Live' : 'Offline mode'}
          </span>
          <NotificationBell />
          <Avatar user={user} size="md" className="hidden sm:inline-grid" />
        </header>

        <AnimatePresence>
          {offline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-900">
                <WifiOff size={15} aria-hidden />
                You're offline — check your internet connection. Actions will fail until you're back online.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
