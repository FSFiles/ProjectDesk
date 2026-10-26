import { Project as ProjectModel } from '../models/Project.js';
import { ProjectTitle } from '../models/ProjectTitle.js';
import { Team as TeamModel } from '../models/Team.js';
import { TeamMember as TeamMemberModel } from '../models/TeamMember.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';

/** GET /api/dashboard/faculty — real aggregates from MongoDB. */
export const facultyStats = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const projects = await ProjectModel.find({ facultyId })
    .select('projectId projectName status endDate createdAt maxTeamMembers')
    .sort({ createdAt: -1 })
    .lean();
  const projectIds = projects.map((p) => p._id);

  const [titleAgg, teamAgg, memberCountAgg] = await Promise.all([
    ProjectTitle.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TeamModel.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TeamMemberModel.aggregate([
      { $match: { projectId: { $in: projectIds }, status: 'ACTIVE' } },
      { $count: 'members' },
    ]),
  ]);

  const titleCounts = { AVAILABLE: 0, ASSIGNED: 0 };
  titleAgg.forEach((r) => {
    titleCounts[r._id] = r.count;
  });
  const teamCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0, CHANGES_REQUESTED: 0 };
  teamAgg.forEach((r) => {
    teamCounts[r._id] = r.count;
  });

  const totalTeams = Object.values(teamCounts).reduce((a, b) => a + b, 0);
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const totalTitles = titleCounts.AVAILABLE + titleCounts.ASSIGNED;

  // Recent activity: latest 6 teams across own projects.
  const recentTeams = await TeamModel.find({ projectId: { $in: projectIds } })
    .populate('projectTitleId', 'title')
    .populate('projectId', 'projectId projectName')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  ok(res, {
    stats: {
      totalProjects: projects.length,
      activeProjects,
      totalTeams,
      totalStudents: memberCountAgg[0]?.members || 0,
      pendingApprovals: teamCounts.PENDING,
      approvedTeams: teamCounts.APPROVED,
      rejectedTeams: teamCounts.REJECTED,
      changesRequested: teamCounts.CHANGES_REQUESTED,
      totalTitles,
      availableTitles: titleCounts.AVAILABLE,
      assignedTitles: titleCounts.ASSIGNED,
    },
    recentProjects: projects.slice(0, 5),
    recentTeams,
    teamStatusOverview: teamCounts,
  });
});

/** GET /api/dashboard/student — the student's personal overview. */
export const studentStats = asyncHandler(async (req, res) => {
  const memberships = await TeamMemberModel.find({ userId: req.user._id, status: 'ACTIVE' })
    .populate({
      path: 'teamId',
      populate: [
        { path: 'projectTitleId', select: 'title status' },
        { path: 'projectId', select: 'projectId projectName endDate status maxTeamMembers' },
      ],
    })
    .lean();

  const teams = memberships
    .filter((m) => m.teamId)
    .map((m) => ({ ...m.teamId, membershipRole: m.role }));
  const teamsWithCounts = await Promise.all(
    teams.map(async (t) => ({
      ...t,
      memberCount: await TeamMemberModel.countDocuments({ teamId: t._id, status: 'ACTIVE' }),
    }))
  );

  ok(res, { teams: teamsWithCounts });
});
