/**
 * Security Organisms Index
 *
 * This file exports all security-related organism components for easy importing.
 */

const securityManager = require('./securityManager');

module.exports = {
  // Security Manager
  SecurityManager: securityManager.SecurityManager,
  securityManager: securityManager.securityManager,
  PERMISSION_LEVELS: securityManager.PERMISSION_LEVELS,
  DEFAULT_ROLES: securityManager.DEFAULT_ROLES,
  VALIDATION_SCHEMAS: securityManager.VALIDATION_SCHEMAS,
};
