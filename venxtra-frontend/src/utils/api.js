import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/token', credentials, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  register: (userData) => api.post('/auth/register', userData),
}

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
}

export const projectsAPI = {
  getAll: () => api.get('/projects/'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects/', data),
  delete: (id) => api.delete(`/projects/${id}`),
}

export const vendorsAPI = {
  getAll: () => api.get('/vendors/'),
  getByProject: (projectId) => api.get(`/vendors/project/${projectId}`),
  getOne: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors/', data),
  delete: (id) => api.delete(`/vendors/${id}`),
  deleteAll: () => api.delete('/vendors/'),
}

export const documentsAPI = {
  getAll: () => api.get('/documents/'),
  upload: (vendorId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/documents/upload?vendor_id=${vendorId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getByVendor: (vendorId) => api.get(`/documents/vendor/${vendorId}`),
  getOne: (id) => api.get(`/documents/${id}`),
  preview: (id) => api.get(`/documents/${id}/preview`),
  checkDuplicates: (id) => api.get(`/documents/${id}/duplicates`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
  deleteAll: () => api.delete('/documents/'),
}

export const comparisonAPI = {
  compare: (data) => api.post('/comparison/', data),
}

export default api