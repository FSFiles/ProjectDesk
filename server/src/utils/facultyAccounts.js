/**
 * The 5 authorized faculty accounts — single source of truth shared by the
 * seed and cleanup scripts. Passwords here are DEMO credentials only; they
 * are always stored in MongoDB as bcrypt hashes, never plain text.
 */
export const FACULTY_ACCOUNTS = [
  { firstName: 'Faculty', lastName: 'One', email: 'faculty01@projectdesk.dev', password: 'Faculty@123' },
  { firstName: 'Faculty', lastName: 'Two', email: 'faculty02@projectdesk.dev', password: 'Faculty@456' },
  { firstName: 'Faculty', lastName: 'Three', email: 'faculty03@projectdesk.dev', password: 'Faculty@789' },
  { firstName: 'Faculty', lastName: 'Four', email: 'faculty04@projectdesk.dev', password: 'Faculty@321' },
  { firstName: 'Faculty', lastName: 'Five', email: 'faculty05@projectdesk.dev', password: 'Faculty@654' },
];

/**
 * Idempotently ensure all faculty accounts exist. Existing accounts are kept
 * untouched (no duplicates, no password overwrites).
 */
export async function ensureFacultyAccounts(User, log = console.log) {
  let created = 0;
  let existing = 0;
  for (const account of FACULTY_ACCOUNTS) {
    const found = await User.findOne({ email: account.email });
    if (found) {
      if (found.role !== 'faculty') {
        log(`[faculty] warning: ${account.email} exists with role "${found.role}" — left unchanged`);
      }
      existing += 1;
      log(`[faculty] exists  → ${account.email}`);
      continue;
    }
    const { default: bcrypt } = await import('bcryptjs');
    await User.create({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      passwordHash: await bcrypt.hash(account.password, 12),
      role: 'faculty',
    });
    created += 1;
    log(`[faculty] created → ${account.email}`);
  }
  return { created, existing, total: FACULTY_ACCOUNTS.length };
}
