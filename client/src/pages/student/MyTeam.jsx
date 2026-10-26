import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Layers, Hash, Crown, UserPlus, ClipboardList, Lightbulb, CalendarDays, FileText, Trash2,
} from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx';
import { fullName, formatDate } from '../../utils/format.js';

export default function MyTeam() {
  const [team, setTeam] = useState(undefined);
  const [membershipRole, setMembershipRole] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { team: t, membershipRole: role } = await teamService.mine();
        if (alive) {
          setTeam(t);
          setMembershipRole(role || null);
        }
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load your team.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const isLeader = membershipRole === 'LEADER' || team?.members?.some(
    (m) => m.role === 'LEADER' && m.user?._id
  );
  const approved = team?.status === 'APPROVED';

  const handleDeleteTeam = async () => {
    setDeleting(true);
    try {
      await teamService.delete(team._id);
      toast.success('Team deleted successfully.');
      setTeam(null); // back to the empty state — team is gone
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete the team. Please try again.');
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (team === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton className="lg:col-span-2" lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={Users}
        title="You're not in a team yet"
        message="Access a project with your Project ID, then create a team or join one with a Team Code."
        action={
          <Link to="/student/project/access">
            <Button icon={Hash}>Access Project</Button>
          </Link>
        }
      />
    );
  }

  const project = team.projectId;
  const title = team.projectTitleId;
  const members = team.members || [];
  const maxMembers = project?.maxTeamMembers || members.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {team.teamLogo?.url ? (
            <img
              src={team.teamLogo.url}
              alt={`${team.teamName} logo`}
              className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-950 text-lg font-bold text-teal-300">
              {team.teamName?.[0]?.toUpperCase() || 'T'}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-navy-950">{team.teamName}</h1>
              <StatusBadge status={team.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <CodeChip code={team.teamCode} size="sm" label="Team Code" />
              <span aria-hidden>·</span>
              <span>{members.length} / {maxMembers} members</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLeader && (
            <Button
              variant="outline"
              icon={Trash2}
              onClick={() => setConfirmOpen(true)}
              disabled={deleting || approved}
              title={approved ? 'Approved teams can no longer be deleted' : 'Delete this team'}
              className={approved ? '' : 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50'}
            >
              Delete Team
            </Button>
          )}
          <Link to="/student/status">
            <Button variant="outline" icon={ClipboardList}>Project Status</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: statements */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Project Title" icon={Layers} action={title ? <StatusBadge status={title.status} /> : undefined} />
            {title ? (
              <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
                <p className="font-semibold text-navy-900">{title.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Project: {project?.projectName} · Ends {formatDate(project?.endDate)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No title allocated yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Problem Statement" icon={ClipboardList} />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{team.problemStatement}</p>
          </Card>

          <Card>
            <CardHeader title="Proposed Solution" icon={Lightbulb} />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{team.proposedSolution}</p>
          </Card>
        </div>

        {/* Right: members + meta */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Members"
              subtitle={`${members.length} / ${maxMembers}`}
              icon={Users}
              action={
                members.length < maxMembers ? (
                  <Link to="/student/team/join">
                    <Button variant="ghost" size="xs" icon={UserPlus}>Invite</Button>
                  </Link>
                ) : (
                  <StatusBadge status="ASSIGNED" />
                )
              }
            />
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.id || m.user?._id} className="flex items-center gap-3">
                  <Avatar user={m.user} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">
                      {fullName(m.user)} {m.role === 'LEADER' && <Crown size={13} className="mb-0.5 inline text-amber-500" aria-label="Team leader" />}
                    </p>
                    <p className="truncate text-xs text-slate-400">{m.user?.email}</p>
                  </div>
                  <StatusBadge status={m.role} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Project" icon={CalendarDays} />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Project ID</dt>
                <dd><CodeChip code={project?.projectId} size="sm" label="Project ID" /></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">End date</dt>
                <dd className="font-medium text-navy-900">{formatDate(project?.endDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Max team size</dt>
                <dd className="font-medium text-navy-900">{maxMembers}</dd>
              </div>
            </dl>
            <Link to={`/student/project/${project?.projectId}`} className="mt-4 block">
              <Button variant="subtle" size="sm" className="w-full" icon={FileText}>
                View Project Details
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Delete confirmation (leader only) */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={handleDeleteTeam}
        title="Delete Team?"
        message="Are you sure you want to delete this team? This action cannot be undone."
        confirmLabel="Delete Team"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
