import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/format.js';

/** Monospace, copy-on-click chip for Project IDs / Team Codes. */
export default function CodeChip({ code, size = 'md', label }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title={`Copy ${label || 'code'}: ${code}`}
      aria-label={`Copy ${label || 'code'} ${code}`}
      className={`inline-flex select-all items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 font-mono font-semibold tracking-wide text-navy-900 transition-colors hover:border-brand-400 hover:bg-brand-50 focus-ring ${sizes[size]}`}
    >
      {code}
      {copied ? (
        <Check size={14} className="text-teal-600" aria-hidden />
      ) : (
        <Copy size={13} className="text-slate-400" aria-hidden />
      )}
    </button>
  );
}
