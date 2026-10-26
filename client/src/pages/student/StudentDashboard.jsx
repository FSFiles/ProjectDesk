import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Users, Layers, ClipboardCheck, CalendarDays, Hash, ArrowRight, Plus, UserPlus, Rocket, Trash2,
} from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import StatCard from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { PageSkeleton, CardSkeleton } from '../../components/ui/Loading.jsx';
import { ErrorState } from '../../components/ui/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, daysLeft, fullName } from '../../utils/format.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(undefined); // undefined = loading, null = no team
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
        if (alive) setError(err.friendlyMessage || "We couldn't load your dashboard.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const isLeader = membershipRole === 'LEADER' || !!team?.members?.some((m) => m.role === 'LEADER');
  const approved = team?.status === 'APPROVED';

  const handleDeleteTeam = async () => {
    setDeleting(true);
    try {
      await teamService.delete(team._id);
      toast.success('Team deleted successfully.');
      setTeam(null); // dashboard falls back to the empty state
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete the team. Please try again.');
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }
  if (team === undefined) {
    return <PageSkeleton />;
  }

  const project = team?.projectId;
  const title = team?.projectTitleId;
  const memberCount = team?.members?.length || 0;
  const maxMembers = project?.maxTeamMembers || 0;
  const left = daysLeft(project?.endDate);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {team
              ? 'Here is the latest on your project and team.'
              : 'You are not part of a team yet. Access a project to get started.'}
          </p>
        </div>
        {!team && (
          <Link to="/student/project/access">
            <Button icon={Hash}>Access Project</Button>
          </Link>
        )}
      </div>

      {!team ? (
        /* Empty state — no team yet */
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                <Rocket size={26} aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-navy-900">No project yet</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                  Enter the Project ID shared by your faculty to view project details, available titles and create your team.
                </p>
              </div>
              <Link to="/student/project/access">
                <Button icon={Hash}>Enter Project ID</Button>
              </Link>
            </div>
          </Card>
          <Card>
            <CardHeader title="How it works" icon={ClipboardCheck} />
            <ol className="space-y-3 text-sm text-slate-600">
              {['Enter the Project ID from your faculty', 'Create a team and pick an available title', 'Share your Team Code with members', 'Get faculty approval and track status'].map((s, i) => (
                <li key={s} className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-bold text-brand-600">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ) : (
        /* Bento overview */
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FolderKanban} tone="brand" label="My Project" value={project?.projectName || '—'} sub={project ? `ID available below` : undefined} className="sm:col-span-2" />
            <StatCard icon={Users} tone="teal" label="My Team" value={team.teamName} sub={`${memberCount} / ${maxMembers} members`} />
            <StatCard
              icon={ClipboardCheck}
              tone={team.status === 'APPROVED' ? 'teal' : team.status === 'REJECTED' ? 'red' : team.status === 'CHANGES_REQUESTED' ? 'violet' : 'amber'}
              label="Approval Status"
              value={<StatusBadge status={team.status} />}
              sub="Faculty review"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Project details */}
            <Card className="lg:col-span-2">
              <CardHeader
                title={project?.projectName}
                subtitle={project ? `Ends ${formatDate(project.endDate)}${left !== null ? ` · ${left >= 0 ? `${left} days left` : 'ended'}` : ''}` : undefined}
                icon={FolderKanban}
                action={
                  <Link to={`/student/project/${project?.projectId}`}>
                    <Button variant="subtle" size="sm" icon={ArrowRight}>
                      View Project
                    </Button>
                  </Link>
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Project ID</p>
                  <div className="mt-2">
                    <CodeChip code={project?.projectId} size="sm" label="Project ID" />
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Team Code</p>
                  <div className="mt-2">
                    <CodeChip code={team.teamCode} size="sm" label="Team Code" />
                  </div>
                </div>
              </div>
              {title && (
                <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-brand-100 bg-brand-50/60 p-3.5">
                  <Layers size={17} className="shrink-0 text-brand-600" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-500">Allocated Title</p>
                    <p className="truncate text-sm font-semibold text-navy-900">{title.title}</p>
                  </div>
                  <StatusBadge status={title.status} className="ml-auto shrink-0" />
                </div>
              )}
            </Card>

            {/* Members */}
            <Card>
              <CardHeader
                title="Team Members"
                subtitle={`${memberCount} / ${maxMembers}`}
                icon={Users}
                action={
                  <span className="flex items-center gap-1">
                    {isLeader && !approved && (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        onClick={() => setConfirmOpen(true)}
                        disabled={deleting}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete Team
                      </Button>
                    )}
                    {memberCount < maxMembers && (
                      <Link to="/student/team/join">
                        <Button variant="ghost" size="xs" icon={UserPlus}>Add</Button>
                      </Link>
                    )}
                  </span>
                }
              />
              <ul className="space-y-2.5">
                {team.members?.map((m) => (
                  <li key={m.id || m.user?._id} className="flex items-center gap-3">
                    <Avatar user={m.user} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{fullName(m.user)}</span>
                    <StatusBadge status={m.role} />
                  </li>
                ))}
              </ul>
              {team.status === 'CHANGES_REQUESTED' && (
                <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs leading-relaxed text-violet-800">
                  Faculty requested changes. Update your problem statement or solution and await re-review.
                </div>
              )}
            </Card>
          </div>

          {/* Dates strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarDays} tone="navy" label="Project End Date" value={formatDate(project?.endDate)} sub={left !== null && left >= 0 ? `${left} days remaining` : 'Project ended'} />
            <StatCard icon={Layers} tone="violet" label="Project Title" value={<span className="text-base leading-snug">{title?.title || '—'}</span>} />
            <StatCard icon={Users} tone="teal" label="Team Size" value={`${memberCount} / ${maxMembers}`} sub={memberCount >= maxMembers ? 'Team is full' : `${maxMembers - memberCount} slot(s) open`} />
          </div>
        </>
      )}

      {/* Delete team confirmation (leader only) */}
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
