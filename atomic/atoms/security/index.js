/**
 * Security Atoms Index
 *
 * This file exports all security-related atomic components for easy importing.
 */

const apiKeyPatterns = require('./apiKeyPatterns');
const inputValidation = require('./inputValidation');
const authChecks = require('./authChecks');

module.exports = {
  // API Key Detection
  API_KEY_PATTERNS: apiKeyPatterns.API_KEY_PATTERNS,
  SCAN_EXCLUSIONS: apiKeyPatterns.SCAN_EXCLUSIONS,
  ALLOWLISTED_FILES: apiKeyPatterns.ALLOWLISTED_FILES,

  // Input Validation
  sanitizeString: inputValidation.sanitizeString,
  isValidEmail: inputValidation.isValidEmail,
  isValidUrl: inputValidation.isValidUrl,
  isValidPhone: inputValidation.isValidPhone,
  isValidUsername: inputValidation.isValidUsername,
  validatePasswordStrength: inputValidation.validatePasswordStrength,
  validateObject: inputValidation.validateObject,
  escapeRegExp: inputValidation.escapeRegExp,
  sanitizeForSql: inputValidation.sanitizeForSql,

  // Authentication and Authorization
  PERMISSION_LEVELS: authChecks.PERMISSION_LEVELS,
  DEFAULT_ROLES: authChecks.DEFAULT_ROLES,
  isTokenExpired: authChecks.isTokenExpired,
  hasPermission: authChecks.hasPermission,
  hasResourceAccess: authChecks.hasResourceAccess,
  validateFirebaseToken: authChecks.validateFirebaseToken,
  generateSecureToken: authChecks.generateSecureToken,
  hashPassword: authChecks.hashPassword,
  verifyPassword: authChecks.verifyPassword,
};
