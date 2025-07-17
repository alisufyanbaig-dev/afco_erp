import toast from 'react-hot-toast';

// Configuration
const API_CONFIG = {
  baseURL: 'http://localhost:3500/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

/**
 * Token management utilities
 */
export const tokenManager = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },
  removeTokens: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp <= currentTime;
    } catch (error) {
      return true;
    }
  },
  isAuthenticated: () => {
    const token = tokenManager.getAccessToken();
    return token && !tokenManager.isTokenExpired(token);
  }
};

/**
 * HTTP error handling
 */
class APIError extends Error {
  constructor(message, status, data = null, errors = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

/**
 * Response handler for standardized backend responses
 */
const handleResponse = async (response) => {
  let data;
  
  try {
    data = await response.json();
  } catch (error) {
    throw new APIError(
      'Invalid response format',
      response.status,
      null,
      { parseError: 'Failed to parse JSON response' }
    );
  }

  // Handle standardized backend response format
  if (data.hasOwnProperty('success')) {
    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: data.message,
        status_code: data.status_code
      };
    } else {
      // Show error toast for failed requests
      const errorMessage = data.message || 'An error occurred';
      toast.error(errorMessage);
      
      throw new APIError(
        errorMessage,
        data.status_code || response.status,
        data.data,
        data.errors
      );
    }
  }

  // Fallback for non-standardized responses
  if (!response.ok) {
    const errorMessage = data.detail || data.message || `HTTP ${response.status} Error`;
    toast.error(errorMessage);
    throw new APIError(errorMessage, response.status, data);
  }

  return {
    success: true,
    data: data,
    message: 'Success',
    status_code: response.status
  };
};

/**
 * Request interceptor
 */
const buildRequestConfig = (options = {}) => {
  const token = tokenManager.getAccessToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  if (token && !tokenManager.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

/**
 * Token refresh logic
 */
const refreshAccessToken = async () => {
  const refreshToken = tokenManager.getRefreshToken();
  
  if (!refreshToken) {
    throw new APIError('No refresh token available', 401);
  }

  try {
    const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const result = await handleResponse(response);
    
    if (result.success && result.data.access) {
      tokenManager.setTokens(result.data.access, result.data.refresh);
      return result.data.access;
    } else {
      throw new APIError('Token refresh failed', 401);
    }
  } catch (error) {
    tokenManager.removeTokens();
    // Redirect to login page
    window.location.href = '/login';
    throw error;
  }
};

/**
 * Main request function with retry logic and token refresh
 */
const makeRequest = async (url, options = {}, retryCount = 0) => {
  const config = buildRequestConfig(options);
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;

  try {
    const response = await fetch(fullUrl, config);
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && tokenManager.getRefreshToken() && retryCount === 0) {
      try {
        await refreshAccessToken();
        // Retry the original request with new token
        return makeRequest(url, options, retryCount + 1);
      } catch (refreshError) {
        throw refreshError;
      }
    }

    return await handleResponse(response);
    
  } catch (error) {
    // Retry logic for network errors
    if (retryCount < API_CONFIG.retryAttempts && 
        (error.name === 'TypeError' || error.status >= 500)) {
      
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1))
      );
      
      return makeRequest(url, options, retryCount + 1);
    }

    throw error;
  }
};

/**
 * Main API client
 */
export const apiClient = {
  // GET request
  get: async (url, options = {}) => {
    return makeRequest(url, { ...options, method: 'GET' });
  },

  // POST request
  post: async (url, data = null, options = {}) => {
    const requestOptions = {
      ...options,
      method: 'POST',
    };

    if (data) {
      if (data instanceof FormData) {
        // Remove Content-Type header for FormData (browser sets it automatically)
        delete requestOptions.headers?.['Content-Type'];
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    return makeRequest(url, requestOptions);
  },

  // PUT request
  put: async (url, data = null, options = {}) => {
    const requestOptions = {
      ...options,
      method: 'PUT',
    };

    if (data) {
      if (data instanceof FormData) {
        delete requestOptions.headers?.['Content-Type'];
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    return makeRequest(url, requestOptions);
  },

  // PATCH request
  patch: async (url, data = null, options = {}) => {
    const requestOptions = {
      ...options,
      method: 'PATCH',
    };

    if (data) {
      if (data instanceof FormData) {
        delete requestOptions.headers?.['Content-Type'];
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    return makeRequest(url, requestOptions);
  },

  // DELETE request
  delete: async (url, options = {}) => {
    return makeRequest(url, { ...options, method: 'DELETE' });
  },

  // File upload helper
  uploadFile: async (url, file, additionalData = {}, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const options = {
      body: formData,
      // Remove Content-Type header to let browser set it with boundary
      headers: {},
    };

    // Add progress tracking if callback provided
    if (onProgress && typeof onProgress === 'function') {
      // Note: Progress tracking requires XMLHttpRequest for now
      // This is a placeholder for future implementation
    }

    return apiClient.post(url, formData, options);
  },
};

/**
 * Authentication service
 */
export const authService = {
  // Login
  login: async (credentials) => {
    try {
      const result = await apiClient.post('/auth/login/', credentials);
      
      if (result.success && result.data) {
        const { user, access, refresh } = result.data;
        
        // Store tokens and user data
        tokenManager.setTokens(access, refresh);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        // Show success message
        toast.success(result.message || 'Login successful!');
        
        return result;
      }
    } catch (error) {
      // Error toast is already shown in handleResponse
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const result = await apiClient.post('/auth/register/', userData);
      
      if (result.success && result.data) {
        const { user, access, refresh } = result.data;
        
        // Store tokens and user data
        tokenManager.setTokens(access, refresh);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        // Show success message
        toast.success(result.message || 'Registration successful!');
        
        return result;
      }
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: () => {
    // Clear local storage tokens and user data
    tokenManager.removeTokens();
    toast.success('Logged out successfully');
  },

  // Get current user
  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return tokenManager.isAuthenticated();
  },

  // Get user profile
  getProfile: async () => {
    return apiClient.get('/auth/profile/');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const result = await apiClient.put('/auth/profile/', profileData);
      
      if (result.success && result.data) {
        // Update stored user data
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.data));
        toast.success(result.message || 'Profile updated successfully!');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const result = await apiClient.post('/auth/change-password/', passwordData);
      
      if (result.success) {
        toast.success(result.message || 'Password changed successfully!');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Generic CRUD service factory
 */
export const createCRUDService = (baseEndpoint) => ({
  // List all items
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${baseEndpoint}/?${queryString}` : `${baseEndpoint}/`;
    return apiClient.get(url);
  },

  // Get single item
  get: async (id) => {
    return apiClient.get(`${baseEndpoint}/${id}/`);
  },

  // Create new item
  create: async (data) => {
    try {
      const result = await apiClient.post(`${baseEndpoint}/`, data);
      if (result.success) {
        toast.success(result.message || 'Created successfully!');
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Update item
  update: async (id, data) => {
    try {
      const result = await apiClient.put(`${baseEndpoint}/${id}/`, data);
      if (result.success) {
        toast.success(result.message || 'Updated successfully!');
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Partial update
  patch: async (id, data) => {
    try {
      const result = await apiClient.patch(`${baseEndpoint}/${id}/`, data);
      if (result.success) {
        toast.success(result.message || 'Updated successfully!');
      }
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Delete item
  delete: async (id) => {
    try {
      const result = await apiClient.delete(`${baseEndpoint}/${id}/`);
      if (result.success) {
        toast.success(result.message || 'Deleted successfully!');
      }
      return result;
    } catch (error) {
      throw error;
    }
  },
});

/**
 * Company service
 */
export const companyService = createCRUDService('/companies');

/**
 * Financial Year service
 */
export const financialYearService = createCRUDService('/financial-years');

/**
 * User Activity service
 */
export const userActivityService = {
  // Get current user activity
  get: async () => {
    const response = await apiClient.get('/user-activity/');
    return response;
  },
  
  // Update user activity
  update: async (data) => {
    const response = await apiClient.patch('/user-activity/', data);
    return response.data;
  },
  
  // Activate company
  activateCompany: async (companyId) => {
    const response = await apiClient.post(`/companies/${companyId}/activate/`);
    return response;
  },
  
  // Activate financial year
  activateFinancialYear: async (financialYearId) => {
    const response = await apiClient.post(`/financial-years/${financialYearId}/activate/`);
    return response;
  },
  
  // Get filtered financial years
  getFilteredFinancialYears: async () => {
    const response = await apiClient.get('/financial-years/filtered/');
    return response.data;
  }
};

/**
 * Chart of Accounts service
 */
export const chartOfAccountsService = {
  ...createCRUDService('/accounting/chart-of-accounts'),
  
  // Get account hierarchy
  getHierarchy: async (accountType = null) => {
    const params = accountType ? { account_type: accountType } : {};
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/accounting/chart-of-accounts/hierarchy/?${queryString}` : '/accounting/chart-of-accounts/hierarchy/';
    return apiClient.get(url);
  },
  
  // Get account types
  getAccountTypes: async () => {
    return apiClient.get('/accounting/account-types/');
  }
};

/**
 * Voucher service
 */
export const voucherService = {
  ...createCRUDService('/accounting/vouchers'),
  
  // Post voucher
  post: async (id) => {
    try {
      const result = await apiClient.post(`/accounting/vouchers/${id}/post/`);
      if (result.success) {
        toast.success(result.message || 'Voucher posted successfully!');
      }
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // Get voucher types
  getVoucherTypes: async () => {
    return apiClient.get('/accounting/voucher-types/');
  }
};

// Export the error class for custom error handling
export { APIError };

// Default export
export default apiClient;