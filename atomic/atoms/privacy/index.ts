/**
 * Privacy Components Index
 *
 * This file exports all privacy-related atomic components for easy importing.
 */

// Configuration
// Default exports
import dataCategories from './dataCategories';
import gdprConfig from './gdprConfig';
import storageUtils from './storageUtils';

export * from './gdprConfig';

// Type Definitions
export * from './privacyTypes';

// Data Categories
export * from './dataCategories';

// Storage Utilities
export * from './storageUtils';

export default {
  gdprConfig,
  dataCategories,
  storageUtils,
};
