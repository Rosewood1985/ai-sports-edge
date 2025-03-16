import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

// Microtransaction types
export interface Microtransaction {
  id: string;
  name: string;
  description: string;
  price: number;
  amount?: number; // For backward compatibility (in cents)
  productType: ProductType;
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
    productType: 'microtransaction'
  },
  {
    id: 'parlay-suggestion',
    name: 'AI Parlay Suggestion',
    description: 'AI-generated parlay based on real-time trends',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction'
  },
  {
    id: 'parlay-package',
    name: 'Parlay Package (3)',
    description: '3 AI-generated parlays with different risk levels',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction'
  },
  {
    id: 'alert-package-small',
    name: 'Alert Package (5)',
    description: '5 real-time betting opportunity alerts',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction'
  },
  {
    id: 'alert-package-large',
    name: 'Alert Package (15)',
    description: '15 real-time betting opportunity alerts',
    price: 9.99,
    amount: 999,
    productType: 'microtransaction'
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
    // In a real app, this would check with a backend service
    // For now, we'll use AsyncStorage to simulate subscription status
    const subscriptionData = await AsyncStorage.getItem(`subscription_${userId}`);
    
    if (!subscriptionData) {
      return false;
    }
    
    const subscription = JSON.parse(subscriptionData) as SubscriptionStatus;
    
    // Check if subscription is active and not expired
    if (subscription.active) {
      // If there's an end date, check if it's in the future
      if (subscription.currentPeriodEnd) {
        return subscription.currentPeriodEnd > Date.now();
      }
      return true;
    }
    
    return false;
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
    const subscriptionData = await AsyncStorage.getItem(`subscription_${userId}`);
    
    if (!subscriptionData) {
      return null;
    }
    
    return JSON.parse(subscriptionData) as SubscriptionStatus;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
};

/**
 * Subscribe a user to a plan
 * @param userId User ID
 * @param planId Plan ID
 * @returns Success status
 */
export const subscribeToPlan = async (userId: string, planId: string): Promise<boolean> => {
  try {
    // Find the plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }
    
    // Calculate subscription end date
    const now = Date.now();
    let endDate = now;
    
    if (plan.interval === 'month') {
      // Add 30 days
      endDate = now + (30 * 24 * 60 * 60 * 1000);
    } else if (plan.interval === 'year') {
      // Add 365 days
      endDate = now + (365 * 24 * 60 * 60 * 1000);
    }
    
    // Create subscription status
    const subscriptionStatus: SubscriptionStatus = {
      active: true,
      planId,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      trialEnd: null
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(
      `subscription_${userId}`,
      JSON.stringify(subscriptionStatus)
    );
    
    return true;
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    return false;
  }
};

/**
 * Cancel a subscription
 * @param userId User ID
 * @param subscriptionIdOrImmediate Subscription ID or immediate flag
 * @returns Success status
 */
export const cancelSubscription = async (
  userId: string,
  subscriptionIdOrImmediate?: string | boolean
): Promise<boolean> => {
  // Handle both function signatures for backward compatibility
  const immediate = typeof subscriptionIdOrImmediate === 'boolean' ?
    subscriptionIdOrImmediate : false;
  try {
    const subscriptionData = await AsyncStorage.getItem(`subscription_${userId}`);
    
    if (!subscriptionData) {
      return false;
    }
    
    const subscription = JSON.parse(subscriptionData) as SubscriptionStatus;
    
    if (immediate) {
      // Cancel immediately
      subscription.active = false;
      subscription.currentPeriodEnd = null;
    } else {
      // Cancel at the end of the period
      subscription.cancelAtPeriodEnd = true;
    }
    
    // Save updated subscription
    await AsyncStorage.setItem(
      `subscription_${userId}`,
      JSON.stringify(subscription)
    );
    
    return true;
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
 * @param trialDays Number of trial days
 * @returns Success status
 */
export const startFreeTrial = async (
  userId: string,
  planId: string,
  trialDays: number = 7
): Promise<boolean> => {
  try {
    // Find the plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }
    
    // Calculate trial end date
    const now = Date.now();
    const trialEnd = now + (trialDays * 24 * 60 * 60 * 1000);
    
    // Create subscription status
    const subscriptionStatus: SubscriptionStatus = {
      active: true,
      planId,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: true, // Auto-cancel at the end of trial
      trialEnd
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(
      `subscription_${userId}`,
      JSON.stringify(subscriptionStatus)
    );
    
    return true;
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
    const status = await getSubscriptionStatus(userId);
    
    if (!status || !status.active) {
      return null;
    }
    
    // Convert SubscriptionStatus to Subscription format for backward compatibility
    const planId = status.planId || 'premium-monthly'; // Default to premium-monthly if no plan ID
    const plan = getPlanById(planId);
    
    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }
    
    const now = Date.now();
    
    return {
      id: `sub_${now}`, // Generate a fake ID
      status: status.trialEnd && status.trialEnd > now ? 'trialing' : 'active',
      planId: planId,
      currentPeriodEnd: status.currentPeriodEnd || (now + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
      cancelAtPeriodEnd: status.cancelAtPeriodEnd,
      trialEnd: status.trialEnd,
      defaultPaymentMethod: null,
      plan: plan, // Always include the plan
      createdAt: now - 7 * 24 * 60 * 60 * 1000 // Default to 7 days ago
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
    // In a real app, this would fetch from a backend service
    // For now, return a mock payment method if the user has a subscription
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return [];
    }
    
    return [
      {
        id: 'pm_mock',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      }
    ];
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
};

/**
 * Create a subscription for a user
 * @param userId User ID
 * @param planId Plan ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export const createSubscription = async (
  userId: string,
  planId: string,
  paymentMethodId?: string
): Promise<boolean> => {
  // This is just a wrapper around subscribeToPlan for backward compatibility
  return subscribeToPlan(userId, planId);
};

/**
 * Purchase a one-time product
 * @param userId User ID
 * @param productId Product ID
 * @returns Success status
 */
export const purchaseOneTimeProduct = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = ONE_TIME_PURCHASES.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Calculate expiration date
    const now = Date.now();
    const expirationDate = now + (product.duration || 24) * 60 * 60 * 1000;
    
    // Store the purchase
    const purchaseData = {
      id: `purchase_${now}`,
      productId,
      purchaseDate: now,
      expirationDate,
      active: true
    };
    
    // Save to AsyncStorage
    const purchasesKey = `one_time_purchases_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing one-time product:', error);
    return false;
  }
};

/**
 * Purchase a microtransaction
 * @param userId User ID
 * @param productId Product ID
 * @returns Success status
 */
export const purchaseMicrotransaction = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = MICROTRANSACTIONS.find(p => p.id === productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
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
    
    // Check one-time purchases
    const purchasesKey = `one_time_purchases_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    // Check if user has an active one-time purchase
    const now = Date.now();
    const hasActiveOneTimePurchase = existingPurchases.some(
      (purchase: any) => purchase.active && purchase.expirationDate > now
    );
    
    if (hasActiveOneTimePurchase) {
      return true;
    }
    
    // Check microtransactions
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused single prediction purchase
    const hasUnusedPrediction = existingMicrotransactions.some(
      (purchase: any) => !purchase.used && purchase.productId === 'single-prediction'
    );
    
    return hasUnusedPrediction;
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

export default {
  hasPremiumAccess,
  getSubscriptionStatus,
  subscribeToPlan,
  cancelSubscription,
  getPlanById,
  startFreeTrial,
  getUserSubscription,
  getUserPaymentMethods,
  createSubscription,
  formatDate,
  purchaseOneTimeProduct,
  purchaseMicrotransaction,
  hasGamePredictionAccess,
  SUBSCRIPTION_PLANS,
  ONE_TIME_PURCHASES,
  MICROTRANSACTIONS,
  ALL_PRODUCTS
};