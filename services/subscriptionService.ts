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
import { generateRandomCode } from '../utils/codeGenerator';

// Initialize Firestore and Functions
const firestore = getFirestore();
const functions = getFunctions();

// Gift subscription amounts - Updated for new pricing structure
export const GIFT_SUBSCRIPTION_AMOUNTS = [
  { label: '$20 (1 month Insight)', value: 2000 },
  { label: '$75 (1 month Analyst)', value: 7500 },
  { label: '$150 (2 months Analyst)', value: 15000 },
  { label: '$190 (1 month Edge Collective)', value: 19000 },
  { label: '$300 (4 months Analyst)', value: 30000 },
  { label: '$500 (Gift Card)', value: 50000 },
];

/**
 * Check if a user has an active subscription
 * @param userId User ID to check
 * @returns Boolean indicating if the user has an active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    // Get user document
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();

    // Check if user has an active subscription
    if (userData.subscriptionStatus === 'active') {
      // If there's a subscription ID, check if it's still valid
      if (userData.subscriptionId) {
        // Get the subscription document
        const subscriptionsRef = collection(firestore, 'users', userId, 'subscriptions');
        const subscriptionDoc = await getDoc(doc(subscriptionsRef, userData.subscriptionId));

        if (subscriptionDoc.exists()) {
          const subscriptionData = subscriptionDoc.data();

          // Check if subscription is active and not expired
          if (subscriptionData.status === 'active') {
            // If there's an end date, check if it's in the future
            if (subscriptionData.currentPeriodEnd) {
              const endDate = subscriptionData.currentPeriodEnd.toDate();
              return endDate > new Date();
            }

            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Create a gift subscription
 * @param userId User ID of the purchaser
 * @param paymentMethodId Stripe payment method ID
 * @param amount Amount in cents
 * @param recipientEmail Optional email of the recipient
 * @param message Optional personal message
 * @returns Gift subscription object
 */
export const createGiftSubscription = async (
  userId: string,
  paymentMethodId: string,
  amount: number,
  recipientEmail?: string,
  message?: string
): Promise<any> => {
  try {
    // Generate a unique gift code
    const code = generateRandomCode(8);

    // Call the Cloud Function to create the gift subscription
    const createGiftSubscriptionFn = httpsCallable(functions, 'createGiftSubscription');
    const result = await createGiftSubscriptionFn({
      paymentMethodId,
      amount,
      code,
      recipientEmail,
      message,
    });

    // Return the gift subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error creating gift subscription:', error);
    throw new Error(error.message || 'Failed to create gift subscription');
  }
};

/**
 * Get a gift subscription by code
 * @param code Gift subscription code
 * @returns Gift subscription object or null if not found
 */
export const getGiftSubscriptionByCode = async (code: string): Promise<any> => {
  try {
    // Get the gift subscription document
    const giftSubscriptionRef = doc(firestore, 'giftSubscriptions', code);
    const giftSubscriptionDoc = await getDoc(giftSubscriptionRef);

    if (!giftSubscriptionDoc.exists()) {
      return null;
    }

    return giftSubscriptionDoc.data();
  } catch (error) {
    console.error('Error getting gift subscription:', error);
    return null;
  }
};

/**
 * Redeem a gift subscription
 * @param userId User ID of the redeemer
 * @param code Gift subscription code
 * @returns Subscription object
 */
export const redeemGiftSubscription = async (userId: string, code: string): Promise<any> => {
  try {
    // Call the Cloud Function to redeem the gift subscription
    const redeemGiftSubscriptionFn = httpsCallable(functions, 'redeemGiftSubscription');
    const result = await redeemGiftSubscriptionFn({ code });

    // Return the subscription data
    return result.data;
  } catch (error: any) {
    console.error('Error redeeming gift subscription:', error);
    throw new Error(error.message || 'Failed to redeem gift subscription');
  }
};

/**
 * Get all gift subscriptions purchased by a user
 * @param userId User ID
 * @returns Array of gift subscriptions
 */
export const getPurchasedGiftSubscriptions = async (userId: string): Promise<any[]> => {
  try {
    // Query gift subscriptions purchased by the user
    const giftSubscriptionsRef = collection(firestore, 'giftSubscriptions');
    const q = query(giftSubscriptionsRef, where('purchasedBy', '==', userId));
    const querySnapshot = await getDocs(q);

    // Convert query snapshot to array of gift subscriptions
    const giftSubscriptions: any[] = [];
    querySnapshot.forEach(doc => {
      giftSubscriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return giftSubscriptions;
  } catch (error) {
    console.error('Error getting purchased gift subscriptions:', error);
    return [];
  }
};

/**
 * Get all gift subscriptions redeemed by a user
 * @param userId User ID
 * @returns Array of gift subscriptions
 */
export const getRedeemedGiftSubscriptions = async (userId: string): Promise<any[]> => {
  try {
    // Query gift subscriptions redeemed by the user
    const giftSubscriptionsRef = collection(firestore, 'giftSubscriptions');
    const q = query(giftSubscriptionsRef, where('redeemedBy', '==', userId));
    const querySnapshot = await getDocs(q);

    // Convert query snapshot to array of gift subscriptions
    const giftSubscriptions: any[] = [];
    querySnapshot.forEach(doc => {
      giftSubscriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return giftSubscriptions;
  } catch (error) {
    console.error('Error getting redeemed gift subscriptions:', error);
    return [];
  }
};
