import { forwardRef, useId } from 'react';

const baseField =
  'w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400';

function FieldWrapper({ id, label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, required, className = '', containerClassName = '', ...props },
  ref
) {
  const autoId = useId();
  const id = props.id || autoId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          className={`${baseField} h-10 ${Icon ? 'pl-9' : ''} ${
            error ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, rows = 4, className = '', containerClassName = '', ...props },
  ref
) {
  const autoId = useId();
  const id = props.id || autoId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`${baseField} py-2.5 ${error ? 'border-red-400 bg-red-50/40' : 'border-slate-300'} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, children, className = '', containerClassName = '', ...props },
  ref
) {
  const autoId = useId();
  const id = props.id || autoId;
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <select
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        className={`${baseField} h-10 ${error ? 'border-red-400 bg-red-50/40' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});
