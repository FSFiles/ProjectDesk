import { ProjectTitle } from '../models/ProjectTitle.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { body } from 'express-validator';
import { validate } from '../utils/validate.js';

/** GET /api/projects/:id/titles (faculty, owner only). */
export const getProjectTitles = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, facultyId: req.user._id });
  if (!project) throw ApiError.notFound('Project not found');
  const titles = await ProjectTitle.find({ projectId: project._id }).sort({ createdAt: 1 }).lean();
  ok(res, { titles });
});

/** PATCH /api/titles/:titleId (faculty, owner only) — edit title text while AVAILABLE. */
export const updateTitle = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 160 })
    .withMessage('Title must be 3-160 characters'),
  asyncHandler(async (req, res) => {
    validate(req);
    const title = await ProjectTitle.findById(req.params.titleId);
    if (!title) throw ApiError.notFound('Title not found');

    const project = await Project.findById(title.projectId);
    if (!project || String(project.facultyId) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only edit titles of your own projects.');
    }
    if (title.status !== 'AVAILABLE') {
      throw ApiError.conflict('Assigned titles cannot be edited.');
    }

    title.title = req.body.title;
    title.titleKey = req.body.title.trim().replace(/\s+/g, ' ').toLowerCase();
    await title.save();
    ok(res, { title });
  }),
];
