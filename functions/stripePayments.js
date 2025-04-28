/**
 * Stripe Payment Functions
 * 
 * Firebase Cloud Functions for handling Stripe payments and purchase records.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key || 'PLACEHOLDER_STRIPE_SECRET_KEY');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get Firestore instance
const db = admin.firestore();

/**
 * Create a payment intent for purchasing odds
 * 
 * @param {Object} data - Request data
 * @param {string} data.userId - User ID
 * @param {string} data.productId - Product ID (game ID)
 * @param {number} data.price - Price in cents
 * @param {string} data.productName - Product name
 * @returns {Object} - Payment intent client secret
 */
exports.createPayment = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to make a payment'
    );
  }

  const { userId, productId, price, productName } = data;

  // Validate inputs
  if (!userId || !productId || !price || !productName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price, // Price in cents
      currency: 'usd',
      metadata: {
        userId,
        productId,
        productName,
      },
    });

    // Log payment intent creation
    console.log(`Created payment intent for user ${userId}, product ${productId}`);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Update purchase record in Firestore
 * 
 * @param {Object} data - Request data
 * @param {string} data.userId - User ID
 * @param {string} data.gameId - Game ID
 * @param {string} data.timestamp - Timestamp
 * @returns {Object} - Success status
 */
exports.updatePurchaseRecord = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update purchase records'
    );
  }

  const { userId, gameId, timestamp } = data;

  // Validate inputs
  if (!userId || !gameId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Update purchase record in Firestore
    await db.collection('user_purchases').doc(userId).set(
      {
        [gameId]: {
          hasPurchased: true,
          timestamp: timestamp || new Date().toISOString(),
        },
      },
      { merge: true }
    );

    // Log purchase record update
    console.log(`Updated purchase record for user ${userId}, game ${gameId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating purchase record:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Check if user has purchased odds for a specific game
 * 
 * @param {Object} data - Request data
 * @param {string} data.userId - User ID
 * @param {string} data.gameId - Game ID
 * @returns {Object} - Purchase status
 */
exports.checkPurchaseStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to check purchase status'
    );
  }

  const { userId, gameId } = data;

  // Validate inputs
  if (!userId || !gameId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    // Get purchase record from Firestore
    const purchaseDoc = await db.collection('user_purchases').doc(userId).get();
    
    if (!purchaseDoc.exists) {
      return { hasPurchased: false };
    }
    
    const purchaseData = purchaseDoc.data();
    return {
      hasPurchased: purchaseData[gameId]?.hasPurchased || false,
      timestamp: purchaseData[gameId]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error checking purchase status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Handle Stripe webhook events
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret || 'PLACEHOLDER_WEBHOOK_SECRET';
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      endpointSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { userId, productId } = paymentIntent.metadata;
    
    // Update purchase record in Firestore
    if (userId && productId) {
      try {
        await db.collection('user_purchases').doc(userId).set(
          {
            [productId]: {
              hasPurchased: true,
              timestamp: new Date().toISOString(),
            },
          },
          { merge: true }
        );
        
        console.log(`Purchase record updated for user ${userId}, game ${productId}`);
      } catch (error) {
        console.error('Error updating purchase record from webhook:', error);
      }
    }
  }
  
  res.status(200).send({ received: true });
});