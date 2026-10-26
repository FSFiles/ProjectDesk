import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Users, ClipboardCheck, Activity, Layers, ArrowRight, Plus, CheckCircle2, Clock,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import StatCard from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await dashboardService.faculty();
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load your dashboard.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (data === undefined) return <PageSkeleton />;

  const { stats, recentProjects, recentTeams, teamStatusOverview } = data;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">
            Welcome, Prof. {user?.lastName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's the overview of your student projects.</p>
        </div>
        <Link to="/faculty/projects/create">
          <Button icon={Plus}>Create Project</Button>
        </Link>
      </div>

      {/* Bento stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} tone="brand" label="Total Projects" value={stats.totalProjects} sub={`${stats.activeProjects} active`} />
        <StatCard icon={Users} tone="teal" label="Total Teams" value={stats.totalTeams} sub={`${stats.totalStudents} students enrolled`} />
        <StatCard icon={ClipboardCheck} tone="amber" label="Pending Approvals" value={stats.pendingApprovals} sub={stats.pendingApprovals > 0 ? 'Awaiting your review' : 'All caught up'} />
        <StatCard icon={Activity} tone="violet" label="Active Projects" value={stats.activeProjects} sub={`${stats.totalTitles} titles · ${stats.assignedTitles} assigned`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent projects */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="px-5 pt-5">
            <CardHeader
              title="Recent Projects"
              icon={FolderKanban}
              action={
                <Link to="/faculty/projects">
                  <Button variant="ghost" size="xs" icon={ArrowRight}>View all</Button>
                </Link>
              }
            />
          </div>
          {recentProjects.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                message="Create your first project to start managing student teams and approvals."
                action={
                  <Link to="/faculty/projects/create">
                    <Button icon={Plus}>Create Project</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {recentProjects.map((p) => (
                <li key={p._id} className="flex items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <Link to={`/faculty/projects/${p._id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-brand-700">
                      {p.projectName}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                      <span className="font-mono">{p.projectId}</span>
                      <span aria-hidden>·</span>
                      <span>Ends {formatDate(p.endDate)}</span>
                    </p>
                  </div>
                  <StatusBadge status={p.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Status overview */}
        <Card>
          <CardHeader title="Team Status Overview" icon={Activity} />
          <div className="space-y-3">
            {[
              ['PENDING', 'Pending', 'amber'],
              ['APPROVED', 'Approved', 'teal'],
              ['CHANGES_REQUESTED', 'Changes Requested', 'violet'],
              ['REJECTED', 'Rejected', 'red'],
            ].map(([key, label, tone]) => {
              const value = teamStatusOverview[key] || 0;
              const pct = stats.totalTeams ? Math.round((value / stats.totalTeams) * 100) : 0;
              const bar = { amber: 'bg-amber-400', teal: 'bg-teal-500', violet: 'bg-violet-500', red: 'bg-red-400' }[tone];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-navy-900">{value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-lg font-bold text-navy-950">{stats.availableTitles}</p>
              <p className="text-xs text-slate-500">Titles free</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-lg font-bold text-navy-950">{stats.assignedTitles}</p>
              <p className="text-xs text-slate-500">Titles assigned</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending approvals strip */}
      <Card>
        <CardHeader
          title="Teams Awaiting Review"
          icon={Clock}
          action={
            <Link to="/faculty/approvals">
              <Button variant="subtle" size="sm" icon={ArrowRight}>Open Approvals</Button>
            </Link>
          }
        />
        {recentTeams.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No teams yet — share your Project ID with students.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentTeams.slice(0, 4).map((t) => (
              <li key={t._id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-950 text-sm font-bold text-teal-300">
                  {t.teamName?.[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">{t.teamName}</p>
                  <p className="truncate text-xs text-slate-400">
                    {t.projectTitleId?.title || 'No title'} · {t.projectId?.projectName}
                  </p>
                </div>
                <StatusBadge status={t.status} className="shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
