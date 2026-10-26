/**
 * Central model barrel — importing this module guarantees every Mongoose
 * schema is registered, and provides shared populate configs.
 */
import { Project } from './Project.js';
import { ProjectTitle } from './ProjectTitle.js';
import { Team } from './Team.js';
import { TeamMember } from './TeamMember.js';
import { Approval } from './Approval.js';
import { Notification } from './Notification.js';
import { User } from './User.js';

export { Project, ProjectTitle, Team, TeamMember, Approval, Notification, User };

/** Standard populate config for team documents. */
export const TEAM_POPULATE = [
  { path: 'projectTitleId', select: 'title status assignedTeamId' },
  { path: 'projectId', select: 'projectId projectName maxTeamMembers endDate status' },
];
