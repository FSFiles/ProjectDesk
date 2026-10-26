import client from './api.js';

const unwrap = (r) => r.data.data;

export const dashboardService = {
  faculty: () => client.get('/dashboard/faculty').then(unwrap),
  student: () => client.get('/dashboard/student').then(unwrap),
};

export const notificationService = {
  list: () => client.get('/notifications').then(unwrap),
  markRead: (id) => client.patch(`/notifications/${id}/read`).then(unwrap),
};
