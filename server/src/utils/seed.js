/**
 * ProjectDesk seed script — creates the 5 authorized faculty accounts.
 *
 * Idempotent: safe to run repeatedly. Existing accounts are kept as-is
 * (no duplicates, no overwrites of changed passwords).
 *
 * NOTE: This seed intentionally does NOT create any demo projects, teams,
 * titles, approvals or notifications — the Faculty Portal must start clean.
 * To wipe old workflow data, run `npm run clean` instead.
 *
 * Usage: npm run seed   (from the project root or server/)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { ensureFacultyAccounts } from './facultyAccounts.js';

async function seed() {
  await connectDatabase();
  console.log('[seed] ensuring faculty accounts…');
  const { created, existing, total } = await ensureFacultyAccounts(User, console.log);
  console.log(`[seed] faculty accounts: ${created} created, ${existing} already present (${total} total)`);
  console.log('[seed] no demo projects/teams are created — Faculty Portal starts clean.');
  await disconnectDatabase();
  console.log('[seed] done.');
}

// Only auto-run when executed directly (never when imported by other scripts).
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  seed().catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exit(1);
  });
}
