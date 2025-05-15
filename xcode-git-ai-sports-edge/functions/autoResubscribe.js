const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Automatically resubscribe a user when their subscription expires
 * This function is triggered by a Firestore document update in the subscriptions collection
 */
exports.handleAutoResubscribe = functions.firestore
  .document('users/{userId}/subscriptions/{subscriptionId}')
  .onUpdate(async (change, context) => {
    const { userId, subscriptionId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only proceed if the subscription status changed from active to canceled
    // and cancelAtPeriodEnd is true (indicating it was canceled to expire at the end of the period)
    if (
      beforeData.status === 'active' &&
      afterData.status === 'canceled' &&
      afterData.cancelAtPeriodEnd === true
    ) {
      try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.log(`User ${userId} not found`);
          return null;
        }
        
        const userData = userDoc.data();
        
        // Check if user has auto-resubscribe enabled
        if (userData.autoResubscribe === true) {
          console.log(`Auto-resubscribe enabled for user ${userId}, subscription ${subscriptionId}`);
          
          // Get the original subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Get the price ID from the original subscription
          const priceId = subscription.items.data[0].price.id;
          
          // Get the payment method
          const paymentMethodId = userData.defaultPaymentMethodId || subscription.default_payment_method;
          
          if (!paymentMethodId) {
            console.error(`No payment method found for user ${userId}`);
            
            // Create a notification for the user
            await userRef.collection('notifications').add({
              type: 'auto_resubscribe_failed',
              title: 'Auto-Resubscribe Failed',
              message: 'We could not automatically renew your subscription because no payment method was found. Please update your payment method.',
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return null;
          }
          
          // Create a new subscription
          const newSubscription = await stripe.subscriptions.create({
            customer: userData.stripeCustomerId,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            metadata: {
              firebaseUserId: userId,
              autoResubscribed: 'true',
              originalSubscriptionId: subscriptionId
            }
          });
          
          console.log(`Created new subscription ${newSubscription.id} for user ${userId}`);
          
          // Update analytics for auto-resubscribe
          await db.collection('analytics').doc('subscriptions').collection('events').add({
            type: 'auto_resubscribe',
            userId: userId,
            originalSubscriptionId: subscriptionId,
            newSubscriptionId: newSubscription.id,
            priceId: priceId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Create a notification for the user
          await userRef.collection('notifications').add({
            type: 'auto_resubscribe_success',
            title: 'Subscription Renewed',
            message: 'Your subscription has been automatically renewed. Thank you for your continued support!',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          return newSubscription.id;
        } else {
          console.log(`Auto-resubscribe not enabled for user ${userId}`);
          return null;
        }
      } catch (error) {
        console.error('Error in auto-resubscribe function:', error);
        return null;
      }
    }
    
    return null;
  });

/**
 * Toggle auto-resubscribe setting for a user
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {boolean} data.enabled - Whether to enable or disable auto-resubscribe
 * @returns {Object} - Update status
 */
exports.toggleAutoResubscribe = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is updating their own setting
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only update their own settings.'
    );
  }

  // Validate required fields
  if (data.enabled === undefined) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The "enabled" parameter is required.'
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(data.userId);
    
    await userRef.update({
      autoResubscribe: data.enabled,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Track the setting change in analytics
    await db.collection('analytics').doc('subscriptions').collection('events').add({
      type: 'auto_resubscribe_setting_changed',
      userId: data.userId,
      enabled: data.enabled,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      updated: true,
      autoResubscribe: data.enabled
    };
  } catch (error) {
    console.error('Error toggling auto-resubscribe:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Export the functions
module.exports = {
  handleAutoResubscribe: exports.handleAutoResubscribe,
  toggleAutoResubscribe: exports.toggleAutoResubscribe
};