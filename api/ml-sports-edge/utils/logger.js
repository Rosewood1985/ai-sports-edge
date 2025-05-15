/**
 * Logger utility for ML Sports Edge API
 * Provides consistent logging across the application
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    return `${formattedMessage} ${JSON.stringify(data, null, 2)}`;
  }
  
  return formattedMessage;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or additional data
 */
const error = (message, error) => {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    if (error instanceof Error) {
      console.error(formatLogMessage('ERROR', message, { 
        message: error.message, 
        stack: error.stack 
      }));
    } else {
      console.error(formatLogMessage('ERROR', message, error));
    }
  }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} data - Additional data
 */
const warn = (message, data) => {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLogMessage('WARN', message, data));
  }
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
const info = (message, data) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(formatLogMessage('INFO', message, data));
  }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} data - Additional data
 */
const debug = (message, data) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(formatLogMessage('DEBUG', message, data));
  }
};

/**
 * Log performance metric
 * @param {string} operation - Operation name
 * @param {number} startTime - Start time (from performance.now())
 */
const performance = (operation, startTime) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(formatLogMessage('PERFORMANCE', `${operation} completed in ${duration}ms`));
  }
};

/**
 * Create a child logger with a prefix
 * @param {string} prefix - Prefix for log messages
 * @returns {Object} Child logger
 */
const createChildLogger = (prefix) => {
  return {
    error: (message, error) => error(`[${prefix}] ${message}`, error),
    warn: (message, data) => warn(`[${prefix}] ${message}`, data),
    info: (message, data) => info(`[${prefix}] ${message}`, data),
    debug: (message, data) => debug(`[${prefix}] ${message}`, data),
    performance: (operation, startTime) => performance(`[${prefix}] ${operation}`, startTime),
    createChildLogger: (childPrefix) => createChildLogger(`${prefix}:${childPrefix}`)
  };
};

module.exports = {
  error,
  warn,
  info,
  debug,
  performance,
  createChildLogger,
  LOG_LEVELS
};