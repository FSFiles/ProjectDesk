import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Trash2, Check, FileText, PartyPopper, ArrowRight, Info, ListPlus, CalendarDays, Users,
} from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import Card from '../../components/ui/Card.jsx';
import { Input, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import FileUpload from '../../components/ui/FileUpload.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import { SlowNetworkIndicator } from '../../components/ui/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const STAGES = ['Validating…', 'Saving project…', 'Generating Project ID…', 'Finalizing…'];
const today = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export default function FacultyProjectCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slow } = useAuth();

  const [form, setForm] = useState({ projectName: '', maxTeamMembers: 4, endDate: '', instructions: '' });
  const [titles, setTitles] = useState(['']);
  const [titleErrors, setTitleErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [pdf, setPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState(-1);
  const [created, setCreated] = useState(null);
  const stageTimer = useRef(null);

  useEffect(() => () => clearTimeout(stageTimer.current), []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setServerError('');
  };

  /* ---------- dynamic titles ---------- */
  const setTitle = (i, value) => {
    setTitles((t) => t.map((x, idx) => (idx === i ? value : x)));
    setTitleErrors((er) => ({ ...er, [i]: undefined }));
  };
  const addTitle = () => setTitles((t) => [...t, '']);
  const removeTitle = (i) => setTitles((t) => (t.length === 1 ? [''] : t.filter((_, idx) => idx !== i)));

  const validate = () => {
    const er = {};
    if (!form.projectName.trim()) er.projectName = 'Project name is required';
    else if (form.projectName.trim().length < 3) er.projectName = 'Project name must be at least 3 characters';
    if (!form.endDate) er.endDate = 'Project end date is required';
    else if (new Date(form.endDate) <= new Date()) er.endDate = 'End date must be in the future';
    if (!form.maxTeamMembers || form.maxTeamMembers < 2 || form.maxTeamMembers > 10)
      er.maxTeamMembers = 'Team size must be between 2 and 10';

    const cleaned = titles.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setTitleErrors({ 0: 'At least one project title is required' });
      return false;
    }
    const te = {};
    const seen = new Set();
    titles.forEach((t, i) => {
      const v = t.trim();
      if (!v) {
        te[i] = 'Title cannot be empty — remove it or fill it in';
      } else if (v.length < 3) {
        te[i] = 'Title must be at least 3 characters';
      } else {
        const key = v.toLowerCase();
        if (seen.has(key)) te[i] = 'Duplicate title';
        seen.add(key);
      }
    });
    setTitleErrors(te);
    setErrors(er);
    return Object.keys(er).length === 0 && Object.keys(te).length === 0;
  };

  const runStages = () => {
    setStage(0);
    const step = (i) => {
      stageTimer.current = setTimeout(() => {
        if (i < STAGES.length - 1) {
          setStage(i + 1);
          step(i + 1);
        }
      }, 650);
    };
    step(0);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    runStages();

    try {
      const fd = new FormData();
      fd.append('projectName', form.projectName.trim());
      fd.append('maxTeamMembers', String(form.maxTeamMembers));
      fd.append('endDate', new Date(form.endDate).toISOString());
      fd.append('instructions', form.instructions.trim());
      titles.map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append('titles', t));
      if (pdf) fd.append('instructionsPdf', pdf.file);

      const [data] = await Promise.all([projectService.create(fd), new Promise((r) => setTimeout(r, 2300))]);
      clearTimeout(stageTimer.current);
      setStage(STAGES.length);
      setCreated(data.project);
      toast.success('Project created successfully!');
    } catch (err) {
      clearTimeout(stageTimer.current);
      setStage(-1);
      if (err.details?.length) {
        const map = {};
        err.details.forEach((d) => {
          map[d.field] = map[d.field] || d.message;
        });
        setErrors((prev) => ({ ...prev, ...map }));
      }
      setServerError(err.friendlyMessage || 'Project creation failed. Please try again.');
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
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 pb-16 pt-8 text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/95 text-teal-600 shadow-lg"
            >
              <PartyPopper size={28} aria-hidden />
            </motion.span>
            <h1 className="mt-4 text-xl font-bold text-white">Project Created Successfully</h1>
            <p className="mt-1 text-sm text-teal-50">Share this Project ID with your students.</p>
          </div>
          <div className="-mt-10 px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
              <p className="text-center text-sm font-medium text-slate-500">{created.projectName}</p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Project ID</p>
                <CodeChip code={created.projectId} size="lg" label="Project ID" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center text-sm">
                <div>
                  <p className="font-bold text-navy-950">{created.maxTeamMembers}</p>
                  <p className="text-xs text-slate-400">Max team</p>
                </div>
                <div>
                  <p className="font-bold text-navy-950">{new Date(created.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-slate-400">End date</p>
                </div>
                <div>
                  <p className="font-bold text-navy-950">0</p>
                  <p className="text-xs text-slate-400">Teams so far</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { setCreated(null); setForm({ projectName: '', maxTeamMembers: 4, endDate: '', instructions: '' }); setTitles(['']); setPdf(null); }}>
                Create Another
              </Button>
              <Link to={`/faculty/projects/${created._id}`}>
                <Button className="w-full" icon={ArrowRight}>View Project</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------- Form ---------- */
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Create Project</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Publish a project with titles, team size and deadline. A unique Project ID is generated for you.
        </p>
      </div>

      <SlowNetworkIndicator visible={slow && submitting} />

      <Card className="relative">
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
          {serverError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="Project Name"
              placeholder="e.g. Major Project 2026 — CSE"
              containerClassName="sm:col-span-2"
              value={form.projectName}
              onChange={set('projectName')}
              error={errors.projectName}
              required
            />
            <Input
              label="Max Team Members"
              type="number"
              min={2}
              max={10}
              icon={Users}
              value={form.maxTeamMembers}
              onChange={set('maxTeamMembers')}
              error={errors.maxTeamMembers}
              hint="2 – 10"
              required
            />
          </div>

          <Input
            label="Project End Date"
            type="date"
            min={today()}
            icon={CalendarDays}
            value={form.endDate}
            onChange={set('endDate')}
            error={errors.endDate}
            hint="Students cannot create or join teams after this date."
            required
          />

          {/* Titles */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <ListPlus size={16} className="text-brand-600" aria-hidden /> Project Titles
              </p>
              <span className="text-xs text-slate-400">{titles.filter((t) => t.trim()).length} added</span>
            </div>
            <div className="space-y-2.5">
              {titles.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                        {i + 1}
                      </span>
                      <input
                        value={t}
                        onChange={(e) => setTitle(i, e.target.value)}
                        placeholder={`Project title ${i + 1} — e.g. AI-Based Attendance System`}
                        aria-label={`Project title ${i + 1}`}
                        aria-invalid={Boolean(titleErrors[i])}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 ${
                          titleErrors[i] ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeTitle(i)}
                        disabled={titles.length === 1}
                        aria-label={`Remove title ${i + 1}`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-ring disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {titleErrors[i] && (
                      <p role="alert" className="ml-8 mt-1 text-xs font-medium text-red-600">{titleErrors[i]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="subtle" size="sm" icon={Plus} className="mt-3" onClick={addTitle}>
              Add Title
            </Button>
          </div>

          <Textarea
            label="Instructions (optional)"
            placeholder="Rules, deliverables, evaluation criteria…"
            rows={4}
            value={form.instructions}
            onChange={set('instructions')}
            error={errors.instructions}
          />

          <FileUpload
            kind="pdf"
            accept=".pdf,application/pdf"
            maxSizeMB={10}
            label="Instructions PDF (optional)"
            value={pdf}
            onChange={setPdf}
            hint="Students will be able to view and download this file."
          />

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              <Info size={13} aria-hidden /> Titles are enforced unique per project.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => navigate('/faculty/projects')} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={FileText}>
                Create Project
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
