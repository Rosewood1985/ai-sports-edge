/**
 * Types for the asynchronous job processing system
 */

/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Job type enum
 */
export enum JobType {
  REPORT_GENERATE = 'report-generate',
  REPORT_EXPORT = 'report-export',
  REPORT_PREVIEW = 'report-preview',
}

/**
 * Job priority enum
 */
export enum JobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Base job interface
 */
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  createdBy: string;
  result?: any;
}

/**
 * Report generation job
 */
export interface ReportGenerationJob extends Job {
  type: JobType.REPORT_GENERATE;
  params: {
    templateId: string;
    filters?: any[];
    format?: string;
    options?: {
      includeRawData?: boolean;
      includeBranding?: boolean;
      [key: string]: any;
    };
  };
  result?: {
    reportId: string;
    url: string;
    format: string;
    fileSize: number;
    expiresAt: string;
  };
}

/**
 * Report export job
 */
export interface ReportExportJob extends Job {
  type: JobType.REPORT_EXPORT;
  params: {
    widgets: string[];
    filters?: any[];
    format: string;
    options?: {
      includeRawData?: boolean;
      includeBranding?: boolean;
      [key: string]: any;
    };
  };
  result?: {
    exportId: string;
    url: string;
    format: string;
    fileSize: number;
    expiresAt: string;
  };
}

/**
 * Report preview job
 */
export interface ReportPreviewJob extends Job {
  type: JobType.REPORT_PREVIEW;
  params: {
    template: {
      name: string;
      description?: string;
      type?: string;
      widgets: string[];
      filters?: any[];
    };
    format?: string;
  };
  result?: {
    previewId: string;
    url: string;
    format: string;
  };
}

/**
 * Union type for all job types
 */
export type JobUnion = ReportGenerationJob | ReportExportJob | ReportPreviewJob;

/**
 * Job creation params
 */
export type JobCreationParams<T extends JobType> = T extends JobType.REPORT_GENERATE
  ? Omit<ReportGenerationJob['params'], 'id'>
  : T extends JobType.REPORT_EXPORT
    ? Omit<ReportExportJob['params'], 'id'>
    : T extends JobType.REPORT_PREVIEW
      ? Omit<ReportPreviewJob['params'], 'id'>
      : never;

/**
 * Job update params
 */
export interface JobUpdateParams {
  status?: JobStatus;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

/**
 * Job filter params
 */
export interface JobFilterParams {
  type?: JobType;
  status?: JobStatus;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
}
