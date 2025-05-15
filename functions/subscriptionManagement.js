const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Upgrade or downgrade a subscription
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Current subscription ID
 * @param {string} data.newPriceId - New price ID to upgrade/downgrade to
 * @param {boolean} data.immediate - Whether to apply changes immediately or at period end
 * @returns {Object} - Update details
 */
exports.updateSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is updating their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only update their own subscriptions.'
    );
  }

  // Validate required fields
  if (!data.subscriptionId || !data.newPriceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Subscription ID and new price ID are required.'
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(data.userId);
    const subscriptionRef = userRef.collection('subscriptions').doc(data.subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Subscription not found.'
      );
    }

    // Get the current price ID
    const currentPriceId = subscriptionDoc.data().priceId;

    // If the new price is the same as the current price, return early
    if (currentPriceId === data.newPriceId) {
      return {
        updated: false,
        message: 'New plan is the same as current plan'
      };
    }

    // Get the price details
    const price = await stripe.prices.retrieve(data.newPriceId, {
      expand: ['product']
    });

    // Update the subscription
    const updateParams = {
      proration_behavior: data.immediate ? 'create_prorations' : 'none',
      items: [{
        id: (await stripe.subscriptions.retrieve(data.subscriptionId)).items.data[0].id,
        price: data.newPriceId
      }]
    };

    const subscription = await stripe.subscriptions.update(
      data.subscriptionId,
      updateParams
    );

    // Update subscription in Firestore
    await subscriptionRef.update({
      priceId: data.newPriceId,
      planName: price.product.name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      updated: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      newPlanName: price.product.name
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Pause a subscription
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Subscription ID
 * @param {number} data.pauseDuration - Duration to pause in days (optional, default: 30)
 * @returns {Object} - Pause details
 */
exports.pauseSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is pausing their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only pause their own subscriptions.'
    );
  }

  // Validate required fields
  if (!data.subscriptionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Subscription ID is required.'
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(data.userId);
    const subscriptionRef = userRef.collection('subscriptions').doc(data.subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Subscription not found.'
      );
    }

    // Calculate resume date
    const pauseDuration = data.pauseDuration || 30; // Default to 30 days
    const resumeDate = new Date();
    resumeDate.setDate(resumeDate.getDate() + pauseDuration);

    // Pause the subscription
    const subscription = await stripe.subscriptions.update(
      data.subscriptionId,
      {
        pause_collection: {
          behavior: 'void',
          resumes_at: Math.floor(resumeDate.getTime() / 1000)
        }
      }
    );

    // Update subscription in Firestore
    await subscriptionRef.update({
      status: 'paused',
      pausedAt: admin.firestore.FieldValue.serverTimestamp(),
      resumesAt: admin.firestore.Timestamp.fromDate(resumeDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's subscription status
    await userRef.update({
      subscriptionStatus: 'paused',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      paused: true,
      subscriptionId: subscription.id,
      resumesAt: Math.floor(resumeDate.getTime() / 1000)
    };
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Resume a paused subscription
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Subscription ID
 * @returns {Object} - Resume details
 */
exports.resumeSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is resuming their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only resume their own subscriptions.'
    );
  }

  // Validate required fields
  if (!data.subscriptionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Subscription ID is required.'
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(data.userId);
    const subscriptionRef = userRef.collection('subscriptions').doc(data.subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Subscription not found.'
      );
    }

    // Resume the subscription
    const subscription = await stripe.subscriptions.update(
      data.subscriptionId,
      {
        pause_collection: ''
      }
    );

    // Update subscription in Firestore
    await subscriptionRef.update({
      status: subscription.status,
      pausedAt: null,
      resumesAt: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's subscription status
    await userRef.update({
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      resumed: true,
      subscriptionId: subscription.id,
      status: subscription.status
    };
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Export the functions
module.exports = {
  updateSubscription: exports.updateSubscription,
  pauseSubscription: exports.pauseSubscription,
  resumeSubscription: exports.resumeSubscription
};