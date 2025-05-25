import {
  ReportTemplate,
  ReportGenerationOptions,
  ReportResult,
  ScheduledReport,
  ScheduleReportConfig,
  ReportHistory,
  ReportHistoryFilters,
} from '../types/reporting';

/**
 * Service for managing reports in the admin dashboard
 */
export class ReportingService {
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
   * Get available report templates
   * @returns Promise with array of report templates
   */
  static async getReportTemplates(): Promise<ReportTemplate[]> {
    return this.request('/api/reports/templates');
  }

  /**
   * Get a specific report template
   * @param id Template ID
   * @returns Promise with report template
   */
  static async getReportTemplate(id: string): Promise<ReportTemplate> {
    return this.request(`/api/reports/templates/${id}`);
  }

  /**
   * Create a new report template
   * @param template Template data without ID
   * @returns Promise with created report template
   */
  static async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
    return this.request('/api/reports/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  /**
   * Update an existing report template
   * @param template Template data with ID
   * @returns Promise with updated report template
   */
  static async updateReportTemplate(template: ReportTemplate): Promise<ReportTemplate> {
    return this.request(`/api/reports/templates/${template.id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  /**
   * Delete a report template
   * @param id Template ID
   * @returns Promise with boolean indicating success
   */
  static async deleteReportTemplate(id: string): Promise<boolean> {
    return this.request(`/api/reports/templates/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Generate a report from a template
   * @param templateId Template ID
   * @param options Optional generation options
   * @returns Promise with report result
   */
  static async generateReport(
    templateId: string,
    options?: ReportGenerationOptions
  ): Promise<ReportResult> {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ templateId, options }),
    });
  }

  /**
   * Get scheduled reports
   * @returns Promise with array of scheduled reports
   */
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    return this.request('/api/reports/scheduled');
  }

  /**
   * Schedule a report
   * @param config Schedule configuration
   * @returns Promise with scheduled report
   */
  static async scheduleReport(config: ScheduleReportConfig): Promise<ScheduledReport> {
    return this.request('/api/reports/schedule', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Update a scheduled report
   * @param report Scheduled report data
   * @returns Promise with updated scheduled report
   */
  static async updateScheduledReport(report: ScheduledReport): Promise<ScheduledReport> {
    return this.request(`/api/reports/scheduled/${report.id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  }

  /**
   * Delete a scheduled report
   * @param id Scheduled report ID
   * @returns Promise with boolean indicating success
   */
  static async deleteScheduledReport(id: string): Promise<boolean> {
    return this.request(`/api/reports/scheduled/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Pause a scheduled report
   * @param id Scheduled report ID
   * @returns Promise with boolean indicating success
   */
  static async pauseScheduledReport(id: string): Promise<boolean> {
    return this.request(`/api/reports/scheduled/${id}/pause`, {
      method: 'POST',
    });
  }

  /**
   * Resume a scheduled report
   * @param id Scheduled report ID
   * @returns Promise with boolean indicating success
   */
  static async resumeScheduledReport(id: string): Promise<boolean> {
    return this.request(`/api/reports/scheduled/${id}/resume`, {
      method: 'POST',
    });
  }

  /**
   * Run a scheduled report immediately
   * @param id Scheduled report ID
   * @returns Promise with report result
   */
  static async runScheduledReport(id: string): Promise<ReportResult> {
    return this.request(`/api/reports/scheduled/${id}/run`, {
      method: 'POST',
    });
  }

  /**
   * Get report history
   * @param filters Optional filters for history
   * @returns Promise with array of report history items
   */
  static async getReportHistory(filters?: ReportHistoryFilters): Promise<ReportHistory[]> {
    return this.request('/api/reports/history', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    });
  }

  /**
   * Get a specific report history item
   * @param id History item ID
   * @returns Promise with report history item
   */
  static async getReportHistoryItem(id: string): Promise<ReportHistory> {
    return this.request(`/api/reports/history/${id}`);
  }

  /**
   * Download a report file
   * @param id History item ID
   * @returns Promise with download URL
   */
  static async downloadReport(id: string): Promise<{ url: string }> {
    return this.request(`/api/reports/history/${id}/download`);
  }
}
