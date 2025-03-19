const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('./stripeConfig').stripe;

/**
 * Prepare payment for group subscription
 * 
 * This function creates a payment intent and ephemeral key for the Stripe payment sheet
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {Array<string>} data.memberEmails - Array of member emails
 * @returns {Object} - Payment data for Stripe payment sheet
 */
exports.prepareGroupSubscriptionPayment = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a group subscription.'
    );
  }

  const userId = context.auth.uid;

  try {
    // Validate required fields
    if (!data.userId || !data.memberEmails) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID and member emails are required.'
      );
    }

    // Verify the authenticated user matches the requested user ID
    if (userId !== data.userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only prepare payments for your own account.'
      );
    }

    // Get user document
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }

    const userData = userDoc.data();

    // Check if user already has a Stripe customer ID
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: {
          firebaseUserId: userId
        }
      });
      
      customerId = customer.id;
      
      // Update user document with Stripe customer ID
      await userRef.update({
        stripeCustomerId: customerId
      });
    }

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2020-08-27' }
    );

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 14999, // $149.99
      currency: 'usd',
      customer: customerId,
      metadata: {
        firebaseUserId: userId,
        type: 'group_subscription',
        memberCount: data.memberEmails.length + 1 // +1 for the owner
      }
    });

    // Return the payment data
    return {
      customerId,
      ephemeralKey: ephemeralKey.secret,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error('Error preparing group subscription payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});