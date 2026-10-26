import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ClipboardList, Layers, Users, CheckCircle2, XCircle, UndoDot, Clock } from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Button from '../../components/ui/Button.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx';
import { formatDateTime } from '../../utils/format.js';

const TIMELINE = [
  { key: 'team', label: 'Team Created', icon: Users },
  { key: 'title', label: 'Title Allocated', icon: Layers },
  { key: 'submitted', label: 'Proposal Submitted', icon: ClipboardList },
  { key: 'review', label: 'Faculty Review', icon: Activity },
];

export default function StudentStatus() {
  const [team, setTeam] = useState(undefined);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { team: t } = await teamService.mine();
        if (!alive) return;
        setTeam(t);
        if (t?._id) {
          const d = await teamService.detail(t._id);
          if (alive) setDetail(d);
        }
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load your project status.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (team === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-56" />
        <CardSkeleton lines={7} />
      </div>
    );
  }
  if (!team) {
    return (
      <EmptyState
        icon={Activity}
        title="No project status yet"
        message="Once you create or join a team, your approval status and timeline will appear here."
        action={
          <Link to="/student/project/access">
            <Button>Access Project</Button>
          </Link>
        }
      />
    );
  }

  const stepIndex = (() => {
    if (['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(team.status)) return 3;
    return 2; // proposal submitted, awaiting review
  })();

  const latestApproval = detail?.approvals?.[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Project Status</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {team.teamName} · <span className="font-mono">{team.teamCode}</span>
        </p>
      </div>

      <Card>
        <CardHeader
          title="Approval Journey"
          icon={Activity}
          action={<StatusBadge status={team.status} />}
        />
        <ol className="relative space-y-6 border-l-2 border-slate-100 pl-6">
          {TIMELINE.map((s, i) => {
            const done = i <= stepIndex;
            const rejected = team.status === 'REJECTED' && i === 3;
            return (
              <li key={s.key} className="relative">
                <span
                  className={`absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full border-2 ${
                    rejected
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : done
                        ? 'border-teal-200 bg-teal-50 text-teal-600'
                        : 'border-slate-200 bg-white text-slate-300'
                  }`}
                >
                  {rejected ? <XCircle size={13} /> : done ? <CheckCircle2 size={13} /> : <s.icon size={12} />}
                </span>
                <p className={`text-sm font-semibold ${done ? 'text-navy-900' : 'text-slate-400'}`}>
                  {s.label}
                  {rejected && <span className="ml-2 text-xs font-medium text-red-500">— team was rejected</span>}
                </p>
                {i === 3 && latestApproval && (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="flex items-center gap-2">
                      <StatusBadge status={latestApproval.status} />
                      <span className="text-xs text-slate-400">{formatDateTime(latestApproval.reviewedAt || latestApproval.createdAt)}</span>
                    </p>
                    {latestApproval.remarks && (
                      <p className="mt-1.5 leading-relaxed text-slate-600">
                        <span className="font-medium text-slate-700">Remarks:</span> {latestApproval.remarks}
                      </p>
                    )}
                  </div>
                )}
                {i === 2 && team.status === 'PENDING' && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                    <Clock size={12} aria-hidden /> Waiting for faculty review
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {team.status === 'CHANGES_REQUESTED' && latestApproval?.remarks && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardHeader title="Changes Requested by Faculty" icon={UndoDot} />
          <p className="text-sm leading-relaxed text-violet-900">{latestApproval.remarks}</p>
          <p className="mt-2 text-xs text-violet-600">
            Coordinate with your team, refine your proposal, and your faculty will re-review.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader title="Quick Summary" icon={Layers} />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Project</dt>
            <dd className="mt-1 text-sm font-medium text-navy-900">{team.projectId?.projectName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Project ID</dt>
            <dd className="mt-1"><CodeChip code={team.projectId?.projectId} size="sm" /></dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Allocated Title</dt>
            <dd className="mt-1 text-sm font-medium text-navy-900">{team.projectTitleId?.title || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Team</dt>
            <dd className="mt-1 text-sm font-medium text-navy-900">{team.teamName} · {team.members?.length} member(s)</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
