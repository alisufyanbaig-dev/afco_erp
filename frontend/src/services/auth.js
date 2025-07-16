const API_BASE_URL = 'http://localhost:8000/api';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      
      return data.access;
    } catch (error) {
      authService.logout();
      throw error;
    }
  },
};

// HTTP interceptor for adding auth token to requests
export const apiClient = {
  get: async (url, options = {}) => {
    return await makeRequest(url, { ...options, method: 'GET' });
  },

  post: async (url, data, options = {}) => {
    return await makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: async (url, data, options = {}) => {
    return await makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (url, options = {}) => {
    return await makeRequest(url, { ...options, method: 'DELETE' });
  },
};

const makeRequest = async (url, options = {}) => {
  const token = authService.getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    let response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // If token expired, try to refresh
    if (response.status === 401 && token) {
      try {
        const newToken = await authService.refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${url}`, config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw refreshError;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};