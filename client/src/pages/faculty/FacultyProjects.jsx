import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Users, Layers, ClipboardCheck, Trash2 } from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import Card from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Button from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState, NoResultsState } from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

const STATUS_FILTERS = ['', 'ACTIVE', 'COMPLETED', 'CLOSED'];

export default function FacultyProjects() {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null); // project awaiting confirmation
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDeleteProject = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectService.delete(pendingDelete._id);
      // Remove immediately from the visible list (refetch not needed).
      setData((d) => (d ? { ...d, projects: d.projects.filter((p) => p._id !== pendingDelete._id) } : d));
      toast.success('Project deleted successfully.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete the project. Please try again.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setData(undefined);
    const t = setTimeout(async () => {
      try {
        const d = await projectService.listMine({ search, status });
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load your projects.");
      }
    }, 250); // debounce search
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search, status, reloadKey]);

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  const projects = data?.projects;
  const isFiltered = search.trim() !== '' || status !== '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">All projects you have published.</p>
        </div>
        <Link to="/faculty/projects/create">
          <Button icon={Plus}>Create Project</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by project name or ID…"
          className="sm:max-w-sm sm:flex-1"
          ariaLabel="Search projects"
        />
        <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-card" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                status === s ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {projects === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        isFiltered ? (
          <NoResultsState query={search} onClear={() => { setSearch(''); setStatus(''); }} entity="projects" />
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            message="Create your first project — add titles, set the team size and deadline, and share the Project ID with students."
            action={
              <Link to="/faculty/projects/create">
                <Button icon={Plus}>Create Project</Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p._id} className="group relative">
              <Link to={`/faculty/projects/${p._id}`} className="block h-full rounded-xl focus-ring" aria-label={`Open ${p.projectName}`}>
                <Card hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-navy-900 group-hover:text-brand-700">
                      {p.projectName}
                    </h3>
                    <StatusBadge status={p.status} className="shrink-0" />
                  </div>
                  <div className="mt-2">
                    <CodeChip code={p.projectId} size="sm" label="Project ID" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5 text-center">
                    <div>
                      <p className="flex items-center justify-center gap-1 text-sm font-bold text-navy-950">
                        <Layers size={13} className="text-slate-400" aria-hidden />
                        {p.stats.titles.total ? `${p.stats.titles.AVAILABLE}/${p.stats.titles.total}` : '0/0'}
                      </p>
                      <p className="text-[11px] text-slate-400">Titles free</p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-1 text-sm font-bold text-navy-950">
                        <Users size={13} className="text-slate-400" aria-hidden />
                        {p.stats.teams.total}
                      </p>
                      <p className="text-[11px] text-slate-400">Teams</p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-1 text-sm font-bold text-navy-950">
                        <ClipboardCheck size={13} className="text-slate-400" aria-hidden />
                        {p.stats.teams.PENDING}
                      </p>
                      <p className="text-[11px] text-slate-400">Pending</p>
                    </div>
                  </div>
                  <p className="mt-3.5 text-xs text-slate-400">Ends {formatDate(p.endDate)}</p>
                </Card>
              </Link>
              {/* Delete lives OUTSIDE the link so clicking it never navigates. */}
              <button
                type="button"
                onClick={() => setPendingDelete(p)}
                disabled={deleting && pendingDelete?._id === p._id}
                aria-label={`Delete project ${p.projectName}`}
                title="Delete project"
                className="absolute bottom-[13px] right-4 grid h-7 w-7 place-items-center rounded-md text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
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
