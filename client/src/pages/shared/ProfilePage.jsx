import { useAuth } from '../../context/AuthContext.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { formatDate, fullName } from '../../utils/format.js';
import { Mail, ShieldCheck, CalendarDays } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Profile</h1>
        <p className="mt-1.5 text-sm text-slate-500">Your account details and role.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-bold text-navy-950">{fullName(user)}</p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
          <Badge tone={user?.role === 'faculty' ? 'navy' : 'teal'} className="ml-auto capitalize">
            {user?.role}
          </Badge>
        </div>
      </Card>

      <Card>
        <CardHeader title="Account Details" icon={ShieldCheck} />
        <dl className="divide-y divide-slate-100">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: ShieldCheck, label: 'Role', value: user?.role?.[0]?.toUpperCase() + user?.role?.slice(1) },
            { icon: CalendarDays, label: 'Member since', value: formatDate(user?.createdAt) },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 py-3.5">
              <row.icon size={16} className="text-slate-400" aria-hidden />
              <dt className="w-32 shrink-0 text-sm text-slate-500">{row.label}</dt>
              <dd className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">{row.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Security" icon={ShieldCheck} subtitle="Your password is stored as a bcrypt hash — it can never be read." />
        <p className="text-sm leading-relaxed text-slate-500">
          Sessions are protected with signed JWTs and expire automatically. If you suspect unauthorized access,
          log out from all devices by changing your password (contact your administrator if you've lost access).
        </p>
      </Card>
    </div>
  );
}
