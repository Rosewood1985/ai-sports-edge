import { useState, useCallback } from 'react';
import { ScheduledReport, ScheduleReportConfig } from '../types/reporting';
import { ReportingService } from '../services/reportingService';

interface UseScheduleReportResult {
  scheduleReport: (config: ScheduleReportConfig) => Promise<ScheduledReport>;
  updateScheduledReport: (report: ScheduledReport) => Promise<ScheduledReport>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for creating and updating scheduled reports
 * @returns Object with functions for scheduling and updating reports
 */
export const useScheduleReport = (): UseScheduleReportResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const scheduleReport = useCallback(
    async (config: ScheduleReportConfig): Promise<ScheduledReport> => {
      try {
        setLoading(true);
        setError(null);
        const result = await ReportingService.scheduleReport(config);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to schedule report';
        const newError = new Error(errorMessage);
        setError(newError);
        console.error('Error scheduling report:', err);
        throw newError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateScheduledReport = useCallback(
    async (report: ScheduledReport): Promise<ScheduledReport> => {
      try {
        setLoading(true);
        setError(null);
        const result = await ReportingService.updateScheduledReport(report);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update scheduled report';
        const newError = new Error(errorMessage);
        setError(newError);
        console.error('Error updating scheduled report:', err);
        throw newError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    scheduleReport,
    updateScheduledReport,
    loading,
    error,
  };
};
