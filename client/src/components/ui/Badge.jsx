const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  navy: 'bg-navy-50 text-navy-800 ring-navy-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export default function Badge({ tone = 'neutral', children, className = '', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}

/** Canonical status colors — never use random colors for a status elsewhere. */
const STATUS_MAP = {
  // Project
  ACTIVE: { tone: 'green', label: 'Active' },
  COMPLETED: { tone: 'blue', label: 'Completed' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
  // Team / Approval
  PENDING: { tone: 'amber', label: 'Pending' },
  APPROVED: { tone: 'green', label: 'Approved' },
  REJECTED: { tone: 'red', label: 'Rejected' },
  CHANGES_REQUESTED: { tone: 'violet', label: 'Changes Requested' },
  // Title
  AVAILABLE: { tone: 'teal', label: 'Available' },
  ASSIGNED: { tone: 'blue', label: 'Assigned' },
  // Membership
  LEADER: { tone: 'navy', label: 'Leader' },
  MEMBER: { tone: 'neutral', label: 'Member' },
};

export function StatusBadge({ status, className = '' }) {
  const cfg = STATUS_MAP[status] || { tone: 'neutral', label: status };
  return (
    <Badge tone={cfg.tone} dot className={className}>
      {cfg.label}
    </Badge>
  );
}
