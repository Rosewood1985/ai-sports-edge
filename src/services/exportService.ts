import { ExportConfig, ExportFormat, ExportHistory, ExportResult } from '../types/export';

/**
 * Service for managing exports in the admin dashboard
 */
export class ExportService {
  /**
   * Helper method to make API requests
   * @param url API endpoint URL
   * @param options Fetch options
   * @returns Promise with response data
   */
  private static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get available export formats
   * @returns Promise with array of export formats
   */
  static async getExportFormats(): Promise<ExportFormat[]> {
    return this.request('/api/exports/formats');
  }

  /**
   * Export data
   * @param config Export configuration
   * @returns Promise with export result
   */
  static async exportData(config: ExportConfig): Promise<ExportResult> {
    return this.request('/api/exports/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get export history
   * @returns Promise with array of export history items
   */
  static async getExportHistory(): Promise<ExportHistory[]> {
    return this.request('/api/exports/history');
  }

  /**
   * Delete an export
   * @param id Export ID
   * @returns Promise with boolean indicating success
   */
  static async deleteExport(id: string): Promise<boolean> {
    return this.request(`/api/exports/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Download an export file
   * @param url Export file URL
   */
  static downloadExport(url: string): void {
    window.open(url, '_blank');
  }
}
