import client from './api.js';

export const authService = {
  register: (payload) => client.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => client.post('/auth/login', payload).then((r) => r.data.data),
  me: () => client.get('/auth/me').then((r) => r.data.data),
  // Profile photo (multipart with a `photo` field) — server attaches it to the JWT user.
  uploadPhoto: (formData) => client.post('/profile/photo', formData).then((r) => r.data.data),
  removePhoto: () => client.delete('/profile/photo').then((r) => r.data.data),
};
