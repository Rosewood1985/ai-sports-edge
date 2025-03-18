/**
 * Mock data service for development mode
 * This service provides mock data when Firebase is not available
 */

import { isDevMode } from '../config/firebase';
import { isFirebaseInitialized } from '../utils/environmentUtils';
import { 
  SubscriptionPlan, 
  Subscription, 
  PaymentMethod,
  SUBSCRIPTION_PLANS
} from './firebaseSubscriptionService';

/**
 * Check if we should use mock data
 * @param firestore Firestore instance
 * @returns Whether to use mock data
 */
export const shouldUseMockData = (firestore: any): boolean => {
  return isDevMode || !isFirebaseInitialized(firestore);
};

/**
 * Get a mock subscription
 * @returns Mock subscription
 */
export const getMockSubscription = (): Subscription => {
  return {
    id: 'mock-subscription-id',
    status: 'active',
    planId: 'premium-yearly',
    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    cancelAtPeriodEnd: false,
    trialEnd: null,
    defaultPaymentMethod: 'mock-payment-method',
    plan: SUBSCRIPTION_PLANS.find(p => p.id === 'premium-yearly'),
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000 // 60 days ago
  };
};

/**
 * Get mock payment methods
 * @returns Array of mock payment methods
 */
export const getMockPaymentMethods = (): PaymentMethod[] => {
  return [
    {
      id: 'pm_mock_visa',
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2030,
      isDefault: true
    },
    {
      id: 'pm_mock_mastercard',
      brand: 'mastercard',
      last4: '8888',
      expiryMonth: 10,
      expiryYear: 2028,
      isDefault: false
    }
  ];
};

/**
 * Mock a successful operation
 * @returns Promise that resolves to true
 */
export const mockSuccess = async (): Promise<boolean> => {
  // Add a small delay to simulate network request
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  return true;
};

/**
 * Log mock data usage
 * @param functionName Name of the function using mock data
 */
export const logMockDataUsage = (functionName: string): void => {
  console.log(`Development mode: Using mock data for ${functionName}`);
};

export default {
  shouldUseMockData,
  getMockSubscription,
  getMockPaymentMethods,
  mockSuccess,
  logMockDataUsage
};