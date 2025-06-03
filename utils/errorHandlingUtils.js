/**
 * Error Handling Utilities for AI Sports Edge
 * Provides robust error handling for API calls and data processing
 */

// Error types
export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  API_ERROR: 'api_error',
  PARSING_ERROR: 'parsing_error',
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND_ERROR: 'not_found_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error',
};

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  shouldRetry: error => {
    // By default, retry network errors, timeouts, and server errors
    const retryableErrors = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.TIMEOUT_ERROR,
      ERROR_TYPES.SERVER_ERROR,
      ERROR_TYPES.RATE_LIMIT_ERROR,
    ];
    return retryableErrors.includes(getErrorType(error));
  },
};

/**
 * Get error type from an error object
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export function getErrorType(error) {
  // If error already has a type, return it
  if (error.type) {
    return error.type;
  }

  // Check for network errors
  if (
    error.name === 'NetworkError' ||
    error.message.includes('network') ||
    error.message.includes('fetch')
  ) {
    return ERROR_TYPES.NETWORK_ERROR;
  }

  // Check for timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }

  // Check for API errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;

    if (status === 401) {
      return ERROR_TYPES.AUTHENTICATION_ERROR;
    }

    if (status === 403) {
      return ERROR_TYPES.AUTHORIZATION_ERROR;
    }

    if (status === 404) {
      return ERROR_TYPES.NOT_FOUND_ERROR;
    }

    if (status === 429) {
      return ERROR_TYPES.RATE_LIMIT_ERROR;
    }

    if (status >= 500) {
      return ERROR_TYPES.SERVER_ERROR;
    }

    return ERROR_TYPES.API_ERROR;
  }

  // Check for parsing errors
  if (
    error.name === 'SyntaxError' ||
    error.message.includes('parse') ||
    error.message.includes('JSON')
  ) {
    return ERROR_TYPES.PARSING_ERROR;
  }

  // Default to unknown error
  return ERROR_TYPES.UNKNOWN_ERROR;
}

/**
 * Get error message from an error object
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
  // If error already has a message, return it
  if (error.message) {
    return error.message;
  }

  // If error is a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If error has a response with a message, return it
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }

  // Default error message
  return 'An unknown error occurred';
}

/**
 * Get error suggestion based on error type
 * @param {string} errorType - Error type
 * @returns {string} Error suggestion
 */
export function getErrorSuggestion(errorType) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK_ERROR:
      return 'Please check your internet connection and try again.';
    case ERROR_TYPES.TIMEOUT_ERROR:
      return 'The request timed out. Please try again later.';
    case ERROR_TYPES.API_ERROR:
      return 'There was an issue with the API. Please try again later.';
    case ERROR_TYPES.PARSING_ERROR:
      return 'There was an issue parsing the response. Please try again later.';
    case ERROR_TYPES.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      return 'Please log in and try again.';
    case ERROR_TYPES.AUTHORIZATION_ERROR:
      return 'You do not have permission to access this resource.';
    case ERROR_TYPES.NOT_FOUND_ERROR:
      return 'The requested resource was not found.';
    case ERROR_TYPES.RATE_LIMIT_ERROR:
      return 'You have made too many requests. Please try again later.';
    case ERROR_TYPES.SERVER_ERROR:
      return 'There was an issue with the server. Please try again later.';
    case ERROR_TYPES.UNKNOWN_ERROR:
    default:
      return 'An unknown error occurred. Please try again later.';
  }
}

/**
 * Handle error and return standardized error object
 * @param {Error} error - Error object
 * @param {Object} options - Options for error handling
 * @returns {Object} Standardized error object
 */
export function handleError(error, options = {}) {
  const { source = 'unknown', context = {} } = options;

  // Get error type and message
  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);
  const errorSuggestion = getErrorSuggestion(errorType);

  // Log the error
  console.error(`Error in ${source}:`, {
    type: errorType,
    message: errorMessage,
    suggestion: errorSuggestion,
    context,
    originalError: error,
  });

  // Return standardized error object
  return {
    type: errorType,
    message: errorMessage,
    suggestion: errorSuggestion,
    source,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise<any>} Result of the function
 */
export async function withRetry(fn, config = {}) {
  // Merge with default config
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  const { maxRetries, initialDelayMs, maxDelayMs, backoffFactor, shouldRetry, source } =
    retryConfig;

  let lastError = null;

  // Try the function up to maxRetries times
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt - 1), maxDelayMs);

      // Log the retry attempt
      console.warn(`Retry attempt ${attempt}/${maxRetries} for operation:`, {
        errorType: lastError.type,
        errorMessage: lastError.message,
        source: source || 'unknown',
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, we've exhausted all retries
  throw lastError;
}

/**
 * Use a fallback function if the primary function fails
 * @param {Function} primaryFn - Primary function to try
 * @param {Function} fallbackFn - Fallback function to use if primary fails
 * @param {Object} options - Options for fallback handling
 * @returns {Promise<any>} Result of either primary or fallback function
 */
export async function withFallback(primaryFn, fallbackFn, options = {}) {
  try {
    // Try the primary function
    return await primaryFn();
  } catch (error) {
    // Log the fallback
    console.warn(`Primary function failed, using fallback for ${options.source || 'unknown'}:`, {
      errorType: error.type,
      errorMessage: error.message,
    });

    // Use the fallback function
    return await fallbackFn(error);
  }
}

/**
 * Create a timeout promise that rejects after a specified time
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<never>} Promise that rejects after timeout
 */
export function createTimeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Execute a function with a timeout
 * @param {Function} fn - Function to execute
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<any>} Result of the function or timeout error
 */
export async function withTimeout(fn, ms) {
  return Promise.race([fn(), createTimeout(ms)]);
}

/**
 * Handle edge cases for RSS feed parsing
 * @param {string} content - RSS feed content
 * @returns {string} Sanitized RSS feed content
 */
export function sanitizeRSSContent(content) {
  if (!content) {
    return '';
  }

  // Handle invalid XML characters
  let sanitized = content
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Remove control characters
    .replace(/&#0;/g, '') // Remove null characters
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;'); // Fix unescaped ampersands

  // Ensure XML declaration is present and valid
  if (!sanitized.trim().startsWith('<?xml')) {
    sanitized = '<?xml version="1.0" encoding="UTF-8"?>\n' + sanitized;
  }

  return sanitized;
}

/**
 * Handle edge cases for JSON parsing
 * @param {string} content - JSON content
 * @returns {Object} Parsed JSON object
 */
export function safeJSONParse(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    // Try to fix common JSON issues
    const fixedContent = content
      .replace(/,\s*}/g, '}') // Remove trailing commas in objects
      .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":') // Add quotes to keys
      .replace(/\n/g, ''); // Remove newlines

    try {
      return JSON.parse(fixedContent);
    } catch (innerError) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
}

/**
 * Create a user-friendly error message
 * @param {Object} error - Standardized error object
 * @returns {string} User-friendly error message
 */
export function createUserErrorMessage(error) {
  const { type, message, suggestion } = error;

  // Create a user-friendly message based on error type
  switch (type) {
    case ERROR_TYPES.NETWORK_ERROR:
      return `Network error: ${suggestion}`;
    case ERROR_TYPES.TIMEOUT_ERROR:
      return `Request timed out: ${suggestion}`;
    case ERROR_TYPES.API_ERROR:
      return `API error: ${message}. ${suggestion}`;
    case ERROR_TYPES.PARSING_ERROR:
      return `Data error: ${suggestion}`;
    case ERROR_TYPES.VALIDATION_ERROR:
      return `Validation error: ${message}. ${suggestion}`;
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      return `Authentication error: ${suggestion}`;
    case ERROR_TYPES.AUTHORIZATION_ERROR:
      return `Authorization error: ${suggestion}`;
    case ERROR_TYPES.NOT_FOUND_ERROR:
      return `Not found: ${suggestion}`;
    case ERROR_TYPES.RATE_LIMIT_ERROR:
      return `Rate limit exceeded: ${suggestion}`;
    case ERROR_TYPES.SERVER_ERROR:
      return `Server error: ${suggestion}`;
    case ERROR_TYPES.UNKNOWN_ERROR:
    default:
      return `Error: ${message}. ${suggestion}`;
  }
}

/**
 * Handle errors in React components
 * @param {Error} error - Error object
 * @param {Function} setError - Function to set error state
 * @param {Object} options - Options for error handling
 */
export function handleComponentError(error, setError, options = {}) {
  const standardError = handleError(error, options);
  const userMessage = createUserErrorMessage(standardError);

  // Set error state
  setError(userMessage);

  // Return standardized error for further handling
  return standardError;
}

/**
 * Create a fallback UI for error states
 * @param {string} errorMessage - Error message to display
 * @param {Function} retry - Function to retry the operation
 * @returns {JSX.Element} Fallback UI component
 */
export function ErrorFallback({ errorMessage, retry }) {
  return (
    <div className="error-fallback">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{errorMessage}</div>
      {retry && (
        <button className="error-retry-button" onClick={retry}>
          Try Again
        </button>
      )}
    </div>
  );
}
