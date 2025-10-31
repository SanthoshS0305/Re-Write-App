import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// Story API
export const storyAPI = {
  getStories: () => api.get('/stories'),
  getStory: (id) => api.get(`/stories/${id}`),
  createStory: (data) => api.post('/stories', data),
  updateStory: (id, data) => api.put(`/stories/${id}`, data),
  deleteStory: (id) => api.delete(`/stories/${id}`),
  reorderChapters: (id, chapterIds) => api.put(`/stories/${id}/reorder`, { chapterIds }),
  createCharacter: (storyId, data) => api.post(`/stories/${storyId}/characters`, data),
  updateCharacter: (storyId, characterId, data) =>
    api.put(`/stories/${storyId}/characters/${characterId}`, data),
  deleteCharacter: (storyId, characterId) =>
    api.delete(`/stories/${storyId}/characters/${characterId}`),
};

// Chapter API
export const chapterAPI = {
  createChapter: (storyId, data) => api.post(`/chapters/stories/${storyId}/chapters`, data),
  getChapter: (id) => api.get(`/chapters/${id}`),
  updateChapter: (id, data) => api.put(`/chapters/${id}`, data),
  deleteChapter: (id) => api.delete(`/chapters/${id}`),
  createModularSection: (id, data) => api.post(`/chapters/${id}/modules`, data),
  updateModularSection: (id, moduleId, data) =>
    api.put(`/chapters/${id}/modules/${moduleId}`, data),
  activateVariant: (id, moduleId, variantName) =>
    api.put(`/chapters/${id}/modules/${moduleId}/activate`, { variantName }),
  deleteModularSection: (id, moduleId) => api.delete(`/chapters/${id}/modules/${moduleId}`),
};

// Revision API
export const revisionAPI = {
  getRevisions: (chapterId, page = 1, limit = 10) =>
    api.get(`/chapters/${chapterId}/revisions`, { params: { page, limit } }),
  getRevision: (id) => api.get(`/revisions/${id}`),
  restoreRevision: (chapterId, revisionId) =>
    api.post(`/chapters/${chapterId}/restore/${revisionId}`),
};

export default api;

