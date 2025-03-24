/**
 * Security Audit Logging Module
 * 
 * This module provides comprehensive security audit logging for the AI Sports Edge application.
 * It logs security-relevant events and provides tools for monitoring and analyzing security incidents.
 */

const winston = require('winston');
const { format } = winston;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default log directory
const DEFAULT_LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(DEFAULT_LOG_DIR)) {
  fs.mkdirSync(DEFAULT_LOG_DIR, { recursive: true });
}

// Create a secure hash for log integrity
const createLogHash = (logEntry) => {
  return crypto.createHash('sha256').update(JSON.stringify(logEntry)).digest('hex');
};

// Create a Winston logger for security events
const createSecurityLogger = (options = {}) => {
  const {
    logDir = DEFAULT_LOG_DIR,
    logLevel = 'info',
    maxSize = '10m',
    maxFiles = 10,
    enableConsole = process.env.NODE_ENV !== 'production',
    enableFile = true,
    enableSyslog = false,
    syslogHost = 'localhost',
    syslogPort = 514,
    enableTamperProtection = true,
  } = options;

  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Define log formats
  const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.json()
  );

  // Define transports
  const transports = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, metadata }) => {
            return `${timestamp} ${level}: ${message} ${JSON.stringify(metadata)}`;
          })
        ),
      })
    );
  }

  // File transport
  if (enableFile) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'security-audit.log'),
        maxsize: maxSize,
        maxFiles,
        format: logFormat,
      })
    );
  }

  // Create the logger
  const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'security-audit' },
    transports,
  });

  // Add tamper protection
  if (enableTamperProtection) {
    // Override the log method to add a hash
    const originalLog = logger.log.bind(logger);
    logger.log = function (level, message, meta) {
      const logEntry = {
        level,
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      };
      
      // Add a hash for tamper detection
      logEntry.hash = createLogHash(logEntry);
      
      return originalLog(level, message, meta);
    };
  }

  return logger;
};

// Security event types
const SecurityEventType = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_CHALLENGE: 'mfa_challenge',
  
  // Authorization events
  ACCESS_DENIED: 'access_denied',
  PERMISSION_CHANGE: 'permission_change',
  ROLE_CHANGE: 'role_change',
  
  // Data access events
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  DATA_DELETION: 'data_deletion',
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  
  // System events
  SYSTEM_START: 'system_start',
  SYSTEM_STOP: 'system_stop',
  CONFIG_CHANGE: 'config_change',
  
  // Security events
  SECURITY_ALERT: 'security_alert',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  
  // API events
  API_KEY_CREATED: 'api_key_created',
  API_KEY_DELETED: 'api_key_deleted',
  API_REQUEST: 'api_request',
  
  // User management events
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_LOCKED: 'user_locked',
  USER_UNLOCKED: 'user_unlocked',
};

// Create a default security logger
const securityLogger = createSecurityLogger();

/**
 * Log a security event
 * @param {String} eventType - Type of security event
 * @param {String} message - Event message
 * @param {Object} data - Additional event data
 * @param {String} level - Log level (default: info)
 */
const logSecurityEvent = (eventType, message, data = {}, level = 'info') => {
  securityLogger.log(level, message, {
    eventType,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create an Express middleware for audit logging
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
const createAuditMiddleware = (options = {}) => {
  const {
    excludePaths = ['/health', '/metrics'],
    logBody = false,
    logHeaders = true,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    sensitiveParams = ['password', 'token', 'key', 'secret'],
  } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Capture the original end method
    const originalEnd = res.end;
    
    // Get the start time
    const startTime = Date.now();
    
    // Override the end method to log the response
    res.end = function (chunk, encoding) {
      // Restore the original end method
      res.end = originalEnd;
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Prepare request data
      const requestData = {
        method: req.method,
        path: req.path,
        query: sanitizeObject(req.query, sensitiveParams),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        responseTime,
        statusCode: res.statusCode,
      };
      
      // Add headers if enabled
      if (logHeaders) {
        requestData.headers = sanitizeObject(req.headers, sensitiveHeaders);
      }
      
      // Add body if enabled and present
      if (logBody && req.body) {
        requestData.body = sanitizeObject(req.body, sensitiveParams);
      }
      
      // Add user if authenticated
      if (req.user) {
        requestData.userId = req.user.id;
        requestData.userRole = req.user.role;
      }
      
      // Determine log level based on status code
      let logLevel = 'info';
      if (res.statusCode >= 400 && res.statusCode < 500) {
        logLevel = 'warn';
      } else if (res.statusCode >= 500) {
        logLevel = 'error';
      }
      
      // Log the request
      logSecurityEvent(
        'api_request',
        `${req.method} ${req.path} ${res.statusCode}`,
        requestData,
        logLevel
      );
      
      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Sanitize an object by removing or masking sensitive fields
 * @param {Object} obj - Object to sanitize
 * @param {Array} sensitiveFields - Array of sensitive field names
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, sensitiveFields = []) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '********';
    }
  }
  
  return sanitized;
};

/**
 * Verify the integrity of a log file
 * @param {String} logFilePath - Path to the log file
 * @returns {Object} Verification results
 */
const verifyLogIntegrity = async (logFilePath) => {
  try {
    // Read the log file
    const logContent = await fs.promises.readFile(logFilePath, 'utf8');
    
    // Parse each line as JSON
    const logEntries = logContent.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // Verify each log entry
    const results = {
      totalEntries: logEntries.length,
      validEntries: 0,
      invalidEntries: 0,
      tamperedEntries: [],
    };
    
    for (let i = 0; i < logEntries.length; i++) {
      const entry = logEntries[i];
      
      // Skip entries without a hash
      if (!entry.hash) {
        continue;
      }
      
      // Create a copy without the hash
      const entryWithoutHash = { ...entry };
      delete entryWithoutHash.hash;
      
      // Calculate the hash
      const calculatedHash = createLogHash(entryWithoutHash);
      
      // Compare the hashes
      if (calculatedHash === entry.hash) {
        results.validEntries++;
      } else {
        results.invalidEntries++;
        results.tamperedEntries.push({
          lineNumber: i + 1,
          entry,
        });
      }
    }
    
    return results;
  } catch (error) {
    return {
      error: error.message,
      stack: error.stack,
    };
  }
};

/**
 * Apply audit logging to an Express app
 * @param {Object} app - Express app
 * @param {Object} options - Configuration options
 */
const applyAuditLogging = (app, options = {}) => {
  const middleware = createAuditMiddleware(options);
  app.use(middleware);
  
  // Log application start
  logSecurityEvent(
    SecurityEventType.SYSTEM_START,
    'Application started',
    {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    }
  );
  
  // Log application shutdown
  process.on('SIGINT', () => {
    logSecurityEvent(
      SecurityEventType.SYSTEM_STOP,
      'Application stopping due to SIGINT',
      { pid: process.pid }
    );
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logSecurityEvent(
      SecurityEventType.SYSTEM_STOP,
      'Application stopping due to SIGTERM',
      { pid: process.pid }
    );
    process.exit(0);
  });
  
  // Log uncaught exceptions
  process.on('uncaughtException', (error) => {
    logSecurityEvent(
      SecurityEventType.SECURITY_ALERT,
      'Uncaught exception',
      {
        error: error.message,
        stack: error.stack,
        pid: process.pid,
      },
      'error'
    );
  });
  
  // Log unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logSecurityEvent(
      SecurityEventType.SECURITY_ALERT,
      'Unhandled promise rejection',
      {
        reason: reason.toString(),
        pid: process.pid,
      },
      'error'
    );
  });
};

module.exports = {
  createSecurityLogger,
  logSecurityEvent,
  createAuditMiddleware,
  verifyLogIntegrity,
  applyAuditLogging,
  SecurityEventType,
};