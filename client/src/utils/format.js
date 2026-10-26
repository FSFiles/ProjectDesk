export const formatDate = (d, opts = {}) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...opts,
    });
  } catch {
    return '—';
  }
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const daysLeft = (d) => {
  if (!d) return null;
  const ms = new Date(d) - new Date();
  return Math.ceil(ms / 864e5);
};

export const initials = (first = '', last = '') =>
  `${(first || '?')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

export const fullName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts.
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}
