const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  teal: 'bg-teal-50 text-teal-600',
  navy: 'bg-navy-50 text-navy-700',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-violet-50 text-violet-600',
};

export default function StatCard({ icon: Icon, label, value, sub, tone = 'brand', className = '', children }) {
  return (
    <div className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${TONES[tone]}`}>
            <Icon size={17} aria-hidden />
          </span>
        )}
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-navy-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      {children}
    </div>
  );
}
