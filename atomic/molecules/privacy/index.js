/**
 * Privacy Module
 *
 * This module exports privacy-related components for data access, data deletion,
 * and consent management in compliance with GDPR and CCPA requirements.
 */

import PrivacyManager from './PrivacyManager';
import * as DataAccessManager from './DataAccessManager';
import * as DataDeletionManager from './DataDeletionManager';

export { PrivacyManager as default, DataAccessManager, DataDeletionManager };

// Export individual functions for direct import
export const {
  // Data access functions
  createDataAccessRequest,
  getDataAccessRequest,
  processDataAccessRequest,
  collectUserData,
  formatUserData,
  generateDownloadUrl,
  verifyDataAccessRequest,

  // Data deletion functions
  createDataDeletionRequest,
  getDataDeletionRequest,
  processDataDeletionRequest,
  deleteUserData,

  // Privacy management functions
  getUserPrivacyRequests,
  updatePrivacyPreferences,
  recordConsent,
  hasConsent,
  createPrivacyRequest,
  getPrivacyRequest,
  processPrivacyRequest,
  verifyPrivacyRequest,
} = PrivacyManager;
