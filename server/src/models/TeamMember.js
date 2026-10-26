import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['LEADER', 'MEMBER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'LEFT'],
      default: 'ACTIVE',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Rule: one student can belong to at most ONE team within the same project.
teamMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
