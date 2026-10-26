import { FileSearch, AlertCircle, SearchX, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

/** Data is genuinely absent — invite the user to create something. */
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-card">
        <Icon size={26} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Something failed — never expose raw errors. */
export function ErrorState({ title = 'Something went wrong', message = "We couldn't load this content.", onRetry, retryLabel = 'Try Again' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-red-500 shadow-card">
        <AlertCircle size={26} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="outline" icon={RefreshCw} className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/** Data exists but the search returned nothing. */
export function NoResultsState({ query, onClear, entity = 'results' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-card">
        <SearchX size={26} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-navy-900">No results found</h3>
      <p className="mt-1.5 text-sm text-slate-500">
        No {entity} match {query ? <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span> : 'your search'}.
      </p>
      {onClear && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onClear}>
          Clear Search
        </Button>
      )}
    </div>
  );
}

export { FileSearch };
