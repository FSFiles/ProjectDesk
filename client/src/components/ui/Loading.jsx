import { Hourglass } from 'lucide-react';

/** Base shimmer block. */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Spinner for small operations. */
export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Skeleton card used by list/grid loading. */
export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-card ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i % 2 ? 'w-5/6' : 'w-4/6'}`} />
        ))}
      </div>
    </div>
  );
}

/** Bento-style stat tile skeleton. */
export function StatSkeleton({ className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-card ${className}`}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );
}

/** Full-page skeleton for dashboards. */
export function PageSkeleton({ cards = 4 }) {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" lines={5} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}

/** Slow network notice — shown while a request is still working. */
export function SlowNetworkIndicator({ visible }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
    >
      <Hourglass size={15} className="animate-pulse" aria-hidden />
      <span>
        <span className="font-semibold">Still working…</span>{' '}
        <span className="text-amber-700">This is taking a little longer than usual. Please wait.</span>
      </span>
    </div>
  );
}
