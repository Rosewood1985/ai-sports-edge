const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Create a Stripe customer for a user
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @returns {Object} - Stripe customer object
 */
exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is creating a customer for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only create customers for themselves."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    // Check if user already has a Stripe customer ID
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      // Return existing customer
      const customer = await stripe.customers.retrieve(userDoc.data().stripeCustomerId);
      return { customerId: customer.id };
    }

    // Get user details
    const user = await admin.auth().getUser(data.userId);

    // Create a new customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUserId: data.userId }
    });

    // Store customer ID in Firestore
    await userRef.set(
      {
        stripeCustomerId: customer.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return { customerId: customer.id };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Create a subscription for a user
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.paymentMethodId - Stripe payment method ID
 * @param {string} data.priceId - Stripe price ID
 * @param {string} data.promoCode - Optional promotion code
 * @returns {Object} - Subscription details
 */
exports.createSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is creating a subscription for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only create subscriptions for themselves."
    );
  }

  // Validate required fields
  if (!data.paymentMethodId || !data.priceId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payment method ID and price ID are required."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    // Get or create customer
    let customerId;
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      // Create a new customer
      const user = await admin.auth().getUser(data.userId);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebaseUserId: data.userId }
      });

      customerId = customer.id;
      await userRef.set(
        {
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: data.paymentMethodId }
    });

    // Create subscription with optional promo code
    const subscriptionParams = {
      customer: customerId,
      items: [{ price: data.priceId }],
      expand: ["latest_invoice.payment_intent"]
    };

    // Apply promotion code if provided
    if (data.promoCode) {
      try {
        // Validate the promotion code
        const promotionCodes = await stripe.promotionCodes.list({
          code: data.promoCode,
          active: true,
          limit: 1
        });

        if (promotionCodes.data.length > 0) {
          subscriptionParams.promotion_code = promotionCodes.data[0].id;
        } else {
          console.log(`Invalid or inactive promo code: ${data.promoCode}`);
        }
      } catch (promoError) {
        console.error("Error validating promo code:", promoError);
        // Continue without the promo code if there's an error
      }
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Get the price details
    const price = await stripe.prices.retrieve(data.priceId, {
      expand: ["product"]
    });

    // Store subscription in Firestore
    await userRef.collection("subscriptions").doc(subscription.id).set({
      status: subscription.status,
      priceId: data.priceId,
      planName: price.product.name,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's subscription status
    await userRef.update({
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    };
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cancel a subscription
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Stripe subscription ID
 * @param {boolean} data.immediate - Whether to cancel immediately or at period end
 * @returns {Object} - Cancellation details
 */
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is canceling their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only cancel their own subscriptions."
    );
  }

  // Validate required fields
  if (!data.subscriptionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Subscription ID is required."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const subscriptionRef = userRef.collection("subscriptions").doc(data.subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Subscription not found."
      );
    }

    // Cancel the subscription
    const cancelOptions = {};
    if (!data.immediate) {
      cancelOptions.cancel_at_period_end = true;
    }

    const subscription = await stripe.subscriptions.update(
      data.subscriptionId,
      cancelOptions
    );

    // If immediate cancellation, cancel the subscription
    if (data.immediate) {
      await stripe.subscriptions.del(data.subscriptionId);
    }

    // Update subscription in Firestore
    await subscriptionRef.update({
      status: data.immediate ? "canceled" : subscription.status,
      cancelAtPeriodEnd: data.immediate ? false : true,
      canceledAt: data.immediate ? admin.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's subscription status if immediate cancellation
    if (data.immediate) {
      await userRef.update({
        subscriptionStatus: "canceled",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      canceled: true,
      immediate: data.immediate,
      status: data.immediate ? "canceled" : subscription.status
    };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Update a payment method
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.paymentMethodId - New Stripe payment method ID
 * @returns {Object} - Update details
 */
exports.updatePaymentMethod = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is updating their own payment method
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only update their own payment methods."
    );
  }

  // Validate required fields
  if (!data.paymentMethodId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payment method ID is required."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
      throw new functions.https.HttpsError(
        "not-found",
        "User does not have a Stripe customer ID."
      );
    }

    const customerId = userDoc.data().stripeCustomerId;

    // Attach new payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: data.paymentMethodId }
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(data.paymentMethodId);

    // Store payment method in Firestore
    await userRef.collection("paymentMethods").doc(data.paymentMethodId).set({
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand || "unknown",
      last4: paymentMethod.card?.last4 || "0000",
      expiryMonth: paymentMethod.card?.exp_month || 0,
      expiryYear: paymentMethod.card?.exp_year || 0,
      isDefault: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update existing payment methods to not be default
    const paymentMethodsSnapshot = await userRef.collection("paymentMethods")
      .where("isDefault", "==", true)
      .where(admin.firestore.FieldPath.documentId(), "!=", data.paymentMethodId)
      .get();

    const batch = db.batch();
    paymentMethodsSnapshot.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });
    await batch.commit();

    return {
      updated: true,
      paymentMethodId: data.paymentMethodId,
      brand: paymentMethod.card?.brand || "unknown",
      last4: paymentMethod.card?.last4 || "0000"
    };
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Create a one-time payment
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.paymentMethodId - Stripe payment method ID
 * @param {string} data.productId - Product ID
 * @param {number} data.amount - Amount in cents
 * @param {string} data.currency - Currency code (default: 'usd')
 * @param {number} data.duration - Duration in hours (optional)
 * @returns {Object} - Payment details
 */
exports.createOneTimePayment = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is making a payment for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only make payments for themselves."
    );
  }

  // Validate required fields
  if (!data.paymentMethodId || !data.productId || !data.amount) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payment method ID, product ID, and amount are required."
    );
  }

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    // Get or create customer
    let customerId;
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      // Create a new customer
      const user = await admin.auth().getUser(data.userId);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebaseUserId: data.userId }
      });

      customerId = customer.id;
      await userRef.set(
        {
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    // Attach payment method to customer if not already attached
    try {
      await stripe.paymentMethods.attach(data.paymentMethodId, {
        customer: customerId
      });
    } catch (error) {
      // Ignore error if payment method is already attached
      if (!error.message.includes("already been attached")) {
        throw error;
      }
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || "usd",
      customer: customerId,
      payment_method: data.paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        type: "one_time",
        userId: data.userId,
        productId: data.productId,
        duration: data.duration ? data.duration.toString() : undefined
      }
    });

    // Store the payment in Firestore
    await userRef.collection("purchases").doc(paymentIntent.id).set({
      productId: data.productId,
      amount: data.amount,
      currency: data.currency || "usd",
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If this is a one-time purchase with duration (like a weekend pass)
    if (data.duration) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + data.duration);

      await userRef.collection("purchases").doc(paymentIntent.id).update({
        duration: data.duration,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
      });
    }

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error("Error creating one-time payment:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Export the functions
module.exports = {
  createStripeCustomer: exports.createStripeCustomer,
  createSubscription: exports.createSubscription,
  cancelSubscription: exports.cancelSubscription,
  updatePaymentMethod: exports.updatePaymentMethod,
  createOneTimePayment: exports.createOneTimePayment
};