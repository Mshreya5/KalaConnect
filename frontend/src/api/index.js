import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getParticipants = () => api.get('/participants');
export const getParticipant = (id) => api.get(`/participants/${id}`);
export const createParticipant = (data) => api.post('/participants', data);
export const updateParticipant = (id, data) => api.put(`/participants/${id}`, data);
export const deleteParticipant = (id) => api.delete(`/participants/${id}`);

export const getActivities = () => api.get('/activities');
export const getActivitySkills = (id) => api.get(`/activities/${id}/skills`);

export const getParticipantSkills = (id) => api.get(`/participants/${id}/skills`);
export const addParticipantSkill = (id, data) => api.post(`/participants/${id}/skills`, data);
export const updateParticipantSkill = (id, skillId, data) => api.put(`/participants/${id}/skills/${skillId}`, data);
export const removeParticipantSkill = (id, skillId) => api.delete(`/participants/${id}/skills/${skillId}`);

export const getParticipantAvailability = (id) => api.get(`/participants/${id}/availability`);
export const createAvailability = (id, data) => api.post(`/participants/${id}/availability`, data);
export const updateAvailability = (id, data) => api.put(`/availability/${id}`, data);
export const deleteAvailability = (id) => api.delete(`/availability/${id}`);

export const searchTalents = (params) => api.get('/talents/search', { params });
export const getAvailableTalents = (params) => api.get('/talents/available', { params });
