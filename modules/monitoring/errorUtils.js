/**
 * Error Utilities
 * 
 * Provides utility functions for error handling and tracking.
 */

/**
 * Breadcrumb data interface
 * @typedef {Object} BreadcrumbData
 * @property {string} category - Breadcrumb category
 * @property {string} message - Breadcrumb message
 * @property {Object} [data] - Additional data
 * @property {'fatal'|'error'|'warning'|'info'|'debug'} [level] - Breadcrumb level
 */

/**
 * Safely capture an error without throwing exceptions
 * @param {Error} error - Error to capture
 * @param {Record<string, any>} [context] - Additional context
 */
export const safeErrorCapture = (error, context) => {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development' || __DEV__) {
      console.error('Error captured:', error, context);
    }
    
    // In a production app, this would send the error to a tracking service
    // This is implemented in errorTracking.js
  } catch (captureError) {
    // Fallback error handling
    console.error('Failed to capture error:', captureError);
  }
};

/**
 * Format error for logging
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error
 */
export const formatError = (error) => {
  if (!error) return null;
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    // Add any additional error properties that might be useful
  };
};

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} [details] - Additional error details
 * @returns {Error} Standardized error
 */
export const createError = (message, code, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
};