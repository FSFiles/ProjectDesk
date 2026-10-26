import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Info } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function FacultyLogin() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user?.role === 'faculty') navigate('/faculty/dashboard', { replace: true });
    if (user?.role === 'student') navigate('/student/dashboard', { replace: true });
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
      await login(form.email.trim(), form.password, 'faculty');
      toast.success('Welcome to the faculty portal');
      navigate('/faculty/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.friendlyMessage || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      headline="Faculty Portal."
      subline="Publish projects with unique IDs, review team proposals and monitor every student project from proposal to evaluation."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-navy-950">Faculty Login</h2>
        <p className="mt-1.5 text-sm text-slate-500">Access is restricted to faculty accounts.</p>
      </div>

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
          placeholder="faculty@college.edu"
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
        <Button type="submit" size="lg" className="w-full" loading={submitting} icon={ShieldCheck}>
          {submitting ? 'Logging in…' : 'Login to Faculty Portal'}
        </Button>
      </form>

      {/* Informational notice (not an error) */}
      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-brand-100 bg-brand-50/70 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden />
        <p className="text-sm leading-relaxed text-brand-900">
          Faculty access is restricted. Please contact the Administrative Office for login credentials.
        </p>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center">
        <p className="text-sm text-slate-500">
          Student?{' '}
          <Link to="/student/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Use the student portal
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
