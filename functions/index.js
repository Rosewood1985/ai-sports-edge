const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const stripeWebhooks = require('./stripeWebhooks');
const stripeSubscriptions = require('./stripeSubscriptions');
const stripePayments = require('./stripePayments');
const subscriptionManagement = require('./subscriptionManagement');
const subscriptionGifting = require('./subscriptionGifting');
const autoResubscribe = require('./autoResubscribe');
const referralProgram = require('./referralProgram');
const referralRewards = require('./referralRewards');
const subscriptionAnalytics = require('./subscriptionAnalytics');
const aiSummary = require('./aiSummary');
const leaderboardUpdates = require('./leaderboardUpdates');
const notifications = require('./notifications');

// Export all functions
exports.stripeWebhook = stripeWebhooks.stripeWebhook;
exports.createStripeCustomer = stripeSubscriptions.createStripeCustomer;
exports.createSubscription = stripeSubscriptions.createSubscription;
exports.cancelSubscription = stripeSubscriptions.cancelSubscription;
exports.updatePaymentMethod = stripeSubscriptions.updatePaymentMethod;
exports.createOneTimePayment = stripeSubscriptions.createOneTimePayment;

// Export odds payment functions
exports.createPayment = stripePayments.createPayment;
exports.updatePurchaseRecord = stripePayments.updatePurchaseRecord;
exports.checkPurchaseStatus = stripePayments.checkPurchaseStatus;
exports.stripeOddsWebhook = stripePayments.stripeWebhook;

// Export subscription management functions
exports.updateSubscription = subscriptionManagement.updateSubscription;
exports.pauseSubscription = subscriptionManagement.pauseSubscription;
exports.resumeSubscription = subscriptionManagement.resumeSubscription;

// Export subscription gifting functions
exports.giftSubscription = subscriptionGifting.giftSubscription;
exports.redeemGiftSubscription = subscriptionGifting.redeemGiftSubscription;

// Export auto-resubscribe functions
exports.handleAutoResubscribe = autoResubscribe.handleAutoResubscribe;
exports.toggleAutoResubscribe = autoResubscribe.toggleAutoResubscribe;

// Export referral program functions
exports.generateReferralCode = referralProgram.generateReferralCode;
exports.applyReferralCode = referralProgram.applyReferralCode;
exports.processReferralReward = referralProgram.processReferralReward;
exports.processMilestoneReward = referralProgram.processMilestoneReward;

// Export referral rewards functions
exports.processReferralDiscount = referralRewards.processReferralDiscount;
exports.applyReferralDiscount = referralRewards.applyReferralDiscount;
exports.processSubscriptionExtension = referralRewards.processSubscriptionExtension;

// Export subscription analytics functions
exports.trackSubscriptionEvent = subscriptionAnalytics.trackSubscriptionEvent;
exports.generateSubscriptionReport = subscriptionAnalytics.generateSubscriptionReport;

// Export AI summary functions
exports.generateAISummary = aiSummary.generateAISummary;

// Export leaderboard update functions
exports.updateReferralLeaderboard = leaderboardUpdates.updateReferralLeaderboard;

// Export notification functions
exports.sendPredictionNotifications = notifications.sendPredictionNotifications;
exports.sendValueBetNotifications = notifications.sendValueBetNotifications;
exports.sendGameStartReminders = notifications.sendGameStartReminders;
exports.sendModelPerformanceUpdates = notifications.sendModelPerformanceUpdates;

// Add any existing functions from the project
try {
  const playerPlusMinusNotifications = require('./playerPlusMinusNotifications');
  exports.sendPlayerPlusMinusNotifications = playerPlusMinusNotifications.sendPlayerPlusMinusNotifications;
} catch (error) {
  console.log('playerPlusMinusNotifications module not found or has errors');
}

// Add user creation hook to set up Stripe customer
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    
    // Create a Stripe customer for the new user
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUserId: user.uid }
    });
    
    // Store customer ID in Firestore
    await userRef.set({
      email: user.email,
      stripeCustomerId: customer.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`Created Stripe customer for user ${user.uid}`);
    return null;
  } catch (error) {
    console.error('Error creating Stripe customer on user creation:', error);
    return null;
  }
});