import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Layers, Users, ArrowRight, FolderKanban } from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

export default function FacultyMonitoring() {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await teamService.approvals(); // returns overview + pendingTeams
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load monitoring data.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (data === undefined) return <PageSkeleton cards={3} />;

  const { overview } = data;

  if (overview.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Nothing to monitor yet"
        message="Create a project first — its titles, teams and approval progress will be tracked here."
        action={
          <Link to="/faculty/projects/create">
            <Button>Create Project</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">Title allocation and team progress across all projects.</p>
      </div>

      <div className="space-y-4">
        {overview.map((o) => {
          const allocatedPct = o.titleCount ? Math.round(((o.titleCount - o.availableTitles) / o.titleCount) * 100) : 0;
          return (
            <Card key={o._id}>
              <CardHeader
                title={o.projectName}
                subtitle={`Ends ${formatDate(o.endDate)} · max ${o.maxTeamMembers} per team`}
                icon={FolderKanban}
                action={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <Link to={`/faculty/projects/${o._id}`}>
                      <Button variant="ghost" size="xs" icon={ArrowRight}>Open</Button>
                    </Link>
                  </div>
                }
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Layers size={13} aria-hidden /> Title allocation
                  </p>
                  <p className="mt-1.5 text-xl font-bold text-navy-950">
                    {o.titleCount - o.availableTitles}<span className="text-sm font-medium text-slate-400"> / {o.titleCount}</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${allocatedPct}%` }} />
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Users size={13} aria-hidden /> Teams formed
                  </p>
                  <p className="mt-1.5 text-xl font-bold text-navy-950">{o.teamCount}</p>
                  <p className="mt-2 text-xs text-slate-400">{o.availableTitles} titles still free</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Activity size={13} aria-hidden /> Awaiting review
                  </p>
                  <p className="mt-1.5 text-xl font-bold text-navy-950">{o.pendingTeams}</p>
                  {o.pendingTeams > 0 && (
                    <Link to="/faculty/approvals" className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Review now →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
