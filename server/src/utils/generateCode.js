/**
 * Safe32 character set — visually unambiguous.
 * Excluded: O/0, I/1 (and L, which reads like 1 in some fonts, and U/V).
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ2346789';

/** Cryptographically uniform random integer in [0, max). */
function randomInt(max) {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    // Rejection sampling keeps the distribution uniform.
    const limit = Math.floor(0xffffffff / max) * max;
    const buf = new Uint32Array(1);
    do {
      c.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function randomCode(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += SAFE_CHARS[randomInt(SAFE_CHARS.length)];
  return out;
}

export const newProjectId = () => `PD-PRJ-${randomCode(8)}`;
export const newTeamCode = () => `PD-TEAM-${randomCode(6)}`;
