import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, FolderKanban, Users, Layers, ClipboardCheck, Activity,
  CheckCircle2, FileSpreadsheet, MessageSquare, FolderOpen, GraduationCap, ShieldCheck, Zap,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: 'easeOut' },
};

const WORKFLOW = [
  { icon: FolderKanban, title: 'Create Project', desc: 'Faculty defines the project, titles, team size and deadline.' },
  { icon: Users, title: 'Build Team', desc: 'A leader creates the team; members join with a team code.' },
  { icon: Layers, title: 'Allocate Title', desc: 'Teams claim an available title — first come, first served.' },
  { icon: ClipboardCheck, title: 'Get Approval', desc: 'Faculty reviews and approves, rejects or requests changes.' },
  { icon: Activity, title: 'Monitor Project', desc: 'Everyone tracks status from proposal to final evaluation.' },
];

const PAINS = [
  { icon: FileSpreadsheet, text: 'Project titles tracked in spreadsheets' },
  { icon: MessageSquare, text: 'Team updates scattered across WhatsApp' },
  { icon: FolderOpen, text: 'Approvals buried in email threads' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const portal = user ? (user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard') : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="/" className="inline-flex items-center" aria-label="ProjectDesk home">
            <Logo h={26} withText />
          </a>
          <nav className="flex items-center gap-2" aria-label="Account">
            {portal ? (
              <Link to={portal}>
                <Button size="sm" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/student/login">
                  <Button variant="ghost" size="sm">Student Login</Button>
                </Link>
                <Link to="/faculty/login">
                  <Button variant="secondary" size="sm">Faculty Login</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(46rem 30rem at 82% -8%, rgba(38,209,194,0.12), transparent 60%), radial-gradient(40rem 28rem at 8% 8%, rgba(60,120,242,0.10), transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:pt-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700"
          >
            <Zap size={13} aria-hidden /> From Proposal to Final Evaluation
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-navy-950 sm:text-5xl"
          >
            Student Project Lifecycle Management,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">centralized.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            ProjectDesk gives faculty and students one structured platform for projects — titles, teams,
            approvals and status. No spreadsheets, no scattered messages.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/student/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" icon={GraduationCap}>
                Student Login
              </Button>
            </Link>
            <Link to="/faculty/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" icon={ShieldCheck}>
                Faculty Login
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500"
          >
            {['Role-based access', 'Real-time status', 'Unique project & team IDs'].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal-500" aria-hidden /> {f}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-widest text-red-500">The problem</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
              Project management is scattered everywhere.
            </h2>
            <ul className="mt-6 space-y-3.5">
              {PAINS.map((p) => (
                <li key={p.text} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-card">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                    <p.icon size={17} aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{p.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600">The solution</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">
              One platform for the entire lifecycle.
            </h2>
            <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-950 p-6 shadow-card">
              <div className="space-y-4">
                {[
                  ['Faculty publishes projects with titles, team size & deadline'],
                  ['Students form teams and claim unique project titles'],
                  ['Faculty reviews proposals and approves with one click'],
                  ['Everyone sees live status — from proposal to evaluation'],
                ].map(([text], i) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-teal-400/15 text-[11px] font-bold text-teal-300">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-navy-100">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
              Five steps from proposal to final evaluation — with every action validated and tracked.
            </p>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW.map((w, i) => (
              <motion.div
                key={w.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <span className="absolute right-4 top-4 text-[11px] font-bold text-slate-300">
                  0{i + 1}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <w.icon size={19} aria-hidden />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-navy-900">{w.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl rounded-2xl bg-navy-950 px-6 py-12 text-center shadow-card sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to streamline your next project?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-navy-200">
            Students join with a Project ID. Faculty publish with one form. Everything else just works.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/student/login" className="w-full sm:w-auto">
              <Button variant="success" size="lg" className="w-full sm:w-auto">Student Login</Button>
            </Link>
            <Link to="/faculty/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto">
                Faculty Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-slate-500 sm:flex-row">
          <p className="inline-flex items-center gap-2">
            <Logo h={18} />
            <span className="font-semibold text-navy-900">ProjectDesk</span> — From Proposal to Final Evaluation.
          </p>
          <p>Student Project Lifecycle Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
