/**
 * ProjectDesk brand logo.
 *
 * The uploaded official mark (blue paper plane with motion swoosh) is used
 * exactly as provided — no redesign, no distortion. It has a transparent
 * background, so it works on white panels and navy surfaces alike.
 *
 * Sizing contract:
 *  - `h`  → rendered height in px (width follows the 668:373 aspect ratio)
 *  - `withText` → shows the "ProjectDesk" wordmark beside the mark
 */
const ASPECT = 668 / 373; // ≈ 1.79 — matches logo.png exactly

export default function Logo({ h = 28, withText = false, textClass = 'text-navy-950', className = '' }) {
  const width = Math.round(h * ASPECT);

  const mark = (
    <img
      src="/logo.png"
      alt="ProjectDesk logo"
      width={width}
      height={h}
      style={{ height: h, width: width }}
      className="block select-none object-contain"
      draggable={false}
    />
  );

  if (!withText) return <span className={`inline-flex items-center ${className}`}>{mark}</span>;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span className={`text-[17px] font-bold tracking-tight leading-none ${textClass}`}>
        ProjectDesk
      </span>
    </span>
  );
}
