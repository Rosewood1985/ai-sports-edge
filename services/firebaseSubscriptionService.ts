import { auth, firestore, functions } from '../config/firebase';
import { CardFieldInput } from '@stripe/stripe-react-native';
import firebase from 'firebase/app';

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
    features: [
      'AI-powered betting predictions',
      'Real-time odds updates',
      'Basic analytics'
    ]
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
      'Email and push notifications'
    ]
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
      'Priority support'
    ]
  }
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
      'Real-time updates and alerts'
    ]
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
      'Real-time updates and alerts'
    ]
  }
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
    priceId: 'price_single_prediction' // Replace with actual Stripe price ID
  },
  {
    id: 'parlay-suggestion',
    name: 'AI Parlay Suggestion',
    description: 'AI-generated parlay based on real-time trends',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction',
    priceId: 'price_parlay_suggestion' // Replace with actual Stripe price ID
  },
  {
    id: 'parlay-package',
    name: 'Parlay Package (3)',
    description: '3 AI-generated parlays with different risk levels',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction',
    priceId: 'price_parlay_package' // Replace with actual Stripe price ID
  },
  {
    id: 'alert-package-small',
    name: 'Alert Package (5)',
    description: '5 real-time betting opportunity alerts',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction',
    priceId: 'price_alert_package_small' // Replace with actual Stripe price ID
  },
  {
    id: 'alert-package-large',
    name: 'Alert Package (15)',
    description: '15 real-time betting opportunity alerts',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction',
    priceId: 'price_alert_package_large' // Replace with actual Stripe price ID
  },
  {
    id: 'player-plus-minus',
    name: 'Single Game +/- Data',
    description: 'Access to player plus-minus tracking for a specific game',
    price: 1.99,
    amount: 199,
    productType: 'microtransaction',
    priceId: 'price_player_plus_minus' // Replace with actual Stripe price ID
  }
];

// All available products
export const ALL_PRODUCTS = [
  ...SUBSCRIPTION_PLANS,
  ...ONE_TIME_PURCHASES,
  ...MICROTRANSACTIONS
];

/**
 * Check if a user has premium access
 * @param userId User ID
 * @returns Whether the user has premium access
 */
export const hasPremiumAccess = async (userId: string): Promise<boolean> => {
  try {
    // Check for active subscription
    const subscription = await getUserSubscription(userId);
    if (subscription && subscription.status === 'active') {
      return true;
    }
    
    // Check for active one-time purchases
    const db = firestore;
    const now = new Date();
    
    const purchasesSnapshot = await db.collection('users').doc(userId)
      .collection('purchases')
      .where('status', '==', 'succeeded')
      .where('expiresAt', '>', now)
      .limit(1)
      .get();
    
    return !purchasesSnapshot.empty;
  } catch (error) {
    console.error('Error checking premium access:', error);
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
    const subscriptionDoc = await db.collection('users').doc(userId)
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
      trialEnd: data?.trialEnd?.toMillis() || null
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
      priceId: plan.priceId
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
      immediate
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
    const db = firestore;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists || !userDoc.data()?.subscriptionId) {
      return null;
    }
    
    const subscriptionId = userDoc.data()?.subscriptionId;
    const subscriptionDoc = await db.collection('users').doc(userId)
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
      plan: plan,
      createdAt: data?.createdAt?.toMillis() || Date.now()
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
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
    const paymentMethodsSnapshot = await db.collection('users').doc(userId)
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
        isDefault: data.isDefault || false
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
      duration: product.duration
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
 * @returns Success status
 */
export const purchaseMicrotransaction = async (
  userId: string,
  productId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = MICROTRANSACTIONS.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Call the Firebase function to create a one-time payment
    const createOneTimePayment = functions.httpsCallable('createOneTimePayment');
    const result = await createOneTimePayment({
      userId,
      paymentMethodId,
      productId,
      amount: product.amount
    });
    
    return result.data.status === 'succeeded';
  } catch (error) {
    console.error('Error purchasing microtransaction:', error);
    return false;
  }
};

/**
 * Check if user has access to a specific game prediction
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasGamePredictionAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      return true;
    }
    
    // Check for specific game prediction purchases
    const db = firestore;
    const purchasesSnapshot = await db.collection('users').doc(userId)
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
    day: 'numeric'
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
      paymentMethodId
    });
    
    return result.data.updated === true;
  } catch (error) {
    console.error('Error updating payment method:', error);
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
  getUserPaymentMethods,
  createPaymentMethod,
  createSubscription,
  formatDate,
  purchaseOneTimeProduct,
  purchaseMicrotransaction,
  hasGamePredictionAccess,
  updatePaymentMethod,
  SUBSCRIPTION_PLANS,
  ONE_TIME_PURCHASES,
  MICROTRANSACTIONS,
  ALL_PRODUCTS
};