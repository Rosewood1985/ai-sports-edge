const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");

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

// Import advanced Stripe features
const {
  calculateProration,
  updateSubscriptionWithProration,
  calculateTax,
  createMultiCurrencyPricing,
  getPricingForCurrency,
  createAdvancedSubscription
} = require('./stripeAdvancedFeatures');

// Import Stripe Extension integration
const {
  handleStripeWebhook,
  handleSubscriptionChange,
  onUserCreate
} = require('./stripeExtensionIntegration');

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

// Add user creation hook to set up Stripe customer (temporarily disabled for deployment)
/*
exports.onUserCreate = wrapEventFunction(functions.auth.user().onCreate(async (user) => {
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
*/

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
const { sentryTestMinimal } = require("./sentryTestMinimal");

exports.sentryTest = sentryTest;
exports.sentryTestMinimal = sentryTestMinimal;
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

// Export TypeScript scheduled functions (temporarily disabled for deployment)
/*
exports.predictTodayGames = require("./lib/predictTodayGames").predictTodayGames;
exports.updateStatsPage = require("./lib/updateStatsPage").updateStatsPage;
*/

// Export Sentry test function
const sentryTestModule = require("./sentryTest");
exports.sentryTest = sentryTestModule.sentryTest;

// Import simple Sentry functions for deployment verification
const {
  sentryBasicTest,
  healthCheck,
  performanceTest
} = require('./sentrySimpleFunctions');

// Import new generation functions with Sentry monitoring
const {
  sentryVerifyV2,
  stripeWebhookV2,
  processNotificationsV2,
  updateLeaderboardV2,
  dailyCleanupV2,
  backupUserDataV2
} = require('./sentryMonitoredFunctions');

// Export simple Sentry functions
exports.sentryBasicTest = sentryBasicTest;
exports.healthCheck = healthCheck;
exports.performanceTest = performanceTest;

// Export new generation scheduled functions
exports.sentryVerifyV2 = sentryVerifyV2;
exports.stripeWebhookV2 = stripeWebhookV2;
exports.processNotificationsV2 = processNotificationsV2;
exports.updateLeaderboardV2 = updateLeaderboardV2;
exports.dailyCleanupV2 = dailyCleanupV2;
exports.backupUserDataV2 = backupUserDataV2;

// Import and export sports data sync functions
const {
  syncLiveOddsV2,
  syncPlayerStatsV2,
  syncGameSchedulesV2,
  syncRacingDataV2,
  sportsDataHealthCheckV2
} = require('./sportsDataSyncV2');

exports.syncLiveOddsV2 = syncLiveOddsV2;
exports.syncPlayerStatsV2 = syncPlayerStatsV2;
exports.syncGameSchedulesV2 = syncGameSchedulesV2;
exports.syncRacingDataV2 = syncRacingDataV2;
exports.sportsDataHealthCheckV2 = sportsDataHealthCheckV2;

// Import and export UFC scheduled functions
const { syncUFCData } = require("./scheduled/sportsSync/syncUFCData");
const { syncUFCEvents } = require("./scheduled/sportsSync/syncUFCEvents");
const { syncUFCOdds } = require("./scheduled/sportsSync/syncUFCOdds");

exports.syncUFCData = syncUFCData;
exports.syncUFCEvents = syncUFCEvents;
exports.syncUFCOdds = syncUFCOdds;

// Import and export Stripe checkout functions
const {
  createCheckoutSession,
  handleSuccessfulPayment,
  checkEduDiscount,
  getCheckoutSessionStatus
} = require('./createCheckoutSession');

exports.createCheckoutSession = createCheckoutSession;
exports.handleSuccessfulPayment = handleSuccessfulPayment;
exports.checkEduDiscount = checkEduDiscount;
exports.getCheckoutSessionStatus = getCheckoutSessionStatus;

// Export advanced Stripe features
exports.calculateProration = calculateProration;
exports.updateSubscriptionWithProration = updateSubscriptionWithProration;
exports.calculateTax = calculateTax;
exports.createMultiCurrencyPricing = createMultiCurrencyPricing;
exports.getPricingForCurrency = getPricingForCurrency;
exports.createAdvancedSubscription = createAdvancedSubscription;

// Export subscription analytics
const { generateSubscriptionReport, trackSubscriptionEvent } = require('./subscriptionAnalytics');
exports.generateSubscriptionReport = generateSubscriptionReport;
exports.trackSubscriptionEvent = trackSubscriptionEvent;

// HTTP endpoint for admin dashboard
exports.subscriptionAnalytics = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Call the subscription report function
    const result = await generateSubscriptionReport({ timeRange: '30d' }, {
      auth: { uid: decodedToken.uid, token: decodedToken }
    });

    res.status(200).json({
      status: 200,
      message: 'Success',
      data: result
    });

  } catch (error) {
    console.error('Subscription analytics HTTP error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// HTTP endpoint for featured games (production data)
exports.featuredGames = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Fetch featured games from live_odds collection
    const db = admin.firestore();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const snapshot = await db.collection('live_odds')
      .where('timestamp', '>=', oneHourAgo)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const games = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.game && data.odds) {
        games.push({
          id: data.game.id || doc.id,
          homeTeam: {
            name: data.game.home_team || 'Home',
            logo: '🏠',
            score: data.game.home_score || null
          },
          awayTeam: {
            name: data.game.away_team || 'Away', 
            logo: '🏃',
            score: data.game.away_score || null
          },
          venue: data.game.venue || 'TBD',
          date: data.game.commence_time ? new Date(data.game.commence_time) : new Date(),
          status: data.game.completed ? 'completed' : 'live',
          quarter: data.game.quarter || 1,
          timeRemaining: data.game.time_remaining || '15:00'
        });
      }
    });

    trackFunctionPerformance('featuredGames', Date.now() - startTime, true);

    res.status(200).json({
      success: true,
      games: games,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Featured games API error:', error);
    captureCloudFunctionError(error, 'featuredGames');
    trackFunctionPerformance('featuredGames', Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured games',
      games: []
    });
  }
}));

// HTTP endpoint for trending topics (production data)
exports.trendingTopics = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Fetch trending topics from sports news feeds and analytics
    const db = admin.firestore();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get trending from RSS feed items and user analytics
    const rssSnapshot = await db.collection('rss_feed_items')
      .where('publishDate', '>=', oneHourAgo)
      .orderBy('publishDate', 'desc')
      .limit(5)
      .get();

    const topics = [];
    rssSnapshot.forEach(doc => {
      const data = doc.data();
      topics.push({
        id: doc.id,
        title: data.title || 'Sports News',
        image: data.category === 'news' ? '📰' : '🏀',
        category: data.category || 'news'
      });
    });

    // Add some real-time analytics-based trending topics
    const analyticsSnapshot = await db.collection('user_analytics')
      .where('timestamp', '>=', oneHourAgo)
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get();

    analyticsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.popular_topics) {
        data.popular_topics.forEach(topic => {
          topics.push({
            id: `analytics_${doc.id}_${topic.id}`,
            title: topic.title || 'Trending Analysis',
            image: '📊',
            category: 'analytics'
          });
        });
      }
    });

    trackFunctionPerformance('trendingTopics', Date.now() - startTime, true);

    res.status(200).json({
      success: true,
      topics: topics.slice(0, 6), // Limit to 6 topics
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trending topics API error:', error);
    captureCloudFunctionError(error, 'trendingTopics');
    trackFunctionPerformance('trendingTopics', Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics',
      topics: []
    });
  }
}));

// HTTP endpoint for game statistics (production data)
exports.gameStats = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const gameId = req.query.gameId;
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: "Game ID required"
      });
    }

    // Fetch game statistics from Firestore
    const db = admin.firestore();
    const gameStatsDoc = await db.collection("game_stats").doc(gameId).get();

    if (gameStatsDoc.exists) {
      const statsData = gameStatsDoc.data();
      trackFunctionPerformance("gameStats", Date.now() - startTime, true);

      res.status(200).json({
        success: true,
        stats: statsData,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return default stats structure if no data found
      trackFunctionPerformance("gameStats", Date.now() - startTime, true);
      
      res.status(200).json({
        success: true,
        stats: {
          home: {
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fieldGoalPercentage: "0%",
            threePointPercentage: "0%"
          },
          away: {
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fieldGoalPercentage: "0%",
            threePointPercentage: "0%"
          }
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error("Game stats API error:", error);
    captureCloudFunctionError(error, "gameStats");
    trackFunctionPerformance("gameStats", Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch game statistics"
    });
  }
}));

// HTTP endpoint for horse racing tracks (production data)
exports.racingTracks = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Fetch racing tracks from Firestore
    const db = admin.firestore();
    const tracksSnapshot = await db.collection("racing_tracks")
      .where("active", "==", true)
      .orderBy("name")
      .get();

    const tracks = [];
    tracksSnapshot.forEach(doc => {
      const data = doc.data();
      tracks.push({
        id: doc.id,
        name: data.name,
        code: data.code,
        location: data.location,
        country: data.country,
        timezone: data.timezone,
        surface: data.surface || ["dirt"]
      });
    });

    trackFunctionPerformance("racingTracks", Date.now() - startTime, true);

    res.status(200).json({
      success: true,
      tracks: tracks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Racing tracks API error:", error);
    captureCloudFunctionError(error, "racingTracks");
    trackFunctionPerformance("racingTracks", Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch racing tracks",
      tracks: []
    });
  }
}));

// HTTP endpoint for horse racing races (production data)
exports.racingRaces = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const trackId = req.query.trackId;
    const date = req.query.date || new Date().toISOString().split("T")[0];

    // Fetch racing data from Firestore
    const db = admin.firestore();
    let query = db.collection("racing_events")
      .where("date", "==", date)
      .orderBy("postTime");

    if (trackId) {
      query = query.where("trackId", "==", trackId);
    }

    const racesSnapshot = await query.limit(20).get();

    const races = [];
    racesSnapshot.forEach(doc => {
      const data = doc.data();
      races.push({
        id: doc.id,
        trackId: data.trackId,
        track: data.track,
        date: data.date,
        postTime: data.postTime,
        raceNumber: data.raceNumber,
        name: data.name,
        distance: data.distance,
        surface: data.surface,
        condition: data.condition,
        raceType: data.raceType,
        raceGrade: data.raceGrade,
        purse: data.purse,
        ageRestrictions: data.ageRestrictions,
        entries: data.entries || [],
        status: data.status,
        isStakes: data.isStakes || false,
        isGraded: data.isGraded || false
      });
    });

    trackFunctionPerformance("racingRaces", Date.now() - startTime, true);

    res.status(200).json({
      success: true,
      races: races,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Racing races API error:", error);
    captureCloudFunctionError(error, "racingRaces");
    trackFunctionPerformance("racingRaces", Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch racing data",
      races: []
    });
  }
}));

// HTTP endpoint for personalized recommendations (production data)
exports.personalizedRecommendations = wrapHttpFunction(onRequest({ cors: true }, async (req, res) => {
  const startTime = Date.now();
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required"
      });
    }

    // Fetch personalized recommendations from Firestore
    const db = admin.firestore();
    
    // Get user preferences
    const userPrefsDoc = await db.collection("user_preferences").doc(userId).get();
    const userPrefs = userPrefsDoc.exists ? userPrefsDoc.data() : {};
    
    // Get recommended bets based on user preferences
    const recsSnapshot = await db.collection("betting_recommendations")
      .where("userId", "==", userId)
      .where("active", "==", true)
      .orderBy("confidence", "desc")
      .limit(5)
      .get();

    const recommendedBets = [];
    recsSnapshot.forEach(doc => {
      const data = doc.data();
      recommendedBets.push({
        sport: data.sport,
        league: data.league,
        confidence: data.confidence,
        team1: data.team1,
        team2: data.team2,
        recommendation: data.recommendation,
        odds: data.odds
      });
    });

    // Get upcoming games for user's favorite sports
    const favoriteSports = userPrefs.favoriteSports || ["NBA", "NFL", "MLB"];
    const upcomingGamesSnapshot = await db.collection("upcoming_games")
      .where("league", "in", favoriteSports)
      .where("gameDate", ">=", new Date())
      .orderBy("gameDate")
      .limit(10)
      .get();

    const upcomingGames = [];
    upcomingGamesSnapshot.forEach(doc => {
      const data = doc.data();
      upcomingGames.push({
        league: data.league,
        time: data.gameTime,
        team1: data.team1,
        team2: data.team2,
        gameDate: data.gameDate
      });
    });

    // Get personalized news based on user interests
    const newsSnapshot = await db.collection("sports_news")
      .where("categories", "array-contains-any", userPrefs.newsCategories || ["general"])
      .orderBy("publishDate", "desc")
      .limit(10)
      .get();

    const news = [];
    newsSnapshot.forEach(doc => {
      const data = doc.data();
      news.push({
        title: data.title,
        image: data.image,
        source: data.source,
        time: data.publishDate,
        category: data.category
      });
    });

    trackFunctionPerformance("personalizedRecommendations", Date.now() - startTime, true);

    res.status(200).json({
      success: true,
      data: {
        recommendedBets,
        upcomingGames,
        news
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Personalized recommendations API error:", error);
    captureCloudFunctionError(error, "personalizedRecommendations");
    trackFunctionPerformance("personalizedRecommendations", Date.now() - startTime, false);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch personalized recommendations",
      data: {
        recommendedBets: [],
        upcomingGames: [],
        news: []
      }
    });
  }
}));

// Import and export ML sports integration
const { integrateAllSportsToML, integrateSportToML, SPORTS_CONFIG } = require('./mlSportsIntegration');
exports.integrateAllSportsToML = integrateAllSportsToML;
exports.integrateSportToML = integrateSportToML;
exports.mlSportsConfig = SPORTS_CONFIG;

// Import and export language analytics
const { languageSegmentedAnalytics, trackLanguageEvent } = require('./languageAnalytics');
exports.languageSegmentedAnalytics = languageSegmentedAnalytics;
exports.trackLanguageEvent = trackLanguageEvent;

// Import and export accessibility audit
const { accessibilityAudit } = require('./accessibilityAudit');
exports.accessibilityAudit = accessibilityAudit;

// Import and export security audit for Spanish features
const { securityAuditSpanish } = require('./securityAuditSpanish');
exports.securityAuditSpanish = securityAuditSpanish;

// Import and export Spanish content audit
const { auditSpanishContent } = require('./spanishContentAudit');
exports.auditSpanishContent = auditSpanishContent;

// Export Stripe Extension integration functions
exports.handleStripeExtensionWebhook = handleStripeWebhook;
exports.handleStripeSubscriptionChange = handleSubscriptionChange;
exports.onUserCreateStripe = onUserCreate;

console.log("All functions loaded successfully (including Sentry V2, UFC, Stripe checkout, advanced Stripe functions, Stripe Extension integration, subscription analytics, sports API endpoints, ML sports integration, and Spanish content audit)");
