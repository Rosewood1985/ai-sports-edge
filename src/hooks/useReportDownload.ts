import { useState, useCallback } from 'react';
import { ReportingService } from '../services/reportingService';

interface UseReportDownloadResult {
  downloadReport: (id: string) => Promise<string>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for downloading report files
 * @returns Object with function for downloading reports
 */
export const useReportDownload = (): UseReportDownloadResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadReport = useCallback(async (id: string): Promise<string> => {
    if (!id) {
      const error = new Error('Report ID is required');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await ReportingService.downloadReport(id);
      return result.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download report';
      const newError = new Error(errorMessage);
      setError(newError);
      console.error('Error downloading report:', err);
      throw newError;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    downloadReport,
    loading,
    error,
  };
};
