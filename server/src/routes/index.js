import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { register, login, me } from '../controllers/auth.controller.js';
import { registerRules, loginRules } from '../validators/auth.validators.js';
import {
  createProject,
  listMyProjects,
  getProjectForFaculty,
  updateProjectStatus,
  deleteProject,
  accessProject,
} from '../controllers/project.controller.js';
import {
  createProjectRules,
  statusUpdateRules,
} from '../validators/project.validators.js';
import {
  createTeam,
  joinTeam,
  getTeamByCode,
  getMyTeam,
  listFacultyTeams,
  getTeamDetail,
  deleteTeam,
} from '../controllers/team.controller.js';
import { createTeamRules, joinTeamRules, teamIdParam, reviewRules } from '../validators/team.validators.js';
import { reviewTeam, listPendingApprovals } from '../controllers/approval.controller.js';
import { facultyStats, studentStats } from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadPdf, uploadImage, uploadProfileImage, multerErrorHandler } from '../middleware/upload.js';
import { uploadProfilePhoto, removeProfilePhoto } from '../controllers/profile.controller.js';
import { listNotifications, markNotificationRead } from '../controllers/notification.controller.js';

import { config } from '../config/env.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

// ---------- Health ----------
router.get('/health', (_req, res) => res.json({ success: true, service: 'ProjectDesk API', time: new Date().toISOString() }));

// ---------- Auth ----------
router.post('/auth/register', authLimiter, registerRules, register);
router.post('/auth/login', authLimiter, loginRules, login);
router.get('/auth/me', requireAuth, me);

// ---------- Projects ----------
// Multipart bodies deliver a single `titles` field as a string — coerce it to
// an array so one-title projects validate the same as multi-title ones.
const normalizeTitles = (req, _res, next) => {
  if (typeof req.body?.titles === 'string') req.body.titles = [req.body.titles];
  next();
};

router.post(
  '/projects',
  requireAuth,
  requireRole('faculty'),
  uploadPdf.single('instructionsPdf'),
  multerErrorHandler,
  normalizeTitles,
  createProjectRules,
  createProject
);
router.get('/projects', requireAuth, requireRole('faculty'), listMyProjects);
router.get('/projects/access/:projectId', requireAuth, requireRole('student'), accessProject);
router.get('/projects/:id', requireAuth, requireRole('faculty'), getProjectForFaculty);
router.patch('/projects/:id/status', requireAuth, requireRole('faculty'), statusUpdateRules, updateProjectStatus);
router.delete('/projects/:id', requireAuth, requireRole('faculty'), deleteProject);

// ---------- Titles ----------
router.get('/projects/:id/titles', requireAuth, requireRole('faculty'), async (req, res, next) => {
  const { getProjectTitles } = await import('../controllers/title.controller.js');
  return getProjectTitles(req, res, next);
});
router.patch('/titles/:titleId', requireAuth, requireRole('faculty'), async (req, res, next) => {
  const { updateTitle } = await import('../controllers/title.controller.js');
  return updateTitle(req, res, next);
});

// ---------- Teams ----------
router.post(
  '/teams',
  requireAuth,
  requireRole('student'),
  uploadImage.single('teamLogo'),
  multerErrorHandler,
  createTeamRules,
  createTeam
);
router.post('/teams/join', requireAuth, requireRole('student'), joinTeamRules, joinTeam);
router.get('/teams/mine', requireAuth, getMyTeam);
router.get('/teams', requireAuth, requireRole('faculty'), listFacultyTeams);
router.get('/teams/:teamCode', requireAuth, getTeamByCode);
router.get('/teams/:id/detail', requireAuth, getTeamDetail);
router.patch('/teams/:teamId/approval', requireAuth, requireRole('faculty'), reviewRules, reviewTeam);
router.delete('/teams/:teamId', requireAuth, requireRole('student'), teamIdParam, deleteTeam);

// ---------- Profile ----------
// Photo is attached to the JWT-identified user; no user id is accepted from
// the client, so one account can never modify another's photo.
router.post('/profile/photo', requireAuth, uploadProfileImage.single('photo'), multerErrorHandler, uploadProfilePhoto);
router.delete('/profile/photo', requireAuth, removeProfilePhoto);

// ---------- Approvals ----------
router.get('/approvals', requireAuth, requireRole('faculty'), listPendingApprovals);

// ---------- Dashboard ----------
router.get('/dashboard/faculty', requireAuth, requireRole('faculty'), facultyStats);
router.get('/dashboard/student', requireAuth, requireRole('student'), studentStats);

// ---------- Notifications ----------
router.get('/notifications', requireAuth, listNotifications);
router.patch('/notifications/:id/read', requireAuth, markNotificationRead);

export default router;
