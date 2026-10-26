import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'PROJECT_CREATED',
  'TEAM_CREATED',
  'MEMBER_JOINED',
  'TEAM_APPROVED',
  'TEAM_REJECTED',
  'CHANGES_REQUESTED',
  'TITLE_ASSIGNED',
  'PROJECT_DELETED',
  'TEAM_DELETED',
  'MEMBER_LEFT',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export { NOTIFICATION_TYPES };
