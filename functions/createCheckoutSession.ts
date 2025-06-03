import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { initSentry } from "./sentryConfig";

// Initialize Sentry for monitoring
const Sentry = initSentry();

// Stripe configuration
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: "2023-10-16",
});

// Stripe price IDs - these should match your actual Stripe price IDs
export const STRIPE_PRICES = {
  BASIC_MONTHLY: "price_basic_monthly",
  PREMIUM_MONTHLY: "price_premium_monthly", 
  PREMIUM_YEARLY: "price_premium_yearly",
  GROUP_PRO_MONTHLY: "price_group_pro_monthly",
  WEEKEND_PASS: "price_weekend_pass",
  GAME_DAY_PASS: "price_game_day_pass"
};

// Educational discount promo code
export const EDU_PROMO_CODE_ID = "promo_edu_discount_50";

interface CheckoutSessionData {
  userId: string;
  priceId: string;
  promoCodeId?: string;
  metadata?: Record<string, string>;
}

/**
 * Firebase Cloud Function to create Stripe Checkout sessions
 * Handles subscription creation with educational discounts and analytics tracking
 */
export const createCheckoutSession = functions.https.onCall(async (data: CheckoutSessionData, context) => {
  try {
    Sentry.addBreadcrumb({
      message: "Creating checkout session",
      level: "info",
      data: { userId: data.userId, priceId: data.priceId }
    });

    const { userId, priceId, promoCodeId, metadata = {} } = data;

    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    // Validate required parameters
    if (!userId || !priceId) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required parameters: userId and priceId");
    }

    // Validate price ID
    if (!Object.values(STRIPE_PRICES).includes(priceId)) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid priceId: ${priceId}`);
    }

    // Validate user authorization
    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError("permission-denied", "User can only create sessions for themselves");
    }

    // Get user record
    const userRecord = await admin.auth().getUser(userId);
    const userEmail = userRecord.email;

    if (!userEmail) {
      throw new functions.https.HttpsError("not-found", "User email not found");
    }

    // Check for educational discount eligibility
    const isEdu = userEmail.endsWith(".edu");
    const applyPromo = isEdu && promoCodeId === EDU_PROMO_CODE_ID;

    // Determine if this is a subscription or one-time payment
    const isSubscription = [
      STRIPE_PRICES.BASIC_MONTHLY,
      STRIPE_PRICES.PREMIUM_MONTHLY,
      STRIPE_PRICES.PREMIUM_YEARLY,
      STRIPE_PRICES.GROUP_PRO_MONTHLY
    ].includes(priceId);

    const sessionMode = isSubscription ? "subscription" : "payment";

    // Create Stripe checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: sessionMode,
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://aisportsedge.app/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://aisportsedge.app/checkout-cancel",
      metadata: {
        userId,
        isEdu: applyPromo.toString(),
        planType: isSubscription ? "subscription" : "one-time",
        ...metadata
      },
      // Apply discount if eligible
      ...(applyPromo && { discounts: [{ promotion_code: promoCodeId }] }),
      // Enable tax collection
      automatic_tax: { enabled: true },
      // Collect billing address for tax purposes
      billing_address_collection: "required",
      // Set up subscription behavior
      ...(isSubscription && {
        subscription_data: {
          metadata: {
            userId,
            isEdu: applyPromo.toString()
          }
        }
      })
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log subscription intent in user profile
    await admin.firestore().collection("users").doc(userId).set({
      subscriptionIntent: {
        sessionId: session.id,
        plan: priceId,
        isEdu: applyPromo,
        planType: isSubscription ? "subscription" : "one-time",
        timestamp: Date.now(),
        status: "pending"
      }
    }, { merge: true });

    // Log detailed analytics for funnel tracking
    await admin.firestore().collection("subscription_logs").add({
      userId,
      email: userEmail,
      sessionId: session.id,
      plan: priceId,
      planType: isSubscription ? "subscription" : "one-time",
      isEdu: applyPromo,
      promoCodeUsed: promoCodeId || null,
      userAgent: context.rawRequest?.headers["user-agent"] || null,
      ipAddress: context.rawRequest?.ip || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "session_created"
    });

    // Track analytics event
    await admin.firestore().collection("analytics_events").add({
      eventType: "checkout_session_created",
      userId,
      properties: {
        plan: priceId,
        isEdu: applyPromo,
        sessionId: session.id,
        planType: isSubscription ? "subscription" : "one-time"
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Checkout session created for user ${userId}: ${session.id}`);

    return { 
      url: session.url,
      sessionId: session.id,
      isEdu: applyPromo
    };

  } catch (error) {
    Sentry.captureException(error);
    console.error("Error creating checkout session:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError("internal", "Failed to create checkout session");
  }
});

/**
 * Helper function to handle successful payments
 */
export const handleSuccessfulPayment = functions.https.onCall(async (data: { sessionId: string }, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { sessionId } = data;
    const userId = context.auth.uid;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.metadata?.userId !== userId) {
      throw new functions.https.HttpsError("permission-denied", "Session does not belong to user");
    }

    // Update user profile with successful payment
    await admin.firestore().collection("users").doc(userId).update({
      "subscriptionIntent.status": "completed",
      "subscriptionIntent.completedAt": Date.now(),
      lastPayment: {
        sessionId,
        amount: session.amount_total,
        currency: session.currency,
        timestamp: Date.now()
      }
    });

    // Log successful conversion
    await admin.firestore().collection("subscription_logs").add({
      userId,
      sessionId,
      status: "payment_successful",
      amount: session.amount_total,
      currency: session.currency,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    Sentry.captureException(error);
    console.error("Error handling successful payment:", error);
    throw new functions.https.HttpsError("internal", "Failed to process successful payment");
  }
});

/**
 * Function to check educational discount eligibility
 */
export const checkEduDiscount = functions.https.onCall(async (data: { email: string }, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { email } = data;
    const isEligible = email.endsWith(".edu");

    return { 
      isEligible,
      discountCode: isEligible ? EDU_PROMO_CODE_ID : null,
      discountPercentage: isEligible ? 50 : 0
    };

  } catch (error) {
    Sentry.captureException(error);
    console.error("Error checking edu discount:", error);
    throw new functions.https.HttpsError("internal", "Failed to check educational discount");
  }
});