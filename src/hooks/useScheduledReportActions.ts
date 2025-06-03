import { useState, useCallback } from 'react';

import { ReportingService } from '../services/reportingService';
import { ReportResult } from '../types/reporting';

interface UseScheduledReportActionsResult {
  pauseScheduledReport: (id: string) => Promise<boolean>;
  resumeScheduledReport: (id: string) => Promise<boolean>;
  deleteScheduledReport: (id: string) => Promise<boolean>;
  runScheduledReport: (id: string) => Promise<ReportResult>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for performing actions on scheduled reports
 * @returns Object with functions for pausing, resuming, deleting, and running scheduled reports
 */
export const useScheduledReportActions = (): UseScheduledReportActionsResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const pauseScheduledReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const result = await ReportingService.pauseScheduledReport(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause scheduled report';
      const newError = new Error(errorMessage);
      setError(newError);
      console.error('Error pausing scheduled report:', err);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeScheduledReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const result = await ReportingService.resumeScheduledReport(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume scheduled report';
      const newError = new Error(errorMessage);
      setError(newError);
      console.error('Error resuming scheduled report:', err);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteScheduledReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const result = await ReportingService.deleteScheduledReport(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scheduled report';
      const newError = new Error(errorMessage);
      setError(newError);
      console.error('Error deleting scheduled report:', err);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, []);

  const runScheduledReport = useCallback(async (id: string): Promise<ReportResult> => {
    try {
      setLoading(true);
      setError(null);
      const result = await ReportingService.runScheduledReport(id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run scheduled report';
      const newError = new Error(errorMessage);
      setError(newError);
      console.error('Error running scheduled report:', err);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pauseScheduledReport,
    resumeScheduledReport,
    deleteScheduledReport,
    runScheduledReport,
    loading,
    error,
  };
};
