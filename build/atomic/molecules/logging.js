/**
 * Logging Molecule
 *
 * Provides structured logging functionality for the application.
 * Combines error utility atoms with logging-specific features.
 */

import { Platform } from 'react-native';
import { addBreadcrumb } from './errorTracking';
import { safeErrorCapture, formatError } from '../atoms/errorUtils';
import { isDevelopment } from '../atoms/envConfig';

/**
 * Log levels
 */
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
};

/**
 * Log categories
 */
export const LogCategory = {
  APP: 'app',
  API: 'api',
  AUTH: 'auth',
  NAVIGATION: 'navigation',
  PERFORMANCE: 'performance',
  STORAGE: 'storage',
  UI: 'ui',
  BUSINESS: 'business',
  USER: 'user',
  BETTING: 'betting',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
};

/**
 * Log entry interface
 * @typedef {Object} LogEntry
 * @property {string} timestamp - ISO timestamp
 * @property {string} level - Log level
 * @property {string} category - Log category
 * @property {string} message - Log message
 * @property {Object} [data] - Additional data
 * @property {Object} [tags] - Log tags
 */

/**
 * Logger configuration interface
 * @typedef {Object} LoggerConfig
 * @property {string} minLevel - Minimum log level
 * @property {boolean} enableConsole - Whether to log to console
 * @property {boolean} enableSentry - Whether to log to Sentry
 * @property {boolean} enableRemote - Whether to log to remote
 */

// Default logger configuration
const defaultLoggerConfig = {
  minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableSentry: true,
  enableRemote: !isDevelopment,
};

// Logger configuration by category
const loggerConfigs = Object.values(LogCategory).reduce((configs, category) => {
  configs[category] = { ...defaultLoggerConfig };
  return configs;
}, {});

// Log buffer for remote logging
const logBuffer = [];
const MAX_BUFFER_SIZE = 100;
let isFlushingLogs = false;

/**
 * Initialize logging service
 * @param {Object} [options] - Initialization options
 * @param {boolean} [options.enableConsole] - Whether to enable console logging
 * @param {boolean} [options.enableSentry] - Whether to enable Sentry logging
 * @param {boolean} [options.enableRemote] - Whether to enable remote logging
 * @param {number} [options.flushInterval] - Log flush interval in ms
 * @returns {boolean} Whether initialization was successful
 */
export const initLogging = (options = {}) => {
  console.log('initLogging: Starting initialization');
  try {
    // Update default configuration with options
    if (options.enableConsole !== undefined) {
      defaultLoggerConfig.enableConsole = options.enableConsole;
    }

    if (options.enableSentry !== undefined) {
      defaultLoggerConfig.enableSentry = options.enableSentry;
    }

    if (options.enableRemote !== undefined) {
      defaultLoggerConfig.enableRemote = options.enableRemote;
    }

    // Set up periodic log flushing
    console.log('initLogging: Setting up periodic log flushing');
    if (defaultLoggerConfig.enableRemote) {
      console.log('initLogging: Remote logging enabled, setting up flush interval');
      const flushInterval = options.flushInterval || 30000; // Default: 30 seconds
      setInterval(flushLogs, flushInterval);
    } else {
      console.log('initLogging: Remote logging disabled');
    }

    console.log('initLogging: Initialization completed successfully');
    return true;
  } catch (error) {
    console.error('initLogging: Failed to initialize logging:', error);
    try {
      safeErrorCapture(error);
    } catch (captureError) {
      console.error('initLogging: Failed to use safeErrorCapture:', captureError);
    }
    return false;
  }
};

/**
 * Log a message
 * @param {string} level - Log level
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const log = (level, category, message, data, tags) => {
  try {
    // Get logger configuration
    const config = loggerConfigs[category] || defaultLoggerConfig;

    // Check if log level meets minimum threshold
    if (!isLevelAtLeast(level, config.minLevel)) {
      return;
    }

    // Create log entry
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      tags,
    };

    // Log to console
    if (config.enableConsole) {
      logToConsole(entry);
    }

    // Log to Sentry
    if (config.enableSentry) {
      logToSentry(entry);
    }

    // Log to remote
    if (config.enableRemote) {
      logToRemote(entry);
    }
  } catch (error) {
    console.error('Failed to log message:', error);
    safeErrorCapture(error);
  }
};

/**
 * Log a trace message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const trace = (category, message, data, tags) => {
  log(LogLevel.TRACE, category, message, data, tags);
};

/**
 * Log a debug message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const debug = (category, message, data, tags) => {
  log(LogLevel.DEBUG, category, message, data, tags);
};

/**
 * Log an info message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const info = (category, message, data, tags) => {
  log(LogLevel.INFO, category, message, data, tags);
};

/**
 * Log a warning message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const warn = (category, message, data, tags) => {
  log(LogLevel.WARN, category, message, data, tags);
};

/**
 * Log an error message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Error} [error] - Error object
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const error = (category, message, error, data, tags) => {
  // Combine error and data
  const combinedData = {
    ...data,
    error: error ? formatError(error) : undefined,
  };

  log(LogLevel.ERROR, category, message, combinedData, tags);

  // Capture exception in Sentry
  if (error) {
    safeErrorCapture(error);
  }
};

/**
 * Log a fatal message
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {Error} [error] - Error object
 * @param {Object} [data] - Additional data
 * @param {Object} [tags] - Log tags
 */
export const fatal = (category, message, error, data, tags) => {
  // Combine error and data
  const combinedData = {
    ...data,
    error: error ? formatError(error) : undefined,
  };

  log(LogLevel.FATAL, category, message, combinedData, tags);

  // Capture exception in Sentry
  if (error) {
    safeErrorCapture(error);
  }
};

/**
 * Log to console
 * @param {LogEntry} entry - Log entry
 */
const logToConsole = entry => {
  // Format log message
  const timestamp = entry.timestamp.split('T')[1].split('.')[0];
  const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;

  // Log to console based on level
  switch (entry.level) {
    case LogLevel.TRACE:
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${entry.message}`, entry.data);
      break;
    case LogLevel.INFO:
      console.info(`${prefix} ${entry.message}`, entry.data);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${entry.message}`, entry.data);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(`${prefix} ${entry.message}`, entry.data);
      break;
  }
};

/**
 * Log to Sentry
 * @param {LogEntry} entry - Log entry
 */
const logToSentry = entry => {
  // Only log warnings and above to Sentry
  if (!isLevelAtLeast(entry.level, LogLevel.WARN)) {
    return;
  }

  // Add breadcrumb to Sentry
  addBreadcrumb({
    category: entry.category,
    message: entry.message,
    data: entry.data,
    level: mapLogLevelToSentryLevel(entry.level),
  });
};

/**
 * Log to remote
 * @param {LogEntry} entry - Log entry
 */
const logToRemote = entry => {
  // Add log to buffer
  logBuffer.push(entry);

  // Trim buffer if it gets too large
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Flush logs immediately for errors and fatals
  if (isLevelAtLeast(entry.level, LogLevel.ERROR) && !isFlushingLogs) {
    flushLogs();
  }
};

/**
 * Flush logs to remote
 * @returns {Promise<void>}
 */
const flushLogs = async () => {
  // Check if there are logs to flush
  if (logBuffer.length === 0 || isFlushingLogs) {
    return;
  }

  try {
    isFlushingLogs = true;

    // Get logs to flush
    const logsToFlush = [...logBuffer];

    // Clear buffer
    logBuffer.length = 0;

    // In a real implementation, this would send logs to a remote logging service
    // For now, just log the count
    if (isDevelopment) {
      console.log(`Would flush ${logsToFlush.length} logs to remote`);
    }

    // Simulate remote logging
    await new Promise(resolve => setTimeout(resolve, 500));

    isFlushingLogs = false;
  } catch (error) {
    console.error('Failed to flush logs:', error);
    safeErrorCapture(error);

    // Put logs back in buffer
    logBuffer.unshift(...logBuffer);

    // Trim buffer if it gets too large
    while (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    isFlushingLogs = false;
  }
};

/**
 * Check if a log level is at least a minimum level
 * @param {string} level - Level to check
 * @param {string} minLevel - Minimum level
 * @returns {boolean} Whether the level is at least the minimum
 */
const isLevelAtLeast = (level, minLevel) => {
  const levelOrder = [
    LogLevel.TRACE,
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
    LogLevel.FATAL,
  ];

  const levelIndex = levelOrder.indexOf(level);
  const minLevelIndex = levelOrder.indexOf(minLevel);

  return levelIndex >= minLevelIndex;
};

/**
 * Map log level to Sentry level
 * @param {string} level - Log level
 * @returns {string} Sentry level
 */
const mapLogLevelToSentryLevel = level => {
  switch (level) {
    case LogLevel.TRACE:
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warning';
    case LogLevel.ERROR:
      return 'error';
    case LogLevel.FATAL:
      return 'fatal';
    default:
      return 'info';
  }
};

/**
 * Create a logger for a specific category
 * @param {string} category - Log category
 * @returns {Object} Logger object
 */
export const createLogger = category => {
  return {
    trace: (message, data, tags) => trace(category, message, data, tags),
    debug: (message, data, tags) => debug(category, message, data, tags),
    info: (message, data, tags) => info(category, message, data, tags),
    warn: (message, data, tags) => warn(category, message, data, tags),
    error: (message, error, data, tags) => error(category, message, error, data, tags),
    fatal: (message, error, data, tags) => fatal(category, message, error, data, tags),
  };
};

/**
 * Set minimum log level for a category
 * @param {string} category - Log category
 * @param {string} level - Minimum log level
 */
export const setMinLogLevel = (category, level) => {
  if (loggerConfigs[category]) {
    loggerConfigs[category].minLevel = level;
  }
};

/**
 * Set global minimum log level
 * @param {string} level - Minimum log level
 */
export const setGlobalMinLogLevel = level => {
  Object.keys(loggerConfigs).forEach(category => {
    loggerConfigs[category].minLevel = level;
  });
};

/**
 * Enable or disable console logging for a category
 * @param {string} category - Log category
 * @param {boolean} enabled - Whether to enable console logging
 */
export const enableConsoleLogging = (category, enabled) => {
  if (loggerConfigs[category]) {
    loggerConfigs[category].enableConsole = enabled;
  }
};

/**
 * Enable or disable Sentry logging for a category
 * @param {string} category - Log category
 * @param {boolean} enabled - Whether to enable Sentry logging
 */
export const enableSentryLogging = (category, enabled) => {
  if (loggerConfigs[category]) {
    loggerConfigs[category].enableSentry = enabled;
  }
};

/**
 * Enable or disable remote logging for a category
 * @param {string} category - Log category
 * @param {boolean} enabled - Whether to enable remote logging
 */
export const enableRemoteLogging = (category, enabled) => {
  if (loggerConfigs[category]) {
    loggerConfigs[category].enableRemote = enabled;
  }
};

/**
 * Manually flush logs
 * @returns {Promise<void>}
 */
export const manualFlushLogs = () => {
  return flushLogs();
};
