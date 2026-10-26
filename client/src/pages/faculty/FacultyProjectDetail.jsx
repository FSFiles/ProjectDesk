import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FolderKanban, Layers, Users, CalendarDays, FileText, Download, ClipboardCheck, ArrowLeft, UsersRound, Trash2,
} from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { ErrorState } from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

export default function FacultyProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectService.delete(projectId);
      toast.success('Project deleted successfully.');
      navigate('/faculty/projects', { replace: true });
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete the project. Please try again.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setData(undefined);
    (async () => {
      try {
        const d = await projectService.getForFaculty(projectId);
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
      <div className="space-y-4">
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/faculty/projects')} icon={ArrowLeft}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-80" />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={6} />
        </div>
      </div>
    );
  }

  const { project, titles, teams } = data;
  const available = titles.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/faculty/projects')} className="-ml-2 mb-2">
          Projects
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-navy-950">{project.projectName}</h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="mt-2">
              <CodeChip code={project.projectId} size="md" label="Project ID" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/faculty/teams?projectId=${project._id}`}>
              <Button variant="outline" icon={Users}>View Teams</Button>
            </Link>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Facts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><Layers size={15} aria-hidden /> Titles</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{available} <span className="text-sm font-medium text-slate-400">/ {titles.length} free</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><UsersRound size={15} aria-hidden /> Max Team Size</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{project.maxTeamMembers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><Users size={15} aria-hidden /> Teams</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{teams.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><CalendarDays size={15} aria-hidden /> End Date</p>
          <p className="mt-2 text-2xl font-bold text-navy-950">{formatDate(project.endDate)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Instructions" icon={FileText} />
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
                  <span className="text-xs text-slate-500">Open PDF</span>
                </span>
                <Download size={16} className="text-slate-400" aria-hidden />
              </a>
            )}
          </Card>

          <Card>
            <CardHeader title="Meta" icon={FolderKanban} />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-navy-900">{formatDate(project.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd><StatusBadge status={project.status} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Project ID</dt>
                <dd><CodeChip code={project.projectId} size="sm" /></dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Titles + teams */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader
              title="Project Titles"
              subtitle="Assigned titles are locked to their team"
              icon={Layers}
              action={<span className="text-xs font-medium text-slate-400">{titles.length} total</span>}
            />
            <ul className="divide-y divide-slate-100">
              {titles.map((t) => (
                <li key={t._id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-navy-900">{t.title}</span>
                  <StatusBadge status={t.status} className="shrink-0" />
                </li>
              ))}
              {titles.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No titles.</p>}
            </ul>
          </Card>

          <Card padded={false}>
            <div className="px-5 pt-5">
              <CardHeader
                title="Teams"
                subtitle={`${teams.length} team(s) in this project`}
                icon={Users}
                action={
                  <Link to="/faculty/approvals">
                    <Button variant="ghost" size="xs" icon={ClipboardCheck}>Review</Button>
                  </Link>
                }
              />
            </div>
            {teams.length === 0 ? (
              <div className="px-5 pb-5">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center">
                  <p className="text-sm font-medium text-navy-900">No teams yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share Project ID <span className="font-mono font-semibold">{project.projectId}</span> with your students.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 px-5 pb-3">
                {teams.map((t) => (
                  <li key={t._id}>
                    <Link to={`/faculty/teams/${t._id}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50">
                      <Avatar user={t.leader} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900">{t.teamName}</p>
                        <p className="truncate text-xs text-slate-400">
                          <span className="font-mono">{t.teamCode}</span> · {t.projectTitleId?.title || 'No title'}
                        </p>
                      </div>
                      <span className="hidden text-xs text-slate-500 sm:block">{t.memberCount}/{project.maxTeamMembers}</span>
                      <StatusBadge status={t.status} className="shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project?"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete Project"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
