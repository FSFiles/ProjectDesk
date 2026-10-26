export default function Card({ children, className = '', hover = false, padded = true }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-card ${
        hover ? 'transition-shadow hover:shadow-card-hover' : ''
      } ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={18} aria-hidden />
          </span>
        )}
        <div>
          <h3 className="text-[15px] font-semibold text-navy-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
