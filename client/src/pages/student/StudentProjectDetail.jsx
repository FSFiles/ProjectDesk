import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FolderKanban, Layers, CalendarDays, Users, FileText, Download, Plus, UserPlus, ClipboardList, Info,
} from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Button from '../../components/ui/Button.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { ErrorState } from '../../components/ui/EmptyState.jsx';
import { formatDate, daysLeft } from '../../utils/format.js';
import { useToast } from '../../components/ui/Toast.jsx';

export default function StudentProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(undefined);
    (async () => {
      try {
        const d = await projectService.access(projectId);
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load this project.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId, reloadKey]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Project not available"
          message={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => navigate('/student/project/access')}>
            Enter a different Project ID
          </Button>
        </div>
      </div>
    );
  }
  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  const { project, titles, myTeam } = data;
  const available = titles.filter((t) => t.status === 'AVAILABLE').length;
  const left = daysLeft(project.endDate);
  const projectEnded = project.status !== 'ACTIVE' || (left !== null && left < 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">{project.projectName}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <CodeChip code={project.projectId} size="sm" label="Project ID" />
            <span aria-hidden>·</span>
            <span>
              Faculty: <span className="font-medium text-slate-700">{project.faculty ? `${project.faculty.firstName} ${project.faculty.lastName}` : '—'}</span>
            </span>
          </div>
        </div>
        {myTeam ? (
          <Link to="/student/team">
            <Button icon={Users}>Go to My Team</Button>
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link to={`/student/team/create?projectId=${project.id}&code=${project.projectId}`}>
              <Button icon={Plus} disabled={projectEnded}>Create Team</Button>
            </Link>
            <Link to="/student/team/join">
              <Button variant="outline" icon={UserPlus} disabled={projectEnded}>Join Team</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><Layers size={15} aria-hidden /> Titles Available</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{available} <span className="text-sm font-medium text-slate-400">/ {titles.length}</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><Users size={15} aria-hidden /> Max Team Size</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{project.maxTeamMembers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><CalendarDays size={15} aria-hidden /> End Date</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{formatDate(project.endDate)}</p>
          {left !== null && <p className="mt-0.5 text-xs text-slate-400">{left >= 0 ? `${left} days left` : 'Ended'}</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><ClipboardList size={15} aria-hidden /> Your Status</p>
          <p className="mt-2.5">{myTeam ? <StatusBadge status={myTeam.status} /> : <span className="text-sm text-slate-400">Not in a team yet</span>}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader title="Instructions" icon={Info} />
          {project.instructions ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{project.instructions}</p>
          ) : (
            <p className="text-sm text-slate-400">No instructions provided.</p>
          )}
          {project.instructionsPdf?.url && (
            <a
              href={project.instructionsPdf.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 focus-ring"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-500">
                <FileText size={17} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy-900">
                  {project.instructionsPdf.originalName || 'Instructions PDF'}
                </span>
                <span className="text-xs text-slate-500">Open instructions PDF</span>
              </span>
              <Download size={16} className="text-slate-400" aria-hidden />
            </a>
          )}
        </Card>

        {/* Titles */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Project Titles"
            subtitle="First come, first served — one team per title"
            icon={Layers}
            action={<StatusBadge status={available > 0 ? 'AVAILABLE' : 'ASSIGNED'} />}
          />
          {titles.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No titles published yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {titles.map((t) => (
                <li key={t._id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-navy-900">{t.title}</span>
                  <StatusBadge status={t.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
          {!myTeam && !projectEnded && (
            <div className="mt-4 rounded-lg bg-brand-50/70 p-3.5 text-sm text-brand-800">
              Ready to start? <Link to={`/student/team/create?projectId=${project.id}&code=${project.projectId}`} className="font-semibold underline">Create your team</Link> to claim an available title.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
