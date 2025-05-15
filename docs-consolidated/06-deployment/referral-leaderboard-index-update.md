# Updating functions/index.js for Referral Leaderboard

To integrate the new leaderboard update functions into the Firebase Cloud Functions, the `functions/index.js` file needs to be updated. Here's how to update it:

## 1. Import the leaderboardUpdates module

Add the following line to the imports section:

```javascript
const leaderboardUpdates = require('./leaderboardUpdates');
```

This should be added after line 15, with the other module imports:

```javascript
// Import function modules
const stripeWebhooks = require('./stripeWebhooks');
const stripeSubscriptions = require('./stripeSubscriptions');
const subscriptionManagement = require('./subscriptionManagement');
const subscriptionGifting = require('./subscriptionGifting');
const autoResubscribe = require('./autoResubscribe');
const referralProgram = require('./referralProgram');
const subscriptionAnalytics = require('./subscriptionAnalytics');
const aiSummary = require('./aiSummary');
const leaderboardUpdates = require('./leaderboardUpdates');
```

## 2. Export the leaderboard update functions

Add the following lines to export the new functions:

```javascript
// Export leaderboard update functions
exports.updateReferralLeaderboard = leaderboardUpdates.updateReferralLeaderboard;
exports.processMilestoneReward = referralProgram.processMilestoneReward;
```

This should be added after line 48, with the other function exports:

```javascript
// Export AI summary functions
exports.generateAISummary = aiSummary.generateAISummary;

// Export leaderboard update functions
exports.updateReferralLeaderboard = leaderboardUpdates.updateReferralLeaderboard;
exports.processMilestoneReward = referralProgram.processMilestoneReward;

// Add any existing functions from the project
```

## 3. Complete Updated functions/index.js

Here's the complete updated `functions/index.js` file:

```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const stripeWebhooks = require('./stripeWebhooks');
const stripeSubscriptions = require('./stripeSubscriptions');
const subscriptionManagement = require('./subscriptionManagement');
const subscriptionGifting = require('./subscriptionGifting');
const autoResubscribe = require('./autoResubscribe');
const referralProgram = require('./referralProgram');
const subscriptionAnalytics = require('./subscriptionAnalytics');
const aiSummary = require('./aiSummary');
const leaderboardUpdates = require('./leaderboardUpdates');

// Export all functions
exports.stripeWebhook = stripeWebhooks.stripeWebhook;
exports.createStripeCustomer = stripeSubscriptions.createStripeCustomer;
exports.createSubscription = stripeSubscriptions.createSubscription;
exports.cancelSubscription = stripeSubscriptions.cancelSubscription;
exports.updatePaymentMethod = stripeSubscriptions.updatePaymentMethod;
exports.createOneTimePayment = stripeSubscriptions.createOneTimePayment;

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

// Export subscription analytics functions
exports.trackSubscriptionEvent = subscriptionAnalytics.trackSubscriptionEvent;
exports.generateSubscriptionReport = subscriptionAnalytics.generateSubscriptionReport;

// Export AI summary functions
exports.generateAISummary = aiSummary.generateAISummary;

// Export leaderboard update functions
exports.updateReferralLeaderboard = leaderboardUpdates.updateReferralLeaderboard;
exports.processMilestoneReward = referralProgram.processMilestoneReward;

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
```

## 4. Implementation Notes

- The `updateReferralLeaderboard` function is a scheduled function that runs daily to update the leaderboard.
- The `processMilestoneReward` function is a Firestore trigger that runs when a user's referral count changes.
- Both functions are essential for the gamified referral system to work properly.

## 5. Deployment

After updating the `functions/index.js` file, deploy the functions using the Firebase CLI:

```bash
firebase deploy --only functions
```

This will deploy all the functions, including the new leaderboard update functions.