/**
 * Types for the reporting module
 */

export enum ReportType {
  STANDARD = 'standard',
  ANALYTICS = 'analytics',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportStatus = 'active' | 'paused' | 'error';

export type ReportFormat = 'pdf' | 'csv' | 'excel';

export interface ReportSchedule {
  frequency: ReportFrequency;
  hour?: number;
  minute?: number;
  dayOfWeek?: number; // 0-6, Sunday to Saturday (for weekly reports)
  dayOfMonth?: number; // 1-31 (for monthly reports)
}

export interface ReportRecipient {
  id: string;
  email: string;
  name?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  metrics?: string[] | any;
  filters?: Record<string, any> | any[];
  format?: ReportFormat;
  isSystem?: boolean;
  type?: ReportType;
  widgets?: string[] | any;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName: string;
  schedule: ReportSchedule;
  recipients: ReportRecipient[];
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastRun?: string;
  nextRun?: string;
  tags?: string[];
}

export interface ScheduleReportConfig {
  templateId: string;
  name: string;
  description?: string;
  schedule: ReportSchedule;
  recipients: ReportRecipient[];
}

export interface ReportHistoryFilters {
  startDate?: string;
  endDate?: string;
  templateId?: string;
  status?: 'success' | 'failed';
  reportType?: ReportType;
}

export interface ReportRecipientWithDeliveryStatus extends ReportRecipient {
  deliveryStatus: 'sent' | 'failed' | 'pending';
  deliveredAt?: string;
  errorMessage?: string;
}

export interface ReportHistory {
  id: string;
  scheduledReportId?: string;
  templateId: string;
  templateName: string;
  name: string;
  runAt: string;
  runBy: string;
  status: 'success' | 'failed';
  fileUrl?: string;
  recipients?: ReportRecipientWithDeliveryStatus[];
  error?: string;
  format: ReportFormat;
  reportType: ReportType;
}

export interface ExportOptions {
  startDate: string;
  endDate: string;
  metrics: string[];
  filters?: Record<string, any>;
  format: ReportFormat;
  includeCharts?: boolean;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  dataSource: string;
  isAvailableForExport: boolean;
}

export interface ReportGenerationOptions {
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
  format?: ReportFormat;
  includeCharts?: boolean;
}

export interface ReportResult {
  id: string;
  fileUrl: string;
  format: ReportFormat;
  generatedAt: string;
  status: 'success' | 'failed';
  error?: string;
}
