import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1500, 'Remarks must be at most 1500 characters'],
      default: '',
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Latest-first history of reviews for a team.
approvalSchema.index({ teamId: 1, createdAt: -1 });

export const Approval = mongoose.model('Approval', approvalSchema);
