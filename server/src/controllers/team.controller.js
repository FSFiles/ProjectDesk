import mongoose from 'mongoose';
import { Team } from '../models/Team.js';
import { TEAM_POPULATE } from '../models/helpers.js';
import { TeamMember } from '../models/TeamMember.js';
import { Project } from '../models/Project.js';
import { ProjectTitle } from '../models/ProjectTitle.js';
import { Approval } from '../models/Approval.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { generateUniqueTeamCode } from '../services/id.service.js';
import { storeFile } from '../services/storage.service.js';
import { createNotification } from '../services/notification.service.js';

const TXN_UNSUPPORTED = /Transaction numbers are only allowed|replica set member or mongos|transactions are not supported/i;

/** Build a full team view with populated members and title. */
async function buildTeamView(teamDoc) {
  if (!teamDoc) return null;
  let team = typeof teamDoc.toObject === 'function' ? teamDoc.toObject() : teamDoc;
  team = await Team.findById(team._id).populate(TEAM_POPULATE).lean();
  const members = await TeamMember.find({ teamId: team._id, status: 'ACTIVE' })
    .populate('userId', 'firstName lastName email')
    .lean();
  return {
    ...team,
    members: members.map((m) => ({
      id: m._id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.userId,
    })),
  };
}

/**
 * Run `fn(session)` inside a MongoDB transaction when the deployment supports
 * them (Atlas / replica sets). When running against a standalone mongod the
 * same logic runs without a transaction — the conditional atomic updates and
 * unique indexes still enforce correctness, transactions just batch the steps.
 */
export async function withTransaction(fn) {
  const conn = mongoose.connection;
  try {
    const session = await conn.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    if (TXN_UNSUPPORTED.test(err?.message || '')) {
      console.warn('[db] transactions unsupported on this topology — continuing without them');
      return fn(null);
    }
    throw err;
  }
}

/** POST /api/teams (student) — create a team as leader and allocate a title. */
export const createTeam = asyncHandler(async (req, res) => {
  validate(req);
  const { projectId, teamName, problemStatement, proposedSolution, projectTitleId } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');
  if (project.status !== 'ACTIVE') {
    throw ApiError.conflict('This project is not active. Team creation is closed.');
  }
  if (project.endDate && new Date(project.endDate) < new Date()) {
    throw ApiError.conflict('This project has ended. Team creation is closed.');
  }

  // A student cannot already lead a team in this project (unique index backs this up).
  const existingTeam = await Team.findOne({ projectId: project._id, teamLeaderId: req.user._id });
  if (existingTeam) {
    throw ApiError.conflict('You already lead a team in this project.');
  }

  // No duplicate membership within the project.
  const existingMembership = await TeamMember.findOne({
    projectId: project._id,
    userId: req.user._id,
    status: 'ACTIVE',
  });
  if (existingMembership) {
    throw ApiError.conflict('You are already a member of a team in this project.');
  }

  const createTeamInSession = async (session) => {
    const opts = session ? { session } : {};
    const title = await ProjectTitle.findOne({ _id: projectTitleId, projectId: project._id }, null, opts);
    if (!title) throw ApiError.notFound('Selected project title does not exist in this project.');

    if (title.status !== 'AVAILABLE') {
      throw ApiError.conflict('This project title is no longer available.');
    }

    // Atomic conditional update: only ONE concurrent request can flip AVAILABLE→ASSIGNED.
    const race = await ProjectTitle.updateOne(
      { _id: title._id, status: 'AVAILABLE' },
      { $set: { status: 'ASSIGNED', assignedTeamId: null } },
      opts
    );
    if (race.modifiedCount !== 1) {
      throw ApiError.conflict('This project title is no longer available.');
    }

    const teamCode = await generateUniqueTeamCode();
    const [team] = await Team.create(
      [
        {
          teamCode,
          projectId: project._id,
          teamName,
          teamLeaderId: req.user._id,
          problemStatement,
          proposedSolution,
          projectTitleId: title._id,
          status: 'PENDING',
        },
      ],
      opts
    );

    await ProjectTitle.updateOne({ _id: title._id }, { $set: { assignedTeamId: team._id } }, opts);

    await TeamMember.create(
      [
        {
          teamId: team._id,
          userId: req.user._id,
          projectId: project._id,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      ],
      opts
    );

    return team;
  };

  const team = await withTransaction(createTeamInSession);

  // Optional logo upload (best-effort).
  if (req.file) {
    try {
      const stored = await storeFile(req.file, 'team-logos');
      team.teamLogo = { url: stored.url, publicId: stored.publicId, originalName: stored.originalName };
      await team.save();
    } catch (err) {
      console.error('[upload] team logo failed:', err?.message);
    }
  }

  await createNotification({
    userId: String(project.facultyId),
    type: 'TEAM_CREATED',
    title: 'New team created',
    message: `"${team.teamName}" (${team.teamCode}) was created in "${project.projectName}".`,
    link: '/faculty/approvals',
  });

  ok(res, { team: await buildTeamView(team) }, 201);
});

/** POST /api/teams/join (student) — join by team code with full validation. */
export const joinTeam = asyncHandler(async (req, res) => {
  validate(req);
  const { teamCode } = req.body;
  const normalized = String(teamCode || '').trim().toUpperCase();

  if (!/^PD-TEAM-[A-Z2-9]{6}$/.test(normalized)) {
    throw ApiError.badRequest('That does not look like a valid Team Code. Check the format (e.g. PD-TEAM-X8K2M7).');
  }

  const team = await Team.findOne({ teamCode: normalized });
  if (!team) {
    throw ApiError.notFound('No team was found for this Team Code. Please double-check with your team leader.');
  }

  const project = await Project.findById(team.projectId);
  if (!project) throw ApiError.notFound('The project for this team no longer exists.');
  if (project.status !== 'ACTIVE') throw ApiError.conflict('This project is not active. Joining is closed.');
  if (project.endDate && new Date(project.endDate) < new Date()) {
    throw ApiError.conflict('This project has ended. Joining is closed.');
  }

  // Duplicate membership within the same project.
  const existingMembership = await TeamMember.findOne({
    projectId: team.projectId,
    userId: req.user._id,
    status: 'ACTIVE',
  });
  if (existingMembership) {
    const currentTeam = await Team.findById(existingMembership.teamId).select('teamCode teamName');
    throw ApiError.conflict(
      String(existingMembership.teamId) === String(team._id)
        ? `You are already a member of this team (${currentTeam?.teamCode || 'this team'}).`
        : `You are already a member of a team in this project (${currentTeam?.teamCode || 'another team'}).`
    );
  }

  // Capacity check before attempting the join.
  const memberCount = await TeamMember.countDocuments({ teamId: team._id, status: 'ACTIVE' });
  if (memberCount >= project.maxTeamMembers) {
    throw ApiError.conflict('Team is already full. Please join another team.');
  }

  const joinInSession = async (session) => {
    const opts = session ? { session } : {};
    // Capacity re-checked inside the transaction so concurrent joins are safe.
    const recheck = await TeamMember.countDocuments({ teamId: team._id, status: 'ACTIVE' }, opts);
    if (recheck >= project.maxTeamMembers) {
      throw ApiError.conflict('Team is already full. Please join another team.');
    }
    const [membership] = await TeamMember.create(
      [
        {
          teamId: team._id,
          userId: req.user._id,
          projectId: team.projectId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      ],
      opts
    );
    return membership;
  };

  await withTransaction(joinInSession);

  // Notify leader + faculty.
  await createNotification({
    userId: String(team.teamLeaderId),
    type: 'MEMBER_JOINED',
    title: 'New member joined',
    message: `${req.user.firstName} ${req.user.lastName} joined "${team.teamName}".`,
    link: '/student/team',
  });
  await createNotification({
    userId: String(project.facultyId),
    type: 'MEMBER_JOINED',
    title: 'Team updated',
    message: `${req.user.firstName} ${req.user.lastName} joined "${team.teamName}" (${team.teamCode}).`,
    link: '/faculty/teams',
  });

  ok(res, { team: await buildTeamView(team) }, 200);
});

/** GET /api/teams/:teamCode (authenticated) — resolve a team by its code. */
export const getTeamByCode = asyncHandler(async (req, res) => {
  const normalized = String(req.params.teamCode || '').trim().toUpperCase();
  const team = await Team.findOne({ teamCode: normalized });
  if (!team) throw ApiError.notFound('No team was found for this Team Code.');

  // Only the project's faculty or the team's own members may view details.
  const isMember = await TeamMember.exists({ teamId: team._id, userId: req.user._id });
  const project = await Project.findById(team.projectId);
  const isProjectFaculty = project && String(project.facultyId) === String(req.user._id);
  if (!isMember && !isProjectFaculty) {
    throw ApiError.forbidden('You do not have permission to view this team.');
  }

  ok(res, { team: await buildTeamView(team), project });
});

/** GET /api/teams/mine (student) — the student's team, optionally filtered by project. */
export const getMyTeam = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const membership = await TeamMember.findOne({
    userId: req.user._id,
    status: 'ACTIVE',
    ...(projectId ? { projectId } : {}),
  });

  if (!membership) {
    return ok(res, { team: null });
  }

  const team = await Team.findById(membership.teamId).populate(TEAM_POPULATE).lean();
  ok(res, { team: await buildTeamView(team), membershipRole: membership.role });
});

/** GET /api/teams (faculty) — teams across the faculty's projects with search/filter. */
export const listFacultyTeams = asyncHandler(async (req, res) => {
  const { search = '', status = '', projectId = '' } = req.query;

  const projectFilter = { facultyId: req.user._id };
  if (projectId) projectFilter._id = projectId;
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    projectFilter.$or = [{ projectName: rx }, { projectId: rx }];
  }
  const projects = await Project.find(projectFilter).select('_id projectName projectId maxTeamMembers').lean();
  const projectIds = projects.map((p) => p._id);

  const teamQuery = { projectId: { $in: projectIds } };
  if (status && ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status)) {
    teamQuery.status = status;
  }

  const teams = await Team.find(teamQuery).populate(TEAM_POPULATE).sort({ createdAt: -1 }).lean();

  const projectMap = new Map(projects.map((p) => [String(p._id), p]));
  const teamsWithCounts = await Promise.all(
    teams.map(async (t) => ({
      ...t,
      memberCount: await TeamMember.countDocuments({ teamId: t._id, status: 'ACTIVE' }),
      maxMembers: projectMap.get(String(t.projectId?._id || t.projectId))?.maxTeamMembers ?? null,
    }))
  );

  ok(res, { teams: teamsWithCounts, projects });
});

/** GET /api/teams/:id/detail (authenticated) — full team detail with approval history. */
export const getTeamDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid team identifier');

  const team = await Team.findById(id).populate(TEAM_POPULATE).lean();
  if (!team) throw ApiError.notFound('Team not found');

  const project = await Project.findById(team.projectId?._id || team.projectId);
  const isMember = await TeamMember.exists({ teamId: team._id, userId: req.user._id });
  const isProjectFaculty = project && String(project.facultyId) === String(req.user._id);
  if (!isMember && !isProjectFaculty) {
    throw ApiError.forbidden('You do not have permission to view this team.');
  }

  const approvals = await Approval.find({ teamId: team._id })
    .sort({ createdAt: -1 })
    .populate('facultyId', 'firstName lastName')
    .lean();

  ok(res, { team: await buildTeamView(team), approvals });
});

/**
 * DELETE /api/teams/:teamId (student) — a team leader deletes their own team.
 * Memberships and approval history are removed; an assigned project title is
 * released back to AVAILABLE so other teams can pick it. Deleting an APPROVED
 * team is blocked (409) because it is locked in with the faculty — students
 * should contact faculty instead. Runs in a transaction.
 */
export const deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  if (!mongoose.isValidObjectId(teamId)) throw ApiError.badRequest('Invalid team identifier');

  const team = await Team.findById(teamId);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.teamLeaderId) !== String(req.user._id)) {
    throw ApiError.forbidden('Access restricted. Only the team leader can delete this team.');
  }
  if (team.status === 'APPROVED') {
    throw ApiError.conflict(
      'This team has been approved by faculty and can no longer be deleted. Please contact your faculty if you need to withdraw.'
    );
  }

  const members = await TeamMember.find({ teamId: team._id, status: 'ACTIVE' }).select('userId').lean();
  const project = await Project.findById(team.projectId).select('projectName projectId facultyId').lean();

  await withTransaction(async (session) => {
    const opts = session ? { session } : {};
    await Approval.deleteMany({ teamId: team._id }, opts);
    await TeamMember.deleteMany({ teamId: team._id }, opts);
    // Release the allocated title (only if it is still assigned to THIS team).
    if (team.projectTitleId) {
      await ProjectTitle.updateOne(
        { _id: team.projectTitleId, assignedTeamId: team._id },
        { $set: { status: 'AVAILABLE', assignedTeamId: null } },
        opts
      );
    }
    await Team.deleteOne({ _id: team._id }, opts);
  });

  // Notify ex-members + the project's faculty AFTER the transaction commits.
  await Promise.all([
    ...members
      .filter((m) => String(m.userId) !== String(req.user._id))
      .map((m) =>
        createNotification({
          userId: m.userId,
          type: 'MEMBER_LEFT',
          title: 'Team deleted',
          message: `The team "${team.teamName}" (${team.teamCode}) was deleted by its leader. You are no longer part of it.`,
          link: '/student/dashboard',
        })
      ),
    project &&
      createNotification({
        userId: String(project.facultyId),
        type: 'TEAM_DELETED',
        title: 'Team deleted',
        message: `"${team.teamName}" (${team.teamCode}) deleted their team in "${project.projectName}". Its title is available again.`,
        link: '/faculty/teams',
      }),
  ].filter(Boolean));

  ok(res, { deleted: true, membersNotified: members.length });
});
