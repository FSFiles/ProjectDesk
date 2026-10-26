import { body, param } from 'express-validator';

export const createTeamRules = [
  body('projectId').notEmpty().withMessage('Project is required'),
  body('teamName')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ min: 3, max: 80 }).withMessage('Team name must be 3-80 characters'),
  body('problemStatement')
    .trim()
    .notEmpty().withMessage('Problem statement is required')
    .isLength({ min: 20, max: 3000 }).withMessage('Problem statement must be at least 20 characters'),
  body('proposedSolution')
    .trim()
    .notEmpty().withMessage('Proposed solution is required')
    .isLength({ min: 20, max: 3000 }).withMessage('Proposed solution must be at least 20 characters'),
  body('projectTitleId').notEmpty().withMessage('Please select a project title'),
];

export const joinTeamRules = [
  body('teamCode')
    .trim()
    .notEmpty().withMessage('Team Code is required'),
];

export const teamIdParam = [param('teamId').isMongoId().withMessage('Invalid team identifier')];

export const reviewRules = [
  param('teamId').isMongoId().withMessage('Invalid team identifier'),
  body('action')
    .isIn(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'])
    .withMessage('Invalid review action'),
  body('remarks').custom((value, { req }) => {
    const remarks = (value || '').trim();
    if (req.body.action === 'CHANGES_REQUESTED' && remarks.length < 5) {
      throw new Error('Remarks are required when requesting changes (minimum 5 characters)');
    }
    if (remarks.length > 1500) {
      throw new Error('Remarks must be at most 1500 characters');
    }
    return true;
  }),
];
