import axios from 'axios';

/**
 * API base resolution:
 * - VITE_API_URL if explicitly set (production deploys),
 * - otherwise same-origin '/api' — the Vite dev proxy forwards to :5000,
 *   so the client works on 5173 OR 5174 without any CORS/port coupling.
 */
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Auth session listeners (wired by AuthContext). */
export const sessionHandlers = {
  onUnauthorized: null, // called on 401 → session expired
  onSlowNetwork: null, // called when a request exceeds SLOW_TIMEOUT
  onOffline: null, // called when the network drops
};

const SLOW_TIMEOUT = 8000; // ms before the "still working..." state fires

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach JWT + start the slow-network timer.
client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('pd_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.metadata = { start: Date.now() };
  cfg.slowTimer = setTimeout(() => {
    sessionHandlers.onSlowNetwork?.(true);
  }, SLOW_TIMEOUT);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    sessionHandlers.onOffline?.();
  }
  return cfg;
});

// Clear the timer, normalize errors into friendly messages.
client.interceptors.response.use(
  (res) => {
    clearTimeout(res.config.slowTimer);
    sessionHandlers.onSlowNetwork?.(false);
    return res;
  },
  (err) => {
    clearTimeout(err.config?.slowTimer);
    sessionHandlers.onSlowNetwork?.(false);

    if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        err.friendlyMessage = "You're offline. Check your internet connection and try again.";
      } else {
        err.friendlyMessage = 'Unable to connect to the server. Please check your connection and try again.';
      }
      return Promise.reject(err);
    }

    const { status, data } = err.response;

    if (status === 401) {
      // Token invalid or expired → session expired flow.
      sessionHandlers.onUnauthorized?.(data?.message);
      err.friendlyMessage = data?.message || 'Your session has expired. Please log in again.';
      return Promise.reject(err);
    }

    err.friendlyMessage =
      data?.message ||
      (status === 403
        ? 'Access restricted. You do not have permission to do this.'
        : status === 404
          ? 'Not found.'
          : status >= 500
            ? 'Something went wrong on our side. Please try again.'
            : 'Request failed. Please try again.');
    err.details = data?.details;
    err.statusCode = status;
    return Promise.reject(err);
  }
);

export default client;
