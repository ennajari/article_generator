import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updatePassword: (passwords) => api.put('/auth/update-password', passwords),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword })
};

// Articles API
export const articlesAPI = {
  generate: (query) => api.post('/articles/generate', { query }),
  extractImageContent: (formData) => {
    return axios.post('http://localhost:8000/extract-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getAll: (page = 1, limit = 10) => api.get(`/articles?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/articles/${id}`),
  delete: (id) => api.delete(`/articles/${id}`),
  addFeedback: (id, feedback) => api.put(`/articles/${id}/feedback`, feedback),
  getStats: () => api.get('/articles/stats/overview')
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

export default api;