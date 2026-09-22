import apiClient from './api';

export const reportService = {
  /**
   * Fetch all waste reports with optional filtering
   */
  async getReports(params = {}) {
    return apiClient.get('/reports', { params });
  },

  /**
   * Create a new waste report submission
   */
  async createReport(reportData) {
    return apiClient.post('/reports', reportData);
  },

  /**
   * Get single report by ID
   */
  async getReportById(id) {
    return apiClient.get(`/reports/${id}`);
  },

  /**
   * Update verification status (Board Section)
   */
  async updateReportStatus(id, { status, remarks }) {
    return apiClient.patch(`/reports/${id}/status`, { status, remarks });
  },

  /**
   * Get overall reporting statistics
   */
  async getReportStats() {
    return apiClient.get('/reports/stats/summary');
  },
};
