/**
 * Atomic Organism: useReportHistory Hook
 * Complex business logic for report history management with optimized state management
 * Location: /atomic/organisms/reporting/useReportHistory.ts
 */
import { useState, useEffect, useCallback } from 'react';

import { ReportingService } from '../../../src/services/reportingService';
import { ReportHistory, ReportHistoryFilters } from '../../../src/types/reporting';

interface UseReportHistoryResult {
  history: ReportHistory[];
  loading: boolean;
  error: Error | null;
  refetch: (filters?: ReportHistoryFilters) => Promise<void>;
}

/**
 * Hook for fetching and filtering report history
 * Fixed race condition in filter dependencies
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

        // Use provided filters or current filters
        const filtersToUse = newFilters || filters;

        // Update filters if new ones are provided (after API call to avoid race condition)
        if (newFilters && newFilters !== filters) {
          setFilters(newFilters);
        }

        const data = await ReportingService.getReportHistory(filtersToUse);
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch report history'));
        console.error('Error fetching report history:', err);
      } finally {
        setLoading(false);
      }
    },
    [] // Remove filters from dependency array to prevent race condition
  );

  // Use a separate effect for initial fetch
  useEffect(() => {
    fetchHistory(initialFilters);
  }, []); // Only run on mount

  // Handle filter changes separately
  useEffect(() => {
    if (filters !== initialFilters) {
      fetchHistory(filters);
    }
  }, [filters, initialFilters, fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
};
