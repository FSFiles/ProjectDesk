import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Layers, FileText, Lightbulb, ImageIcon, Check, CheckCircle2, Copy, ArrowRight, PartyPopper,
} from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import { teamService } from '../../services/team.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import FileUpload from '../../components/ui/FileUpload.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { ErrorState } from '../../components/ui/EmptyState.jsx';
import { SlowNetworkIndicator } from '../../components/ui/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const STAGES = ['Validating details…', 'Allocating project title…', 'Generating team code…', 'Creating team…'];

export default function TeamCreate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { slow } = useAuth();

  const [form, setForm] = useState({
    projectId: params.get('projectId') || '',
    teamName: '',
    problemStatement: '',
    proposedSolution: '',
    projectTitleId: '',
  });
  const [project, setProject] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [logo, setLogo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState(-1); // index into STAGES
  const [created, setCreated] = useState(null); // team after success
  const stageTimer = useRef(null);
  const minDelay = useRef(null);

  // Load project context (from ?projectId=… else by ?code=…).
  useEffect(() => {
    const id = params.get('projectId');
    const code = params.get('code');
    if (!id && !code) {
      setLoadError('No project selected. Access a project first, then create your team.');
      return;
    }
    (async () => {
      try {
        const data = code ? await projectService.access(code) : await projectService.access(id);
        setProject(data);
        setForm((f) => ({ ...f, projectId: data.project.id }));
      } catch (err) {
        setLoadError(err.friendlyMessage || "We couldn't load this project.");
      }
    })();
  }, [params]);

  useEffect(() => () => {
    clearTimeout(stageTimer.current);
    clearTimeout(minDelay.current);
  }, []);

  const availableTitles = useMemo(
    () => project?.titles?.filter((t) => t.status === 'AVAILABLE') || [],
    [project]
  );

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.teamName.trim()) er.teamName = 'Team name is required';
    else if (form.teamName.trim().length < 3) er.teamName = 'Team name must be at least 3 characters';
    if (!form.problemStatement.trim()) er.problemStatement = 'Problem statement is required';
    else if (form.problemStatement.trim().length < 20) er.problemStatement = 'Problem statement must be at least 20 characters';
    if (!form.proposedSolution.trim()) er.proposedSolution = 'Proposed solution is required';
    else if (form.proposedSolution.trim().length < 20) er.proposedSolution = 'Proposed solution must be at least 20 characters';
    if (!form.projectTitleId) er.projectTitleId = 'Please select an available project title';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const runStages = () => {
    setStage(0);
    const step = (i) => {
      stageTimer.current = setTimeout(() => {
        if (i < STAGES.length - 1) {
          setStage(i + 1);
          step(i + 1);
        }
      }, 700);
    };
    step(0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setStage(-1);
    runStages();
    // Keep the flow visible for at least ~2.4s so the staged animation completes.
    minDelay.current = new Promise((resolve) => {
      minDelay.current = resolve;
      setTimeout(resolve, 2400);
    });

    try {
      const fd = new FormData();
      fd.append('projectId', form.projectId);
      fd.append('teamName', form.teamName.trim());
      fd.append('problemStatement', form.problemStatement.trim());
      fd.append('proposedSolution', form.proposedSolution.trim());
      fd.append('projectTitleId', form.projectTitleId);
      if (logo) fd.append('teamLogo', logo.file);

      const [team] = await Promise.all([
        teamService.create(fd),
        new Promise((r) => setTimeout(r, 2400)),
      ]);
      clearTimeout(stageTimer.current);
      setStage(STAGES.length);
      setCreated(team);
      toast.success('Team created successfully!');
    } catch (err) {
      clearTimeout(stageTimer.current);
      setStage(-1);
      if (err.details?.length) {
        const map = {};
        err.details.forEach((d) => {
          map[d.field] = map[d.field] || d.message;
        });
        setErrors(map);
      }
      toast.error(err.friendlyMessage || 'Team creation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Success card ---------- */
  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-card"
        >
          <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 px-6 pb-16 pt-8 text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/95 text-teal-600 shadow-lg"
            >
              <PartyPopper size={28} aria-hidden />
            </motion.span>
            <h1 className="mt-4 text-xl font-bold text-white">Team Created Successfully</h1>
            <p className="mt-1 text-sm text-teal-50">Share your Team Code so members can join.</p>
          </div>
          <div className="-mt-10 px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500">{created.teamName}</p>
                <div className="mt-3 flex justify-center">
                  <CodeChip code={created.teamCode} size="lg" label="Team Code" />
                </div>
                <p className="mt-3 text-xs text-slate-400">Members join at Join Team → enter this code.</p>
              </div>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">Project Title</span><span className="max-w-[60%] truncate text-right font-medium text-navy-900">{created.projectTitleId?.title}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={created.status} /></p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/student/team">
                <Button variant="outline" className="w-full">View My Team</Button>
              </Link>
              <Link to="/student/team/join">
                <Button className="w-full" icon={ArrowRight}>Invite Members</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------- Loading / error states for the project context ---------- */
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState title="Project unavailable" message={loadError} onRetry={() => navigate('/student/project/access')} retryLabel="Go to Project Access" />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="skeleton h-9 w-56" />
        <Card><div className="space-y-3"><div className="skeleton h-10 w-full" /><div className="skeleton h-24 w-full" /><div className="skeleton h-24 w-full" /></div></Card>
      </div>
    );
  }

  const noTitles = availableTitles.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Create Team</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {project.project.projectName} · Max team size{' '}
          <span className="font-semibold text-navy-900">{project.project.maxTeamMembers} members</span> (set by faculty) · Ends {formatDate(project.project.endDate)}
        </p>
      </div>

      <SlowNetworkIndicator visible={slow && submitting} />

      <Card className="relative">
        {/* Staged creation overlay */}
        <AnimatePresence>
          {submitting && stage >= 0 && stage < STAGES.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-xl bg-white/90 backdrop-blur-sm"
            >
              <div className="w-64 space-y-2.5">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        i < stage
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : i === stage
                            ? 'border-brand-500 text-brand-600'
                            : 'border-slate-200 text-slate-300'
                      }`}
                    >
                      {i < stage ? <Check size={11} strokeWidth={3.5} /> : i === stage ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand-500" /> : null}
                    </span>
                    <span className={i <= stage ? 'font-medium text-navy-900' : 'text-slate-400'}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Input
            label="Team Name"
            placeholder="e.g. Team Alpha"
            icon={Users}
            value={form.teamName}
            onChange={set('teamName')}
            error={errors.teamName}
            required
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Textarea
              label="Problem Statement"
              placeholder="Describe the real-world problem your project addresses (min 20 characters)…"
              rows={5}
              value={form.problemStatement}
              onChange={set('problemStatement')}
              error={errors.problemStatement}
              required
            />
            <Textarea
              label="Proposed Solution"
              placeholder="Explain your approach, key features and expected outcome (min 20 characters)…"
              rows={5}
              value={form.proposedSolution}
              onChange={set('proposedSolution')}
              error={errors.proposedSolution}
              required
            />
          </div>

          <Select
            label="Project Title"
            value={form.projectTitleId}
            onChange={set('projectTitleId')}
            error={errors.projectTitleId}
            hint={noTitles ? undefined : 'Only currently available titles are listed — allocation is first come, first served.'}
            required
          >
            <option value="">Select an available title…</option>
            {availableTitles.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </Select>
          {noTitles && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              All titles are already allocated. Please contact your faculty.
            </div>
          )}

          <FileUpload
            kind="image"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            maxSizeMB={2}
            label="Team Logo (optional)"
            icon={ImageIcon}
            value={logo}
            onChange={setLogo}
          />

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={noTitles} icon={CheckCircle2}>
              Create Team
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Team Codes are generated by the server and are guaranteed unique — e.g. PD-TEAM-X8K2M7.
      </p>
    </div>
  );
}
