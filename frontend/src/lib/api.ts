import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  guestLogin: () => api.post('/auth/guest'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const emergencyAPI = {
  triggerSOS: (data: any) => api.post('/emergency/sos', data),
  resolve: (data: any) => api.post('/emergency/resolve', data),
  getHistory: (params?: any) => api.get('/emergency/history', { params }),
  getById: (id: string) => api.get(`/emergency/${id}`),
};

export const contactAPI = {
  getAll: () => api.get('/contacts'),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

export const locationAPI = {
  update: (data: any) => api.post('/locations/update', data),
  getHistory: (params?: any) => api.get('/locations/history', { params }),
  getCurrent: () => api.get('/locations/current'),
  getSafeSpots: (params: any) => api.get('/locations/safe-spots', { params }),
  getTracking: (userId: string) => api.get(`/locations/tracking/${userId}`),
};

export const recordingAPI = {
  upload: (data: any) => api.post('/recordings/upload-base64', data),
  getAll: (params?: any) => api.get('/recordings', { params }),
  delete: (id: string) => api.delete(`/recordings/${id}`),
};

export const alertAPI = {
  getAll: (params?: any) => api.get('/alerts', { params }),
  getGuardianAlerts: () => api.get('/alerts/guardian'),
  updateStatus: (id: string, status: string) => api.put(`/alerts/${id}/status`, { status }),
};

export const aiAPI = {
  analyzeVoice: (data: any) => api.post('/ai/voice', data),
  analyzeEmotion: (data: any) => api.post('/ai/emotion', data),
  analyzeGesture: (data: any) => api.post('/ai/gesture', data),
  processEvent: (data: any) => api.post('/ai/event', data),
};

export default api;
