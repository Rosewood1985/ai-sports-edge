import { CardFieldInput } from '@stripe/stripe-react-native';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { auth } from '../config/firebase';
import { isFirebaseInitialized } from '../utils/environmentUtils';

// Initialize Firestore and Functions
const firestore = getFirestore();
const functions = getFunctions();

// Mock implementation of trackEvent for compatibility
// This should be replaced with a proper import once analyticsService is implemented
const trackEvent = async (eventName: string, eventParams?: any): Promise<void> => {
  if (ENV_CONFIG.IS_PRODUCTION) {
    // In production, this would call the actual analytics service
    console.log(`[Analytics] Event tracked: ${eventName}`);
  } else {
    // In development, just log the event
    console.log(`[Analytics] Event tracked: ${eventName}`, eventParams || '');
  }
  return Promise.resolve();
};

// Environment configuration
const ENV_CONFIG = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_DEV: process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production',
  STRIPE_API_VERSION: '2020-08-27',
};

// Safe logging function
const safeLog = (level: 'log' | 'warn' | 'error', message: string, data?: any) => {
  // In production, don't log detailed errors or sensitive information
  if (ENV_CONFIG.IS_PRODUCTION) {
    if (level === 'error') {
      console.error(`[SubscriptionService] ${message}`);
    } else if (level === 'warn') {
      console.warn(`[SubscriptionService] ${message}`);
    } else {
      console.log(`[SubscriptionService] ${message}`);
    }
    return;
  }

  // In development, log more details
  if (level === 'error') {
    console.error(`[SubscriptionService] ${message}`, data || '');
  } else if (level === 'warn') {
    console.warn(`[SubscriptionService] ${message}`, data || '');
  } else {
    console.log(`[SubscriptionService] ${message}`, data || '');
  }
};

// Input validation functions
const validateUserId = (userId: string): boolean => {
  return typeof userId === 'string' && userId.trim().length > 0;
};

const validatePlanId = (planId: string): boolean => {
  return typeof planId === 'string' && planId.trim().length > 0;
};

const validatePaymentMethodId = (paymentMethodId: string): boolean => {
  return typeof paymentMethodId === 'string' && paymentMethodId.trim().length > 0;
};

// Product types
export type ProductType = 'subscription' | 'one_time_purchase' | 'microtransaction';

// Subscription plan types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  // For backward compatibility with existing screens
  amount?: number;
  productType: ProductType;
  priceId?: string; // Stripe price ID
}

// One-time purchase types
export interface OneTimePurchase {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number; // Duration in hours (for weekend pass, etc.)
  features: string[];
  amount?: number; // For backward compatibility (in cents)
  productType: ProductType;
  priceId?: string; // Stripe price ID
}

// Microtransaction types
export interface Microtransaction {
  id: string;
  name: string;
  description: string;
  price: number;
  amount?: number; // For backward compatibility (in cents)
  productType: ProductType;
  priceId?: string; // Stripe price ID
}

// Payment method type
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

// Subscription type
export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  planId: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd: number | null;
  defaultPaymentMethod: string | null;
  autoResubscribe?: boolean;
  // For backward compatibility with existing screens
  plan?: SubscriptionPlan;
  createdAt?: number;
}

// Subscription status types
export interface SubscriptionStatus {
  active: boolean;
  planId: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: number | null;
}

// Available subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic',
    description: 'Essential features for casual bettors',
    price: 4.99,
    amount: 499, // For backward compatibility (in cents)
    interval: 'month',
    productType: 'subscription',
    priceId: 'price_basic_monthly', // Replace with actual Stripe price ID
    features: ['AI-powered betting predictions', 'Real-time odds updates', 'Basic analytics'],
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    description: 'Advanced features for serious bettors',
    price: 9.99,
    amount: 999, // For backward compatibility (in cents)
    interval: 'month',
    productType: 'subscription',
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    popular: true,
    features: [
      'All Basic features',
      'Advanced analytics and insights',
      'Personalized betting recommendations',
      'Historical performance tracking',
      'Email and push notifications',
    ],
  },
  {
    id: 'premium-yearly',
    name: 'Premium Annual',
    description: 'Our best value plan',
    price: 99.99,
    amount: 9999, // For backward compatibility (in cents)
    interval: 'year',
    productType: 'subscription',
    priceId: 'price_premium_yearly', // Replace with actual Stripe price ID
    features: [
      'All Premium features',
      '2 months free compared to monthly',
      'Early access to new features',
      'Priority support',
      'Exclusive access to Formula 1 data and predictions',
      'Exclusive access to NASCAR data and predictions',
      'Exclusive access to Rugby data and predictions',
      'Exclusive access to Cricket data and predictions',
    ],
  },
  {
    id: 'group-pro-monthly',
    name: 'Group Pro',
    description:
      'Share premium features with friends or family. All members must register within 24 hours for the deal to activate.',
    price: 149.99,
    amount: 14999, // For backward compatibility (in cents)
    interval: 'month',
    productType: 'subscription',
    priceId: 'price_group_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'All Premium features for up to 3 users',
      'Each user gets full access to premium features',
      'Split the cost between up to 3 people',
      'All members must register within 24 hours',
      'Manage members from your account',
      'Perfect for friends, family, or small groups',
    ],
  },
];

// One-time purchase options
export const ONE_TIME_PURCHASES: OneTimePurchase[] = [
  {
    id: 'weekend-pass',
    name: 'Weekend Pass',
    description: 'Full premium access for 48 hours',
    price: 4.99,
    amount: 499,
    duration: 48, // 48 hours
    productType: 'one_time_purchase',
    priceId: 'price_weekend_pass', // Replace with actual Stripe price ID
    features: [
      'All premium features for 48 hours',
      'AI predictions for all games',
      'Real-time updates and alerts',
    ],
  },
  {
    id: 'game-day-pass',
    name: 'Game Day Pass',
    description: 'Premium access for 24 hours',
    price: 2.99,
    amount: 299,
    duration: 24, // 24 hours
    productType: 'one_time_purchase',
    priceId: 'price_game_day_pass', // Replace with actual Stripe price ID
    features: [
      'All premium features for 24 hours',
      'AI predictions for all games',
      'Real-time updates and alerts',
    ],
  },
];

// Microtransaction options
export const MICROTRANSACTIONS: Microtransaction[] = [
  {
    id: 'single-prediction',
    name: 'Single AI Prediction',
    description: 'One-time AI prediction for a specific game',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction',
    priceId: 'price_single_prediction', // Replace with actual Stripe price ID
  },
  {
    id: 'parlay-suggestion',
    name: 'AI Parlay Suggestion',
    description: 'AI-generated parlay based on real-time trends',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction',
    priceId: 'price_parlay_suggestion', // Replace with actual Stripe price ID
  },
  {
    id: 'parlay-package',
    name: 'Parlay Package (3)',
    description: '3 AI-generated parlays with different risk levels',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction',
    priceId: 'price_parlay_package', // Replace with actual Stripe price ID
  },
  {
    id: 'alert-package-small',
    name: 'Alert Package (5)',
    description: '5 real-time betting opportunity alerts',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction',
    priceId: 'price_alert_package_small', // Replace with actual Stripe price ID
  },
  {
    id: 'alert-package-large',
    name: 'Alert Package (15)',
    description: '15 real-time betting opportunity alerts',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction',
    priceId: 'price_alert_package_large', // Replace with actual Stripe price ID
  },
  {
    id: 'player-plus-minus',
    name: 'Single Game +/- Data',
    description: 'Access to player plus-minus tracking for a specific game',
    price: 1.99,
    amount: 199,
    productType: 'microtransaction',
    priceId: 'price_player_plus_minus', // Replace with actual Stripe price ID
  },
  // Formula 1 microtransactions
  {
    id: 'formula1-race-prediction',
    name: 'Formula 1 Race Prediction',
    description: 'AI-powered prediction for a specific Formula 1 race',
    price: 3.99,
    amount: 399,
    productType: 'microtransaction',
    priceId: 'price_formula1_race_prediction',
  },
  {
    id: 'formula1-driver-stats',
    name: 'Formula 1 Driver Stats Package',
    description: 'Detailed performance analytics for all F1 drivers',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction',
    priceId: 'price_formula1_driver_stats',
  },
  // NASCAR microtransactions
  {
    id: 'nascar-race-prediction',
    name: 'NASCAR Race Prediction',
    description: 'AI-powered prediction for a specific NASCAR race',
    price: 3.99,
    amount: 399,
    productType: 'microtransaction',
    priceId: 'price_nascar_race_prediction',
  },
  {
    id: 'nascar-driver-stats',
    name: 'NASCAR Driver Stats Package',
    description: 'Detailed performance analytics for all NASCAR drivers',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction',
    priceId: 'price_nascar_driver_stats',
  },
  // Rugby microtransactions
  {
    id: 'rugby-match-prediction',
    name: 'Rugby Match Prediction',
    description: 'AI-powered prediction for a specific Rugby match',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction',
    priceId: 'price_rugby_match_prediction',
  },
  {
    id: 'rugby-team-analysis',
    name: 'Rugby Team Analysis',
    description: "In-depth analysis of a Rugby team's performance and strategy",
    price: 3.99,
    amount: 399,
    productType: 'microtransaction',
    priceId: 'price_rugby_team_analysis',
  },
  // Cricket microtransactions
  {
    id: 'cricket-match-prediction',
    name: 'Cricket Match Prediction',
    description: 'AI-powered prediction for a specific Cricket match',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction',
    priceId: 'price_cricket_match_prediction',
  },
  {
    id: 'cricket-player-stats',
    name: 'Cricket Player Stats Package',
    description: 'Detailed performance analytics for Cricket players',
    price: 3.99,
    amount: 399,
    productType: 'microtransaction',
    priceId: 'price_cricket_player_stats',
  },
];

// All available products
export const ALL_PRODUCTS = [...SUBSCRIPTION_PLANS, ...ONE_TIME_PURCHASES, ...MICROTRANSACTIONS];

/**
 * Check if a user has premium access
 * @param userId User ID
 * @returns Whether the user has premium access
 */
export const hasPremiumAccess = async (userId: string): Promise<boolean> => {
  try {
    // Validate input
    if (!validateUserId(userId)) {
      safeLog('warn', 'Invalid user ID provided for premium access check');
      return false;
    }

    // In development/test mode or if Firebase is not initialized, return simulated access
    if (ENV_CONFIG.IS_DEV || !isFirebaseInitialized(firestore)) {
      safeLog('log', 'Development mode: Simulating premium access');
      return true;
    }

    // Check for active subscription
    const subscription = await getUserSubscription(userId);
    if (subscription && subscription.status === 'active') {
      return true;
    }

    // Check for active one-time purchases
    const db = firestore;
    if (!db) return false;

    const now = new Date();

    try {
      // @ts-ignore - Firestore types may not be correctly defined
      const purchasesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('purchases')
        .where('status', '==', 'succeeded')
        .where('expiresAt', '>', now)
        .limit(1)
        .get();

      return !purchasesSnapshot.empty;
    } catch (dbError) {
      safeLog(
        'error',
        `Database error checking purchases for user ${userId}`,
        ENV_CONFIG.IS_PRODUCTION ? null : dbError
      );
      return false;
    }
  } catch (error) {
    safeLog('error', 'Error checking premium access', ENV_CONFIG.IS_PRODUCTION ? null : error);
    return false;
  }
};

/**
 * Get the current subscription status for a user
 * @param userId User ID
 * @returns Subscription status
 */
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  try {
    const db = firestore;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data()?.subscriptionId) {
      return null;
    }

    const subscriptionId = userDoc.data()?.subscriptionId;
    const subscriptionDoc = await db
      .collection('users')
      .doc(userId)
      .collection('subscriptions')
      .doc(subscriptionId)
      .get();

    if (!subscriptionDoc.exists) {
      return null;
    }

    const data = subscriptionDoc.data();

    return {
      active: data?.status === 'active' || data?.status === 'trialing',
      planId: data?.priceId || null,
      currentPeriodEnd: data?.currentPeriodEnd?.toMillis() || null,
      cancelAtPeriodEnd: data?.cancelAtPeriodEnd || false,
      trialEnd: data?.trialEnd?.toMillis() || null,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};

/**
 * Subscribe a user to a plan
 * @param userId User ID
 * @param planId Plan ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export const subscribeToPlan = async (
  userId: string,
  planId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Find the plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || !plan.priceId) {
      throw new Error(`Plan with ID ${planId} not found or missing priceId`);
    }

    // Call the Firebase function to create a subscription
    const createSubscriptionFunc = functions.httpsCallable('createSubscription');
    const result = await createSubscriptionFunc({
      userId,
      paymentMethodId,
      priceId: plan.priceId,
    });

    return result.data.status === 'active' || result.data.status === 'trialing';
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    return false;
  }
};

/**
 * Cancel a subscription
 * @param userId User ID
 * @param immediate Whether to cancel immediately
 * @returns Success status
 */
export const cancelSubscription = async (
  userId: string,
  immediate: boolean = false
): Promise<boolean> => {
  try {
    // Get the user's subscription ID
    const db = firestore;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data()?.subscriptionId) {
      throw new Error('User does not have an active subscription');
    }

    const subscriptionId = userDoc.data()?.subscriptionId;

    // Call the Firebase function to cancel the subscription
    const cancelSubscriptionFunc = functions.httpsCallable('cancelSubscription');
    const result = await cancelSubscriptionFunc({
      userId,
      subscriptionId,
      immediate,
    });

    return result.data.canceled === true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
};

/**
 * Get a subscription plan by ID
 * @param planId Plan ID
 * @returns Subscription plan
 */
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

/**
 * Start a free trial
 * @param userId User ID
 * @param planId Plan ID
 * @param paymentMethodId Payment method ID
 * @param trialDays Number of trial days
 * @returns Success status
 */
export const startFreeTrial = async (
  userId: string,
  planId: string,
  paymentMethodId: string,
  trialDays: number = 7
): Promise<boolean> => {
  try {
    // Find the plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || !plan.priceId) {
      throw new Error(`Plan with ID ${planId} not found or missing priceId`);
    }

    // In a real implementation, you would create a subscription with a trial period
    // For now, we'll just create a regular subscription
    return subscribeToPlan(userId, planId, paymentMethodId);
  } catch (error) {
    console.error('Error starting free trial:', error);
    return false;
  }
};

/**
 * Get user subscription details
 * @param userId User ID
 * @returns User subscription details
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    // Validate input
    if (!validateUserId(userId)) {
      safeLog('warn', 'Invalid user ID provided for subscription check');
      return null;
    }

    // In development mode or if Firebase is not initialized, return mock subscription
    if (ENV_CONFIG.IS_DEV || !isFirebaseInitialized(firestore)) {
      safeLog('log', 'Development mode: Returning mock subscription');
      // Return a mock premium subscription
      return {
        id: 'mock-subscription-id',
        status: 'active',
        planId: 'premium-yearly',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        cancelAtPeriodEnd: false,
        trialEnd: null,
        defaultPaymentMethod: 'mock-payment-method',
        plan: SUBSCRIPTION_PLANS.find(p => p.id === 'premium-yearly'),
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
      };
    }

    const db = firestore;
    if (!db) return null;

    try {
      // @ts-ignore - Firestore types may not be correctly defined
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists || !userDoc.data()?.subscriptionId) {
        return null;
      }

      const subscriptionId = userDoc.data()?.subscriptionId;

      // @ts-ignore - Firestore types may not be correctly defined
      const subscriptionDoc = await db
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc(subscriptionId)
        .get();

      if (!subscriptionDoc.exists) {
        return null;
      }

      const data = subscriptionDoc.data();
      const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === data?.priceId);

      return {
        id: subscriptionId,
        status: data?.status as 'active' | 'canceled' | 'past_due' | 'trialing',
        planId: data?.priceId || '',
        currentPeriodEnd: data?.currentPeriodEnd?.toMillis() || Date.now(),
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd || false,
        trialEnd: data?.trialEnd?.toMillis() || null,
        defaultPaymentMethod: data?.defaultPaymentMethod || null,
        plan,
        createdAt: data?.createdAt?.toMillis() || Date.now(),
      };
    } catch (dbError) {
      safeLog(
        'error',
        `Database error getting subscription for user ${userId}`,
        ENV_CONFIG.IS_PRODUCTION ? null : dbError
      );
      return null;
    }
  } catch (error) {
    safeLog('error', 'Error getting user subscription', ENV_CONFIG.IS_PRODUCTION ? null : error);
    return null;
  }
};

/**
 * Get user payment methods
 * @param userId User ID
 * @returns Array of payment methods
 */
export const getUserPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    const db = firestore;
    const paymentMethodsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('paymentMethods')
      .get();

    if (paymentMethodsSnapshot.empty) {
      return [];
    }

    return paymentMethodsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        brand: data.brand || 'unknown',
        last4: data.last4 || '0000',
        expiryMonth: data.expiryMonth || 0,
        expiryYear: data.expiryYear || 0,
        isDefault: data.isDefault || false,
      };
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
};

/**
 * Create a payment method from card details
 * @param cardDetails Card details from Stripe CardField
 * @returns Payment method ID
 */
export const createPaymentMethod = async (
  cardDetails: CardFieldInput.Details
): Promise<string | null> => {
  try {
    // This would typically be handled by the Stripe SDK
    // For this example, we'll just return a mock payment method ID
    return `pm_${Date.now()}`;
  } catch (error) {
    console.error('Error creating payment method:', error);
    return null;
  }
};

/**
 * Create a subscription for a user
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @param planId Plan ID
 * @returns Success status
 */
export const createSubscription = async (
  userId: string,
  paymentMethodId: string,
  planId: string
): Promise<boolean> => {
  // This is just a wrapper around subscribeToPlan for backward compatibility
  return subscribeToPlan(userId, planId, paymentMethodId);
};

/**
 * Purchase a one-time product
 * @param userId User ID
 * @param productId Product ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export const purchaseOneTimeProduct = async (
  userId: string,
  productId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = ONE_TIME_PURCHASES.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Call the Firebase function to create a one-time payment
    const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
    const result = await createOneTimePayment({
      userId,
      paymentMethodId,
      productId,
      amount: product.amount,
      duration: product.duration,
    });

    return result.data.status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing one-time product:', error);
    return false;
  }
};

/**
 * Purchase a microtransaction
 * @param userId User ID
 * @param productId Product ID
 * @param paymentMethodId Payment method ID
 * @param retryCount Optional retry count for handling network errors
 * @returns Object with success status and error details if applicable
 */
export const purchaseMicrotransaction = async (
  userId: string,
  productId: string,
  paymentMethodId: string,
  retryCount: number = 0
): Promise<{ success: boolean; error?: string; errorCode?: string; transactionId?: string }> => {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        errorCode: 'missing_user_id',
      };
    }

    if (!paymentMethodId) {
      return {
        success: false,
        error: 'Payment method ID is required',
        errorCode: 'missing_payment_method',
      };
    }

    // Find the product
    const product = MICROTRANSACTIONS.find(p => p.id === productId);
    if (!product) {
      return {
        success: false,
        error: `Product with ID ${productId} not found`,
        errorCode: 'product_not_found',
      };
    }

    // Generate idempotency key to prevent duplicate charges
    const idempotencyKey = `${userId}_${productId}_${Date.now()}`;

    // Call the Firebase function to create a one-time payment
    const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
    const result = await createOneTimePayment({
      userId,
      paymentMethodId,
      productId,
      amount: product.amount,
      idempotencyKey,
    });

    // Track successful transaction
    if (result.data.status === 'succeeded') {
      // Log successful purchase
      safeLog('log', `Successful microtransaction purchase: ${productId} for user ${userId}`);

      return {
        success: true,
        transactionId: result.data.transactionId,
      };
    } else {
      return {
        success: false,
        error: 'Payment processing failed',
        errorCode: 'payment_failed',
      };
    }
  } catch (error: any) {
    // Log detailed error
    safeLog(
      'error',
      `Error purchasing microtransaction: ${error.message || 'Unknown error'}`,
      error
    );

    // Handle network errors with retry
    if (error.code === 'network-error' && retryCount < 3) {
      // Exponential backoff: wait longer for each retry
      const waitTime = 1000 * Math.pow(2, retryCount);
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), waitTime);
      });

      // Retry the purchase
      return purchaseMicrotransaction(userId, productId, paymentMethodId, retryCount + 1);
    }

    // Return detailed error information
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      errorCode: error.code || 'unknown_error',
    };
  }
};

/**
 * Check if user has access to a specific game prediction
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasGamePredictionAccess = async (userId: string, gameId: string): Promise<boolean> => {
  try {
    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }

    // Check for specific game prediction purchases
    const db = firestore;
    const purchasesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('purchases')
      .where('productId', '==', 'single-prediction')
      .where('gameId', '==', gameId)
      .where('status', '==', 'succeeded')
      .limit(1)
      .get();

    return !purchasesSnapshot.empty;
  } catch (error) {
    console.error('Error checking game prediction access:', error);
    return false;
  }
};

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date?: Date | number): string => {
  if (!date) {
    return 'N/A';
  }

  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Update a payment method
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export const updatePaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Call the Firebase function to update the payment method
    const updatePaymentMethodFunc = functions.httpsCallable('updatePaymentMethod');
    const result = await updatePaymentMethodFunc({
      userId,
      paymentMethodId,
    });

    return result.data.updated === true;
  } catch (error) {
    console.error('Error updating payment method:', error);
    return false;
  }
};

/**
 * Update a subscription (upgrade/downgrade)
 * @param userId Firebase user ID
 * @param subscriptionId Subscription ID
 * @param newPriceId New price ID
 * @param immediate Whether to apply changes immediately
 * @returns Promise with update result
 */
export const updateSubscription = async (
  userId: string,
  subscriptionId: string,
  newPriceId: string,
  immediate: boolean = false
): Promise<any> => {
  try {
    const updateSubscriptionFunc = functions.httpsCallable('updateSubscription');
    const result = await updateSubscriptionFunc({
      userId,
      subscriptionId,
      newPriceId,
      immediate,
    });
    return result.data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * Pause a subscription
 * @param userId Firebase user ID
 * @param subscriptionId Subscription ID
 * @param pauseDuration Duration to pause in days (optional)
 * @returns Promise with pause result
 */
export const pauseSubscription = async (
  userId: string,
  subscriptionId: string,
  pauseDuration?: number
): Promise<any> => {
  try {
    const pauseSubscriptionFunc = functions.httpsCallable('pauseSubscription');
    const result = await pauseSubscriptionFunc({
      userId,
      subscriptionId,
      pauseDuration,
    });
    return result.data;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
};

/**
 * Resume a paused subscription
 * @param userId Firebase user ID
 * @param subscriptionId Subscription ID
 * @returns Promise with resume result
 */
export const resumeSubscription = async (userId: string, subscriptionId: string): Promise<any> => {
  try {
    const resumeSubscriptionFunc = functions.httpsCallable('resumeSubscription');
    const result = await resumeSubscriptionFunc({
      userId,
      subscriptionId,
    });
    return result.data;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
};

/**
 * Gift a subscription to another user
 * @param userId Firebase user ID of the gifter
 * @param recipientEmail Email of the recipient
 * @param priceId Stripe price ID
 * @param paymentMethodId Stripe payment method ID
 * @param giftDuration Duration of the gift in months
 * @returns Promise with gift details
 */
export const giftSubscription = async (
  userId: string,
  recipientEmail: string,
  priceId: string,
  paymentMethodId: string,
  giftDuration: number
): Promise<any> => {
  try {
    const giftSubscriptionFunc = functions.httpsCallable('giftSubscription');
    const result = await giftSubscriptionFunc({
      userId,
      recipientEmail,
      priceId,
      paymentMethodId,
      giftDuration,
    });
    return result.data;
  } catch (error) {
    console.error('Error gifting subscription:', error);
    throw error;
  }
};

/**
 * Toggle auto-resubscribe setting for a user's subscription
 * @param userId Firebase user ID
 * @param subscriptionId Subscription ID
 * @param enabled Whether to enable or disable auto-resubscribe
 * @returns Promise with toggle result
 */
export const toggleAutoResubscribe = async (
  userId: string,
  subscriptionId: string,
  enabled: boolean
): Promise<any> => {
  try {
    const toggleAutoResubscribeFunc = functions.httpsCallable('toggleAutoResubscribe');
    const result = await toggleAutoResubscribeFunc({
      userId,
      subscriptionId,
      enabled,
    });

    // Track the event
    await trackEvent(enabled ? 'auto_resubscribe_enabled' : 'auto_resubscribe_disabled', {
      subscriptionId,
    });

    return result.data;
  } catch (error) {
    console.error('Error toggling auto-resubscribe:', error);
    throw error;
  }
};

/**
 * Generate a referral code for a user
 * @param userId Firebase user ID
 * @returns Promise with referral code details
 */
export const generateReferralCode = async (userId: string): Promise<any> => {
  try {
    const generateReferralCodeFunc = functions.httpsCallable('generateReferralCode');
    const result = await generateReferralCodeFunc({
      userId,
    });

    // Track the event
    await trackEvent('referral_code_generated', {
      referralCode: result.data.referralCode,
    });

    return result.data;
  } catch (error) {
    console.error('Error generating referral code:', error);
    throw error;
  }
};

/**
 * Apply a referral code
 * @param userId Firebase user ID
 * @param referralCode Referral code to apply
 * @returns Promise with referral application result
 */
export const applyReferralCode = async (userId: string, referralCode: string): Promise<any> => {
  try {
    const applyReferralCodeFunc = functions.httpsCallable('applyReferralCode');
    const result = await applyReferralCodeFunc({
      newUserId: userId,
      referralCode,
    });

    // Track the event
    await trackEvent('referral_code_applied', {
      referralCode,
      referrerId: result.data.referrerId,
    });

    return result.data;
  } catch (error) {
    console.error('Error applying referral code:', error);
    throw error;
  }
};

/**
 * Redeem a gift subscription
 * @param userId Firebase user ID
 * @param giftCode Gift code to redeem
 * @returns Promise with redemption result
 */
export const redeemGiftSubscription = async (userId: string, giftCode: string): Promise<any> => {
  try {
    const redeemGiftSubscriptionFunc = functions.httpsCallable('redeemGiftSubscription');
    const result = await redeemGiftSubscriptionFunc({
      giftCode,
    });

    // Track the event
    await trackEvent('gift_subscription_redeemed', {
      giftCode,
    });

    return result.data;
  } catch (error) {
    console.error('Error redeeming gift subscription:', error);
    throw error;
  }
};

/**
 * Check if user has used their free daily pick
 * @param userId User ID
 * @returns Boolean indicating if the user has used their free daily pick
 */
export const hasUsedFreeDailyPick = async (userId: string): Promise<boolean> => {
  try {
    // Get user document
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();

    // Check if user has used their free daily pick today
    if (userData.lastFreeDailyPick) {
      const lastPickDate = userData.lastFreeDailyPick.toDate();
      const today = new Date();

      // Check if the last pick was today
      return (
        lastPickDate.getDate() === today.getDate() &&
        lastPickDate.getMonth() === today.getMonth() &&
        lastPickDate.getFullYear() === today.getFullYear()
      );
    }

    return false;
  } catch (error) {
    console.error('Error checking if user has used free daily pick:', error);
    return false;
  }
};

/**
 * Mark free daily pick as used
 * @param userId User ID
 * @param gameId Game ID
 * @returns Boolean indicating success
 */
export const markFreeDailyPickAsUsed = async (userId: string, gameId: string): Promise<boolean> => {
  try {
    // Get user document
    const userDocRef = doc(firestore, 'users', userId);

    // Update user document
    await updateDoc(userDocRef, {
      lastFreeDailyPick: serverTimestamp(),
      lastFreeDailyPickGameId: gameId,
    });

    // Track the event
    await trackEvent('free_daily_pick_used', {
      gameId,
    });

    return true;
  } catch (error) {
    console.error('Error marking free daily pick as used:', error);
    return false;
  }
};

export default {
  hasPremiumAccess,
  getSubscriptionStatus,
  subscribeToPlan,
  cancelSubscription,
  getPlanById,
  startFreeTrial,
  getUserSubscription,
  hasUsedFreeDailyPick,
  markFreeDailyPickAsUsed,
  getUserPaymentMethods,
  createPaymentMethod,
  createSubscription,
  formatDate,
  purchaseOneTimeProduct,
  purchaseMicrotransaction,
  hasGamePredictionAccess,
  updatePaymentMethod,
  updateSubscription,
  pauseSubscription,
  resumeSubscription,
  giftSubscription,
  redeemGiftSubscription,
  toggleAutoResubscribe,
  generateReferralCode,
  applyReferralCode,
  SUBSCRIPTION_PLANS,
  ONE_TIME_PURCHASES,
  MICROTRANSACTIONS,
  ALL_PRODUCTS,
};
