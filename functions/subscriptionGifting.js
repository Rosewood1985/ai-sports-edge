const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is gifting from their own account
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only gift subscriptions from their own account."
    );
  }

  // Validate required fields
  if (!data.recipientEmail || !data.priceId || !data.paymentMethodId || !data.giftDuration) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Recipient email, price ID, payment method ID, and gift duration are required."
    );
  }

  try {
    const db = admin.firestore();
    const gifterRef = db.collection("users").doc(data.userId);
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
    await db.collection("giftSubscriptions").doc(giftCode).set({
      giftCode: giftCode,
      gifterId: data.userId,
      recipientEmail: data.recipientEmail,
      priceId: data.priceId,
      giftDuration: data.giftDuration,
      status: "active",
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
    console.error("Error gifting subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Redeem a gift subscription
 * @param {Object} data - Request data
 * @param {string} data.giftCode - Gift code to redeem
 * @returns {Object} - Redemption details
 */
exports.redeemGiftSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Validate required fields
  if (!data.giftCode) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Gift code is required."
    );
  }

  try {
    const db = admin.firestore();
    const userId = context.auth.uid;
    
    // Get the gift subscription
    const giftRef = db.collection("giftSubscriptions").doc(data.giftCode);
    const giftDoc = await giftRef.get();
    
    if (!giftDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Gift subscription not found."
      );
    }
    
    const giftData = giftDoc.data();
    
    // Check if already redeemed
    if (giftData.redeemed) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Gift subscription has already been redeemed."
      );
    }
    
    // Check if recipient email matches
    if (giftData.recipientEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "This gift subscription is for a different email address."
      );
    }
    
    // Calculate subscription end date based on gift duration
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + giftData.giftDuration);
    
    // Create subscription in Firestore
    const subscriptionRef = db.collection("users").doc(userId)
      .collection("subscriptions").doc();
    
    await subscriptionRef.set({
      status: "active",
      priceId: giftData.priceId,
      currentPeriodStart: admin.firestore.Timestamp.fromDate(now),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
      cancelAtPeriodEnd: true, // Auto-cancel at the end of gift period
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      giftedBy: giftData.gifterId,
      isGift: true
    });
    
    // Update user's subscription status
    await db.collection("users").doc(userId).update({
      subscriptionStatus: "active",
      subscriptionId: subscriptionRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark gift as redeemed
    await giftRef.update({
      redeemed: true,
      redeemedBy: userId,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      subscriptionId: subscriptionRef.id,
      expiresAt: endDate.getTime()
    };
  } catch (error) {
    console.error("Error redeeming gift subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Export the functions
module.exports = {
  giftSubscription: exports.giftSubscription,
  redeemGiftSubscription: exports.redeemGiftSubscription
};