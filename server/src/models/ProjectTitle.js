import mongoose from 'mongoose';

const projectTitleSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title text is required'],
      trim: true,
      minlength: [3, 'Project title must be at least 3 characters'],
      maxlength: [160, 'Project title must be at most 160 characters'],
    },
    // Case-insensitive uniqueness within a project is enforced by a unique index.
    titleKey: { type: String, select: false },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED'],
      default: 'AVAILABLE',
    },
    assignedTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  { timestamps: true }
);

// Duplicate titles within the same project are impossible at the DB level.
projectTitleSchema.index({ projectId: 1, titleKey: 1 }, { unique: true });
projectTitleSchema.index({ projectId: 1, status: 1 });

export const ProjectTitle = mongoose.model('ProjectTitle', projectTitleSchema);
