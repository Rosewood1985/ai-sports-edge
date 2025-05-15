# Subscription Service Implementation Guide

This document provides detailed implementation instructions for the `subscriptionService.ts` file, which will handle interactions with Stripe and manage subscriptions.

## File Location
```
services/subscriptionService.ts
```

## Dependencies
```typescript
import { firestore, auth } from '../config/firebase';
import { doc, collection, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase'; // This needs to be added to firebase.ts
```

## Interfaces

```typescript
export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  plan: {
    id: string;
    name: string;
    amount: number;
    interval: 'month' | 'year' | 'week' | 'day';
  };
  createdAt: Date;
  canceledAt?: Date;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  interval: 'month' | 'year' | 'week' | 'day';
  features: string[];
}
```

## Constants

```typescript
// Firestore collection paths
const USERS_COLLECTION = 'users';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium_monthly',
    name: 'AI Subscription (Premium Picks)',
    description: 'Access to all AI-generated bets, detailed analytics, and historical performance data.',
    amount: 999, // $9.99 in cents
    interval: 'month',
    features: [
      'All AI-generated bets',
      'Detailed analytics and insights',
      'Historical performance data',
      'Priority customer support'
    ]
  },
  {
    id: 'weekend_pass',
    name: 'Weekend Pass',
    description: '3-day access to premium AI picks, perfect for weekend sports events.',
    amount: 499, // $4.99 in cents
    interval: 'day',
    features: [
      '3-day access to premium AI picks',
      'Perfect for weekend sports events',
      'No subscription required'
    ]
  }
];
```

## Functions

### Get User's Subscription

```typescript
/**
 * Get the user's current subscription
 * @param userId - The user's ID
 * @returns The user's subscription or null if not found
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get the user's subscription from Firestore
    const subscriptionsRef = collection(firestore, USERS_COLLECTION, userId, SUBSCRIPTIONS_COLLECTION);
    const q = query(subscriptionsRef, where('status', 'in', ['active', 'trialing']));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first active subscription
    const subscriptionDoc = querySnapshot.docs[0];
    const subscriptionData = subscriptionDoc.data();

    return {
      id: subscriptionDoc.id,
      status: subscriptionData.status,
      currentPeriodEnd: subscriptionData.currentPeriodEnd.toDate(),
      plan: subscriptionData.plan,
      createdAt: subscriptionData.createdAt.toDate(),
      canceledAt: subscriptionData.canceledAt ? subscriptionData.canceledAt.toDate() : undefined
    } as Subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
};
```

### Create Subscription

```typescript
/**
 * Create a subscription for a user
 * @param userId - The user's ID
 * @param paymentMethodId - The payment method ID
 * @param planId - The subscription plan ID
 * @returns The created subscription
 */
export const createSubscription = async (
  userId: string,
  paymentMethodId: string,
  planId: string
): Promise<Subscription> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the createSubscription Firebase function
    const createSubscriptionFn = httpsCallable(functions, 'createSubscription');
    const result = await createSubscriptionFn({
      paymentMethodId,
      planId
    });

    // Parse the result
    const subscription = result.data as Subscription;

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};
```

### Cancel Subscription

```typescript
/**
 * Cancel a user's subscription
 * @param userId - The user's ID
 * @param subscriptionId - The subscription ID
 * @returns True if the subscription was canceled successfully
 */
export const cancelSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<boolean> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the cancelSubscription Firebase function
    const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
    const result = await cancelSubscriptionFn({
      subscriptionId
    });

    // Parse the result
    const success = result.data as boolean;

    return success;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};
```

### Get User's Payment Methods

```typescript
/**
 * Get the user's payment methods
 * @param userId - The user's ID
 * @returns The user's payment methods
 */
export const getUserPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get the user's payment methods from Firestore
    const paymentMethodsRef = collection(firestore, USERS_COLLECTION, userId, PAYMENT_METHODS_COLLECTION);
    const querySnapshot = await getDocs(paymentMethodsRef);

    if (querySnapshot.empty) {
      return [];
    }

    // Return the payment methods
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        brand: data.brand,
        last4: data.last4,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        isDefault: data.isDefault
      } as PaymentMethod;
    });
  } catch (error) {
    console.error('Error getting user payment methods:', error);
    throw error;
  }
};
```

### Add Payment Method

```typescript
/**
 * Add a payment method for a user
 * @param userId - The user's ID
 * @param paymentMethodId - The payment method ID from Stripe
 * @returns The added payment method
 */
export const addPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<PaymentMethod> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the addPaymentMethod Firebase function
    const addPaymentMethodFn = httpsCallable(functions, 'addPaymentMethod');
    const result = await addPaymentMethodFn({
      paymentMethodId
    });

    // Parse the result
    const paymentMethod = result.data as PaymentMethod;

    return paymentMethod;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};
```

### Update Default Payment Method

```typescript
/**
 * Update the default payment method for a user
 * @param userId - The user's ID
 * @param paymentMethodId - The payment method ID
 * @returns True if the payment method was updated successfully
 */
export const updateDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the updateDefaultPaymentMethod Firebase function
    const updateDefaultPaymentMethodFn = httpsCallable(functions, 'updateDefaultPaymentMethod');
    const result = await updateDefaultPaymentMethodFn({
      paymentMethodId
    });

    // Parse the result
    const success = result.data as boolean;

    return success;
  } catch (error) {
    console.error('Error updating default payment method:', error);
    throw error;
  }
};
```

### Remove Payment Method

```typescript
/**
 * Remove a payment method for a user
 * @param userId - The user's ID
 * @param paymentMethodId - The payment method ID
 * @returns True if the payment method was removed successfully
 */
export const removePaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the removePaymentMethod Firebase function
    const removePaymentMethodFn = httpsCallable(functions, 'removePaymentMethod');
    const result = await removePaymentMethodFn({
      paymentMethodId
    });

    // Parse the result
    const success = result.data as boolean;

    return success;
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};
```

### Check Subscription Access

```typescript
/**
 * Check if the user has access to premium features
 * @param userId - The user's ID
 * @returns True if the user has access to premium features
 */
export const hasPremiumAccess = async (userId: string): Promise<boolean> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      return false;
    }

    // Get the user's subscription
    const subscription = await getUserSubscription(userId);

    // Check if the subscription is active
    if (!subscription) {
      return false;
    }

    // Check if the subscription is active and not expired
    return (
      (subscription.status === 'active' || subscription.status === 'trialing') &&
      subscription.currentPeriodEnd > new Date()
    );
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
};
```

## Firebase Functions Implementation

The Firebase Cloud Functions will need to be implemented separately. Here's a brief overview of what each function should do:

1. `createSubscription`: Create a Stripe customer if one doesn't exist, attach the payment method, and create a subscription.
2. `cancelSubscription`: Cancel a Stripe subscription and update the Firestore document.
3. `addPaymentMethod`: Add a payment method to a Stripe customer and save it to Firestore.
4. `updateDefaultPaymentMethod`: Update the default payment method for a Stripe customer.
5. `removePaymentMethod`: Remove a payment method from a Stripe customer and delete it from Firestore.

## Next Steps

After implementing the subscription service, we'll need to:

1. Update the Firebase configuration to include the functions export
2. Create the subscription-related screens and components
3. Update the navigation to include the new screens
4. Implement the Firebase Cloud Functions