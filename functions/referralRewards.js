const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Process referral discount for a new user
 * This function applies a discount to the first subscription for a referred user
 * @param {Object} data - Request data
 * @param {string} data.userId - User ID of the referred user
 * @returns {Object} - Discount details
 */
exports.processReferralDiscount = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is requesting a discount for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only request discounts for themselves."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found."
      );
    }
    
    const userData = userDoc.data();
    
    // Check if user was referred by someone
    if (!userData.referredBy) {
      return {
        success: false,
        message: "User was not referred by anyone.",
        discountApplied: false
      };
    }
    
    // Check if discount has already been applied
    if (userData.referralDiscountApplied) {
      return {
        success: false,
        message: "Referral discount has already been applied.",
        discountApplied: true
      };
    }
    
    // Create a Stripe coupon for 10% off
    const coupon = await stripe.coupons.create({
      percent_off: 10,
      duration: "once",
      metadata: {
        userId: data.userId,
        referrerId: userData.referredBy,
        referralCode: userData.referralCodeUsed
      }
    });
    
    // Store the coupon ID in the user's document
    await userRef.update({
      referralDiscountCouponId: coupon.id,
      referralDiscountAmount: 10, // 10% off
      referralDiscountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Track the discount in analytics
    await db.collection("analytics").doc("referrals").collection("events").add({
      type: "referral_discount_created",
      userId: data.userId,
      referrerId: userData.referredBy,
      discountAmount: 10,
      couponId: coupon.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: "Referral discount created successfully.",
      discountApplied: true,
      discountAmount: 10,
      couponId: coupon.id
    };
  } catch (error) {
    console.error("Error processing referral discount:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Apply referral discount to a subscription
 * This function is called during the subscription creation process
 * @param {Object} data - Request data
 * @param {string} data.userId - User ID
 * @param {string} data.couponId - Stripe coupon ID
 * @returns {Object} - Result of applying the discount
 */
exports.applyReferralDiscount = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is applying a discount for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only apply discounts for themselves."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found."
      );
    }
    
    const userData = userDoc.data();
    
    // Check if discount has already been applied
    if (userData.referralDiscountApplied) {
      return {
        success: false,
        message: "Referral discount has already been applied.",
        discountApplied: true
      };
    }
    
    // Verify the coupon ID matches the one stored for the user
    if (userData.referralDiscountCouponId !== data.couponId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid coupon ID."
      );
    }
    
    // Mark the discount as applied
    await userRef.update({
      referralDiscountApplied: true,
      referralDiscountAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Track the discount application in analytics
    await db.collection("analytics").doc("referrals").collection("events").add({
      type: "referral_discount_applied",
      userId: data.userId,
      referrerId: userData.referredBy,
      discountAmount: userData.referralDiscountAmount,
      couponId: data.couponId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a notification for the user
    await userRef.collection("notifications").add({
      type: "referral_discount_applied",
      title: "Referral Discount Applied",
      message: `Your ${userData.referralDiscountAmount}% referral discount has been applied to your subscription!`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: "Referral discount applied successfully.",
      discountApplied: true,
      discountAmount: userData.referralDiscountAmount
    };
  } catch (error) {
    console.error("Error applying referral discount:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Process subscription extension reward for a referrer
 * @param {Object} data - Request data
 * @param {string} data.referrerId - User ID of the referrer
 * @param {string} data.referredUserId - User ID of the referred user
 * @param {number} data.extensionDays - Number of days to extend the subscription
 * @returns {Object} - Result of processing the reward
 */
exports.processSubscriptionExtension = functions.https.onCall(async (data, context) => {
  // Only allow this function to be called by other Firebase functions or admin
  if (context.auth && context.auth.token.firebase.sign_in_provider !== "custom") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This function can only be called by admin or other Firebase functions."
    );
  }

  try {
    const { referrerId, referredUserId, extensionDays = 30 } = data; // Default to 30 days (1 month)
    
    if (!referrerId || !referredUserId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "referrerId and referredUserId are required."
      );
    }
    
    const db = admin.firestore();
    
    // Get user's active subscription
    const subscriptionsQuery = await db.collection("users").doc(referrerId)
      .collection("subscriptions")
      .where("status", "==", "active")
      .limit(1)
      .get();
    
    if (subscriptionsQuery.empty) {
      console.log(`No active subscription found for user ${referrerId}`);
      
      // Store the extension for future use
      await db.collection("users").doc(referrerId).update({
        pendingSubscriptionExtensionDays: admin.firestore.FieldValue.increment(extensionDays),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        message: "No active subscription found. Extension will be applied when user subscribes.",
        extensionApplied: false,
        pendingExtension: true
      };
    }
    
    const subscriptionDoc = subscriptionsQuery.docs[0];
    const subscriptionId = subscriptionDoc.id;
    const subscriptionData = subscriptionDoc.data();
    
    // Calculate new end date
    const currentPeriodEnd = subscriptionData.currentPeriodEnd.toDate();
    const newPeriodEnd = new Date(currentPeriodEnd);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + extensionDays);
    
    // Update subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      proration_behavior: "none",
      trial_end: Math.floor(newPeriodEnd.getTime() / 1000)
    });
    
    // Update subscription in Firestore
    await subscriptionDoc.ref.update({
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      referralRewardApplied: true,
      referralRewardDetails: {
        extensionDays,
        referredUserId,
        appliedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });
    
    // Track the reward in analytics
    await db.collection("analytics").doc("referrals").collection("events").add({
      type: "subscription_extension_applied",
      referrerId,
      referredUserId,
      extensionDays,
      subscriptionId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create a notification for the referrer
    await db.collection("users").doc(referrerId).collection("notifications").add({
      type: "subscription_extension",
      title: "Subscription Extended",
      message: `Your subscription has been extended by ${extensionDays} days as a reward for your referral!`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Extended subscription ${subscriptionId} for user ${referrerId} by ${extensionDays} days`);
    
    return {
      success: true,
      message: "Subscription extension applied successfully.",
      extensionApplied: true,
      extensionDays,
      newEndDate: newPeriodEnd.toISOString()
    };
  } catch (error) {
    console.error("Error processing subscription extension:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Export the functions
module.exports = {
  processReferralDiscount: exports.processReferralDiscount,
  applyReferralDiscount: exports.applyReferralDiscount,
  processSubscriptionExtension: exports.processSubscriptionExtension
};