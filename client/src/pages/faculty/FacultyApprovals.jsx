import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Users, Layers, Inbox, ExternalLink } from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Input.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

export default function FacultyApprovals() {
  const toast = useToast();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [actingId, setActingId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { team, action }
  const [remarksFor, setRemarksFor] = useState(null); // team
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const load = async () => {
    try {
      const d = await teamService.approvals();
      setData(d);
    } catch (err) {
      setError(err.friendlyMessage || "We couldn't load approvals.");
    }
  };

  useEffect(() => {
    let alive = true;
    setData(undefined);
    setError('');
    load().then(() => {
      if (!alive) return;
    });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const review = async (team, action, reviewRemarks = '') => {
    setActingId(team._id);
    try {
      await teamService.review(team._id, action, reviewRemarks);
      toast.success(
        action === 'APPROVED' ? `"${team.teamName}" approved` : action === 'REJECTED' ? `"${team.teamName}" rejected` : 'Changes requested'
      );
      setConfirm(null);
      setRemarksFor(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Review failed. Please try again.');
    } finally {
      setActingId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} lines={3} />
        ))}
      </div>
    );
  }

  const { pendingTeams, overview } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review team proposals — approve, reject, or request changes with remarks.
        </p>
      </div>

      {/* Overview chips */}
      {overview.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overview.slice(0, 4).map((o) => (
            <div key={o._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <p className="truncate text-sm font-semibold text-navy-900">{o.projectName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Layers size={12} aria-hidden /> {o.availableTitles}/{o.titleCount} titles free</span>
                <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden /> {o.teamCount} teams</span>
                {o.pendingTeams > 0 && <StatusBadge status="PENDING" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending list */}
      {!pendingTeams ? null : pendingTeams.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No pending approvals"
          message="You're all caught up. New team proposals will appear here the moment students submit them."
        />
      ) : (
        <div className="space-y-4">
          {pendingTeams.map((t) => (
            <Card key={t._id}>
              <div className="flex flex-wrap items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-950 text-lg font-bold text-teal-300">
                  {t.teamName?.[0]?.toUpperCase()}
                </span>
                <div className="min-w-[12rem] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/faculty/teams/${t._id}`} className="text-[15px] font-semibold text-navy-900 hover:text-brand-700">
                      {t.teamName}
                    </Link>
                    <CodeChip code={t.teamCode} size="sm" label="Team Code" />
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{t.projectTitleId?.title || 'No title'}</span>
                    {' · '}{t.projectId?.projectName} · {t.memberCount}/{t.projectId?.maxTeamMembers ?? '—'} members
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Submitted {formatDate(t.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/faculty/teams/${t._id}`}>
                    <Button variant="ghost" size="sm" icon={ExternalLink}>Details</Button>
                  </Link>
                  <Button
                    variant="success"
                    size="sm"
                    loading={actingId === t._id}
                    onClick={() => setConfirm({ team: t, action: 'APPROVED' })}
                  >
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRemarksFor(t); setRemarks(''); setRemarksError(''); }}>
                    Request Changes
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setConfirm({ team: t, action: 'REJECTED' })}>
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm */}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => review(confirm.team, confirm.action)}
        title={confirm?.action === 'APPROVED' ? 'Approve this team?' : 'Reject this team?'}
        message={
          confirm?.action === 'APPROVED'
            ? `"${confirm?.team?.teamName}" will be approved and all members notified.`
            : `"${confirm?.team?.teamName}" will be rejected and its project title released for other teams.`
        }
        confirmLabel={confirm?.action === 'APPROVED' ? 'Approve Team' : 'Reject Team'}
        tone={confirm?.action === 'APPROVED' ? 'success' : 'danger'}
        loading={actingId === confirm?.team?._id}
      />

      {/* Remarks modal */}
      <Modal
        open={Boolean(remarksFor)}
        onClose={() => setRemarksFor(null)}
        title="Request Changes"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemarksFor(null)} disabled={actingId === remarksFor?._id}>Cancel</Button>
            <Button
              loading={actingId === remarksFor?._id}
              onClick={() => {
                if (remarks.trim().length < 5) {
                  setRemarksError('Please describe the changes you expect (at least 5 characters).');
                  return;
                }
                review(remarksFor, 'CHANGES_REQUESTED', remarks.trim());
              }}
            >
              Send Request
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Remarks for <span className="font-semibold text-navy-900">{remarksFor?.teamName}</span>:
        </p>
        <Textarea
          label="Remarks"
          rows={4}
          placeholder="Describe what the team should change…"
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            setRemarksError('');
          }}
          error={remarksError}
          required
        />
      </Modal>
    </div>
  );
}
