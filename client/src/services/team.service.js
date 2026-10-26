import client from './api.js';

const unwrap = (r) => r.data.data;

export const teamService = {
  create: (formData) => client.post('/teams', formData).then(unwrap),
  join: (teamCode) => client.post('/teams/join', { teamCode }).then(unwrap),
  byCode: (code) => client.get(`/teams/${encodeURIComponent(code.trim().toUpperCase())}`).then(unwrap),
  mine: (projectId) => client.get('/teams/mine', { params: projectId ? { projectId } : {} }).then(unwrap),
  detail: (id) => client.get(`/teams/${id}/detail`).then(unwrap),
  delete: (id) => client.delete(`/teams/${id}`).then(unwrap),

  // Faculty
  listAll: (params) => client.get('/teams', { params }).then(unwrap),
  review: (teamId, action, remarks) =>
    client.patch(`/teams/${teamId}/approval`, { action, remarks }).then(unwrap),
  approvals: () => client.get('/approvals').then(unwrap),
};
