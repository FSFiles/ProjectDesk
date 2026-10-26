import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, User } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function StudentRegister() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // from API details

  useEffect(() => {
    if (user) navigate(user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard', { replace: true });
  }, [user, navigate]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setFieldErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  const validate = () => {
    const er = {};
    if (!form.firstName.trim()) er.firstName = 'First name is required';
    if (!form.lastName.trim()) er.lastName = 'Last name is required';
    if (!form.email.trim()) er.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    else if (form.password.length < 8) er.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      er.password = 'Password must contain at least one letter and one number';
    if (form.confirmPassword !== form.password) er.confirmPassword = 'Passwords do not match';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created. Welcome to ProjectDesk!');
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      if (err.details?.length) {
        const map = {};
        err.details.forEach((d) => {
          map[d.field] = d.message;
        });
        setFieldErrors(map);
      }
      setServerError(err.friendlyMessage || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      headline="Start your project journey."
      subline="Register once — then join projects with a Project ID, form your team and track approvals in real time."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-navy-950">Student Registration</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/student/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="Leon"
            icon={User}
            value={form.firstName}
            onChange={set('firstName')}
            error={errors.firstName || fieldErrors.firstName}
            required
          />
          <Input
            label="Last name"
            placeholder="D'Souza"
            value={form.lastName}
            onChange={set('lastName')}
            error={errors.lastName || fieldErrors.lastName}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          icon={Mail}
          value={form.email}
          onChange={set('email')}
          error={errors.email || fieldErrors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={Lock}
          value={form.password}
          onChange={set('password')}
          error={errors.password || fieldErrors.password}
          hint="Use 8+ characters with at least one letter and one number."
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          icon={Lock}
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          required
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} icon={UserPlus}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
        Faculty? <Link to="/faculty/login" className="font-semibold text-brand-600 hover:text-brand-700">Use the faculty portal</Link>
      </p>
    </AuthLayout>
  );
}
