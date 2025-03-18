const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const giftSubscriptions = require('./giftSubscriptions');

// Initialize Firebase Admin
admin.initializeApp();

// Export gift subscription functions
exports.createGiftSubscription = giftSubscriptions.createGiftSubscription;
exports.redeemGiftSubscription = giftSubscriptions.redeemGiftSubscription;
exports.checkExpiredGiftSubscriptions = giftSubscriptions.checkExpiredGiftSubscriptions;

/**
 * Create a Stripe customer when a user is created
 */
exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  try {
    // Create a Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        firebaseUserId: user.uid
      }
    });
    
    // Store the Stripe customer ID in Firestore
    await admin.firestore().collection('users').doc(user.uid).update({
      stripeCustomerId: customer.id
    });
    
    console.log(`Created Stripe customer for ${user.email}`);
    return null;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return null;
  }
});

/**
 * Handle Stripe webhook events
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      functions.config().stripe.webhook_secret
    );
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
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
 * Handle payment intent succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
  
  // Check if this is a gift subscription payment
  if (paymentIntent.metadata.type === 'gift_subscription') {
    // The gift subscription is already created in the createGiftSubscription function
    console.log(`Gift subscription payment succeeded: ${paymentIntent.id}`);
    
    // Track the event
    await admin.firestore().collection('analytics').add({
      event: 'gift_subscription_payment_succeeded',
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.metadata.firebaseUserId,
      amount: paymentIntent.amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Handle payment intent failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`PaymentIntent failed: ${paymentIntent.id}`);
  
  // Check if this is a gift subscription payment
  if (paymentIntent.metadata.type === 'gift_subscription') {
    console.log(`Gift subscription payment failed: ${paymentIntent.id}`);
    
    // Track the event
    await admin.firestore().collection('analytics').add({
      event: 'gift_subscription_payment_failed',
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.metadata.firebaseUserId,
      amount: paymentIntent.amount,
      error: paymentIntent.last_payment_error,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log(`Subscription updated: ${subscription.id}`);
  
  // Get the customer ID
  const customerId = subscription.customer;
  
  // Find the user with this Stripe customer ID
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .get();
  
  if (usersSnapshot.empty) {
    console.log(`No user found with Stripe customer ID: ${customerId}`);
    return;
  }
  
  const userId = usersSnapshot.docs[0].id;
  
  // Update the subscription in Firestore
  const subscriptionRef = admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscription.id);
  
  await subscriptionRef.set({
    status: subscription.status,
    planId: subscription.items.data[0].plan.id,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? admin.firestore.Timestamp.fromMillis(subscription.canceled_at * 1000) : null,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Update the user's subscription status
  await admin.firestore()
    .collection('users')
    .doc(userId)
    .update({
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  // Track the event
  await admin.firestore().collection('analytics').add({
    event: 'subscription_updated',
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  // Get the customer ID
  const customerId = subscription.customer;
  
  // Find the user with this Stripe customer ID
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .get();
  
  if (usersSnapshot.empty) {
    console.log(`No user found with Stripe customer ID: ${customerId}`);
    return;
  }
  
  const userId = usersSnapshot.docs[0].id;
  
  // Update the subscription in Firestore
  const subscriptionRef = admin.firestore()
    .collection('users')
    .doc(userId)
    .collection('subscriptions')
    .doc(subscription.id);
  
  await subscriptionRef.update({
    status: 'canceled',
    canceledAt: admin.firestore.Timestamp.fromMillis(subscription.canceled_at * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update the user's subscription status
  await admin.firestore()
    .collection('users')
    .doc(userId)
    .update({
      subscriptionStatus: 'canceled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  // Track the event
  await admin.firestore().collection('analytics').add({
    event: 'subscription_deleted',
    subscriptionId: subscription.id,
    userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}