import { useState, useCallback, useEffect } from 'react';
import { ExportConfig, ExportFormat, ExportHistory, ExportResult } from '../types/export';
import { AdminDashboardService } from '../services/adminDashboardService';

/**
 * Hook for accessing export formats
 */
export function useExportFormats() {
  const [formats, setFormats] = useState<ExportFormat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFormats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminDashboardService.getExportFormats();
      setFormats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch export formats'));
      console.error('Error fetching export formats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch formats on mount
  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

  return { formats, isLoading, error, fetchFormats };
}

/**
 * Hook for accessing export history
 */
export function useExportHistory() {
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminDashboardService.getExportHistory();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch export history'));
      console.error('Error fetching export history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const downloadExport = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const deleteExport = useCallback(
    async (id: string) => {
      try {
        await AdminDashboardService.deleteExport(id);
        // Refresh history after deletion
        fetchHistory();
      } catch (err) {
        console.error('Error deleting export:', err);
        throw err;
      }
    },
    [fetchHistory]
  );

  return { history, isLoading, error, fetchHistory, downloadExport, deleteExport };
}

/**
 * Hook for exporting data
 */
export function useExportData() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  const exportData = useCallback(async (config: ExportConfig) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await AdminDashboardService.exportData(config);

      // Transform the data to match the ExportResult type
      const result: ExportResult = {
        id: `export-${Date.now()}`,
        format: data.format,
        fileSize: 0, // We don't have this information yet
        downloadUrl: data.url,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'success',
      };

      setResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to export data'));
      console.error('Error exporting data:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { exportData, isLoading, error, result };
}
