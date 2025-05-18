/**
 * Security Molecules Index
 *
 * This file exports all security-related molecular components for easy importing.
 */

const apiKeyScanner = require('./apiKeyScanner');
const inputValidator = require('./inputValidator');
const authManager = require('./authManager');

module.exports = {
  // API Key Scanner
  scanFile: apiKeyScanner.scanFile,
  scanDirectory: apiKeyScanner.scanDirectory,
  scanProject: apiKeyScanner.scanProject,
  formatScanResults: apiKeyScanner.formatScanResults,
  saveScanResults: apiKeyScanner.saveScanResults,
  shouldExcludeFile: apiKeyScanner.shouldExcludeFile,
  isFileAllowlisted: apiKeyScanner.isFileAllowlisted,

  // Input Validator
  VALIDATION_SCHEMAS: inputValidator.VALIDATION_SCHEMAS,
  validateForm: inputValidator.validateForm,
  createValidationSchema: inputValidator.createValidationSchema,
  sanitizeForDisplay: inputValidator.sanitizeForDisplay,
  sanitizeForDatabase: inputValidator.sanitizeForDatabase,

  // Auth Manager
  AuthManager: authManager.AuthManager,
  authManager: authManager.authManager,
  PERMISSION_LEVELS: authManager.PERMISSION_LEVELS,
  DEFAULT_ROLES: authManager.DEFAULT_ROLES,
};
