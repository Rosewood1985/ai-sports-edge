import { useState, useEffect, useCallback } from 'react';
import { ReportHistory } from '../types/reporting';
import { ReportingService } from '../services/reportingService';

interface UseReportHistoryItemResult {
  historyItem: ReportHistory | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching a specific report history item
 * @param id Report history item ID
 * @returns Object with report history item data and loading state
 */
export const useReportHistoryItem = (id: string): UseReportHistoryItemResult => {
  const [historyItem, setHistoryItem] = useState<ReportHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistoryItem = useCallback(async (): Promise<void> => {
    if (!id) {
      setError(new Error('Report history item ID is required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ReportingService.getReportHistoryItem(id);
      setHistoryItem(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch report history item'));
      console.error('Error fetching report history item:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHistoryItem();
  }, [fetchHistoryItem]);

  return {
    historyItem,
    loading,
    error,
    refetch: fetchHistoryItem,
  };
};
