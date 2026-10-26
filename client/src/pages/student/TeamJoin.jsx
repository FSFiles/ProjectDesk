import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Check, Hash, ArrowRight, UserPlus, PartyPopper } from 'lucide-react';
import { teamService } from '../../services/team.service.js';
import Card from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import CodeChip from '../../components/ui/CodeChip.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { SlowNetworkIndicator } from '../../components/ui/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const STAGES = ['Validating Team Code…', 'Checking capacity…', 'Confirming membership…'];

export default function TeamJoin() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slow } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState(-1);
  const [joined, setJoined] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Team Code is required');
      return;
    }
    if (!/^PD-TEAM-[A-Z2-9]{6}$/.test(normalized)) {
      setError('That does not look like a valid Team Code. The format is PD-TEAM-XXXXXX (e.g. PD-TEAM-X8K2M7).');
      return;
    }
    setSubmitting(true);
    setStage(0);
    const timers = [700, 1400].map((t, i) => setTimeout(() => setStage(i + 1), t));
    try {
      const [team] = await Promise.all([teamService.join(normalized), new Promise((r) => setTimeout(r, 1600))]);
      timers.forEach(clearTimeout);
      setStage(STAGES.length);
      setJoined(team);
      toast.success(`Joined "${team.teamName}" successfully!`);
    } catch (err) {
      timers.forEach(clearTimeout);
      setStage(-1);
      setError(err.friendlyMessage || 'Could not join this team.');
    } finally {
      setSubmitting(false);
    }
  };

  if (joined) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-card"
        >
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 pb-14 pt-8 text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/95 text-teal-600 shadow-lg"
            >
              <PartyPopper size={28} aria-hidden />
            </motion.span>
            <h1 className="mt-4 text-xl font-bold text-white">Joined Team Successfully</h1>
          </div>
          <div className="-mt-8 px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card text-center">
              <p className="text-sm font-medium text-slate-500">{joined.teamName}</p>
              <div className="mt-3 flex justify-center">
                <CodeChip code={joined.teamCode} size="lg" label="Team Code" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <StatusBadge status={joined.status} />
                <span>·</span>
                <span>{joined.members?.length} member(s)</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => navigate('/student/team/join')} icon={UserPlus}>
                Join Another
              </Button>
              <Link to="/student/team">
                <Button className="w-full" icon={ArrowRight}>Go to My Team</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Join a Team</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the Team Code shared by your team leader. Capacity and duplicate membership are checked automatically.
        </p>
      </div>

      <SlowNetworkIndicator visible={slow && submitting} />

      <Card>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input
            label="Team Code"
            placeholder="PD-TEAM-X8K2M7"
            icon={Hash}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            error={error}
            hint="Format: PD-TEAM-XXXXXX — ask your team leader."
            autoComplete="off"
            className="font-mono tracking-wider"
            required
          />

          <AnimatePresence>
            {submitting && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-2 rounded-lg bg-slate-50 p-3.5">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5 text-sm">
                      <span className={`grid h-5 w-5 place-items-center rounded-full border ${i < stage ? 'border-teal-500 bg-teal-500 text-white' : i === stage ? 'border-brand-500 text-brand-600' : 'border-slate-200 text-slate-300'}`}>
                        {i < stage ? <Check size={11} strokeWidth={3.5} /> : i === stage ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand-500" /> : null}
                      </span>
                      <span className={i <= stage ? 'font-medium text-navy-900' : 'text-slate-400'}>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full" loading={submitting} icon={Users}>
            {submitting ? 'Joining…' : 'Join Team'}
          </Button>
        </form>
      </Card>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card">
        <p className="font-medium text-navy-900">Good to know</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 leading-relaxed">
          <li>You can only be in one team per project.</li>
          <li>If the team is full, you'll see it before joining.</li>
          <li>Want to start your own instead? <Link to="/student/project/access" className="font-semibold text-brand-600 hover:text-brand-700">Create a team</Link>.</li>
        </ul>
      </div>
    </div>
  );
}
