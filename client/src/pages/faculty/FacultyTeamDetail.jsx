import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Layers, ClipboardList, Lightbulb, Crown, FileText, History, CheckCircle2, XCircle, UndoDot,
} from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Input.jsx';
import { CardSkeleton } from '../../components/ui/Loading.jsx';
import { ErrorState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { fullName, formatDateTime } from '../../utils/format.js';

export default function FacultyTeamDetail() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [confirm, setConfirm] = useState(null); // { action, title, message }
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await teamService.detail(teamId);
        if (alive) setData(d);
      } catch (err) {
        if (alive) setError(err.friendlyMessage || "We couldn't load this team.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [teamId, reloadKey]);

  const doReview = async (action, reviewRemarks = '') => {
    setActing(true);
    try {
      await teamService.review(data.team._id, action, reviewRemarks);
      toast.success(
        action === 'APPROVED'
          ? 'Team approved'
          : action === 'REJECTED'
            ? 'Team rejected'
            : 'Changes requested — students notified'
      );
      setConfirm(null);
      setRemarksOpen(false);
      setRemarks('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Review failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const openChangesModal = () => {
    setRemarks('');
    setRemarksError('');
    setRemarksOpen(true);
  };

  const submitChanges = () => {
    if (remarks.trim().length < 5) {
      setRemarksError('Please describe the changes you expect (at least 5 characters).');
      return;
    }
    doReview('CHANGES_REQUESTED', remarks.trim());
  };

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        <div className="text-center">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }
  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton className="lg:col-span-2" lines={7} />
          <CardSkeleton lines={7} />
        </div>
      </div>
    );
  }

  const { team, approvals } = data;
  const project = team.projectId;
  const title = team.projectTitleId;
  const members = team.members || [];
  const latest = approvals?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} className="-ml-2 mb-2">
          Back
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {team.teamLogo?.url ? (
              <img src={team.teamLogo.url} alt={`${team.teamName} logo`} className="h-14 w-14 rounded-xl border border-slate-200 object-cover" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-950 text-lg font-bold text-teal-300">
                {team.teamName?.[0]?.toUpperCase()}
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
                <span>{project?.projectName}</span>
              </div>
            </div>
          </div>

          {/* Review actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              icon={CheckCircle2}
              loading={acting}
              disabled={team.status === 'APPROVED'}
              onClick={() => setConfirm({ action: 'APPROVED', title: 'Approve this team?', message: `Approve "${team.teamName}"? Members will be notified immediately.` })}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              icon={UndoDot}
              disabled={team.status === 'CHANGES_REQUESTED'}
              onClick={openChangesModal}
            >
              Request Changes
            </Button>
            <Button
              variant="danger"
              icon={XCircle}
              disabled={team.status === 'REJECTED'}
              onClick={() => setConfirm({ action: 'REJECTED', title: 'Reject this team?', message: `Reject "${team.teamName}"? Its project title will be released for other teams.` })}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Statements */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Project Title" icon={Layers} action={title ? <StatusBadge status={title.status} /> : undefined} />
            <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
              <p className="font-semibold text-navy-900">{title?.title || 'No title allocated'}</p>
              {project && (
                <p className="mt-1 text-xs text-slate-500">
                  Max team size {project.maxTeamMembers} · Ends {new Date(project.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
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

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={`Members (${members.length})`} icon={Users} />
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
            <CardHeader title="Review History" icon={History} />
            {approvals?.length ? (
              <ol className="space-y-4">
                {approvals.map((a) => (
                  <li key={a._id} className="border-l-2 border-slate-100 pl-4">
                    <p className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-slate-400">{formatDateTime(a.reviewedAt || a.createdAt)}</span>
                    </p>
                    {a.remarks && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.remarks}</p>}
                    <p className="mt-1 text-xs text-slate-400">by {fullName(a.facultyId)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">No reviews yet.</p>
            )}
          </Card>

          {team.status === 'PENDING' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Awaiting review</p>
              <p className="mt-1 leading-relaxed">This team's proposal is pending. Review the details and approve, reject, or request changes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => doReview(confirm.action)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.action === 'APPROVED' ? 'Approve Team' : 'Reject Team'}
        tone={confirm?.action === 'APPROVED' ? 'success' : 'danger'}
        loading={acting}
      />

      {/* Request changes modal */}
      <Modal
        open={remarksOpen}
        onClose={() => setRemarksOpen(false)}
        title="Request Changes"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemarksOpen(false)} disabled={acting}>Cancel</Button>
            <Button onClick={submitChanges} loading={acting} icon={UndoDot}>Send Request</Button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Tell <span className="font-semibold text-navy-900">{team.teamName}</span> what needs to change. They'll be notified with your remarks.
        </p>
        <Textarea
          label="Remarks"
          rows={4}
          placeholder="e.g. Please expand the evaluation plan and clarify the target users…"
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
