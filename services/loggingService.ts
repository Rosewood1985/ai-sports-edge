import { Platform } from 'react-native';

// Create a separate file for shared interfaces to break circular dependency
import { addBreadcrumb } from './errorTrackingService';

// Define a local fallback for safeErrorCapture in case the import fails
// This helps us handle the TypeScript error while still maintaining functionality
const localSafeErrorCapture = (error: Error, context?: Record<string, any>): void => {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development' || __DEV__) {
      console.error('[LOCAL] Error captured:', error, context);
    }
  } catch (captureError) {
    // Fallback error handling
    console.error('[LOCAL] Failed to capture error:', captureError);
  }
};

// Try to import from errorUtils, but use local fallback if it fails
let safeErrorCapture: (error: Error, context?: Record<string, any>) => void;
try {
  // This dynamic import approach helps work around TypeScript module resolution issues
  // Note: In a production app, you'd want to use a more robust approach
  const errorUtils = require('./errorUtils');
  safeErrorCapture = errorUtils.safeErrorCapture;
  console.log('Successfully imported safeErrorCapture from errorUtils');
} catch (importError) {
  console.error('Failed to import safeErrorCapture from errorUtils:', importError);
  safeErrorCapture = localSafeErrorCapture;
}

/**
 * Logging Service
 *
 * This service provides logging functionality for the app.
 * It supports different log levels, structured logging, and integration with error tracking.
 */

// Log levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log categories
export enum LogCategory {
  APP = 'app',
  API = 'api',
  AUTH = 'auth',
  NAVIGATION = 'navigation',
  PERFORMANCE = 'performance',
  STORAGE = 'storage',
  UI = 'ui',
  BUSINESS = 'business',
  USER = 'user',
}

// Log entry
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  tags?: Record<string, string>;
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
  enableRemote: boolean;
}

// Default logger configuration
const defaultLoggerConfig: LoggerConfig = {
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableSentry: true,
  enableRemote: !__DEV__,
};

// Logger configuration by category
const loggerConfigs: Record<LogCategory, LoggerConfig> = {
  [LogCategory.APP]: { ...defaultLoggerConfig },
  [LogCategory.API]: { ...defaultLoggerConfig },
  [LogCategory.AUTH]: { ...defaultLoggerConfig },
  [LogCategory.NAVIGATION]: { ...defaultLoggerConfig },
  [LogCategory.PERFORMANCE]: { ...defaultLoggerConfig },
  [LogCategory.STORAGE]: { ...defaultLoggerConfig },
  [LogCategory.UI]: { ...defaultLoggerConfig },
  [LogCategory.BUSINESS]: { ...defaultLoggerConfig },
  [LogCategory.USER]: { ...defaultLoggerConfig },
};

// Log buffer for remote logging
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 100;
let isFlushingLogs = false;

/**
 * Initialize logging
 */
export const initLogging = () => {
  console.log('initLogging: Starting initialization');
  try {
    // Set up logging integrations
    console.log('initLogging: Setting up logging integrations');

    // Check if we're importing from errorUtils correctly
    console.log('initLogging: Checking errorUtils import');
    if (typeof safeErrorCapture === 'function') {
      console.log('initLogging: safeErrorCapture is available');
    } else {
      console.log('initLogging: safeErrorCapture is NOT available');
    }

    // Set up periodic log flushing
    console.log('initLogging: Setting up periodic log flushing');
    if (defaultLoggerConfig.enableRemote) {
      console.log('initLogging: Remote logging enabled, setting up flush interval');
      setInterval(flushLogs, 30000); // Flush logs every 30 seconds
    } else {
      console.log('initLogging: Remote logging disabled');
    }

    console.log('initLogging: Initialization completed successfully');
    return true;
  } catch (error) {
    console.error('initLogging: Failed to initialize logging:', error);
    try {
      console.log('initLogging: Attempting to use safeErrorCapture');
      safeErrorCapture(error as Error);
    } catch (captureError) {
      console.error('initLogging: Failed to use safeErrorCapture:', captureError);
    }
    return false;
  }
};

/**
 * Log a message
 * @param level Log level
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param tags Log tags
 */
export const log = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  try {
    // Get logger configuration
    const config = loggerConfigs[category];

    // Check if log level meets minimum threshold
    if (!isLevelAtLeast(level, config.minLevel)) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
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
    safeErrorCapture(error as Error);
  }
};

/**
 * Log a trace message
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param tags Log tags
 */
export const trace = (
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  log(LogLevel.TRACE, category, message, data, tags);
};

/**
 * Log a debug message
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param tags Log tags
 */
export const debug = (
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  log(LogLevel.DEBUG, category, message, data, tags);
};

/**
 * Log an info message
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param tags Log tags
 */
export const info = (
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  log(LogLevel.INFO, category, message, data, tags);
};

/**
 * Log a warning message
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param tags Log tags
 */
export const warn = (
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  log(LogLevel.WARN, category, message, data, tags);
};

/**
 * Log an error message
 * @param category Log category
 * @param message Log message
 * @param error Error object
 * @param data Additional data
 * @param tags Log tags
 */
export const error = (
  category: LogCategory,
  message: string,
  error?: Error,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  // Combine error and data
  const combinedData = {
    ...data,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  log(LogLevel.ERROR, category, message, combinedData, tags);

  // Capture exception in Sentry
  if (error) {
    safeErrorCapture(error);
  }
};

/**
 * Log a fatal message
 * @param category Log category
 * @param message Log message
 * @param error Error object
 * @param data Additional data
 * @param tags Log tags
 */
export const fatal = (
  category: LogCategory,
  message: string,
  error?: Error,
  data?: Record<string, any>,
  tags?: Record<string, string>
): void => {
  // Combine error and data
  const combinedData = {
    ...data,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  log(LogLevel.FATAL, category, message, combinedData, tags);

  // Capture exception in Sentry
  if (error) {
    safeErrorCapture(error);
  }
};

/**
 * Log to console
 * @param entry Log entry
 */
const logToConsole = (entry: LogEntry): void => {
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
 * @param entry Log entry
 */
const logToSentry = (entry: LogEntry): void => {
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
 * @param entry Log entry
 */
const logToRemote = (entry: LogEntry): void => {
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
 */
const flushLogs = async (): Promise<void> => {
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
    if (__DEV__) {
      console.log(`Would flush ${logsToFlush.length} logs to remote`);
    }

    // Simulate remote logging
    await new Promise(resolve => setTimeout(resolve, 500));

    isFlushingLogs = false;
  } catch (error) {
    console.error('Failed to flush logs:', error);
    safeErrorCapture(error as Error);

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
 * @param level Level to check
 * @param minLevel Minimum level
 * @returns Whether the level is at least the minimum
 */
const isLevelAtLeast = (level: LogLevel, minLevel: LogLevel): boolean => {
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
 * @param level Log level
 * @returns Sentry level
 */
const mapLogLevelToSentryLevel = (
  level: LogLevel
): 'fatal' | 'error' | 'warning' | 'info' | 'debug' => {
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
