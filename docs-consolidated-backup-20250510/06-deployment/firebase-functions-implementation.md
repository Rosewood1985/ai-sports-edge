# Firebase Cloud Functions Implementation Guide for Stripe Integration

This document provides detailed implementation instructions for the Firebase Cloud Functions that will handle Stripe API interactions for the AI Sports Edge app.

## Overview

Firebase Cloud Functions will serve as the backend for our Stripe integration, handling sensitive operations like creating customers, managing subscriptions, and processing payments. This approach keeps API keys and sensitive operations on the server side, enhancing security.

## Project Setup

### 1. Initialize Firebase Functions

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Functions in your project
firebase init functions
```

Choose TypeScript when prompted and set up ESLint.

### 2. Install Dependencies

In the functions directory:

```bash
cd functions
npm install stripe firebase-admin
```

## Implementation

### 1. Firebase Functions Configuration

Create a `src/config.ts` file:

```typescript
export const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'your_test_key_here',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'your_webhook_secret_here',
  },
  email: {
    apiKey: process.env.EMAIL_API_KEY || 'your_email_api_key_here',
    fromEmail: 'receipts@aisportsedge.com',
    fromName: 'AI Sports Edge',
  },
};
```

### 2. Stripe Service

Create a `src/services/stripeService.ts` file:

```typescript
import Stripe from 'stripe';
import { config } from '../config';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16', // Use the latest API version
});

/**
 * Create a Stripe customer
 * @param email - Customer email
 * @param name - Customer name
 * @returns Stripe customer object
 */
export const createCustomer = async (
  email: string,
  name?: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe customer
 * @param customerId - Stripe customer ID
 * @returns Stripe customer object
 */
export const getCustomer = async (
  customerId: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw error;
  }
};

/**
 * Create a subscription for a customer
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID
 * @param paymentMethodId - Stripe payment method ID
 * @returns Stripe subscription object
 */
export const createSubscription = async (
  customerId: string,
  priceId: string,
  paymentMethodId: string
): Promise<Stripe.Subscription> => {
  try {
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set the payment method as the default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
};

/**
 * Cancel a subscription
 * @param subscriptionId - Stripe subscription ID
 * @returns Stripe subscription object
 */
export const cancelSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    throw error;
  }
};

/**
 * Create a one-time payment
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Stripe payment method ID
 * @param amount - Amount in cents
 * @param description - Payment description
 * @returns Stripe payment intent object
 */
export const createPayment = async (
  customerId: string,
  paymentMethodId: string,
  amount: number,
  description: string
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      description,
      confirm: true,
      off_session: true,
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe payment:', error);
    throw error;
  }
};

/**
 * Get a customer's payment methods
 * @param customerId - Stripe customer ID
 * @returns Array of Stripe payment method objects
 */
export const getPaymentMethods = async (
  customerId: string
): Promise<Stripe.PaymentMethod[]> => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  } catch (error) {
    console.error('Error getting Stripe payment methods:', error);
    throw error;
  }
};

/**
 * Detach a payment method from a customer
 * @param paymentMethodId - Stripe payment method ID
 * @returns Stripe payment method object
 */
export const detachPaymentMethod = async (
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error detaching Stripe payment method:', error);
    throw error;
  }
};

/**
 * Set a payment method as the default for a customer
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Stripe payment method ID
 * @returns Stripe customer object
 */
export const setDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    return customer;
  } catch (error) {
    console.error('Error setting default Stripe payment method:', error);
    throw error;
  }
};

export default {
  createCustomer,
  getCustomer,
  createSubscription,
  cancelSubscription,
  createPayment,
  getPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
};
```

### 3. Email Service

Create a `src/services/emailService.ts` file:

```typescript
import { config } from '../config';
import axios from 'axios';

// This example uses SendGrid, but you can use any email service
const sendgridApiKey = config.email.apiKey;

/**
 * Send a receipt email for a successful payment
 * @param email - Recipient email
 * @param name - Recipient name
 * @param amount - Payment amount in cents
 * @param description - Payment description
 * @param receiptUrl - URL to view the receipt online
 * @returns Success status
 */
export const sendReceiptEmail = async (
  email: string,
  name: string,
  amount: number,
  description: string,
  receiptUrl: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email, name }],
            subject: 'Your AI Sports Edge Receipt',
          },
        ],
        from: {
          email: config.email.fromEmail,
          name: config.email.fromName,
        },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3498db;">AI Sports Edge</h1>
                <h2>Payment Receipt</h2>
                <p>Thank you for your payment, ${name}!</p>
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 20px 0;">
                  <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}</p>
                  <p><strong>Description:</strong> ${description}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>You can view your receipt online at <a href="${receiptUrl}">${receiptUrl}</a></p>
                <p>If you have any questions, please contact our support team at support@aisportsedge.com.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.status === 202;
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return false;
  }
};

export default {
  sendReceiptEmail,
};
```

### 4. Firestore Service

Create a `src/services/firestoreService.ts` file:

```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

// Collection paths
const USERS_COLLECTION = 'users';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';
const PAYMENTS_COLLECTION = 'payments';

/**
 * Save a user's Stripe customer ID
 * @param userId - Firebase user ID
 * @param customerId - Stripe customer ID
 * @returns Success status
 */
export const saveCustomerId = async (
  userId: string,
  customerId: string
): Promise<boolean> => {
  try {
    await firestore.collection(USERS_COLLECTION).doc(userId).set(
      {
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving customer ID:', error);
    return false;
  }
};

/**
 * Get a user's Stripe customer ID
 * @param userId - Firebase user ID
 * @returns Stripe customer ID or null
 */
export const getCustomerId = async (
  userId: string
): Promise<string | null> => {
  try {
    const userDoc = await firestore.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data()?.stripeCustomerId || null;
  } catch (error) {
    console.error('Error getting customer ID:', error);
    return null;
  }
};

/**
 * Save a subscription to Firestore
 * @param userId - Firebase user ID
 * @param subscription - Subscription data
 * @returns Success status
 */
export const saveSubscription = async (
  userId: string,
  subscription: any
): Promise<boolean> => {
  try {
    const subscriptionRef = firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SUBSCRIPTIONS_COLLECTION)
      .doc(subscription.id);

    await subscriptionRef.set(
      {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_start * 1000)
        ),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
        plan: {
          id: subscription.items.data[0].price.id,
          name: subscription.items.data[0].price.nickname || 'Subscription',
          amount: subscription.items.data[0].price.unit_amount,
          interval: subscription.items.data[0].price.recurring.interval,
        },
        canceledAt: subscription.canceled_at
          ? admin.firestore.Timestamp.fromDate(
              new Date(subscription.canceled_at * 1000)
            )
          : null,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.created * 1000)
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
};

/**
 * Save a payment method to Firestore
 * @param userId - Firebase user ID
 * @param paymentMethod - Payment method data
 * @param isDefault - Whether this is the default payment method
 * @returns Success status
 */
export const savePaymentMethod = async (
  userId: string,
  paymentMethod: any,
  isDefault: boolean
): Promise<boolean> => {
  try {
    const paymentMethodRef = firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(PAYMENT_METHODS_COLLECTION)
      .doc(paymentMethod.id);

    await paymentMethodRef.set({
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expiryMonth: paymentMethod.card.exp_month,
      expiryYear: paymentMethod.card.exp_year,
      isDefault,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving payment method:', error);
    return false;
  }
};

/**
 * Update all payment methods to set isDefault to false
 * @param userId - Firebase user ID
 * @returns Success status
 */
export const resetDefaultPaymentMethods = async (
  userId: string
): Promise<boolean> => {
  try {
    const paymentMethodsRef = firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(PAYMENT_METHODS_COLLECTION);

    const paymentMethodsSnapshot = await paymentMethodsRef.get();
    
    const batch = firestore.batch();
    paymentMethodsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isDefault: false });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error resetting default payment methods:', error);
    return false;
  }
};

/**
 * Delete a payment method from Firestore
 * @param userId - Firebase user ID
 * @param paymentMethodId - Payment method ID
 * @returns Success status
 */
export const deletePaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    await firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(PAYMENT_METHODS_COLLECTION)
      .doc(paymentMethodId)
      .delete();
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }
};

/**
 * Save a payment to Firestore
 * @param userId - Firebase user ID
 * @param payment - Payment data
 * @returns Success status
 */
export const savePayment = async (
  userId: string,
  payment: any
): Promise<boolean> => {
  try {
    const paymentRef = firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(PAYMENTS_COLLECTION)
      .doc(payment.id);

    await paymentRef.set({
      id: payment.id,
      amount: payment.amount,
      description: payment.description,
      status: payment.status,
      paymentMethodId: payment.payment_method,
      receiptUrl: payment.charges.data[0]?.receipt_url || null,
      createdAt: admin.firestore.Timestamp.fromDate(
        new Date(payment.created * 1000)
      ),
    });
    return true;
  } catch (error) {
    console.error('Error saving payment:', error);
    return false;
  }
};

export default {
  saveCustomerId,
  getCustomerId,
  saveSubscription,
  savePaymentMethod,
  resetDefaultPaymentMethods,
  deletePaymentMethod,
  savePayment,
};
```

### 5. Cloud Functions Implementation

Create a `src/index.ts` file:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import stripeService from './services/stripeService';
import emailService from './services/emailService';
import firestoreService from './services/firestoreService';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Create a Stripe customer when a user signs up
 */
export const createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  try {
    // Create a Stripe customer
    const customer = await stripeService.createCustomer(
      user.email || 'unknown@example.com',
      user.displayName || undefined
    );

    // Save the customer ID to Firestore
    await firestoreService.saveCustomerId(user.uid, customer.id);

    console.log(`Created Stripe customer for user ${user.uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Create a subscription for a user
 */
export const createSubscription = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { paymentMethodId, planId } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!paymentMethodId || !planId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method ID and plan ID are required'
      );
    }

    // Get the user's Stripe customer ID
    let customerId = await firestoreService.getCustomerId(userId);

    // If the user doesn't have a customer ID, create one
    if (!customerId) {
      const user = await admin.auth().getUser(userId);
      const customer = await stripeService.createCustomer(
        user.email || 'unknown@example.com',
        user.displayName || undefined
      );
      customerId = customer.id;
      await firestoreService.saveCustomerId(userId, customerId);
    }

    // Create the subscription
    const subscription = await stripeService.createSubscription(
      customerId,
      planId,
      paymentMethodId
    );

    // Save the subscription to Firestore
    await firestoreService.saveSubscription(userId, subscription);

    // Save the payment method to Firestore
    const paymentMethods = await stripeService.getPaymentMethods(customerId);
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    
    if (paymentMethod) {
      // Reset all payment methods to not be default
      await firestoreService.resetDefaultPaymentMethods(userId);
      
      // Save the new payment method as default
      await firestoreService.savePaymentMethod(userId, paymentMethod, true);
    }

    // Send a receipt email
    const user = await admin.auth().getUser(userId);
    if (user.email) {
      const invoice = subscription.latest_invoice as any;
      if (invoice && invoice.hosted_invoice_url) {
        await emailService.sendReceiptEmail(
          user.email,
          user.displayName || 'Valued Customer',
          subscription.items.data[0].price.unit_amount || 0,
          subscription.items.data[0].price.nickname || 'Subscription',
          invoice.hosted_invoice_url
        );
      }
    }

    // Return the subscription
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: {
        id: subscription.items.data[0].price.id,
        name: subscription.items.data[0].price.nickname || 'Subscription',
        amount: subscription.items.data[0].price.unit_amount,
        interval: subscription.items.data[0].price.recurring.interval,
      },
      createdAt: new Date(subscription.created * 1000),
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while creating the subscription'
    );
  }
});

/**
 * Cancel a subscription
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { subscriptionId } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!subscriptionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Subscription ID is required'
      );
    }

    // Cancel the subscription
    const subscription = await stripeService.cancelSubscription(subscriptionId);

    // Update the subscription in Firestore
    await firestoreService.saveSubscription(userId, subscription);

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while canceling the subscription'
    );
  }
});

/**
 * Add a payment method
 */
export const addPaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { paymentMethodId } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!paymentMethodId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method ID is required'
      );
    }

    // Get the user's Stripe customer ID
    let customerId = await firestoreService.getCustomerId(userId);

    // If the user doesn't have a customer ID, create one
    if (!customerId) {
      const user = await admin.auth().getUser(userId);
      const customer = await stripeService.createCustomer(
        user.email || 'unknown@example.com',
        user.displayName || undefined
      );
      customerId = customer.id;
      await firestoreService.saveCustomerId(userId, customerId);
    }

    // Attach the payment method to the customer
    await stripeService.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Get the payment method details
    const paymentMethod = await stripeService.stripe.paymentMethods.retrieve(paymentMethodId);

    // Save the payment method to Firestore
    await firestoreService.savePaymentMethod(userId, paymentMethod, false);

    // Return the payment method
    return {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      expiryMonth: paymentMethod.card?.exp_month,
      expiryYear: paymentMethod.card?.exp_year,
      isDefault: false,
    };
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while adding the payment method'
    );
  }
});

/**
 * Update the default payment method
 */
export const updateDefaultPaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { paymentMethodId } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!paymentMethodId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method ID is required'
      );
    }

    // Get the user's Stripe customer ID
    const customerId = await firestoreService.getCustomerId(userId);
    if (!customerId) {
      throw new functions.https.HttpsError(
        'not-found',
        'Stripe customer not found'
      );
    }

    // Update the default payment method
    await stripeService.setDefaultPaymentMethod(customerId, paymentMethodId);

    // Reset all payment methods to not be default
    await firestoreService.resetDefaultPaymentMethods(userId);

    // Get the payment method details
    const paymentMethod = await stripeService.stripe.paymentMethods.retrieve(paymentMethodId);

    // Save the payment method to Firestore as default
    await firestoreService.savePaymentMethod(userId, paymentMethod, true);

    return true;
  } catch (error) {
    console.error('Error updating default payment method:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while updating the default payment method'
    );
  }
});

/**
 * Remove a payment method
 */
export const removePaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { paymentMethodId } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!paymentMethodId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method ID is required'
      );
    }

    // Detach the payment method from the customer
    await stripeService.detachPaymentMethod(paymentMethodId);

    // Delete the payment method from Firestore
    await firestoreService.deletePaymentMethod(userId, paymentMethodId);

    return true;
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while removing the payment method'
    );
  }
});

/**
 * Create a one-time payment (for Pay-Per-Prediction)
 */
export const createPayment = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { paymentMethodId, amount, description } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!paymentMethodId || !amount || !description) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method ID, amount, and description are required'
      );
    }

    // Get the user's Stripe customer ID
    let customerId = await firestoreService.getCustomerId(userId);

    // If the user doesn't have a customer ID, create one
    if (!customerId) {
      const user = await admin.auth().getUser(userId);
      const customer = await stripeService.createCustomer(
        user.email || 'unknown@example.com',
        user.displayName || undefined
      );
      customerId = customer.id;
      await firestoreService.saveCustomerId(userId, customerId);
    }

    // Create the payment
    const payment = await stripeService.createPayment(
      customerId,
      paymentMethodId,
      amount,
      description
    );

    // Save the payment to Firestore
    await firestoreService.savePayment(userId, payment);

    // Send a receipt email
    const user = await admin.auth().getUser(userId);
    if (user.email && payment.charges.data[0]?.receipt_url) {
      await emailService.sendReceiptEmail(
        user.email,
        user.displayName || 'Valued Customer',
        amount,
        description,
        payment.charges.data[0].receipt_url
      );
    }

    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      receiptUrl: payment.charges.data[0]?.receipt_url || null,
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while creating the payment'
    );
  }
});

/**
 * Webhook handler for Stripe events
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('No Stripe signature found');
    res.status(400).send('No Stripe signature found');
    return;
  }

  try {
    const event = stripeService.stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeService.config.stripe.webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    // Get the subscription
    const subscription = await stripeService.stripe.subscriptions.retrieve(
      invoice.subscription
    );

    // Get the customer
    const customer = await stripeService.stripe.customers.retrieve(
      invoice.customer as string
    );

    if (customer.deleted) {
      console.error('Customer has been deleted');
      return;
    }

    // Find the user with this Stripe customer ID
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', invoice.customer)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found with Stripe customer ID:', invoice.customer);
      return;
    }

    const userId = usersSnapshot.docs[0].id;

    // Update the subscription in Firestore
    await firestoreService.saveSubscription(userId, subscription);

    // Send a receipt email
    const user = await admin.auth().getUser(userId);
    if (user.email && invoice.hosted_invoice_url) {
      await emailService.sendReceiptEmail(
        user.email,
        user.displayName || 'Valued Customer',
        invoice.amount_paid,
        invoice.lines.data[0]?.description || 'Subscription',
        invoice.hosted_invoice_url
      );
    }
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Find the user with this Stripe customer ID
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', subscription.customer)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found with Stripe customer ID:', subscription.customer);
      return;
    }

    const userId = usersSnapshot.docs[0].id;

    // Update the subscription in Firestore
    await firestoreService.saveSubscription(userId, subscription);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Find the user with this Stripe customer ID
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', subscription.customer)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found with Stripe customer ID:', subscription.customer);
      return;
    }

    const userId = usersSnapshot.docs[0].id;

    // Update the subscription in Firestore
    await firestoreService.saveSubscription(userId, subscription);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}
```

## Deployment

### 1. Set Environment Variables

```bash
firebase functions:config:set stripe.secret_key="your_stripe_secret_key" stripe.webhook_secret="your_webhook_secret" email.api_key="your_email_api_key"
```

### 2. Deploy Functions

```bash
firebase deploy --only functions
```

## Testing

### 1. Test with Stripe CLI

Install the Stripe CLI and use it to test webhooks locally:

```bash
stripe listen --forward-to http://localhost:5001/your-project-id/us-central1/stripeWebhook
```

### 2. Test Functions Locally

```bash
firebase emulators:start
```

## Security Considerations

1. **API Keys**: Never expose Stripe API keys in client-side code. Always use Firebase Functions to interact with Stripe.

2. **Authentication**: Always check if the user is authenticated before performing any operations.

3. **Data Validation**: Validate all input data before using it.

4. **Error Handling**: Properly handle and log errors to help with debugging.

5. **Webhook Signatures**: Always verify Stripe webhook signatures to prevent unauthorized requests.

## Next Steps

After implementing these Firebase Cloud Functions, you'll need to:

1. Update the frontend to use these functions
2. Test the complete subscription flow
3. Monitor for any errors or issues
4. Set up proper logging and monitoring