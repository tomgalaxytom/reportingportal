import apiClient from './api';

/**
 * Stream Report API Service
 * Handles all CRUD operations for E-Waste, Bio-Medical Waste, and Plastic Waste reports.
 * Backend base prefix: /api/reports/stream/
 */
const streamReportService = {
  // ─── E-Waste ─────────────────────────────────────────────────────────────

  /**
   * Fetch the E-Waste report for a given district and reporting month.
   * Returns null (HTTP 200 with null body) if no record exists yet.
   */
  async getEWasteReport(districtName, reportingMonth) {
    return apiClient.get('/reports/stream/e-waste', {
      params: { district_name: districtName, reporting_month: reportingMonth },
    });
  },

  /**
   * Save (Draft) or Submit the E-Waste report.
   * @param {Object} payload - Must include district_name, officer_email, reporting_month, status,
   *   collected_* and recovered_* fields.
   */
  async saveEWasteReport(payload) {
    return apiClient.post('/reports/stream/e-waste', payload);
  },

  // ─── Bio-Medical Waste ───────────────────────────────────────────────────

  /**
   * Fetch the Bio-Medical Waste report for a given district and reporting month.
   */
  async getBMWReport(districtName, reportingMonth) {
    return apiClient.get('/reports/stream/biomedical', {
      params: { district_name: districtName, reporting_month: reportingMonth },
    });
  },

  /**
   * Save (Draft) or Submit the Bio-Medical Waste report.
   * Backend auto-calculates total_treated_qty and difference_qty before persisting.
   * @param {Object} payload - Must include district_name, officer_email, reporting_month, status,
   *   generated_qty, incinerator_treated_qty, autoclave_treated_qty.
   */
  async saveBMWReport(payload) {
    return apiClient.post('/reports/stream/biomedical', payload);
  },

  // ─── Plastic Waste ───────────────────────────────────────────────────────

  /**
   * Fetch the Plastic Waste report (Annexure I + II) for a given district and month.
   */
  async getPlasticReport(districtName, reportingMonth) {
    return apiClient.get('/reports/stream/plastic', {
      params: { district_name: districtName, reporting_month: reportingMonth },
    });
  },

  /**
   * Save (Draft) or Submit the Plastic Waste report.
   * @param {Object} payload - Must include district_name, officer_email, reporting_month,
   *   status, annexure1_status, annexure2_status, and all Annexure I & II fields.
   */
  async savePlasticReport(payload) {
    return apiClient.post('/reports/stream/plastic', payload);
  },

  // ─── District Summary ────────────────────────────────────────────────────

  /**
   * Fetch the real-time status summary for all three waste streams for a district and month.
   * Returns { district_name, reporting_month, ewaste_status, biomedical_status, plastic_status, overall_status }
   * Statuses: "Draft" | "Submitted" | "Returned" | "Draft — Not Submitted"
   */
  async getDistrictSummary(districtName, reportingMonth) {
    return apiClient.get('/reports/stream/district-summary', {
      params: { district_name: districtName, reporting_month: reportingMonth },
    });
  },
  /**
   * Fetch all district records for a stream and month (JCEE Board view).
   * @param {string} stream - 'e-waste' | 'biomedical' | 'plastic'
   * @param {string} reportingMonth
   */
  async getBoardConsolidated(stream, reportingMonth) {
    return apiClient.get('/reports/stream/board-consolidated', {
      params: { stream, reporting_month: reportingMonth },
    });
  },
};

export default streamReportService;
