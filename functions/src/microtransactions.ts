import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2025-02-24.acacia',
});

// Initialize Firestore
const db = admin.firestore();

// Product definitions with server-side prices
interface Product {
  name: string;
  amount: number;
  description: string;
}

interface ProductMap {
  [key: string]: Product;
}

const PRODUCTS: ProductMap = {
  'advanced-player-metrics': {
    name: 'Advanced Player Metrics',
    amount: 299, // $2.99
    description: 'Access to advanced player metrics and statistics',
  },
  'player-comparison-tool': {
    name: 'Player Comparison Tool',
    amount: 199, // $1.99
    description: 'Compare players side by side with detailed analytics',
  },
  'historical-trends-package': {
    name: 'Historical Trends Package',
    amount: 249, // $2.49
    description: 'Access historical trends and patterns',
  },
  'player-stats-premium-bundle': {
    name: 'Premium Stats Bundle',
    amount: 499, // $4.99
    description: 'Complete package of all premium statistics features',
  },
  'odds-access': {
    name: 'Odds Access',
    amount: 99, // $0.99
    description: 'Access to betting odds for a specific game',
  },
};

/**
 * Create a one-time payment for a microtransaction
 * 
 * This function validates the product and price on the server side,
 * creates a payment intent with Stripe, and records the transaction.
 */
export const createOneTimePayment = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to make purchases'
    );
  }
  
  const { userId, paymentMethodId, productId, idempotencyKey } = data;
  
  // Validate user ID matches authenticated user
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User ID does not match authenticated user'
    );
  }
  
  // Validate product exists
  if (!productId || !PRODUCTS[productId]) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid product ID: ${productId}`
    );
  }
  
  // Get product details from server-side configuration
  const product = PRODUCTS[productId];
  
  // Validate payment method
  if (!paymentMethodId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Payment method ID is required'
    );
  }
  
  try {
    // Check if this is a duplicate request using idempotency key
    if (idempotencyKey) {
      const existingPurchases = await db
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('purchases')
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('idempotencyKey', '==', idempotencyKey)
        .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.limit(1)
        .get();
      
      if (!existingPurchases.empty) {
        const existingPurchase = existingPurchases.docs[0].data();
        
        // Return the existing purchase
        return {
          status: 'succeeded',
          transactionId: existingPurchase.transactionId,
          message: 'Purchase already processed',
        };
      }
    }
    
    // Get customer ID from Firestore
    const userDoc = await db.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('users').firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.stripeCustomerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User does not have a Stripe customer ID'
      );
    }
    
    const customerId = userData.stripeCustomerId;
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Purchase of ${product.name}`,
      metadata: {
        productId,
        userId,
      },
    }, {
      idempotencyKey,
    });
    
    // Record the purchase in Firestore
    const purchaseRef = db.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('purchases').firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc();
    await purchaseRef.set({
      userId,
      productId,
      productName: product.name,
      amount: product.amount,
      currency: 'usd',
      status: paymentIntent.status,
      transactionId: paymentIntent.id,
      paymentMethodId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      idempotencyKey,
    });
    
    // Add the purchase to user's purchases
    await db.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('users').firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(userId).firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('purchases').add({
      productId,
      productName: product.name,
      amount: product.amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      transactionId: paymentIntent.id,
      status: 'active',
    });
    
    // Return success response
    return {
      status: 'succeeded',
      transactionId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error processing payment:', error);
    
    // Log the error for debugging
    await db.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('error_logs').add({
      userId,
      productId,
      error: error.message || 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'payment_processing',
    });
    
    // Return appropriate error
    if (error.type === 'StripeCardError') {
      throw new functions.https.HttpsError(
        'aborted',
        error.message || 'Your card was declined'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while processing your payment'
    );
  }
});

/**
 * Verify a purchase to check if a user has access to a specific product
 */
export const verifyPurchase = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to verify purchases'
    );
  }
  
  const { userId, productId } = data;
  
  // Validate user ID matches authenticated user
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User ID does not match authenticated user'
    );
  }
  
  try {
    // Query user's purchases
    const purchasesSnapshot = await db
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('users')
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(userId)
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('purchases')
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('productId', '==', productId)
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.where('status', '==', 'active')
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.limit(1)
      .get();
    
    // Return whether the user has access
    return {
      hasAccess: !purchasesSnapshot.empty,
      purchaseId: !purchasesSnapshot.empty ? purchasesSnapshot.docs[0].id : null,
    };
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while verifying your purchase'
    );
  }
});

/**
 * Get all purchases for a user
 */
export const getUserPurchases = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to get purchases'
    );
  }
  
  const { userId } = data;
  
  // Validate user ID matches authenticated user
  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User ID does not match authenticated user'
    );
  }
  
  try {
    // Query user's purchases
    const purchasesSnapshot = await db
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('users')
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.doc(userId)
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.collection('purchases')
      .firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.firebaseService.firestore.orderBy('timestamp', 'desc')
      .get();
    
    // Format purchases
    const purchases = purchasesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId,
        productName: data.productName,
        amount: data.amount,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null,
        status: data.status,
      };
    });
    
    return { purchases };
  } catch (error: any) {
    console.error('Error getting purchases:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while getting your purchases'
    );
  }
});