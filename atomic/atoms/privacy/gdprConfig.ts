/**
 * GDPR/CCPA Configuration
 *
 * This file contains configuration settings for GDPR and CCPA compliance features.
 * It includes feature flags, regional settings, and other configuration options.
 */

/**
 * Supported privacy regulations
 */
export enum PrivacyRegulation {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  GLOBAL = 'global',
}

/**
 * Supported regions for privacy regulations
 */
export enum PrivacyRegion {
  EU = 'eu',
  CALIFORNIA = 'california',
  US = 'us',
  GLOBAL = 'global',
}

/**
 * Types of consent that can be collected
 */
export enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  THIRD_PARTY = 'thirdParty',
  PROFILING = 'profiling',
}

/**
 * Methods of consent collection
 */
export enum ConsentMethod {
  EXPLICIT = 'explicit',
  IMPLICIT = 'implicit',
  FORM = 'form',
  COOKIE = 'cookie',
  API = 'api',
}

/**
 * Types of privacy requests
 */
export enum PrivacyRequestType {
  ACCESS = 'access',
  DELETION = 'deletion',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
}

/**
 * Status of privacy requests
 */
export enum PrivacyRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  DENIED = 'denied',
}

/**
 * Configuration for privacy features
 */
interface PrivacyFeatureConfig {
  enabled: boolean;
  requiredConsent?: ConsentType[];
  applicableRegions: PrivacyRegion[];
}

/**
 * Configuration for privacy features
 */
export const privacyFeatures: Record<string, PrivacyFeatureConfig> = {
  dataAccess: {
    enabled: true,
    applicableRegions: [PrivacyRegion.EU, PrivacyRegion.CALIFORNIA, PrivacyRegion.GLOBAL],
  },
  dataDeletion: {
    enabled: true,
    applicableRegions: [PrivacyRegion.EU, PrivacyRegion.CALIFORNIA, PrivacyRegion.GLOBAL],
  },
  dataPortability: {
    enabled: true,
    applicableRegions: [PrivacyRegion.EU, PrivacyRegion.GLOBAL],
  },
  processingRestriction: {
    enabled: true,
    applicableRegions: [PrivacyRegion.EU, PrivacyRegion.GLOBAL],
  },
  marketingOptOut: {
    enabled: true,
    requiredConsent: [ConsentType.MARKETING],
    applicableRegions: [
      PrivacyRegion.EU,
      PrivacyRegion.CALIFORNIA,
      PrivacyRegion.US,
      PrivacyRegion.GLOBAL,
    ],
  },
  dataAnalytics: {
    enabled: true,
    requiredConsent: [ConsentType.ANALYTICS],
    applicableRegions: [
      PrivacyRegion.EU,
      PrivacyRegion.CALIFORNIA,
      PrivacyRegion.US,
      PrivacyRegion.GLOBAL,
    ],
  },
  thirdPartySharing: {
    enabled: true,
    requiredConsent: [ConsentType.THIRD_PARTY],
    applicableRegions: [
      PrivacyRegion.EU,
      PrivacyRegion.CALIFORNIA,
      PrivacyRegion.US,
      PrivacyRegion.GLOBAL,
    ],
  },
  profiling: {
    enabled: true,
    requiredConsent: [ConsentType.PROFILING],
    applicableRegions: [PrivacyRegion.EU, PrivacyRegion.GLOBAL],
  },
};

/**
 * Configuration for consent collection
 */
export const consentConfig = {
  // Default expiration time for consent in days
  defaultExpirationDays: 365,

  // Whether to require explicit consent for all data processing
  requireExplicitConsent: true,

  // Whether to refresh consent on policy updates
  refreshConsentOnPolicyUpdate: true,

  // Whether to store consent records in the database
  storeConsentRecords: true,

  // Current version of the privacy policy
  currentPrivacyPolicyVersion: '1.0.0',

  // Current version of the terms of service
  currentTermsOfServiceVersion: '1.0.0',
};

/**
 * Configuration for data retention
 */
export const dataRetentionConfig = {
  // Default retention period for user data in days
  defaultRetentionDays: 730, // 2 years

  // Retention periods for specific data types in days
  retentionPeriods: {
    accountData: 730, // 2 years
    activityLogs: 90, // 3 months
    analyticsData: 365, // 1 year
    marketingData: 365, // 1 year
    paymentData: 2555, // 7 years (financial records)
  },

  // Whether to anonymize data after retention period
  anonymizeAfterRetention: true,
};

/**
 * Configuration for privacy request handling
 */
export const privacyRequestConfig = {
  // Maximum time to process requests in days
  maxProcessingDays: {
    [PrivacyRequestType.ACCESS]: 30,
    [PrivacyRequestType.DELETION]: 30,
    [PrivacyRequestType.PORTABILITY]: 30,
    [PrivacyRequestType.RESTRICTION]: 15,
    [PrivacyRequestType.OBJECTION]: 15,
  },

  // Whether to require verification for requests
  requireVerification: true,

  // Methods for request verification
  verificationMethods: ['email', 'password', 'code'],

  // Whether to notify users of request status changes
  notifyStatusChanges: true,
};

/**
 * Default privacy settings for new users
 */
export const defaultPrivacySettings = {
  marketingCommunications: false,
  dataAnalytics: true,
  thirdPartySharing: false,
  profiling: false,
};

/**
 * Map of regions to applicable regulations
 */
export const regionToRegulation: Record<PrivacyRegion, PrivacyRegulation> = {
  [PrivacyRegion.EU]: PrivacyRegulation.GDPR,
  [PrivacyRegion.CALIFORNIA]: PrivacyRegulation.CCPA,
  [PrivacyRegion.US]: PrivacyRegulation.CCPA,
  [PrivacyRegion.GLOBAL]: PrivacyRegulation.GLOBAL,
};

/**
 * Get applicable regulations based on user's region
 * @param region The user's region
 * @returns Array of applicable regulations
 */
export function getApplicableRegulations(region: PrivacyRegion): PrivacyRegulation[] {
  const regulation = regionToRegulation[region];
  return regulation === PrivacyRegulation.GLOBAL
    ? [PrivacyRegulation.GDPR, PrivacyRegulation.CCPA]
    : [regulation];
}

/**
 * Check if a feature is enabled for a specific region
 * @param featureName The name of the feature to check
 * @param region The region to check for
 * @returns Whether the feature is enabled for the region
 */
export function isFeatureEnabledForRegion(featureName: string, region: PrivacyRegion): boolean {
  const feature = privacyFeatures[featureName];
  if (!feature || !feature.enabled) {
    return false;
  }

  return (
    feature.applicableRegions.includes(region) ||
    feature.applicableRegions.includes(PrivacyRegion.GLOBAL)
  );
}

/**
 * Get required consent types for a feature
 * @param featureName The name of the feature
 * @returns Array of required consent types, or empty array if none required
 */
export function getRequiredConsentForFeature(featureName: string): ConsentType[] {
  const feature = privacyFeatures[featureName];
  return feature?.requiredConsent || [];
}

export default {
  PrivacyRegulation,
  PrivacyRegion,
  ConsentType,
  ConsentMethod,
  PrivacyRequestType,
  PrivacyRequestStatus,
  privacyFeatures,
  consentConfig,
  dataRetentionConfig,
  privacyRequestConfig,
  defaultPrivacySettings,
  regionToRegulation,
  getApplicableRegulations,
  isFeatureEnabledForRegion,
  getRequiredConsentForFeature,
};
