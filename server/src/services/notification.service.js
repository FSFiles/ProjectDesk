import { Notification } from '../models/Notification.js';

let io = null;
export const setSocketIO = (instance) => {
  io = instance;
};

/**
 * Persist a notification (source of truth) and push it over Socket.IO when a
 * socket room for the user is connected. The app must never *depend* on the
 * socket: clients also poll on load.
 */
export async function createNotification({ userId, type, title, message, link = null }) {
  const notification = await Notification.create({ userId, type, title, message, link });
  if (io) {
    io.to(`user:${String(userId)}`).emit('notification:new', {
      id: notification._id.toString(),
      type,
      title,
      message,
      link,
      read: false,
      createdAt: notification.createdAt,
    });
  }
  return notification;
}
