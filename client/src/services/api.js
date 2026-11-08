const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Stats & KPIs
  getDashboardStats: () => request('/reports/dashboard-stats'),

  // Organizers
  getOrganizers: () => request('/organizers'),
  getOrganizer: (id) => request(`/organizers/${id}`),
  createOrganizer: (data) => request('/organizers', { method: 'POST', body: data }),
  updateOrganizer: (id, data) => request(`/organizers/${id}`, { method: 'PUT', body: data }),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (data) => request('/events', { method: 'POST', body: data }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PUT', body: data }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Event Requirements
  getEventRequirements: (eventId) => request(`/events/${eventId}/requirements`),
  addEventRequirement: (eventId, data) => request(`/events/${eventId}/requirements`, { method: 'POST', body: data }),
  deleteEventRequirement: (reqId) => request(`/events/requirements/${reqId}`, { method: 'DELETE' }),

  // Talent Matching (Calls sp_match_available_talents_for_event)
  matchTalents: (eventId) => request(`/events/${eventId}/match-talents`),

  // Participation & Registrations
  getEventParticipants: (eventId) => request(`/events/${eventId}/participants`),
  registerParticipant: (eventId, data) => request(`/events/${eventId}/register`, { method: 'POST', body: data }),
  updateParticipationStatus: (id, data) => request(`/participation/${id}/status`, { method: 'PATCH', body: data }),
  deleteParticipation: (id) => request(`/participation/${id}`, { method: 'DELETE' }),

  // Reports (Member 2 Queries)
  getDeficitReport: () => request('/reports/deficit'),
  getPopularEvents: () => request('/reports/popular-events'),
  getOrganizerSummary: () => request('/reports/organizer-summary'),
  getUpcomingEvents: () => request('/reports/upcoming'),
  getDepartmentDistribution: () => request('/reports/department-distribution'),

  // Lookups
  getSkills: () => request('/skills'),
  getCulturalActivities: () => request('/cultural-activities'),
  getParticipants: () => request('/participants'),
};
