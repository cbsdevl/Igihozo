import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const medicineService = {
  getAll: (params) => api.get('/medicines', { params }),
  getOne: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  remove: (id) => api.delete(`/medicines/${id}`),
  adjustQuantity: (id, data) => api.patch(`/medicines/${id}/quantity`, data),
  search: (q, limit = 10) => api.get('/medicines/search', { params: { q, limit } }),
  getCategories: () => api.get('/medicines/categories'),
};

export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  cancel: (id) => api.patch(`/sales/${id}/cancel`),
  getStats: () => api.get('/sales/stats'),
};

export const workerService = {
  getAll: (params) => api.get('/workers', { params }),
  getOne: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  remove: (id) => api.delete(`/workers/${id}`),
};

export const supplierService = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
};

export const inventoryService = {
  getAll: (params) => api.get('/inventory', { params }),
  overview: () => api.get('/inventory/overview'),
};

export const reportService = {
  dashboard: () => api.get('/reports/dashboard'),
  daily: (date) => api.get('/reports/daily', { params: { date } }),
  weekly: () => api.get('/reports/weekly'),
  monthly: (month) => api.get('/reports/monthly', { params: { month } }),
  expired: () => api.get('/reports/expired'),
  lowStock: () => api.get('/reports/low-stock'),
  profit: (params) => api.get('/reports/profit', { params }),
  inventory: () => api.get('/reports/inventory'),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear-read'),
};

export const settingsService = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  backup: () => api.post('/settings/backup'),
  listBackups: () => api.get('/settings/backups'),
};

export const activityService = {
  getAll: (params) => api.get('/activity-logs', { params }),
  getModules: () => api.get('/activity-logs/modules'),
};
