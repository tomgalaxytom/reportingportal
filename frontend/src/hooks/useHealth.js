import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';

export function useHealth(autoRefreshInterval = 0) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const data = await healthService.checkHealth();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(data);
    } catch (err) {
      const end = performance.now();
      setLatency(Math.round(end - start));
      setError(err.message || 'Unable to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchHealth, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefreshInterval]);

  return { healthData, loading, error, latency, refetch: fetchHealth };
}
