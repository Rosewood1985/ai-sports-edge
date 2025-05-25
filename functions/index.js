const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { onCreate } = require("firebase-functions/v2/auth");

// Initialize Sentry first
const {
  initSentry,
  wrapHttpFunction,
  wrapEventFunction,
  trackStripeFunction,
  trackSubscriptionFunction,
  captureCloudFunctionError,
  trackFunctionPerformance,
} = require('./sentryConfig');

initSentry();

// Initialize Firebase Admin
admin.initializeApp();

// Create a simple Stripe webhook handler
exports.stripeWebhook = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    trackStripeFunction('stripeWebhook', 'webhook_received', {
      method: req.method,
      contentType: req.get('content-type'),
    });

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Log the webhook request
    console.log("Received Stripe webhook request");

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send({ received: true });
    
    trackFunctionPerformance('stripeWebhook', Date.now() - startTime, true);
  } catch (error) {
    console.error("Error processing webhook:", error);
    captureCloudFunctionError(error, 'stripeWebhook', {
      method: req.method,
      url: req.url,
    });
    trackFunctionPerformance('stripeWebhook', Date.now() - startTime, false);
    res.status(500).send({ error: "Webhook processing failed" });
  }
}));

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  const startTime = Date.now();
  try {
    trackStripeFunction('handleCheckoutSessionCompleted', 'session_completed', {
      sessionId: session.id,
      customerId: session.customer,
    });

    console.log('Processing checkout session:', session.id);
    const db = admin.firestore();

    // Get the customer and metadata
    const customerId = session.customer;
    const metadata = session.metadata || {};
    const userId = metadata.userId;

    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }

    // Update the user's subscription status
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      stripeCustomerId: customerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated user ${userId} with Stripe customer ID ${customerId}`);
    trackSubscriptionFunction('handleCheckoutSessionCompleted', 'user_updated', {
      userId,
      customerId,
    });
    trackFunctionPerformance('handleCheckoutSessionCompleted', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    captureCloudFunctionError(error, 'handleCheckoutSessionCompleted', {
      sessionId: session.id,
    });
    trackFunctionPerformance('handleCheckoutSessionCompleted', Date.now() - startTime, false);
  }
}

// Handle invoice paid
async function handleInvoicePaid(invoice) {
  const startTime = Date.now();
  try {
    trackStripeFunction('handleInvoicePaid', 'invoice_paid', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
    });

    console.log('Processing paid invoice:', invoice.id);
    const db = admin.firestore();

    // Get the subscription and customer
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    if (!subscriptionId) {
      console.log('No subscription associated with this invoice');
      return;
    }

    // Find the user with this customer ID
    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);

    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set(
      {
        id: subscriptionId,
        status: 'active',
        customerId: customerId,
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          invoice.lines.data[0].period.end * 1000
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update the user document
    await userRef.update({
      subscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated subscription ${subscriptionId} for user ${userId}`);
    trackSubscriptionFunction('handleInvoicePaid', 'subscription_updated', {
      userId,
      subscriptionId,
    });
    trackFunctionPerformance('handleInvoicePaid', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
    captureCloudFunctionError(error, 'handleInvoicePaid', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });
    trackFunctionPerformance('handleInvoicePaid', Date.now() - startTime, false);
  }
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice) {
  const startTime = Date.now();
  try {
    trackStripeFunction('handleInvoicePaymentFailed', 'invoice_payment_failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
    });

    console.log('Processing failed invoice payment:', invoice.id);
    const db = admin.firestore();

    // Get the subscription and customer
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    if (!subscriptionId) {
      console.log('No subscription associated with this invoice');
      return;
    }

    // Find the user with this customer ID
    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);

    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set(
      {
        id: subscriptionId,
        status: 'past_due',
        customerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update the user document
    await userRef.update({
      subscriptionStatus: 'past_due',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated subscription ${subscriptionId} to past_due for user ${userId}`);
    trackSubscriptionFunction('handleInvoicePaymentFailed', 'subscription_past_due', {
      userId,
      subscriptionId,
    });
    trackFunctionPerformance('handleInvoicePaymentFailed', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    captureCloudFunctionError(error, 'handleInvoicePaymentFailed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });
    trackFunctionPerformance('handleInvoicePaymentFailed', Date.now() - startTime, false);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  const startTime = Date.now();
  try {
    trackSubscriptionFunction('handleSubscriptionCreated', 'subscription_created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    console.log('Processing subscription created:', subscription.id);
    const db = admin.firestore();

    // Get the customer
    const customerId = subscription.customer;

    // Find the user with this customer ID
    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);

    // Create the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      customerId: customerId,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_start * 1000
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update the user document
    await userRef.update({
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Created subscription ${subscription.id} for user ${userId}`);
    trackSubscriptionFunction('handleSubscriptionCreated', 'subscription_stored', {
      userId,
      subscriptionId: subscription.id,
    });
    trackFunctionPerformance('handleSubscriptionCreated', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    captureCloudFunctionError(error, 'handleSubscriptionCreated', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });
    trackFunctionPerformance('handleSubscriptionCreated', Date.now() - startTime, false);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  const startTime = Date.now();
  try {
    trackSubscriptionFunction('handleSubscriptionUpdated', 'subscription_updated', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    console.log('Processing subscription updated:', subscription.id);
    const db = admin.firestore();

    // Get the customer
    const customerId = subscription.customer;

    // Find the user with this customer ID
    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);

    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set(
      {
        id: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id,
        customerId: customerId,
        currentPeriodStart: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_start * 1000
        ),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update the user document
    await userRef.update({
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated subscription ${subscription.id} for user ${userId}`);
    trackSubscriptionFunction('handleSubscriptionUpdated', 'subscription_synced', {
      userId,
      subscriptionId: subscription.id,
    });
    trackFunctionPerformance('handleSubscriptionUpdated', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    captureCloudFunctionError(error, 'handleSubscriptionUpdated', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });
    trackFunctionPerformance('handleSubscriptionUpdated', Date.now() - startTime, false);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  const startTime = Date.now();
  try {
    trackSubscriptionFunction('handleSubscriptionDeleted', 'subscription_deleted', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });

    console.log('Processing subscription deleted:', subscription.id);
    const db = admin.firestore();

    // Get the customer
    const customerId = subscription.customer;

    // Find the user with this customer ID
    const usersSnapshot = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);

    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set(
      {
        id: subscription.id,
        status: 'canceled',
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update the user document
    await userRef.update({
      subscriptionStatus: 'canceled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Marked subscription ${subscription.id} as canceled for user ${userId}`);
    trackSubscriptionFunction('handleSubscriptionDeleted', 'subscription_canceled', {
      userId,
      subscriptionId: subscription.id,
    });
    trackFunctionPerformance('handleSubscriptionDeleted', Date.now() - startTime, true);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    captureCloudFunctionError(error, 'handleSubscriptionDeleted', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });
    trackFunctionPerformance('handleSubscriptionDeleted', Date.now() - startTime, false);
  }
}

// Add user creation hook to set up Stripe customer
exports.onUserCreate = wrapEventFunction(onCreate(async (event) => {
  const user = event.data;
  const startTime = Date.now();
  try {
    trackSubscriptionFunction('onUserCreate', 'user_created', {
      userId: user.uid,
      email: user.email,
    });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);

    // Create a Stripe customer for the new user
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUserId: user.uid },
    });

    // Store customer ID in Firestore
    await userRef.set(
      {
        email: user.email,
        stripeCustomerId: customer.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Created Stripe customer for user ${user.uid}`);
    trackSubscriptionFunction('onUserCreate', 'customer_created', {
      userId: user.uid,
      customerId: customer.id,
    });
    trackFunctionPerformance('onUserCreate', Date.now() - startTime, true);
    return null;
  } catch (error) {
    console.error('Error creating Stripe customer on user creation:', error);
    captureCloudFunctionError(error, 'onUserCreate', {
      userId: user.uid,
    });
    trackFunctionPerformance('onUserCreate', Date.now() - startTime, false);
    return null;
  }
}));

// Referral + Reward Functions
const { generateReferralCode } = require("./generateReferralCode");
const { rewardReferrer } = require("./rewardReferrer");
exports.generateReferralCode = generateReferralCode;
exports.rewardReferrer = rewardReferrer;

// Database Consistency Triggers
const {
  syncSubscriptionStatus,
  syncCustomerId,
  standardizeStatusSpelling,
} = require("./database-consistency-triggers");
exports.syncSubscriptionStatus = syncSubscriptionStatus;
exports.syncCustomerId = syncCustomerId;
exports.standardizeStatusSpelling = standardizeStatusSpelling;

// Sentry Test Functions (for verification only - remove after testing)
const {
  sentryTest,
  sentryErrorTest,
  sentryRacingTest,
  sentryMLTest,
  sentryPerformanceTest,
} = require("./sentryTest");
exports.sentryTest = sentryTest;
exports.sentryErrorTest = sentryErrorTest;
exports.sentryRacingTest = sentryRacingTest;
exports.sentryMLTest = sentryMLTest;
exports.sentryPerformanceTest = sentryPerformanceTest;

// Scheduled Functions with Sentry Monitoring
const { 
  processScheduledNotifications, 
  cleanupOldNotifications 
} = require("./processScheduledNotifications");
const { updateReferralLeaderboard } = require("./leaderboardUpdates");
const { 
  processRssFeedsAndNotify,
  onNewRssItem 
} = require("./rssFeedNotifications");

// Export scheduled functions
exports.processScheduledNotifications = processScheduledNotifications;
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.updateReferralLeaderboard = updateReferralLeaderboard;
exports.processRssFeedsAndNotify = processRssFeedsAndNotify;
exports.onNewRssItem = onNewRssItem;

// Export TypeScript scheduled functions
exports.predictTodayGames = require("./lib/predictTodayGames").predictTodayGames;
exports.updateStatsPage = require("./lib/updateStatsPage").updateStatsPage;
