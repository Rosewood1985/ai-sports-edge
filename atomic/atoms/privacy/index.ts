/**
 * Privacy Components Index
 *
 * This file exports all privacy-related atomic components for easy importing.
 */

// Configuration
export * from './gdprConfig';

// Type Definitions
export * from './privacyTypes';

// Data Categories
export * from './dataCategories';

// Storage Utilities
export * from './storageUtils';

// Default exports
import gdprConfig from './gdprConfig';
import dataCategories from './dataCategories';
import storageUtils from './storageUtils';

export default {
  gdprConfig,
  dataCategories,
  storageUtils,
};
