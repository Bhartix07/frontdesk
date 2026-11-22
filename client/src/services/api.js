import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Interceptor to attach active agent identity
api.interceptors.request.use(config => {
  const currentAgent = localStorage.getItem('frontdesk_active_agent');
  if (currentAgent) {
    try {
      const agent = JSON.parse(currentAgent);
      config.headers['x-agent-id'] = agent.id;
      config.headers['x-agent-name'] = agent.name;
      config.headers['x-requester-role'] = 'AGENT';
    } catch (e) {
      // fallback
    }
  }
  return config;
});

export const ticketApi = {
  getTickets: (params) => api.get('/tickets', { params }),
  getTicketDetails: (id) => api.get(`/tickets/${id}`),
  getCustomerTicket: (ticketNumber) => api.get(`/tickets/customer/${ticketNumber}`),
  createTicket: (data) => api.post('/tickets', data),
  claimTicket: (id, agentId) => api.post(`/tickets/${id}/claim`, { agentId }),
  assignTicket: (id, targetAgentId, assignedByAgentId, assignedByAgentName) =>
    api.post(`/tickets/${id}/assign`, { targetAgentId, assignedByAgentId, assignedByAgentName }),
  updatePriority: (id, priority, agentId, agentName) =>
    api.patch(`/tickets/${id}/priority`, { priority, agentId, agentName }),
  updateStatus: (id, status, actorType, actorId, actorName, reason) =>
    api.patch(`/tickets/${id}/status`, { status, actorType, actorId, actorName, reason }),
  addMessage: (id, messageData) => api.post(`/tickets/${id}/messages`, messageData),
  addInternalNote: (id, agentId, content) => api.post(`/tickets/${id}/notes`, { agentId, content }),
  getAuditTrail: (id) => api.get(`/tickets/${id}/audit`),
  getMetrics: () => api.get('/tickets/metrics'),
  triggerSweep: () => api.post('/tickets/sweep-autoclose')
};

export const agentApi = {
  getAgents: () => api.get('/agents'),
  getAgentById: (id) => api.get(`/agents/${id}`)
};

export default api;
