import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { message } from 'antd';

export function useReports(initialFilters = {}) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getReports(filters);
      setReports(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await reportService.getReportStats();
      setStats(data);
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, []);

  const createReport = async (reportData) => {
    try {
      const created = await reportService.createReport(reportData);
      message.success('Report submitted successfully!');
      fetchReports();
      fetchStats();
      return created;
    } catch (err) {
      message.error(err.message || 'Submission failed');
      throw err;
    }
  };

  const updateStatus = async (id, status, remarks) => {
    try {
      const updated = await reportService.updateReportStatus(id, { status, remarks });
      message.success(`Status updated to ${status}`);
      fetchReports();
      fetchStats();
      return updated;
    } catch (err) {
      message.error(err.message || 'Status update failed');
      throw err;
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [fetchReports, fetchStats]);

  return {
    reports,
    stats,
    loading,
    filters,
    setFilters,
    refetch: fetchReports,
    createReport,
    updateStatus,
  };
}
