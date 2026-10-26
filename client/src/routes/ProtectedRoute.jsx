import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui/Loading.jsx';

/** Blocks unauthenticated users; remembers where they were heading. */
export function RequireAuth({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <Spinner size={28} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/student/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

/** Blocks wrong-role users and sends them to their own portal. */
export function RequireRole({ role, children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <Spinner size={28} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={role === 'faculty' ? '/faculty/login' : '/student/login'} state={{ from: location.pathname }} replace />;
  }
  if (user.role !== role) {
    // Permission denied: send them to their own dashboard.
    return <Navigate to={user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
}
