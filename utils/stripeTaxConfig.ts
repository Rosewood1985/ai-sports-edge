/**
 * Stripe Tax Configuration Utility
 */

import * as fs from 'fs';
import * as path from 'path';

import logger from './logger';

// Configuration interface
export interface StripeTaxConfig {
  enabled: boolean;
  mode: 'automatic' | 'manual' | 'custom';
  defaultTaxCodes: Record<string, string>;
  taxCalculation: {
    cacheEnabled: boolean;
    cacheTTL: number;
    defaultTaxBehavior: string;
  };
  taxReporting: {
    enabled: boolean;
    automaticReporting: boolean;
    reportingFrequency: string;
    reportingDay: number;
    recipients: string[];
  };
  taxExemptions: {
    enabled: boolean;
    requireCertificate: boolean;
    certificateStorage: string;
  };
  registrations: {
    country: string;
    state?: string;
    type: string;
    registrationId: string;
  }[];
  thresholds: {
    country: string;
    threshold: number;
    currency: string;
    period: string;
  }[];
}

// Default configuration
const defaultConfig: StripeTaxConfig = {
  enabled: false,
  mode: 'automatic',
  defaultTaxCodes: {
    subscription: 'txcd_10103001',
    oneTimePurchase: 'txcd_10103001',
    inAppPurchase: 'txcd_10103001',
    premiumFeature: 'txcd_10103001',
    groupSubscription: 'txcd_10103001',
  },
  taxCalculation: {
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    defaultTaxBehavior: 'exclusive',
  },
  taxReporting: {
    enabled: true,
    automaticReporting: true,
    reportingFrequency: 'monthly',
    reportingDay: 5,
    recipients: [],
  },
  taxExemptions: {
    enabled: true,
    requireCertificate: true,
    certificateStorage: 'firebase',
  },
  registrations: [],
  thresholds: [],
};

// Load configuration
let config: StripeTaxConfig;

try {
  const configPath = path.join(process.cwd(), 'config', 'stripe-tax.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = { ...defaultConfig, ...JSON.parse(configData) };
  logger.info('Stripe Tax configuration loaded successfully');
} catch (error) {
  logger.warn('Failed to load Stripe Tax configuration, using defaults', {
    error: error instanceof Error ? error.message : String(error),
  });
  config = defaultConfig;
}

/**
 * Get the Stripe Tax configuration
 */
export function getConfig(): StripeTaxConfig {
  return config;
}

/**
 * Check if Stripe Tax is enabled
 */
export function isEnabled(): boolean {
  return config.enabled;
}

/**
 * Get the tax code for a specific product type
 */
export function getTaxCode(productType: string): string {
  return config.defaultTaxCodes[productType] || config.defaultTaxCodes.oneTimePurchase;
}

/**
 * Get the default tax behavior
 */
export function getDefaultTaxBehavior(): string {
  return config.taxCalculation.defaultTaxBehavior;
}

/**
 * Get the tax registrations for a country
 */
export function getRegistrationsForCountry(country: string): {
  country: string;
  state?: string;
  type: string;
  registrationId: string;
}[] {
  return config.registrations.filter(reg => reg.country === country);
}

export default {
  getConfig,
  isEnabled,
  getTaxCode,
  getDefaultTaxBehavior,
  getRegistrationsForCountry,
};
