import { body, param } from 'express-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

export const createProjectRules = [
  body('projectName')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 120 }).withMessage('Project name must be 3-120 characters'),
  body('maxTeamMembers')
    .notEmpty().withMessage('Maximum team members is required')
    .isInt({ min: 2, max: 10 }).withMessage('Maximum team members must be between 2 and 10'),
  body('endDate')
    .notEmpty().withMessage('Project end date is required')
    .custom((v) => !Number.isNaN(new Date(v).getTime())).withMessage('End date must be a valid date')
    .custom((v) => new Date(v) > new Date()).withMessage('End date must be in the future'),
  body('instructions').optional().isLength({ max: 4000 }).withMessage('Instructions must be at most 4000 characters'),
  body('titles')
    .custom((titles) => Array.isArray(titles) && titles.length > 0).withMessage('At least one project title is required'),
  body('titles.*')
    .trim()
    .isLength({ min: 3, max: 160 }).withMessage('Each project title must be 3-160 characters'),
];

export const projectIdParam = [
  param('id').trim().notEmpty().withMessage('Project identifier is required'),
];

export const statusUpdateRules = [
  body('status').isIn(['ACTIVE', 'COMPLETED', 'CLOSED']).withMessage('Invalid project status'),
];

export const accessProjectParam = [
  param('projectId')
    .trim()
    .notEmpty().withMessage('Project ID is required'),
];
