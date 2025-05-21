/**
 * Privacy Types
 *
 * This file contains TypeScript interfaces and types for privacy-related data structures.
 * These types are used throughout the privacy components to ensure type safety.
 */

import {
  ConsentType,
  ConsentMethod,
  PrivacyRegion,
  PrivacyRequestType,
  PrivacyRequestStatus,
} from './gdprConfig';

/**
 * Represents a user's consent for a specific purpose
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  given: boolean;
  timestamp: Date;
  method: ConsentMethod;
  ipAddress?: string;
  userAgent?: string;
  policyVersion: string;
  policyText: string; // The actual text shown to the user
  expiresAt?: Date;
}

/**
 * Represents a simplified consent record stored in the user document
 */
export interface UserConsentRecord {
  given: boolean;
  timestamp: Date;
  method: ConsentMethod;
  version: string; // Version of privacy policy/terms
}

/**
 * Represents a user's privacy preferences
 */
export interface PrivacyPreferences {
  marketingCommunications: boolean;
  dataAnalytics: boolean;
  thirdPartySharing: boolean;
  profiling: boolean;
  [key: string]: boolean; // Allow for additional preferences
}

/**
 * Represents data retention settings for a user
 */
export interface DataRetentionSettings {
  accountDeletionScheduled: boolean;
  scheduledDeletionDate?: Date;
  retentionExceptions?: {
    [dataType: string]: {
      extendedRetention: boolean;
      reason: string;
      expiresAt?: Date;
    };
  };
}

/**
 * Represents privacy-related fields in the user document
 */
export interface UserPrivacyFields {
  // Consent records
  consentRecords: {
    [consentType: string]: UserConsentRecord;
  };

  // Privacy preferences
  privacyPreferences: PrivacyPreferences;

  // Data retention settings
  dataRetention: DataRetentionSettings;

  // User's region for privacy regulations
  region?: PrivacyRegion;

  // Whether the user has completed privacy onboarding
  privacyOnboardingCompleted: boolean;

  // Last time privacy settings were updated
  privacySettingsUpdatedAt: Date;
}

/**
 * Represents a privacy request made by a user
 */
export interface PrivacyRequest {
  id: string;
  userId: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  requestData?: any; // Additional request details
  responseData?: any; // Response details
  verificationMethod?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  notes?: string;
  handledBy?: string; // Admin user who handled the request
}

/**
 * Represents a data access request
 */
export interface DataAccessRequest extends PrivacyRequest {
  type: PrivacyRequestType.ACCESS;
  requestData: {
    dataCategories?: string[]; // Specific categories of data requested
    format?: 'json' | 'csv' | 'pdf'; // Requested format
  };
  responseData?: {
    downloadUrl?: string; // URL to download the data
    expiresAt?: Date; // When the download URL expires
    size?: number; // Size of the data in bytes
  };
}

/**
 * Represents a data deletion request
 */
export interface DataDeletionRequest extends PrivacyRequest {
  type: PrivacyRequestType.DELETION;
  requestData: {
    fullDeletion: boolean; // Whether to delete all data or just specific categories
    dataCategories?: string[]; // Specific categories of data to delete
  };
  responseData?: {
    deletedCategories: string[]; // Categories that were deleted
    anonymizedCategories?: string[]; // Categories that were anonymized
    retainedCategories?: string[]; // Categories that were retained (with reasons)
    retentionReasons?: { [category: string]: string }; // Reasons for retention
    accountDeleted?: boolean; // Whether the account was deleted
  };
}

/**
 * Represents a data portability request
 */
export interface DataPortabilityRequest extends PrivacyRequest {
  type: PrivacyRequestType.PORTABILITY;
  requestData: {
    format: 'json' | 'csv' | 'xml'; // Requested format
    dataCategories?: string[]; // Specific categories of data requested
  };
  responseData?: {
    downloadUrl?: string; // URL to download the data
    expiresAt?: Date; // When the download URL expires
    size?: number; // Size of the data in bytes
  };
}

/**
 * Represents a processing restriction request
 */
export interface ProcessingRestrictionRequest extends PrivacyRequest {
  type: PrivacyRequestType.RESTRICTION;
  requestData: {
    restrictionReason: string; // Reason for the restriction
    dataCategories: string[]; // Categories of data to restrict processing for
  };
  responseData?: {
    restrictedCategories: string[]; // Categories that were restricted
    effectiveUntil?: Date; // When the restriction expires (if temporary)
  };
}

/**
 * Represents an objection to processing request
 */
export interface ObjectionRequest extends PrivacyRequest {
  type: PrivacyRequestType.OBJECTION;
  requestData: {
    objectionReason: string; // Reason for the objection
    processingPurposes: string[]; // Purposes to object to
  };
  responseData?: {
    acceptedObjections: string[]; // Objections that were accepted
    rejectedObjections?: string[]; // Objections that were rejected
    rejectionReasons?: { [objection: string]: string }; // Reasons for rejection
  };
}

/**
 * Union type for all privacy request types
 */
export type PrivacyRequestUnion =
  | DataAccessRequest
  | DataDeletionRequest
  | DataPortabilityRequest
  | ProcessingRestrictionRequest
  | ObjectionRequest;

/**
 * Represents a data category for privacy purposes
 */
export interface DataCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  retention: number; // Retention period in days
  legalBasis: string;
  sensitive: boolean;
  required: boolean;
  purposes: string[];
}

/**
 * Represents a privacy policy version
 */
export interface PrivacyPolicyVersion {
  version: string;
  effectiveDate: Date;
  text: string;
  changes?: string; // Description of changes from previous version
  previousVersion?: string; // Reference to previous version
}

/**
 * Represents a privacy audit log entry
 */
export interface PrivacyAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  adminId?: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Represents a data breach notification
 */
export interface DataBreachNotification {
  id: string;
  detectedAt: Date;
  reportedAt: Date;
  description: string;
  affectedUsers: string[];
  affectedData: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
  notificationSent: boolean;
  notificationSentAt?: Date;
}

// Note: These are TypeScript interfaces and types, not values,
// so they cannot be exported as a default object.
// Instead, they are exported individually above.
