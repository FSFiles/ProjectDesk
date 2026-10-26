import { ProjectTitle } from '../models/ProjectTitle.js';
import { Project } from '../models/Project.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Approval } from '../models/Approval.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { createNotification } from '../services/notification.service.js';

/**
 * PATCH /api/teams/:teamId/approval (faculty, project owner only)
 * Body: { action: APPROVED | REJECTED | CHANGES_REQUESTED, remarks? }
 * Remarks are REQUIRED when requesting changes.
 */
export const reviewTeam = asyncHandler(async (req, res) => {
  validate(req);
  const { teamId } = req.params;
  const { action, remarks = '' } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw ApiError.notFound('Team not found');

  const project = await Project.findById(team.projectId);
  if (!project || String(project.facultyId) !== String(req.user._id)) {
    throw ApiError.forbidden("Access restricted. Only the project's faculty can review this team.");
  }

  if (team.status === action) {
    throw ApiError.conflict(`This team is already marked as ${action.replace('_', ' ').toLowerCase()}.`);
  }

  // Record the review in the approval history.
  const approval = await Approval.create({
    teamId: team._id,
    facultyId: req.user._id,
    status: action,
    remarks: remarks || '',
    reviewedAt: new Date(),
  });

  team.status = action;
  await team.save();

  // Release the title when a team is rejected so other teams can use it.
  if (action === 'REJECTED' && team.projectTitleId) {
    await ProjectTitle.updateOne(
      { _id: team.projectTitleId, assignedTeamId: team._id },
      { $set: { status: 'AVAILABLE', assignedTeamId: null } }
    );
  }

  // Notify every active member of the team.
  const members = await TeamMember.find({ teamId: team._id, status: 'ACTIVE' }).lean();
  const verb =
    action === 'APPROVED' ? 'approved' : action === 'REJECTED' ? 'rejected' : 'sent back for changes';
  const message = `Your team "${team.teamName}" was ${verb}${remarks ? ` — ${remarks}` : '.'}`;
  const notificationType =
    action === 'APPROVED' ? 'TEAM_APPROVED' : action === 'REJECTED' ? 'TEAM_REJECTED' : 'CHANGES_REQUESTED';

  await Promise.all(
    members.map((m) =>
      createNotification({
        userId: String(m.userId),
        type: notificationType,
        title: `Team ${action.replace('_', ' ').toLowerCase()}`,
        message,
        link: '/student/team',
      })
    )
  );

  ok(res, { approval, team });
});

/** GET /api/approvals (faculty) — pending reviews + per-project overview. */
export const listPendingApprovals = asyncHandler(async (req, res) => {
  const projects = await Project.find({ facultyId: req.user._id })
    .select('projectId projectName status endDate maxTeamMembers')
    .sort({ createdAt: -1 })
    .lean();
  const projectIds = projects.map((p) => p._id);

  // Counts per project in bulk.
  const [titleRows, teamRows] = await Promise.all([
    ProjectTitle.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: { p: '$projectId', s: '$status' }, n: { $sum: 1 } } },
    ]),
    Team.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: { p: '$projectId', s: '$status' }, n: { $sum: 1 } } },
    ]),
  ]);

  const titleMap = {};
  titleRows.forEach(({ _id, n }) => {
    const m = (titleMap[String(_id.p)] ||= { AVAILABLE: 0, ASSIGNED: 0, total: 0 });
    m[_id.s] = n;
    m.total += n;
  });
  const teamMap = {};
  teamRows.forEach(({ _id, n }) => {
    const m = (teamMap[String(_id.p)] ||= { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, CHANGES_REQUESTED: 0 });
    m.total += n;
    m[_id.s] = n;
  });

  const overview = projects.map((p) => ({
    _id: p._id,
    projectId: p.projectId,
    projectName: p.projectName,
    status: p.status,
    endDate: p.endDate,
    maxTeamMembers: p.maxTeamMembers,
    titleCount: titleMap[String(p._id)]?.total || 0,
    availableTitles: titleMap[String(p._id)]?.AVAILABLE || 0,
    teamCount: teamMap[String(p._id)]?.total || 0,
    pendingTeams: teamMap[String(p._id)]?.PENDING || 0,
  }));

  // Pending teams, oldest first, with member counts.
  const pendingRaw = await Team.find({ projectId: { $in: projectIds }, status: 'PENDING' })
    .populate('projectTitleId', 'title status')
    .populate('projectId', 'projectId projectName maxTeamMembers')
    .sort({ createdAt: 1 })
    .lean();

  const pendingTeams = await Promise.all(
    pendingRaw.map(async (t) => ({
      ...t,
      memberCount: await TeamMember.countDocuments({ teamId: t._id, status: 'ACTIVE' }),
    }))
  );

  ok(res, { overview, pendingTeams });
});
