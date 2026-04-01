import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tccs_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tccs_token')
      localStorage.removeItem('tccs_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
  updateProfile: (data) => api.patch('/auth/me', data),
}

// Dashboard
export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
}

// Consignments
export const consignmentsAPI = {
  getAll: (params) => api.get('/consignments', { params }),
  getById: (id) => api.get(`/consignments/${id}`),
  create: (data) => api.post('/consignments', data),
  updateStatus: (id, data) => api.patch(`/consignments/${id}/status`, data),
  delete: (id) => api.delete(`/consignments/${id}`),
}

// Trucks
export const trucksAPI = {
  getAll: (params) => api.get('/trucks', { params }),
  getById: (id) => api.get(`/trucks/${id}`),
  getAvailable: () => api.get('/trucks/available'),
  create: (data) => api.post('/trucks', data),
  updateStatus: (id, data) => api.patch(`/trucks/${id}/status`, data),
}

// Allocation
export const allocationAPI = {
  trigger: (data) => api.post('/allocation/trigger', data),
  pendingVolumes: () => api.get('/allocation/pending-volumes'),
  manualAssign: (data) => api.post('/allocation/manual-assign', data),
  assignableConsignments: (params) => api.get('/allocation/assignable-consignments', { params }),
}

// Dispatch
export const dispatchAPI = {
  getAll: (params) => api.get('/dispatch', { params }),
  getById: (id) => api.get(`/dispatch/${id}`),
  create: (data) => api.post('/dispatch', data),
}

// Bills
export const billsAPI = {
  getByConsignment: (consignmentNumber) => api.get(`/bills/${consignmentNumber}`),
  generate: (data) => api.post('/bills/generate', data),
}

// Pricing
export const pricingAPI = {
  getAll: () => api.get('/pricing-rules'),
  create: (data) => api.post('/pricing-rules', data),
  update: (id, data) => api.put(`/pricing-rules/${id}`, data),
}

// Reports
export const reportsAPI = {
  revenue: (params) => api.get('/reports/revenue', { params }),
  performance: (params) => api.get('/reports/performance', { params }),
  truckUsage: (params) => api.get('/reports/truck-usage', { params }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
}

// Chat
export const chatAPI = {
  getUsers: () => api.get('/chat/users'),
  getMessages: (params) => api.get('/chat/messages', { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
}

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  stats: () => api.get('/users/stats'),
  pending: () => api.get('/users/pending'),
  approve: (id) => api.patch(`/users/${id}/approve`),
  reject: (id) => api.patch(`/users/${id}/reject`),
}

export default api
