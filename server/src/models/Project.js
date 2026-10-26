import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    // Human-readable unique ID, e.g. PD-PRJ-K7M4X9Q2 (generated on the backend)
    projectId: {
      type: String,
      required: true,
      unique: true,
      match: [/^PD-PRJ-[A-Z2-9]{8}$/, 'Invalid Project ID format'],
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [120, 'Project name must be at most 120 characters'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    maxTeamMembers: {
      type: Number,
      required: [true, 'Maximum team members is required'],
      min: [2, 'Maximum team members must be at least 2'],
      max: [10, 'Maximum team members cannot exceed 10'],
    },
    endDate: {
      type: Date,
      required: [true, 'Project end date is required'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [4000, 'Instructions must be at most 4000 characters'],
      default: '',
    },
    instructionsPdf: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      originalName: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CLOSED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

projectSchema.index({ facultyId: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
