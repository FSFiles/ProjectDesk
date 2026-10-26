import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Socket URL: explicit VITE_SOCKET_URL (production), otherwise same-origin —
 * the Vite proxy does not forward websockets by default, so in dev we target
 * the API origin directly; both 5173/5174 pages are allowed by dev CORS.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : undefined);

/**
 * Connects a socket for the signed-in user and listens for new notifications.
 * The app never depends on the socket for correctness — it's an enhancement.
 */
export function useSocket(token, onNotification) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return undefined;
    }
    const socket = io(SOCKET_URL, { auth: { token }, reconnectionAttempts: 5 });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('notification:new', (payload) => cbRef.current?.(payload));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return { connected };
}
