import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function StudentLogin() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user?.role === 'student') navigate('/student/dashboard', { replace: true });
    if (user?.role === 'faculty') navigate('/faculty/dashboard', { replace: true });
  }, [user, navigate]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  const validate = () => {
    const er = {};
    if (!form.email.trim()) er.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password, 'student');
      toast.success('Welcome back to ProjectDesk!');
      navigate(location.state?.from || '/student/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.friendlyMessage || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      headline="Welcome back, student."
      subline="Enter your Project ID, build your team, allocate a title and track your approval — all in one place."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-navy-950">Student Login</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          New here?{' '}
          <Link to="/student/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
      </div>

      {location.state?.registered && (
        <div className="mb-5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Account created successfully. You can log in now.
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          icon={Mail}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={Lock}
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} icon={LogIn}>
          {submitting ? 'Logging in…' : 'Login'}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center">
        <p className="text-sm text-slate-500">
          Are you a faculty member?{' '}
          <Link to="/faculty/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Use the faculty portal
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
