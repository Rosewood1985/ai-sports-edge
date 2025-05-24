import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { ExportConfig, ExportFormat, ExportHistory } from '../types/export';
import { adminDashboardService } from '../services/adminDashboardService';

/**
 * Hook for managing export formats
 */
export function useExportFormats() {
  const {
    data: formats = [],
    error,
    mutate,
  } = useSWR('export-formats', () => adminDashboardService.getExportFormats());

  return {
    formats,
    isLoading: !formats && !error,
    error,
    refreshFormats: mutate,
  };
}

/**
 * Hook for managing export history
 */
export function useExportHistory() {
  const {
    data: history = [],
    error,
    mutate,
  } = useSWR('export-history', () => adminDashboardService.getExportHistory());

  const [isLoading, setIsLoading] = useState(false);

  const deleteExport = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await adminDashboardService.deleteExport(id);
        await mutate();
        return true;
      } catch (error) {
        console.error('Error deleting export:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [mutate]
  );

  const downloadExport = useCallback((url: string) => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
  }, []);

  return {
    history,
    isLoading: (!history && !error) || isLoading,
    error,
    fetchHistory: mutate,
    deleteExport,
    downloadExport,
  };
}

/**
 * Hook for exporting data
 */
export function useExportData() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const exportData = useCallback(async (config: ExportConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await adminDashboardService.exportData(config);
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    exportData,
    isLoading,
    result,
    error,
  };
}
