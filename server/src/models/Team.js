import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    // Human-readable unique code, e.g. PD-TEAM-X8K2M7 (generated on the backend)
    teamCode: {
      type: String,
      required: true,
      unique: true,
      match: [/^PD-TEAM-[A-Z2-9]{6}$/, 'Invalid Team Code format'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [3, 'Team name must be at least 3 characters'],
      maxlength: [80, 'Team name must be at most 80 characters'],
    },
    teamLogo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      originalName: { type: String, default: null },
    },
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemStatement: {
      type: String,
      required: [true, 'Problem statement is required'],
      trim: true,
      minlength: [20, 'Problem statement must be at least 20 characters'],
      maxlength: [3000, 'Problem statement must be at most 3000 characters'],
    },
    proposedSolution: {
      type: String,
      required: [true, 'Proposed solution is required'],
      trim: true,
      minlength: [20, 'Proposed solution must be at least 20 characters'],
      maxlength: [3000, 'Proposed solution must be at most 3000 characters'],
    },
    projectTitleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTitle',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// A student leads at most one team per project.
teamSchema.index({ projectId: 1, teamLeaderId: 1 }, { unique: true });

export const Team = mongoose.model('Team', teamSchema);
