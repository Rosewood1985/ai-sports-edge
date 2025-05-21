/**
 * Data Categories
 *
 * This file defines the different categories of personal data collected by the application,
 * along with their retention periods, legal basis for processing, and other metadata.
 */

/**
 * Represents a data category for privacy purposes
 */
export interface DataCategoryDefinition {
  id: string;
  name: string;
  description: string;
  examples: string[];
  retention: number; // Retention period in days
  legalBasis: LegalBasisType;
  sensitive: boolean;
  required: boolean;
  purposes: DataPurposeType[];
  canDelete?: boolean; // Whether the data can be deleted or must be anonymized
}

/**
 * Legal basis for processing personal data
 */
export enum LegalBasisType {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legalObligation',
  VITAL_INTERESTS = 'vitalInterests',
  PUBLIC_TASK = 'publicTask',
  LEGITIMATE_INTERESTS = 'legitimateInterests',
}

/**
 * Purposes for processing personal data
 */
export enum DataPurposeType {
  ACCOUNT_MANAGEMENT = 'accountManagement',
  SERVICE_PROVISION = 'serviceProvision',
  COMMUNICATION = 'communication',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  PERSONALIZATION = 'personalization',
  SECURITY = 'security',
  LEGAL_COMPLIANCE = 'legalCompliance',
  THIRD_PARTY_SHARING = 'thirdPartySharing',
  PROFILING = 'profiling',
}

/**
 * Data categories collected by the application
 */
export const dataCategories: Record<string, DataCategoryDefinition> = {
  accountData: {
    id: 'accountData',
    name: 'Account Data',
    description: 'Information required to create and manage your account',
    examples: ['Email address', 'Username', 'Password (hashed)', 'Account creation date'],
    retention: 730, // 2 years
    legalBasis: LegalBasisType.CONTRACT,
    sensitive: false,
    required: true,
    purposes: [
      DataPurposeType.ACCOUNT_MANAGEMENT,
      DataPurposeType.SERVICE_PROVISION,
      DataPurposeType.SECURITY,
    ],
    canDelete: false, // Account data must be anonymized, not deleted
  },

  profileData: {
    id: 'profileData',
    name: 'Profile Data',
    description: 'Information you provide to personalize your profile',
    examples: ['Display name', 'Profile picture', 'Bio', 'Preferences'],
    retention: 730, // 2 years
    legalBasis: LegalBasisType.CONSENT,
    sensitive: false,
    required: false,
    purposes: [DataPurposeType.PERSONALIZATION, DataPurposeType.SERVICE_PROVISION],
    canDelete: true, // Profile data can be deleted
  },

  contactData: {
    id: 'contactData',
    name: 'Contact Data',
    description: 'Information used to contact you',
    examples: ['Email address', 'Phone number', 'Mailing address'],
    retention: 730, // 2 years
    legalBasis: LegalBasisType.CONSENT,
    sensitive: false,
    required: false,
    purposes: [DataPurposeType.COMMUNICATION, DataPurposeType.MARKETING],
    canDelete: true, // Contact data can be deleted
  },

  paymentData: {
    id: 'paymentData',
    name: 'Payment Data',
    description: 'Information related to payments and subscriptions',
    examples: ['Subscription status', 'Payment history', 'Billing address'],
    retention: 2555, // 7 years (financial records)
    legalBasis: LegalBasisType.CONTRACT,
    sensitive: true,
    required: false,
    purposes: [DataPurposeType.SERVICE_PROVISION, DataPurposeType.LEGAL_COMPLIANCE],
    canDelete: false, // Payment data must be retained for legal compliance
  },

  usageData: {
    id: 'usageData',
    name: 'Usage Data',
    description: 'Information about how you use the application',
    examples: ['Features used', 'Time spent', 'Actions taken', 'Content viewed'],
    retention: 365, // 1 year
    legalBasis: LegalBasisType.LEGITIMATE_INTERESTS,
    sensitive: false,
    required: false,
    purposes: [
      DataPurposeType.ANALYTICS,
      DataPurposeType.PERSONALIZATION,
      DataPurposeType.SERVICE_PROVISION,
    ],
    canDelete: true, // Usage data can be deleted
  },

  deviceData: {
    id: 'deviceData',
    name: 'Device Data',
    description: 'Information about the devices you use to access the application',
    examples: ['Device type', 'Operating system', 'Browser', 'IP address'],
    retention: 365, // 1 year
    legalBasis: LegalBasisType.LEGITIMATE_INTERESTS,
    sensitive: false,
    required: false,
    purposes: [DataPurposeType.SECURITY, DataPurposeType.ANALYTICS],
    canDelete: true, // Device data can be deleted
  },

  locationData: {
    id: 'locationData',
    name: 'Location Data',
    description: 'Information about your geographic location',
    examples: ['Country', 'Region', 'City', 'GPS coordinates'],
    retention: 90, // 3 months
    legalBasis: LegalBasisType.CONSENT,
    sensitive: true,
    required: false,
    purposes: [DataPurposeType.PERSONALIZATION, DataPurposeType.ANALYTICS],
    canDelete: true, // Location data can be deleted
  },

  communicationData: {
    id: 'communicationData',
    name: 'Communication Data',
    description: 'Records of communications between you and the application',
    examples: ['Support tickets', 'Chat logs', 'Emails'],
    retention: 365, // 1 year
    legalBasis: LegalBasisType.LEGITIMATE_INTERESTS,
    sensitive: false,
    required: false,
    purposes: [
      DataPurposeType.COMMUNICATION,
      DataPurposeType.SERVICE_PROVISION,
      DataPurposeType.SECURITY,
    ],
    canDelete: true, // Communication data can be deleted
  },

  marketingData: {
    id: 'marketingData',
    name: 'Marketing Data',
    description: 'Information used for marketing purposes',
    examples: ['Marketing preferences', 'Campaign interactions', 'Referral source'],
    retention: 365, // 1 year
    legalBasis: LegalBasisType.CONSENT,
    sensitive: false,
    required: false,
    purposes: [DataPurposeType.MARKETING, DataPurposeType.ANALYTICS],
    canDelete: true, // Marketing data can be deleted
  },

  thirdPartyData: {
    id: 'thirdPartyData',
    name: 'Third-Party Data',
    description: 'Information received from third parties',
    examples: ['Social media profiles', 'Partner data', 'Public records'],
    retention: 365, // 1 year
    legalBasis: LegalBasisType.CONSENT,
    sensitive: false,
    required: false,
    purposes: [DataPurposeType.PERSONALIZATION, DataPurposeType.THIRD_PARTY_SHARING],
    canDelete: true, // Third-party data can be deleted
  },
};

/**
 * Map of database fields to data categories
 */
export const fieldToCategory: Record<string, string> = {
  // User collection
  'users.email': 'accountData',
  'users.displayName': 'profileData',
  'users.photoURL': 'profileData',
  'users.createdAt': 'accountData',
  'users.lastLoginAt': 'accountData',
  'users.phoneNumber': 'contactData',
  'users.address': 'contactData',
  'users.preferences': 'profileData',
  'users.deviceInfo': 'deviceData',
  'users.location': 'locationData',

  // Subscription collection
  'subscriptions.userId': 'accountData',
  'subscriptions.plan': 'paymentData',
  'subscriptions.status': 'paymentData',
  'subscriptions.startDate': 'paymentData',
  'subscriptions.endDate': 'paymentData',
  'subscriptions.paymentMethod': 'paymentData',
  'subscriptions.billingAddress': 'paymentData',

  // Activity collection
  'activity.userId': 'accountData',
  'activity.action': 'usageData',
  'activity.timestamp': 'usageData',
  'activity.details': 'usageData',
  'activity.deviceInfo': 'deviceData',
  'activity.location': 'locationData',

  // Support collection
  'support.userId': 'accountData',
  'support.subject': 'communicationData',
  'support.message': 'communicationData',
  'support.timestamp': 'communicationData',
  'support.status': 'communicationData',

  // Marketing collection
  'marketing.userId': 'accountData',
  'marketing.preferences': 'marketingData',
  'marketing.campaigns': 'marketingData',
  'marketing.interactions': 'marketingData',
  'marketing.source': 'marketingData',
};

/**
 * Get all data categories
 * @returns Array of data categories
 */
export function getAllDataCategories(): DataCategoryDefinition[] {
  return Object.values(dataCategories);
}

/**
 * Get a data category by ID
 * @param categoryId The ID of the category to get
 * @returns The data category, or undefined if not found
 */
export function getDataCategory(categoryId: string): DataCategoryDefinition | undefined {
  return dataCategories[categoryId];
}

/**
 * Get data categories by purpose
 * @param purpose The purpose to filter by
 * @returns Array of data categories with the specified purpose
 */
export function getDataCategoriesByPurpose(purpose: DataPurposeType): DataCategoryDefinition[] {
  return Object.values(dataCategories).filter(category => category.purposes.includes(purpose));
}

/**
 * Get data categories by legal basis
 * @param legalBasis The legal basis to filter by
 * @returns Array of data categories with the specified legal basis
 */
export function getDataCategoriesByLegalBasis(
  legalBasis: LegalBasisType
): DataCategoryDefinition[] {
  return Object.values(dataCategories).filter(category => category.legalBasis === legalBasis);
}

/**
 * Get the data category for a database field
 * @param fieldPath The path to the field in the database
 * @returns The data category ID, or undefined if not mapped
 */
export function getCategoryForField(fieldPath: string): string | undefined {
  return fieldToCategory[fieldPath];
}

/**
 * Get all fields for a data category
 * @param categoryId The ID of the category to get fields for
 * @returns Array of field paths in the database
 */
export function getFieldsForCategory(categoryId: string): string[] {
  return Object.entries(fieldToCategory)
    .filter(([_, category]) => category === categoryId)
    .map(([field, _]) => field);
}

export default {
  dataCategories,
  fieldToCategory,
  getAllDataCategories,
  getDataCategory,
  getDataCategoriesByPurpose,
  getDataCategoriesByLegalBasis,
  getCategoryForField,
  getFieldsForCategory,
};
