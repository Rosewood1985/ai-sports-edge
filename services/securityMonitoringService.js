/**
 * Security Monitoring Service
 * 
 * Comprehensive security incident logging and monitoring system
 * for OCR processing and file upload security events.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Security incident severity levels
 */
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Security incident types
 */
const INCIDENT_TYPES = {
  COMMAND_INJECTION: 'command_injection',
  PATH_TRAVERSAL: 'path_traversal',
  FILE_UPLOAD_VIOLATION: 'file_upload_violation',
  OCR_SECURITY_VIOLATION: 'ocr_security_violation',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  MALICIOUS_FILE: 'malicious_file',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};

/**
 * Security Monitoring Service
 */
class SecurityMonitoringService {
  constructor() {
    this.logDirectory = '/tmp/security_logs';
    this.incidentCounter = 0;
    this.recentIncidents = new Map();
    this.rateLimitTracking = new Map();
    this.init();
  }

  /**
   * Initialize security monitoring
   */
  async init() {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDirectory, { recursive: true, mode: 0o700 });
      console.log('[SECURITY MONITOR] Security monitoring service initialized');
    } catch (error) {
      console.error('[SECURITY MONITOR] Failed to initialize:', error);
    }
  }

  /**
   * Logs a security incident
   * @param {Object} incident - Incident details
   * @returns {Promise<string>} Incident ID
   */
  async logIncident(incident) {
    const incidentId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const incidentRecord = {
      id: incidentId,
      timestamp,
      severity: incident.severity || SEVERITY_LEVELS.MEDIUM,
      type: incident.type || INCIDENT_TYPES.SUSPICIOUS_ACTIVITY,
      source: incident.source || 'unknown',
      message: incident.message || 'Security incident detected',
      details: incident.details || {},
      userAgent: incident.userAgent,
      ipAddress: incident.ipAddress,
      userId: incident.userId,
      uploadId: incident.uploadId,
      processingId: incident.processingId,
      errorCode: incident.errorCode,
      stackTrace: incident.stackTrace
    };

    try {
      // Log to console immediately
      console.error('[SECURITY INCIDENT]', {
        id: incidentId,
        severity: incidentRecord.severity,
        type: incidentRecord.type,
        message: incidentRecord.message,
        source: incidentRecord.source
      });

      // Store in memory for quick access
      this.recentIncidents.set(incidentId, incidentRecord);
      
      // Limit memory storage
      if (this.recentIncidents.size > 1000) {
        const oldestId = this.recentIncidents.keys().next().value;
        this.recentIncidents.delete(oldestId);
      }

      // Write to file
      await this.writeIncidentToFile(incidentRecord);

      // Check for patterns that require immediate action
      await this.checkForCriticalPatterns(incidentRecord);

      return incidentId;

    } catch (error) {
      console.error('[SECURITY MONITOR] Failed to log incident:', error);
      return null;
    }
  }

  /**
   * Writes incident to log file
   * @param {Object} incident - Incident record
   */
  async writeIncidentToFile(incident) {
    try {
      const logFileName = `security_${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDirectory, logFileName);
      
      const logEntry = JSON.stringify(incident) + '\n';
      
      await fs.appendFile(logFilePath, logEntry, { mode: 0o600 });
      
    } catch (error) {
      console.error('[SECURITY MONITOR] Failed to write to log file:', error);
    }
  }

  /**
   * Checks for critical patterns requiring immediate action
   * @param {Object} incident - Current incident
   */
  async checkForCriticalPatterns(incident) {
    try {
      // Check for repeated incidents from same source
      if (incident.ipAddress || incident.userId) {
        const key = incident.ipAddress || incident.userId;
        const recentCount = this.countRecentIncidents(key, 300000); // 5 minutes
        
        if (recentCount >= 5) {
          await this.logIncident({
            severity: SEVERITY_LEVELS.CRITICAL,
            type: INCIDENT_TYPES.SUSPICIOUS_ACTIVITY,
            source: 'pattern_detection',
            message: `Multiple security incidents detected from ${key}`,
            details: {
              incidentCount: recentCount,
              timeWindow: '5 minutes',
              originalIncident: incident.id
            }
          });
        }
      }

      // Check for command injection attempts
      if (incident.type === INCIDENT_TYPES.COMMAND_INJECTION) {
        await this.alertCommandInjectionAttempt(incident);
      }

      // Check for path traversal attempts
      if (incident.type === INCIDENT_TYPES.PATH_TRAVERSAL) {
        await this.alertPathTraversalAttempt(incident);
      }

    } catch (error) {
      console.error('[SECURITY MONITOR] Error checking patterns:', error);
    }
  }

  /**
   * Counts recent incidents from a specific source
   * @param {string} source - Source identifier
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {number} Number of recent incidents
   */
  countRecentIncidents(source, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    let count = 0;
    
    for (const incident of this.recentIncidents.values()) {
      const incidentTime = new Date(incident.timestamp).getTime();
      if (incidentTime >= cutoff && 
          (incident.ipAddress === source || incident.userId === source)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Alerts on command injection attempts
   * @param {Object} incident - Command injection incident
   */
  async alertCommandInjectionAttempt(incident) {
    console.error('[CRITICAL SECURITY ALERT] Command injection attempt detected:', {
      incidentId: incident.id,
      details: incident.details,
      source: incident.source,
      timestamp: incident.timestamp
    });
    
    // In production, this would integrate with alerting systems
    // await this.sendCriticalAlert('Command injection attempt', incident);
  }

  /**
   * Alerts on path traversal attempts
   * @param {Object} incident - Path traversal incident
   */
  async alertPathTraversalAttempt(incident) {
    console.error('[CRITICAL SECURITY ALERT] Path traversal attempt detected:', {
      incidentId: incident.id,
      details: incident.details,
      source: incident.source,
      timestamp: incident.timestamp
    });
    
    // In production, this would integrate with alerting systems
    // await this.sendCriticalAlert('Path traversal attempt', incident);
  }

  /**
   * Rate limit tracking for security events
   * @param {string} identifier - Unique identifier (IP, user ID, etc.)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if within rate limit
   */
  checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimitTracking.has(identifier)) {
      this.rateLimitTracking.set(identifier, []);
    }
    
    const requests = this.rateLimitTracking.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      // Rate limit exceeded
      this.logIncident({
        severity: SEVERITY_LEVELS.HIGH,
        type: INCIDENT_TYPES.RATE_LIMIT_EXCEEDED,
        source: 'rate_limiter',
        message: `Rate limit exceeded for ${identifier}`,
        details: {
          identifier,
          requestCount: validRequests.length,
          maxRequests,
          windowMs
        }
      });
      
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.rateLimitTracking.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Gets security statistics
   * @param {number} timeWindow - Time window in milliseconds (default: 24 hours)
   * @returns {Object} Security statistics
   */
  getSecurityStats(timeWindow = 86400000) {
    const cutoff = Date.now() - timeWindow;
    const stats = {
      totalIncidents: 0,
      severityBreakdown: {},
      typeBreakdown: {},
      topSources: {},
      recentCritical: []
    };
    
    // Initialize counters
    Object.values(SEVERITY_LEVELS).forEach(level => {
      stats.severityBreakdown[level] = 0;
    });
    
    Object.values(INCIDENT_TYPES).forEach(type => {
      stats.typeBreakdown[type] = 0;
    });
    
    // Analyze recent incidents
    for (const incident of this.recentIncidents.values()) {
      const incidentTime = new Date(incident.timestamp).getTime();
      if (incidentTime >= cutoff) {
        stats.totalIncidents++;
        stats.severityBreakdown[incident.severity]++;
        stats.typeBreakdown[incident.type]++;
        
        // Track sources
        const source = incident.ipAddress || incident.userId || 'unknown';
        stats.topSources[source] = (stats.topSources[source] || 0) + 1;
        
        // Collect critical incidents
        if (incident.severity === SEVERITY_LEVELS.CRITICAL) {
          stats.recentCritical.push({
            id: incident.id,
            timestamp: incident.timestamp,
            type: incident.type,
            message: incident.message
          });
        }
      }
    }
    
    return stats;
  }

  /**
   * Gets recent incidents
   * @param {number} limit - Maximum number of incidents to return
   * @param {string} severity - Filter by severity level
   * @returns {Array<Object>} Recent incidents
   */
  getRecentIncidents(limit = 50, severity = null) {
    let incidents = Array.from(this.recentIncidents.values());
    
    if (severity) {
      incidents = incidents.filter(incident => incident.severity === severity);
    }
    
    // Sort by timestamp (newest first)
    incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return incidents.slice(0, limit);
  }

  /**
   * Clears old incidents from memory
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldIncidents(maxAge = 86400000) { // 24 hours default
    const cutoff = Date.now() - maxAge;
    
    for (const [id, incident] of this.recentIncidents.entries()) {
      const incidentTime = new Date(incident.timestamp).getTime();
      if (incidentTime < cutoff) {
        this.recentIncidents.delete(id);
      }
    }
  }

  /**
   * Validates security configuration
   * @returns {Object} Configuration validation result
   */
  validateSecurityConfig() {
    const validation = {
      valid: true,
      issues: [],
      recommendations: []
    };

    // Check log directory permissions
    try {
      const logPath = this.logDirectory;
      // Basic checks would go here in production
      validation.recommendations.push('Ensure log directory has restricted permissions (700)');
    } catch (error) {
      validation.valid = false;
      validation.issues.push(`Log directory issue: ${error.message}`);
    }

    return validation;
  }
}

// Export singleton instance and constants
const securityMonitoringService = new SecurityMonitoringService();

module.exports = {
  SecurityMonitoringService,
  securityMonitoringService,
  SEVERITY_LEVELS,
  INCIDENT_TYPES
};