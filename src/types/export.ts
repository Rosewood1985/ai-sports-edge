/**
 * Types for the export system
 */

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description?: string;
  isDefault?: boolean;
}

export interface ExportConfig {
  format: string;
  data: Record<string, any>;
  widgets: string[];
  options: {
    includeHeaders: boolean;
    dateFormat: string;
    timezone: string;
    [key: string]: any;
  };
}

export interface ExportHistory {
  id: string;
  format: string;
  fileSize: number;
  downloadUrl: string;
  timestamp: string;
  expiresAt: string;
  status: 'success' | 'error' | 'processing';
  errorMessage?: string;
}

export interface ExportResult {
  id: string;
  format: string;
  fileSize: number;
  downloadUrl: string;
  timestamp: string;
  expiresAt: string;
  status: 'success' | 'error' | 'processing';
  errorMessage?: string;
}
