import apiClient from './api';

export const healthService = {
  /**
   * Fetch backend health and runtime configuration
   */
  async checkHealth() {
    return apiClient.get('/health');
  },

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    return apiClient.get('/health/db');
  },
};
