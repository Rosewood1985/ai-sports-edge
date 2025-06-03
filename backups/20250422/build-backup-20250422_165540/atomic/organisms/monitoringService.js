/**
 * Monitoring Service Organism
 *
 * Integrates error tracking, logging, and performance monitoring
 * into a cohesive monitoring solution.
 */

import {
  safeErrorCapture,
  formatError,
  createError,
  parseError,
  getErrorCode,
  getUserFriendlyMessage,
  isNetworkError,
  isAuthError,
  isPermissionError,
} from '../atoms/errorUtils';
import {
  initErrorTracking,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setTags,
  setExtra,
  setExtras,
  startTransaction,
  flush as flushSentry,
  close as closeSentry,
} from '../molecules/errorTracking';
import {
  initLogging,
  LogLevel,
  LogCategory,
  log,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
  createLogger,
  setMinLogLevel,
  setGlobalMinLogLevel,
  enableConsoleLogging,
  enableSentryLogging,
  enableRemoteLogging,
  manualFlushLogs,
} from '../molecules/logging';
import {
  initPerformanceMonitoring,
  TransactionType,
  trackNavigation,
  trackApiRequest,
  trackUiRender,
  trackDataOperation,
  trackUserInteraction,
  trackAppStartup,
  updatePerformanceMetrics,
  getPerformanceMetrics,
  createPerformanceTimer,
} from '../molecules/performance';

/**
 * Monitoring service initialization options
 * @typedef {Object} MonitoringOptions
 * @property {Object} [errorTracking] - Error tracking options
 * @property {string} [errorTracking.dsn] - Sentry DSN
 * @property {string} [errorTracking.environment] - Environment
 * @property {string} [errorTracking.release] - Release version
 * @property {number} [errorTracking.tracesSampleRate] - Traces sample rate
 * @property {boolean} [errorTracking.debug] - Whether to enable debug mode
 * @property {Object} [logging] - Logging options
 * @property {boolean} [logging.enableConsole] - Whether to enable console logging
 * @property {boolean} [logging.enableSentry] - Whether to enable Sentry logging
 * @property {boolean} [logging.enableRemote] - Whether to enable remote logging
 * @property {number} [logging.flushInterval] - Log flush interval in ms
 * @property {Object} [performance] - Performance monitoring options
 * @property {boolean} [performance.trackAppStart] - Whether to track app start time
 * @property {boolean} [performance.trackDeviceInfo] - Whether to track device information
 */

/**
 * Initialize monitoring services
 * @param {MonitoringOptions} [options] - Initialization options
 * @returns {Object} Initialization result
 */
export const initMonitoring = (options = {}) => {
  console.log('Initializing monitoring services...');

  const result = {
    success: false,
    errorTracking: false,
    logging: false,
    performance: false,
    errors: [],
  };

  try {
    // Initialize logging first
    result.logging = initLogging(options.logging);

    if (result.logging) {
      info(LogCategory.APP, 'Logging service initialized');
    } else {
      console.error('Failed to initialize logging service');
      result.errors.push('Failed to initialize logging service');
    }

    // Initialize error tracking
    try {
      result.errorTracking = initErrorTracking(options.errorTracking);

      if (result.errorTracking) {
        info(LogCategory.APP, 'Error tracking service initialized');
      } else {
        console.error('Failed to initialize error tracking service');
        result.errors.push('Failed to initialize error tracking service');
      }
    } catch (err) {
      console.error('Error tracking initialization failed:', err);
      result.errors.push(`Error tracking initialization failed: ${err.message}`);
    }

    // Initialize performance monitoring
    try {
      result.performance = initPerformanceMonitoring(options.performance);

      if (result.performance) {
        info(LogCategory.APP, 'Performance monitoring service initialized');
      } else {
        console.error('Failed to initialize performance monitoring service');
        result.errors.push('Failed to initialize performance monitoring service');
      }
    } catch (err) {
      console.error('Performance monitoring initialization failed:', err);
      result.errors.push(`Performance monitoring initialization failed: ${err.message}`);
    }

    // Set overall success status
    result.success = result.logging && result.errorTracking && result.performance;

    if (result.success) {
      info(LogCategory.APP, 'All monitoring services initialized successfully');
    } else {
      warn(LogCategory.APP, 'Some monitoring services failed to initialize', { result });
    }

    return result;
  } catch (error) {
    console.error('Unexpected error during monitoring initialization:', error);
    result.errors.push(`Unexpected error: ${error.message}`);
    result.success = false;
    return result;
  }
};

/**
 * Shutdown monitoring services
 * @returns {Promise<boolean>} Whether shutdown was successful
 */
export const shutdownMonitoring = async () => {
  try {
    info(LogCategory.APP, 'Shutting down monitoring services');

    // Flush logs
    await manualFlushLogs();

    // Close Sentry
    await closeSentry();

    info(LogCategory.APP, 'Monitoring services shut down successfully');
    return true;
  } catch (error) {
    console.error('Failed to shut down monitoring services:', error);
    return false;
  }
};

/**
 * Error service
 */
export const errorService = {
  // Core error functions
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setTags,
  setExtra,
  setExtras,

  // Error utilities
  safeErrorCapture,
  formatError,
  createError,
  parseError,
  getErrorCode,
  getUserFriendlyMessage,
  isNetworkError,
  isAuthError,
  isPermissionError,

  /**
   * Handle error with appropriate logging and user feedback
   * @param {Error} error - Error to handle
   * @param {Object} [options] - Options
   * @param {string} [options.category] - Log category
   * @param {string} [options.context] - Error context
   * @param {boolean} [options.silent] - Whether to handle silently
   * @returns {string} User-friendly error message
   */
  handleError: (error, options = {}) => {
    const category = options.category || LogCategory.APP;
    const context = options.context || 'General error';
    const silent = options.silent || false;

    // Log error
    if (!silent) {
      this.error(category, `${context}: ${error.message}`, error);
    }

    // Capture in Sentry
    captureException(error, { tags: { category, context } });

    // Return user-friendly message
    return getUserFriendlyMessage(error);
  },

  /**
   * Create and throw an error
   * @param {string} message - Error message
   * @param {string} [code] - Error code
   * @param {Object} [details] - Error details
   * @throws {Error} Created error
   */
  throwError: (message, code, details) => {
    throw createError(message, code, details);
  },
};

/**
 * Logging service
 */
export const loggingService = {
  // Log levels
  LogLevel,

  // Log categories
  LogCategory,

  // Core logging functions
  log,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,

  // Advanced logging functions
  createLogger,
  setMinLogLevel,
  setGlobalMinLogLevel,
  enableConsoleLogging,
  enableSentryLogging,
  enableRemoteLogging,
  flushLogs: manualFlushLogs,

  /**
   * Create a scoped logger with predefined tags
   * @param {string} category - Log category
   * @param {Object} [tags] - Default tags
   * @returns {Object} Scoped logger
   */
  createScopedLogger: (category, tags = {}) => {
    const logger = createLogger(category);

    return {
      trace: (message, data) => logger.trace(message, data, tags),
      debug: (message, data) => logger.debug(message, data, tags),
      info: (message, data) => logger.info(message, data, tags),
      warn: (message, data) => logger.warn(message, data, tags),
      error: (message, error, data) => logger.error(message, error, data, tags),
      fatal: (message, error, data) => logger.fatal(message, error, data, tags),
    };
  },
};

/**
 * Performance service
 */
export const performanceService = {
  // Transaction types
  TransactionType,

  // Core performance functions
  trackNavigation,
  trackApiRequest,
  trackUiRender,
  trackDataOperation,
  trackUserInteraction,
  trackAppStartup,
  updatePerformanceMetrics,
  getPerformanceMetrics,
  createPerformanceTimer,

  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} name - Measurement name
   * @param {string} type - Transaction type
   * @param {Object} [data] - Additional data
   * @returns {any} Function result
   */
  measure: (fn, name, type, data) => {
    const timer = createPerformanceTimer(name, type, data);

    try {
      const result = fn();

      // Handle promises
      if (result instanceof Promise) {
        return result
          .then(value => {
            timer.stop();
            return value;
          })
          .catch(err => {
            timer.stop({ error: true });
            throw err;
          });
      }

      timer.stop();
      return result;
    } catch (error) {
      timer.stop({ error: true });
      throw error;
    }
  },

  /**
   * Create a performance-tracked version of a function
   * @param {Function} fn - Function to track
   * @param {string} name - Function name
   * @param {string} type - Transaction type
   * @param {Object} [data] - Additional data
   * @returns {Function} Tracked function
   */
  trackFunction: (fn, name, type, data) => {
    return (...args) => {
      return performanceService.measure(() => fn(...args), name, type, data);
    };
  },
};

/**
 * Monitoring service
 */
export const monitoring = {
  // Core monitoring functions
  initialize: initMonitoring,
  shutdown: shutdownMonitoring,

  // Services
  error: errorService,
  logging: loggingService,
  performance: performanceService,

  /**
   * Get monitoring status
   * @returns {Object} Monitoring status
   */
  getStatus: () => {
    return {
      timestamp: new Date().toISOString(),
      performanceMetrics: getPerformanceMetrics(),
    };
  },
};

// Export monitoring service
export default monitoring;
