import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Search } from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import SearchBar from '../../components/ui/SearchBar.jsx';
import Button from '../../components/ui/Button.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState, NoResultsState } from '../../components/ui/EmptyState.jsx';

const STATUS_FILTERS = ['', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'];
const LABELS = { '': 'All', PENDING: 'Pending', APPROVED: 'Approved', CHANGES_REQUESTED: 'Changes', REJECTED: 'Rejected' };

export default function FacultyTeams() {
  const [params] = useSearchParams();
  const [teams, setTeams] = useState(undefined);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setTeams(undefined);
    const t = setTimeout(async () => {
      try {
        const d = await teamService.listAll({ search, status, projectId: params.get('projectId') || '' });
        if (alive) setTeams(d.teams);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load teams.");
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search, status, params, reloadKey]);

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  const isFiltered = search.trim() !== '' || status !== '';

  // Client-side title search across the loaded set (search bar also matches project name/ID server-side).
  const visible = (teams || []).filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      t.teamName?.toLowerCase().includes(q) ||
      t.teamCode?.toLowerCase().includes(q) ||
      t.projectTitleId?.title?.toLowerCase().includes(q) ||
      t.projectId?.projectName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Teams</h1>
        <p className="mt-1 text-sm text-slate-500">All teams across your projects.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by team name, code or title…"
          className="sm:max-w-sm sm:flex-1"
          ariaLabel="Search teams"
        />
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-card" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${
                status === s ? 'bg-navy-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {teams === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        isFiltered ? (
          <NoResultsState query={search} onClear={() => { setSearch(''); setStatus(''); }} entity="teams" />
        ) : (
          <EmptyState
            icon={Users}
            title="No teams yet"
            message="Share a Project ID with your students — teams will appear here as they form."
          />
        )
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <Link key={t._id} to={`/faculty/teams/${t._id}`} className="block">
              <Card hover className="flex flex-wrap items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-950 text-base font-bold text-teal-300">
                  {t.teamName?.[0]?.toUpperCase() || 'T'}
                </span>
                <div className="min-w-[10rem] flex-1">
                  <p className="text-[15px] font-semibold text-navy-900">{t.teamName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-mono">{t.teamCode}</span> · {t.projectTitleId?.title || 'No title'}
                  </p>
                </div>
                <div className="hidden text-sm text-slate-500 sm:block">
                  <span className="font-semibold text-navy-900">{t.memberCount}</span>
                  <span> / {t.maxMembers ?? '—'} members</span>
                </div>
                <div className="hidden text-xs text-slate-400 md:block">
                  {t.projectId?.projectId}
                </div>
                <StatusBadge status={t.status} className="ml-auto shrink-0 sm:ml-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
