import axios from 'axios';

/**
 * Central API Client
 * Uses environment-specific VITE_API_BASE configured via .env files:
 * - .env -> Local
 * - .env.prodlocal -> Production Local / Staging
 * - .env.production -> Production
 */
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can attach auth tokens here if required
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred while communicating with the server.',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
