const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

// Initialize Firestore
const db = admin.firestore();

/**
 * Create a gift subscription
 * This function charges the user and creates a gift subscription code
 */
exports.createGiftSubscription = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a gift subscription.'
    );
  }

  const userId = context.auth.uid;
  const { paymentMethodId, amount, code, recipientEmail, message } = data;

  // Validate input
  if (!paymentMethodId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Payment method ID is required.'
    );
  }

  if (!amount || amount < 2500) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Gift amount must be at least $25.'
    );
  }

  if (!code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Gift code is required.'
    );
  }

  try {
    // Get the user's Stripe customer ID or create one
    const userSnapshot = await db.collection('users').doc(userId).get();
    const userData = userSnapshot.data();
    
    let stripeCustomerId = userData.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          firebaseUserId: userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update the user with the Stripe customer ID
      await db.collection('users').doc(userId).update({
        stripeCustomerId
      });
    }
    
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId
    });
    
    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: false,
      confirm: true,
      description: `Gift Subscription - $${(amount / 100).toFixed(2)}`,
      metadata: {
        type: 'gift_subscription',
        firebaseUserId: userId
      }
    });
    
    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Create the gift subscription in Firestore
    const giftSubscriptionRef = db.collection('giftSubscriptions').doc(code);
    
    const giftSubscription = {
      code,
      amount,
      currency: 'usd',
      status: 'active',
      purchasedBy: userId,
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      paymentIntentId: paymentIntent.id,
      stripeCustomerId,
      recipientEmail: recipientEmail || null,
      message: message || null
    };
    
    await giftSubscriptionRef.set(giftSubscription);
    
    // If recipient email is provided, send an email notification
    if (recipientEmail) {
      // This would be implemented with a service like SendGrid or Mailgun
      // For now, we'll just log it
      console.log(`Email notification would be sent to ${recipientEmail} with code ${code}`);
    }
    
    // Return the gift subscription
    return {
      ...giftSubscription,
      purchasedAt: new Date(),
      expiresAt: expiresAt
    };
  } catch (error) {
    console.error('Error creating gift subscription:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while creating the gift subscription.'
    );
  }
});

/**
 * Redeem a gift subscription
 * This function activates a subscription for the user based on a gift code
 */
exports.redeemGiftSubscription = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to redeem a gift subscription.'
    );
  }

  const userId = context.auth.uid;
  const { code } = data;

  // Validate input
  if (!code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Gift code is required.'
    );
  }

  try {
    // Get the gift subscription
    const giftRef = db.collection('giftSubscriptions').doc(code);
    const giftSnapshot = await giftRef.get();
    
    if (!giftSnapshot.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Gift subscription not found.'
      );
    }
    
    const giftData = giftSnapshot.data();
    
    // Check if the gift subscription is already redeemed
    if (giftData.status === 'redeemed') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gift subscription has already been redeemed.'
      );
    }
    
    // Check if the gift subscription is expired
    if (giftData.status === 'expired') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gift subscription has expired.'
      );
    }
    
    // Check if the gift subscription is for a specific recipient
    if (giftData.recipientEmail) {
      // Get the user's email
      const userSnapshot = await db.collection('users').doc(userId).get();
      const userData = userSnapshot.data();
      
      if (userData.email !== giftData.recipientEmail) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'This gift subscription is for a different email address.'
        );
      }
    }
    
    // Calculate subscription duration based on amount
    // $25 = 30 days, $50 = 60 days, etc.
    const durationDays = Math.floor(giftData.amount / 2500) * 30;
    
    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Create subscription in Firestore
    const subscriptionRef = db.collection('users').doc(userId)
      .collection('subscriptions').doc();
    
    const subscription = {
      status: 'active',
      planId: 'gift',
      plan: {
        id: 'gift',
        name: 'Gift Subscription',
        description: `Gift subscription worth $${(giftData.amount / 100).toFixed(2)}`,
        amount: giftData.amount,
        currency: giftData.currency,
        interval: 'one-time',
        productType: 'subscription'
      },
      currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      giftCode: code,
      giftAmount: giftData.amount,
      purchasedBy: giftData.purchasedBy
    };
    
    await subscriptionRef.set(subscription);
    
    // Update user's subscription status
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'active',
      subscriptionId: subscriptionRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update gift subscription status
    await giftRef.update({
      status: 'redeemed',
      redeemedBy: userId,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Track the event
    await db.collection('analytics').add({
      event: 'gift_subscription_redeemed',
      userId,
      giftCode: code,
      amount: giftData.amount,
      purchasedBy: giftData.purchasedBy,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return the subscription
    return {
      success: true,
      subscriptionId: subscriptionRef.id,
      expiresAt: endDate.getTime(),
      currentPeriodStart: now.getTime(),
      currentPeriodEnd: endDate.getTime(),
      planId: 'gift',
      plan: subscription.plan
    };
  } catch (error) {
    console.error('Error redeeming gift subscription:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while redeeming the gift subscription.'
    );
  }
});

/**
 * Check for expired gift subscriptions and update their status
 * This function runs on a schedule (once a day)
 */
exports.checkExpiredGiftSubscriptions = functions.pubsub.schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Query for active gift subscriptions that have expired
      const snapshot = await db.collection('giftSubscriptions')
        .where('status', '==', 'active')
        .where('expiresAt', '<', now)
        .get();
      
      if (snapshot.empty) {
        console.log('No expired gift subscriptions found.');
        return null;
      }
      
      // Update each expired gift subscription
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      console.log(`Updated ${snapshot.size} expired gift subscriptions.`);
      return null;
    } catch (error) {
      console.error('Error checking expired gift subscriptions:', error);
      return null;
    }
  });