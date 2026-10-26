import { initials } from '../../utils/format.js';

const COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-navy-100 text-navy-700',
];

const SIZES = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm', xl: 'h-20 w-20 text-lg' };

export default function Avatar({ user, size = 'md', className = '' }) {
  const name = user ? `${user.firstName || ''} ${user.lastName || ''}` : '?';
  const hash = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = COLORS[hash % COLORS.length];

  // Saved profile photo wins; initials avatar is the default fallback.
  const photoUrl = user?.profileImage?.url;
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name.trim() || 'Profile photo'}
        title={name.trim()}
        loading="lazy"
        draggable={false}
        className={`inline-block shrink-0 select-none rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      title={name.trim()}
      aria-label={name.trim()}
      className={`inline-grid shrink-0 select-none place-items-center rounded-full font-semibold ${color} ${SIZES[size]} ${className}`}
    >
      {initials(user?.firstName, user?.lastName)}
    </span>
  );
}
