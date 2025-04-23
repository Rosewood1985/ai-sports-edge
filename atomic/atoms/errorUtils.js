/**
 * Error Utilities Atom
 * Provides primitive error handling and formatting utilities.
 * These are the fundamental building blocks for error handling.
 */

// External imports

// Internal imports

/**
 * Breadcrumb data interface
 * @typedef {Object} BreadcrumbData
 * @property {string} category - Breadcrumb category
 * @property {string} message - Breadcrumb message
 * @property {'fatal'|'error'|'warning'|'info'|'debug'} [level] - Breadcrumb level
 * @property {Object} [data] - Additional data
 */

/**
 * Create a standardized error object
 * 
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

/**
 * Parse error from various sources
 * 
 * @param {any} error - Error to parse
 * @returns {Error} Standardized error
 */
export const parseError = error => {
  if (!error) return new Error('Unknown error');
  
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  if (typeof error === 'object' && error !== null) {
    // Copy properties
    const parsedError = new Error(error.message);
    if (error.code) parsedError.code = error.code;
    if (error.details) parsedError.details = error.details;
    if (error.name) parsedError.name = error.name;
    if (error.stack) parsedError.stack = error.stack;
    return parsedError;
  }
  
  return new Error(JSON.stringify(error));
};

/**
 * Format error for logging
 * 
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error
 */
export const formatError = error => {
  if (!error) return null;
  
  return {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack,
    // Add any additional error properties that might be useful
  };
};

/**
 * Get error code
 * 
 * @param {Error} error - Error to get code from
 * @param {string} [defaultCode] - Default code if not found
 * @returns {string} Error code
 */
export const getErrorCode = (error, defaultCode = 'UNKNOWN_ERROR') => {
  if (!error) return defaultCode;
  return error.code || defaultCode;
};

/**
 * Get user-friendly error message
 * 
 * @param {Error} error - Error to get message from
 * @param {string} [defaultMessage] - Default message if not found
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage;
  
  const code = getErrorCode(error);
  
  // Map of error codes to user-friendly messages
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already in use',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/weak-password': 'Password is too weak',
    'auth/user-disabled': 'This account has been disabled',
    'auth/requires-recent-login': 'Please log in again to continue',
    'auth/popup-closed-by-user': 'Authentication canceled',
    'auth/network-request-failed': 'Network connection error',
    'network-error': 'Network connection error',
    'network-request-failed': 'Network connection error',
    'not-found': 'The requested resource was not found',
    'permission-denied': 'You do not have permission to perform this action',
    'already-exists': 'This resource already exists',
    'server-error': 'Server error, please try again later',
  };
  
  return errorMessages[code] || error.message || defaultMessage;
};

/**
 * Check if error is a network error
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is a network error
 */
export const isNetworkError = error => {
  if (!error) return false;
  
  const code = getErrorCode(error);
  const message = error.message || '';
  
  const networkErrorCodes = [
    'network-error',
    'auth/network-request-failed',
    'network-request-failed',
  ];
  
  const networkErrorMessages = [
    'Network Error',
    'Network request failed',
    'Failed to fetch',
    'Connection failed',
  ];
  
  return networkErrorCodes.includes(code) || networkErrorMessages.some(msg => message.includes(msg));
};

/**
 * Check if error is an authentication error
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is an authentication error
 */
export const isAuthError = error => {
  if (!error) return false;
  
  const code = getErrorCode(error);
  return code.startsWith('auth/');
};

/**
 * Check if error is a permission error
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is a permission error
 */
export const isPermissionError = error => {
  if (!error) return false;
  
  const code = getErrorCode(error);
  const permissionErrorCodes = ['permission-denied', 'auth/insufficient-permission'];
  
  return permissionErrorCodes.includes(code);
};

/**
 * Safely capture an error without throwing exceptions
 * 
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
    
    return error;
  } catch (captureError) {
    // Fallback error handling
    console.error('Failed to capture error:', captureError);
    return error;
  }
};
