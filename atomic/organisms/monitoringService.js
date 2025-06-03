/**
 * Monitoring Service Organism
 * Integrates error tracking, logging, and performance monitoring
 * into a cohesive monitoring solution.
 */

// External imports

// Internal imports
import {
  captureException,
  captureMessage,
  setUser,
  setTag,
  setTags,
  setExtra,
  setExtras,
  addBreadcrumb,
  closeSentry,
  flushSentry,
  createError,
  formatError,
  getUserFriendlyMessage,
  parseError,
  getErrorCode,
  isAuthError,
  isNetworkError,
  isPermissionError,
  safeErrorCapture,
} from '../molecules/errorTracking';
import {
  LogCategory,
  LogLevel,
  createLogger,
  enableConsoleLogging,
  enableRemoteLogging,
  enableSentryLogging,
  setGlobalMinLogLevel,
  setMinLogLevel,
  manualFlushLogs,
  debug,
  info,
  warn,
  error,
  fatal,
  trace,
  log,
} from '../molecules/logging';
import {
  TransactionType,
  createPerformanceTimer,
  getPerformanceMetrics,
  updatePerformanceMetrics,
  startTransaction,
  trackApiRequest,
  trackAppStartup,
  trackDataOperation,
  trackNavigation,
  trackUiRender,
  trackUserInteraction,
} from '../molecules/performance';

// Core monitoring functions
const initLogging = (options = {}) => {
  try {
    if (options.enableConsole) {
      enableConsoleLogging();
    }

    if (options.enableRemote) {
      enableRemoteLogging(options.flushInterval);
    }

    if (options.enableSentry) {
      enableSentryLogging();
    }

    info(LogCategory.APP, 'Logging service initialized');
    return true;
  } catch (err) {
    console.error('Failed to initialize logging service');
    return false;
  }
};

const initErrorTracking = (options = {}) => {
  try {
    // Initialize error tracking
    info(LogCategory.APP, 'Error tracking service initialized');
    return true;
  } catch (err) {
    console.error('Error tracking initialization failed:', err);
    return false;
  }
};

const initPerformanceMonitoring = (options = {}) => {
  try {
    // Initialize performance monitoring
    info(LogCategory.APP, 'Performance monitoring service initialized');
    return true;
  } catch (err) {
    console.error('Performance monitoring initialization failed:', err);
    return false;
  }
};

export const initMonitoring = (options = {}) => {
  console.log('Initializing monitoring services...');

  const result = {
    success: false,
    logging: false,
    errorTracking: false,
    performance: false,
    errors: [],
  };

  try {
    // Initialize logging first
    result.logging = initLogging(options.logging);

    if (result.logging) {
      result.errorTracking = initErrorTracking(options.errorTracking);
      result.performance = initPerformanceMonitoring(options.performance);

      // Set overall success status
      result.success = result.logging && result.errorTracking && result.performance;

      if (result.success) {
        info(LogCategory.APP, 'All monitoring services initialized successfully');
      } else {
        warn(LogCategory.APP, 'Some monitoring services failed to initialize', { result });
      }
    } else {
      result.errors.push('Failed to initialize logging service');
    }

    return result;
  } catch (error) {
    console.error('Unexpected error during monitoring initialization:', error);
    result.success = false;
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
};

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

// Services
export const loggingService = {
  debug,
  info,
  warn,
  error,
  fatal,
  trace,
  log,
  flushLogs: manualFlushLogs,
  createScopedLogger: (category, tags = {}) => {
    const logger = createLogger(category);
    return {
      debug: (message, data) => logger.debug(message, data, tags),
      info: (message, data) => logger.info(message, data, tags),
      warn: (message, data) => logger.warn(message, data, tags),
      error: (message, error, data) => logger.error(message, error, data, tags),
      fatal: (message, error, data) => logger.fatal(message, error, data, tags),
      trace: (message, data) => logger.trace(message, data, tags),
    };
  },
};

export const errorService = {
  captureException,
  captureMessage,
  setUser,
  setTag,
  setTags,
  setExtra,
  setExtras,
  addBreadcrumb,
  createError,
  formatError,
  getUserFriendlyMessage,
  parseError,
  getErrorCode,
  isAuthError,
  isNetworkError,
  isPermissionError,
  safeErrorCapture,
  handleError: (error, options = {}) => {
    const category = options.category || LogCategory.APP;
    const context = options.context || 'General error';
    const silent = options.silent || false;

    if (!silent) {
      this.error(category, `${context}: ${error.message}`, error);
    }

    // Capture in Sentry
    captureException(error, { tags: { category, context } });

    return getUserFriendlyMessage(error);
  },
  throwError: (message, code, details) => {
    throw createError(message, code, details);
  },
};

export const performanceService = {
  getPerformanceMetrics,
  updatePerformanceMetrics,
  startTransaction,
  trackApiRequest,
  trackAppStartup,
  trackDataOperation,
  trackNavigation,
  trackUiRender,
  trackUserInteraction,
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
      } else {
        timer.stop();
        return result;
      }
    } catch (error) {
      timer.stop({ error: true });
      throw error;
    }
  },
  trackFunction: (fn, name, type, data) => {
    return (...args) => {
      return performanceService.measure(() => fn(...args), name, type, data);
    };
  },
};

export const monitoring = {
  initialize: initMonitoring,
  shutdown: shutdownMonitoring,
  getStatus: () => {
    return {
      performanceMetrics: getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };
  },
  logging: loggingService,
  error: errorService,
  performance: performanceService,
  LogCategory,
  LogLevel,
  TransactionType,
};

export default monitoring;
