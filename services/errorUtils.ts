/**
 * Error Utilities
 *
 * This file contains utility functions for error handling that can be used
 * by both loggingService and errorTrackingService without creating circular dependencies.
 */

/**
 * Safely capture an error without causing circular dependencies
 * This function logs the error to console and can be extended to use other error tracking
 * mechanisms that don't create circular dependencies
 *
 * @param error Error to capture
 * @param context Additional context
 */
export const safeErrorCapture = (error: Error, context?: Record<string, any>): void => {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development' || __DEV__) {
      console.error('Error captured:', error, context);
    }

    // In a production environment, this could use a direct API call to your error tracking service
    // instead of going through the errorTrackingService to avoid circular dependencies
  } catch (captureError) {
    // Fallback error handling
    console.error('Failed to capture error:', captureError);
  }
};

/**
 * Severity level enum that matches Sentry's severity levels
 */
export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * Interface for breadcrumb data to be shared between services
 * This matches the structure expected by Sentry but avoids direct dependency
 */
export interface BreadcrumbData {
  category?: string;
  message?: string;
  data?: Record<string, any>;
  level?: SeverityLevel;
  type?: string;
  timestamp?: number;
}
