import client from './api.js';

const unwrap = (r) => r.data.data;

export const projectService = {
  // Faculty
  create: (formData) => client.post('/projects', formData).then(unwrap),
  listMine: (params) => client.get('/projects', { params }).then(unwrap),
  getForFaculty: (id) => client.get(`/projects/${id}`).then(unwrap),
  updateStatus: (id, status) => client.patch(`/projects/${id}/status`, { status }).then(unwrap),
  delete: (id) => client.delete(`/projects/${id}`).then(unwrap),

  // Student
  access: (projectId) => client.get(`/projects/access/${encodeURIComponent(projectId.trim().toUpperCase())}`).then(unwrap),

  // Shared
  titles: (projectId) => client.get(`/projects/${projectId}/titles`).then(unwrap),
};
