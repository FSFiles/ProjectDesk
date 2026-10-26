/**
 * ProjectDesk data cleanup — wipes ALL Faculty Portal / project-workflow data
 * so the portal starts clean, while PRESERVING user accounts.
 *
 * Deletes: Project, ProjectTitle, Team, TeamMember, Approval, Notification
 * Keeps:   User (all faculty + valid student accounts), indexes, schemas
 *
 * The 5 authorized faculty accounts are re-ensured afterwards, so a single
 * `npm run reset` always results in: clean data + 5 working faculty logins.
 *
 * Usage: npm run clean (or npm run reset)  — from the project root
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Project } from '../models/Project.js';
import { ProjectTitle } from '../models/ProjectTitle.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Approval } from '../models/Approval.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ensureFacultyAccounts } from './facultyAccounts.js';

async function clean() {
  await connectDatabase();
  console.log('[clean] clearing Faculty Portal / project workflow data…');

  // Delete workflow data collections (NOT users).
  const results = {};
  results.projects = await Project.deleteMany({});
  results.titles = await ProjectTitle.deleteMany({});
  results.teams = await Team.deleteMany({});
  results.teamMembers = await TeamMember.deleteMany({});
  results.approvals = await Approval.deleteMany({});
  results.notifications = await Notification.deleteMany({});

  for (const [name, r] of Object.entries(results)) {
    console.log(`[clean] ${name.padEnd(12)} deleted: ${r.deletedCount}`);
  }

  // Re-ensure the 5 authorized faculty accounts exist (idempotent, hashed).
  console.log('[clean] ensuring the 5 authorized faculty accounts…');
  await ensureFacultyAccounts(User, console.log);

  // Integrity check: no orphaned workflow documents can remain.
  const leftovers = {
    projects: await Project.countDocuments({}),
    titles: await ProjectTitle.countDocuments({}),
    teams: await Team.countDocuments({}),
    teamMembers: await TeamMember.countDocuments({}),
    approvals: await Approval.countDocuments({}),
    notifications: await Notification.countDocuments({}),
  };
  const users = await User.countDocuments({});
  const faculty = await User.countDocuments({ role: 'faculty' });

  console.log('[clean] remaining workflow documents:', JSON.stringify(leftovers));
  console.log(`[clean] users preserved: ${users} total (${faculty} faculty)`);

  await disconnectDatabase();
  console.log('[clean] done — Faculty Portal is clean.');
}

clean().catch((err) => {
  console.error('[clean] failed:', err.message);
  process.exit(1);
});
