const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Gift a subscription to another user
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID of the gifter
 * @param {string} data.recipientEmail - Email of the recipient
 * @param {string} data.priceId - Stripe price ID
 * @param {string} data.paymentMethodId - Stripe payment method ID
 * @param {number} data.giftDuration - Duration of the gift in months
 * @returns {Object} - Gift details
 */
exports.giftSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify the user is gifting from their own account
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Users can only gift subscriptions from their own account.'
    );
  }

  // Validate required fields
  if (!data.recipientEmail || !data.priceId || !data.paymentMethodId || !data.giftDuration) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Recipient email, price ID, payment method ID, and gift duration are required.'
    );
  }

  try {
    const db = admin.firestore();
    const gifterRef = db.collection('users').doc(data.userId);
    const gifterDoc = await gifterRef.get();

    // Get or create customer for the gifter
    let customerId;
    if (gifterDoc.exists && gifterDoc.data().stripeCustomerId) {
      customerId = gifterDoc.data().stripeCustomerId;
    } else {
      // Create a new customer
      const user = await admin.auth().getUser(data.userId);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebaseUserId: data.userId }
      });

      customerId = customer.id;
      await gifterRef.set(
        {
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    // Generate a unique gift code
    const giftCode = `GIFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Store the gift in Firestore
    await db.collection('giftSubscriptions').doc(giftCode).set({
      giftCode: giftCode,
      gifterId: data.userId,
      recipientEmail: data.recipientEmail,
      priceId: data.priceId,
      giftDuration: data.giftDuration,
      status: 'active',
      redeemed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      giftCode: giftCode,
      recipientEmail: data.recipientEmail,
      giftDuration: data.giftDuration
    };
  } catch (error) {
    console.error('Error gifting subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Export the functions
module.exports = {
  giftSubscription: exports.giftSubscription
};