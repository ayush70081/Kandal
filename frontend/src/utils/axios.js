import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];

// Process queue after refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token (user or admin)
api.interceptors.request.use(
  (config) => {
    const isAdminRequest = typeof config.url === 'string' && config.url.includes('/admin');
    const userToken = localStorage.getItem('accessToken');
    const adminToken = localStorage.getItem('adminAccessToken');
    const tokenToUse = isAdminRequest ? adminToken : userToken;

    if (tokenToUse) {
      config.headers.Authorization = `Bearer ${tokenToUse}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAdminRequest = typeof originalRequest.url === 'string' && originalRequest.url.includes('/admin');

      if (isAdminRequest) {
        // Admin: no refresh flow, redirect to admin login
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token available, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post('http://localhost:5000/api/auth/refresh', {
          refreshToken
        });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          
          // Update stored tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Process the queue with the new token
          processQueue(null, accessToken);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Process queue with error
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API calls
export const authAPI = {
  // Auth endpoints
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  
  // Profile endpoints
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  
  // Verification
  verifyToken: () => api.get('/auth/verify'),
  
  // Health check
  healthCheck: () => api.get('/auth/health')
};

// Admin API helpers
export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  verify: () => api.get('/admin/verify'),
  // Reports
  listReports: (params) => api.get('/admin/reports', { params }),
  getReport: (id) => api.get(`/admin/reports/${id}`),
  approveReport: (id, notes) => api.put(`/admin/reports/${id}/approve`, { notes }),
  rejectReport: (id, notes) => api.put(`/admin/reports/${id}/reject`, { notes }),
  // Users & badges
  listUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  awardPoints: (userId, points, reason) => api.post(`/admin/users/${userId}/points`, { points, reason }),
  leaderboard: (limit) => api.get('/admin/users/leaderboard/all', { params: { limit } }),
  listBadges: () => api.get('/admin/badges'),
  createBadge: (data) => api.post('/admin/badges', data),
  // Analytics
  analyticsOverview: () => api.get('/admin/analytics/overview'),
  analyticsReports: () => api.get('/admin/analytics/reports'),
  analyticsUsers: () => api.get('/admin/analytics/users'),
  analyticsGeographic: () => api.get('/admin/analytics/geographic')
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

// Helper function to get current user from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    // Decode JWT token (basic decoding, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function to clear authentication data
export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Helper function to set authentication data
export const setAuth = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Export configured axios instance as default
export default api;