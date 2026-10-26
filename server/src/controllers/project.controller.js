import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { ProjectTitle } from '../models/ProjectTitle.js';
import { Team, TEAM_POPULATE } from '../models/helpers.js';
import { TeamMember } from '../models/TeamMember.js';
import { Approval } from '../models/Approval.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { generateUniqueProjectId } from '../services/id.service.js';
import { storeFile } from '../services/storage.service.js';
import { createNotification } from '../services/notification.service.js';
import { withTransaction } from './team.controller.js';

const normalizeTitleKey = (t) => t.trim().replace(/\s+/g, ' ').toLowerCase();

/** POST /api/projects (faculty) — create project + titles atomically. */
export const createProject = asyncHandler(async (req, res) => {
  validate(req);
  const { projectName, maxTeamMembers, endDate, instructions = '', titles } = req.body;

  // Backend-enforced business rules for titles.
  const cleaned = (titles || []).map((t) => String(t || '').trim()).filter(Boolean);
  if (cleaned.length === 0) {
    throw ApiError.badRequest('At least one project title is required', [
      { field: 'titles', message: 'At least one project title is required' },
    ]);
  }
  const seen = new Set();
  for (const t of cleaned) {
    const key = normalizeTitleKey(t);
    if (seen.has(key)) {
      throw ApiError.badRequest('Project titles must be unique', [
        { field: 'titles', message: `Duplicate title: "${t}"` },
      ]);
    }
    seen.add(key);
  }

  const projectId = await generateUniqueProjectId();

  const project = await Project.create({
    projectId,
    projectName,
    facultyId: req.user._id,
    maxTeamMembers: Number(maxTeamMembers),
    endDate: new Date(endDate),
    instructions: instructions || '',
    instructionsPdf: { url: null, publicId: null, originalName: null, uploadedAt: null },
    status: 'ACTIVE',
  });

  try {
    await ProjectTitle.insertMany(
      cleaned.map((t) => ({
        projectId: project._id,
        title: t.trim().replace(/\s+/g, ' '),
        titleKey: normalizeTitleKey(t),
        status: 'AVAILABLE',
      }))
    );
  } catch (err) {
    // Roll the project back if its titles could not be created.
    await Project.deleteOne({ _id: project._id });
    throw err;
  }

  // Optional instructions PDF (uploaded via multipart form when present).
  if (req.file) {
    try {
      const stored = await storeFile(req.file, 'instructions');
      project.instructionsPdf = {
        url: stored.url,
        publicId: stored.publicId,
        originalName: stored.originalName,
        uploadedAt: new Date(),
      };
      await project.save();
    } catch (err) {
      console.error('[upload] instructions PDF failed:', err?.message);
    }
  }

  await createNotification({
    userId: req.user._id,
    type: 'PROJECT_CREATED',
    title: 'Project created',
    message: `"${project.projectName}" is ready. Project ID: ${projectId}`,
    link: `/faculty/projects/${project._id}`,
  });

  ok(res, { project: project.toJSON(), titles: cleaned.length }, 201);
});

/** GET /api/projects (faculty) — own projects with aggregate stats + search. */
export const listMyProjects = asyncHandler(async (req, res) => {
  const { search = '', status = '' } = req.query;

  const query = { facultyId: req.user._id };
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ projectName: rx }, { projectId: rx }];
  }
  if (status && ['ACTIVE', 'COMPLETED', 'CLOSED'].includes(status)) query.status = status;

  const projects = await Project.find(query).sort({ createdAt: -1 }).lean();

  // Aggregates per project: team counts + available/assigned title counts.
  const ids = projects.map((p) => p._id);
  const titleCounts = await ProjectTitle.aggregate([
    { $match: { projectId: { $in: ids } } },
    { $group: { _id: { projectId: '$projectId', status: '$status' }, count: { $sum: 1 } } },
  ]);
  const teamCounts = await Team.aggregate([
    { $match: { projectId: { $in: ids } } },
    { $group: { _id: { projectId: '$projectId', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const titleMap = {};
  titleCounts.forEach(({ _id, count }) => {
    const m = (titleMap[_id.projectId.toString()] ||= { AVAILABLE: 0, ASSIGNED: 0, total: 0 });
    m[_id.status] = count;
    m.total += count;
  });
  const teamMap = {};
  teamCounts.forEach(({ _id, count }) => {
    const m = (teamMap[_id.projectId.toString()] ||= { total: 0, PENDING: 0, APPROVED: 0 });
    m.total += count;
    if (_id.status === 'PENDING') m.PENDING += count;
    if (_id.status === 'APPROVED') m.APPROVED += count;
  });

  ok(
    res,
    {
      projects: projects.map((p) => ({
        ...p,
        stats: {
          titles: titleMap[p._id.toString()] || { AVAILABLE: 0, ASSIGNED: 0, total: 0 },
          teams: teamMap[p._id.toString()] || { total: 0, PENDING: 0, APPROVED: 0 },
        },
      })),
    }
  );
});

/** GET /api/projects/:id (faculty) — full detail incl. titles and teams. */
export const getProjectForFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findOne(mongoose.isValidObjectId(id) ? { _id: id } : { projectId: id });
  if (!project) throw ApiError.notFound('Project not found');
  if (String(project.facultyId) !== String(req.user._id)) {
    throw ApiError.forbidden('Access restricted. You can only view your own projects.');
  }

  const titles = await ProjectTitle.find({ projectId: project._id }).sort({ createdAt: 1 }).lean();
  const teams = await Team.find({ projectId: project._id })
    .populate(TEAM_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  const memberIds = teams.map((t) => t.teamLeaderId?._id).filter(Boolean);
  const leaders = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select('firstName lastName email').lean()
    : [];
  const leaderMap = new Map(leaders.map((l) => [String(l._id), l]));

  const teamsWithMembers = await Promise.all(
    teams.map(async (t) => ({
      ...t,
      leader: leaderMap.get(String(t.teamLeaderId?._id)) || null,
      memberCount: await TeamMember.countDocuments({ teamId: t._id, status: 'ACTIVE' }),
    }))
  );

  ok(res, { project, titles, teams: teamsWithMembers });
});

/** PATCH /api/projects/:id/status (faculty) — change project status. */
export const updateProjectStatus = asyncHandler(async (req, res) => {
  validate(req);
  const { id } = req.params;
  const { status } = req.body;

  const project = await Project.findOne({ _id: id, facultyId: req.user._id });
  if (!project) throw ApiError.notFound('Project not found');

  project.status = status;
  await project.save();
  ok(res, { project });
});

/**
 * DELETE /api/projects/:id (faculty) — delete a project the faculty owns and
 * every dependent record: titles, teams, memberships and approval history.
 * Runs in a transaction so a mid-failure never leaves partial cleanup behind.
 * Notifications are persisted AFTER commit so they are not rolled back.
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findOne(mongoose.isValidObjectId(id) ? { _id: id } : { projectId: id });
  if (!project) throw ApiError.notFound('Project not found');
  if (String(project.facultyId) !== String(req.user._id)) {
    throw ApiError.forbidden('Access restricted. You can only delete your own projects.');
  }

  const teamIds = (await Team.find({ projectId: project._id }).select('_id').lean()).map((t) => t._id);
  const memberIds = (await TeamMember.find({ projectId: project._id }).select('userId').lean()).map((m) => m.userId);

  await withTransaction(async (session) => {
    const opts = session ? { session } : {};
    if (teamIds.length) {
      await Approval.deleteMany({ teamId: { $in: teamIds } }, opts);
      await TeamMember.deleteMany({ teamId: { $in: teamIds } }, opts);
      await Team.deleteMany({ _id: { $in: teamIds } }, opts);
    }
    await ProjectTitle.deleteMany({ projectId: project._id }, opts);
    await Project.deleteOne({ _id: project._id }, opts);
  });

  // Notify everyone who had a stake in this project (after the transaction commits).
  await Promise.all([
    createNotification({
      userId: req.user._id,
      type: 'PROJECT_DELETED',
      title: 'Project deleted',
      message: `You deleted "${project.projectName}" (${project.projectId}) and its ${teamIds.length} team(s).`,
      link: '/faculty/projects',
    }),
    ...memberIds.map((userId) =>
      createNotification({
        userId,
        type: 'PROJECT_DELETED',
        title: 'Project removed',
        message: `"${project.projectName}" (${project.projectId}) was removed by faculty. You are no longer part of any team in it.`,
        link: '/student/dashboard',
      })
    ),
  ]);

  ok(res, { deleted: true, teamsRemoved: teamIds.length, membersNotified: memberIds.length });
});

/** GET /api/projects/access/:projectId (student) — resolve a Project ID. */
export const accessProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const normalized = String(projectId || '').trim().toUpperCase();

  if (!/^PD-PRJ-[A-Z2-9]{8}$/.test(normalized)) {
    throw ApiError.badRequest('That does not look like a valid Project ID. Check the format (e.g. PD-PRJ-K7M4X9Q2).');
  }

  const project = await Project.findOne({ projectId: normalized });
  if (!project) {
    throw ApiError.notFound('No project was found for this Project ID. Please double-check with your faculty.');
  }

  const titles = await ProjectTitle.find({ projectId: project._id }).sort({ createdAt: 1 }).lean();
  const teamsCount = await Team.countDocuments({ projectId: project._id });

  // The student's own relationship to this project, if any.
  const membership = await TeamMember.findOne({ projectId: project._id, userId: req.user._id, status: 'ACTIVE' });
  let myTeam = null;
  if (membership) {
    const team = await Team.findById(membership.teamId)
      .populate(TEAM_POPULATE)
      .populate('projectTitleId', 'title status')
      .lean();
    if (team) {
      const members = await TeamMember.find({ teamId: team._id, status: 'ACTIVE' })
        .populate('userId', 'firstName lastName email')
        .lean();
      myTeam = { ...team, members };
    }
  }

  ok(res, {
    project: {
      id: project._id,
      projectId: project.projectId,
      projectName: project.projectName,
      maxTeamMembers: project.maxTeamMembers,
      endDate: project.endDate,
      instructions: project.instructions,
      instructionsPdf: project.instructionsPdf,
      status: project.status,
      createdAt: project.createdAt,
      faculty: (await User.findById(project.facultyId).select('firstName lastName email')) || null,
    },
    titles,
    teamsCount,
    myTeam,
  });
});
