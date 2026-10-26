import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, ImageIcon } from 'lucide-react';
import { formatBytes } from '../../utils/formatBytes.js';

/**
 * Accessible file input with drag & drop, client-side validation that mirrors
 * the backend rules, and linear progress during upload.
 */
export default function FileUpload({
  accept = '.pdf',
  maxSizeMB = 10,
  kind = 'pdf', // 'pdf' | 'image'
  value, // { file, previewUrl? } or null
  onChange,
  error,
  label,
  hint,
  uploading = false,
  progress = 0,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const validate = (file) => {
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    const okExt =
      kind === 'pdf'
        ? ext === '.pdf'
        : ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext);
    if (!okExt) {
      setLocalError(kind === 'pdf' ? 'Only PDF files are allowed.' : 'Only PNG, JPG, WEBP or SVG images are allowed.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    setLocalError(null);
    onChange?.({ file });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validate(file);
  };

  const shown = error || localError;
  const Icon = kind === 'pdf' ? FileText : ImageIcon;

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-navy-900">{value.file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(value.file.size)}</p>
            {uploading && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress}>
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={() => onChange?.(null)}
              aria-label="Remove file"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-ring"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-7 text-center transition-colors focus-ring ${
            dragging ? 'border-brand-400 bg-brand-50/60' : shown ? 'border-red-300 bg-red-50/40' : 'border-slate-300 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40'
          }`}
        >
          <UploadCloud size={22} className="text-slate-400" aria-hidden />
          <span className="text-sm font-medium text-slate-700">
            Click to upload{kind === 'image' ? ' logo' : ' PDF'} or drag &amp; drop
          </span>
          <span className="text-xs text-slate-500">
            {kind === 'pdf' ? 'PDF' : 'PNG, JPG, WEBP or SVG'} up to {maxSizeMB}MB
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label || 'File upload'}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validate(file);
          e.target.value = '';
        }}
      />
      {shown && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {shown}
        </p>
      )}
      {hint && !shown && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
