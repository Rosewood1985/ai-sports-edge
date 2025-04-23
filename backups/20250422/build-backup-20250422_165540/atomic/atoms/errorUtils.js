/**
 * Error Utilities Atom
 *
 * Provides primitive error handling and formatting utilities.
 * These are the fundamental building blocks for error handling.
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
export const formatError = error => {
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

/**
 * Parse error from various sources
 * @param {any} error - Error to parse
 * @returns {Error} Standardized error
 */
export const parseError = error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (typeof error === 'object' && error !== null) {
    if (error.message) {
      const parsedError = new Error(error.message);

      // Copy properties
      if (error.code) parsedError.code = error.code;
      if (error.name) parsedError.name = error.name;
      if (error.stack) parsedError.stack = error.stack;
      if (error.details) parsedError.details = error.details;

      return parsedError;
    }

    return new Error(JSON.stringify(error));
  }

  return new Error('Unknown error');
};

/**
 * Get error code
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
 * @param {Error} error - Error to get message from
 * @param {string} [defaultMessage] - Default message if not found
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage;

  // Map of error codes to user-friendly messages
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'This email is already in use',
    'auth/weak-password': 'Password is too weak',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/requires-recent-login': 'Please log in again to continue',
    'auth/popup-closed-by-user': 'Authentication canceled',
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested resource was not found',
    'already-exists': 'This resource already exists',
    'network-error': 'Network connection error',
    'server-error': 'Server error, please try again later',
  };

  const code = getErrorCode(error);
  return errorMessages[code] || error.message || defaultMessage;
};

/**
 * Check if error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is a network error
 */
export const isNetworkError = error => {
  if (!error) return false;

  const networkErrorCodes = [
    'network-error',
    'network-request-failed',
    'auth/network-request-failed',
  ];

  const networkErrorMessages = [
    'Network Error',
    'Failed to fetch',
    'Network request failed',
    'Connection failed',
  ];

  const code = getErrorCode(error);
  if (networkErrorCodes.includes(code)) return true;

  const message = error.message || '';
  return networkErrorMessages.some(msg => message.includes(msg));
};

/**
 * Check if error is an authentication error
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
 * @param {Error} error - Error to check
 * @returns {boolean} Whether error is a permission error
 */
export const isPermissionError = error => {
  if (!error) return false;

  const permissionErrorCodes = ['permission-denied', 'auth/insufficient-permission'];

  const code = getErrorCode(error);
  return permissionErrorCodes.includes(code);
};
