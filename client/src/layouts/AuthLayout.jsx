import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

/** Shell for login/register pages: brand rail on the left, form on the right. */
export default function AuthLayout({ headline, subline, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(52rem 52rem at 118% -18%, rgba(38,209,194,0.16), transparent 60%), radial-gradient(40rem 40rem at -22% 118%, rgba(60,120,242,0.2), transparent 55%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="inline-flex items-center" aria-label="ProjectDesk home">
            <Logo h={30} withText textClass="text-white" />
          </Link>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">{headline}</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-200">{subline}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Create Project', 'Build Team', 'Allocate Title', 'Get Approval', 'Monitor'].map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-navy-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-navy-300">Student Project Lifecycle Management Platform</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-white">
        <div className="flex items-center gap-2.5 p-6 lg:hidden">
          <Link to="/" className="inline-flex items-center" aria-label="ProjectDesk home">
            <Logo h={26} withText textClass="text-navy-950" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
