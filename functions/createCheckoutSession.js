// =============================================================================
// CREATE CHECKOUT SESSION FIREBASE FUNCTION
// Secure server-side Stripe checkout session creation with educational discounts
// =============================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import Sentry monitoring
const {
  wrapHttpFunction,
  trackStripeFunction,
  captureCloudFunctionError,
  trackFunctionPerformance,
} = require('./sentryConfig');

/**
 * Create a Stripe checkout session with educational discount support
 */
exports.createCheckoutSession = wrapHttpFunction(functions.https.onCall(async (data, context) => {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create checkout session'
      );
    }

    const { userId, priceId, promoCodeId, metadata = {} } = data;
    const userEmail = context.auth.token.email;

    if (!userId || !priceId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId and priceId are required'
      );
    }

    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User can only create checkout sessions for themselves'
      );
    }

    trackStripeFunction('createCheckoutSession', 'session_creation_started', {
      userId,
      priceId,
      hasPromo: !!promoCodeId,
      userEmail: userEmail || 'unknown',
    });

    console.log(`Creating checkout session for user ${userId} with price ${priceId}`);

    // Check if user has existing Stripe customer
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    let customerId = null;
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
      console.log(`Using existing Stripe customer: ${customerId}`);
    } else {
      // Create new Stripe customer
      console.log(`Creating new Stripe customer for user ${userId}`);
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUserId: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await userRef.set({
        stripeCustomerId: customerId,
        email: userEmail,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`Created new Stripe customer: ${customerId}`);
    }

    // Check for educational discount
    const isEdu = userEmail && userEmail.endsWith('.edu');
    let discounts = [];
    
    if (isEdu && promoCodeId) {
      try {
        // Verify the promo code exists and is valid
        const promoCode = await stripe.promotionCodes.retrieve(promoCodeId);
        if (promoCode.active) {
          discounts = [{ promotion_code: promoCodeId }];
          console.log(`Applied educational discount: ${promoCodeId}`);
          
          trackStripeFunction('createCheckoutSession', 'edu_discount_applied', {
            userId,
            promoCodeId,
            userEmail,
          });
        }
      } catch (error) {
        console.warn(`Invalid promo code ${promoCodeId}:`, error.message);
        // Continue without discount if promo code is invalid
      }
    }

    // Create checkout session
    const sessionData = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        userId,
        priceId,
        isEdu: isEdu.toString(),
        ...metadata,
      },
      subscription_data: {
        metadata: {
          userId,
          priceId,
          isEdu: isEdu.toString(),
        },
      },
      allow_promotion_codes: !isEdu, // Allow manual promo codes if not using edu discount
      automatic_tax: {
        enabled: true,
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      invoice_creation: {
        enabled: true,
      },
    };

    // Add discounts if applicable
    if (discounts.length > 0) {
      sessionData.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log(`Created checkout session: ${session.id} for user ${userId}`);

    // Log the checkout session creation to Firestore for analytics
    await db.collection('subscription_logs').add({
      type: 'checkout_session_created',
      userId,
      sessionId: session.id,
      priceId,
      isEdu,
      customerId,
      hasDiscount: discounts.length > 0,
      promoCodeId: promoCodeId || null,
      userEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    trackStripeFunction('createCheckoutSession', 'session_created_successfully', {
      userId,
      sessionId: session.id,
      priceId,
      isEdu,
      hasDiscount: discounts.length > 0,
    });

    trackFunctionPerformance('createCheckoutSession', Date.now() - startTime, true);

    return {
      url: session.url,
      sessionId: session.id,
      isEdu,
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    captureCloudFunctionError(error, 'createCheckoutSession', {
      userId: data?.userId,
      priceId: data?.priceId,
      userEmail: context.auth?.token?.email,
    });

    trackFunctionPerformance('createCheckoutSession', Date.now() - startTime, false);

    // Return appropriate error based on type
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to create checkout session',
      { originalError: error.message }
    );
  }
}));

/**
 * Handle successful payment completion
 */
exports.handleSuccessfulPayment = wrapHttpFunction(functions.https.onCall(async (data, context) => {
  const startTime = Date.now();

  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { sessionId } = data;
    if (!sessionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'sessionId is required'
      );
    }

    trackStripeFunction('handleSuccessfulPayment', 'payment_processing_started', {
      sessionId,
      userId: context.auth.uid,
    });

    console.log(`Processing successful payment for session: ${sessionId}`);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // Verify the session belongs to the authenticated user
    if (session.metadata.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Session does not belong to the authenticated user'
      );
    }

    if (session.payment_status !== 'paid') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payment has not been completed'
      );
    }

    const db = admin.firestore();
    const userId = session.metadata.userId;

    // Log successful payment
    await db.collection('subscription_logs').add({
      type: 'payment_successful',
      userId,
      sessionId,
      subscriptionId: session.subscription?.id,
      customerId: session.customer.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      isEdu: session.metadata.isEdu === 'true',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user subscription status
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      subscriptionStatus: 'active',
      subscriptionId: session.subscription?.id,
      stripeCustomerId: session.customer.id,
      lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully processed payment for user ${userId}`);

    trackStripeFunction('handleSuccessfulPayment', 'payment_processed_successfully', {
      userId,
      sessionId,
      subscriptionId: session.subscription?.id,
    });

    trackFunctionPerformance('handleSuccessfulPayment', Date.now() - startTime, true);

    return { success: true };

  } catch (error) {
    console.error('Error handling successful payment:', error);
    
    captureCloudFunctionError(error, 'handleSuccessfulPayment', {
      sessionId: data?.sessionId,
      userId: context.auth?.uid,
    });

    trackFunctionPerformance('handleSuccessfulPayment', Date.now() - startTime, false);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to process successful payment',
      { originalError: error.message }
    );
  }
}));

/**
 * Check educational discount eligibility
 */
exports.checkEduDiscount = wrapHttpFunction(functions.https.onCall(async (data, context) => {
  const startTime = Date.now();

  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { email } = data;
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'email is required'
      );
    }

    console.log(`Checking educational discount eligibility for: ${email}`);

    // Check if email ends with .edu
    const isEduEmail = email.toLowerCase().endsWith('.edu');
    
    let discountCode = null;
    const discountPercentage = 15; // 15% educational discount

    if (isEduEmail) {
      // Get or create the educational promotion code
      try {
        // Try to find existing educational promotion code
        const promotionCodes = await stripe.promotionCodes.list({
          code: 'EDU_DISCOUNT_15',
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          discountCode = promotionCodes.data[0].id;
        } else {
          // Create educational discount coupon if it doesn't exist
          let eduCoupon;
          try {
            eduCoupon = await stripe.coupons.retrieve('edu-15-percent');
          } catch (error) {
            // Create the coupon if it doesn't exist
            eduCoupon = await stripe.coupons.create({
              id: 'edu-15-percent',
              name: 'Educational Discount',
              percent_off: discountPercentage,
              duration: 'forever',
              metadata: {
                type: 'educational',
                description: 'Discount for students and educators',
              },
            });
          }

          // Create promotion code
          const promoCode = await stripe.promotionCodes.create({
            coupon: eduCoupon.id,
            code: 'EDU_DISCOUNT_15',
            active: true,
            metadata: {
              type: 'educational',
              auto_applied: 'true',
            },
          });

          discountCode = promoCode.id;
        }

        console.log(`Educational discount available for ${email}: ${discountCode}`);

        trackStripeFunction('checkEduDiscount', 'edu_discount_eligible', {
          email,
          discountCode,
          discountPercentage,
          userId: context.auth.uid,
        });

      } catch (error) {
        console.error('Error creating/retrieving educational discount:', error);
        // Continue without discount if there's an error
      }
    }

    trackFunctionPerformance('checkEduDiscount', Date.now() - startTime, true);

    return {
      isEligible: isEduEmail,
      discountCode,
      discountPercentage: isEduEmail ? discountPercentage : 0,
    };

  } catch (error) {
    console.error('Error checking educational discount:', error);
    
    captureCloudFunctionError(error, 'checkEduDiscount', {
      email: data?.email,
      userId: context.auth?.uid,
    });

    trackFunctionPerformance('checkEduDiscount', Date.now() - startTime, false);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Return default response on error
    return {
      isEligible: false,
      discountCode: null,
      discountPercentage: 0,
    };
  }
}));

/**
 * Get checkout session status (client-safe)
 */
exports.getCheckoutSessionStatus = wrapHttpFunction(functions.https.onCall(async (data, context) => {
  const startTime = Date.now();

  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { sessionId } = data;
    if (!sessionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'sessionId is required'
      );
    }

    console.log(`Getting checkout session status for: ${sessionId}`);

    // Retrieve session with minimal data for security
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to the authenticated user
    if (session.metadata.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Session does not belong to the authenticated user'
      );
    }

    trackFunctionPerformance('getCheckoutSessionStatus', Date.now() - startTime, true);

    // Return only safe, non-sensitive data
    return {
      status: session.status, // 'open', 'complete', or 'expired'
      payment_status: session.payment_status, // 'paid', 'unpaid', 'no_payment_required'
    };

  } catch (error) {
    console.error('Error getting checkout session status:', error);
    
    captureCloudFunctionError(error, 'getCheckoutSessionStatus', {
      sessionId: data?.sessionId,
      userId: context.auth?.uid,
    });

    trackFunctionPerformance('getCheckoutSessionStatus', Date.now() - startTime, false);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to get checkout session status',
      { originalError: error.message }
    );
  }
}));