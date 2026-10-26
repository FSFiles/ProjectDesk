import { Notification } from '../models/Notification.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';

/** GET /api/notifications — latest 30 notifications for the signed-in user. */
export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  const unread = notifications.filter((n) => !n.read).length;
  ok(res, { notifications, unread });
});

/** PATCH /api/notifications/:id/read — mark one notification as read. */
export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true, readAt: new Date() } }
  );
  ok(res, { updated: true });
});
