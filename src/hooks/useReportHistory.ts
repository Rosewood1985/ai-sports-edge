import { useState, useEffect, useCallback } from 'react';
import { ReportHistory, ReportHistoryFilters } from '../types/reporting';
import { ReportingService } from '../services/reportingService';

interface UseReportHistoryResult {
  history: ReportHistory[];
  loading: boolean;
  error: Error | null;
  refetch: (filters?: ReportHistoryFilters) => Promise<void>;
}

/**
 * Hook for fetching and filtering report history
 * @param initialFilters Optional initial filters
 * @returns Object with report history data and loading state
 */
export const useReportHistory = (initialFilters?: ReportHistoryFilters): UseReportHistoryResult => {
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ReportHistoryFilters | undefined>(initialFilters);

  const fetchHistory = useCallback(
    async (newFilters?: ReportHistoryFilters) => {
      try {
        setLoading(true);
        setError(null);

        // Update filters if new ones are provided
        if (newFilters) {
          setFilters(newFilters);
        }

        // Use current filters or new filters if provided
        const filtersToUse = newFilters || filters;

        const data = await ReportingService.getReportHistory(filtersToUse);
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch report history'));
        console.error('Error fetching report history:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
};
