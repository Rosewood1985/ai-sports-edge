import { useState, useEffect, useCallback } from 'react';
import { ScheduledReport } from '../types/reporting';
import { ReportingService } from '../services/reportingService';

/**
 * Hook for fetching and managing scheduled reports
 * @returns Object with scheduled reports data and loading state
 */
export const useScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportingService.getScheduledReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch scheduled reports'));
      console.error('Error fetching scheduled reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
};
