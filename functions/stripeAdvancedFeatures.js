/**
 * Advanced Stripe Features
 * 
 * Enhanced Stripe functionality including proration, tax calculation, and multi-currency support
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Calculate proration for subscription changes
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Current subscription ID
 * @param {string} data.newPriceId - New price ID
 * @param {boolean} data.previewOnly - Whether to only preview changes
 * @returns {Object} - Proration details
 */
exports.calculateProration = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is calculating proration for their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only calculate proration for their own subscriptions."
    );
  }

  try {
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
      throw new functions.https.HttpsError(
        "not-found",
        "User does not have a Stripe customer ID."
      );
    }

    // Get current subscription
    const subscription = await getStripe().subscriptions.retrieve(data.subscriptionId);
    
    // Calculate proration preview
    const invoice = await getStripe().invoices.createPreview({
      customer: subscription.customer,
      subscription: data.subscriptionId,
      subscription_items: [{
        id: subscription.items.data[0].id,
        price: data.newPriceId,
      }],
      subscription_proration_behavior: "create_prorations",
    });

    // Calculate proration amount
    const prorationLineItems = invoice.lines.data.filter(item => 
      item.type === "invoiceitem" && item.proration
    );

    const creditAmount = prorationLineItems
      .filter(item => item.amount < 0)
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const chargeAmount = prorationLineItems
      .filter(item => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const netProration = chargeAmount - creditAmount;

    // Get new price details
    const newPrice = await getStripe().prices.retrieve(data.newPriceId, {
      expand: ["product"]
    });

    const currentPrice = await getStripe().prices.retrieve(subscription.items.data[0].price.id, {
      expand: ["product"]
    });

    const result = {
      currentPlan: {
        name: currentPrice.product.name,
        amount: currentPrice.unit_amount,
        currency: currentPrice.currency,
        interval: currentPrice.recurring.interval
      },
      newPlan: {
        name: newPrice.product.name,
        amount: newPrice.unit_amount,
        currency: newPrice.currency,
        interval: newPrice.recurring.interval
      },
      proration: {
        creditAmount,
        chargeAmount,
        netAmount: netProration,
        currency: invoice.currency,
        immediateCharge: netProration > 0 ? netProration : 0,
        immediateCredit: netProration < 0 ? Math.abs(netProration) : 0
      },
      nextInvoice: {
        amount: invoice.amount_due,
        currency: invoice.currency,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end
      }
    };

    // Store proration calculation if not preview only
    if (!data.previewOnly) {
      await userRef.collection("prorationCalculations").add({
        subscriptionId: data.subscriptionId,
        currentPriceId: subscription.items.data[0].price.id,
        newPriceId: data.newPriceId,
        calculation: result,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return result;
  } catch (error) {
    console.error("Error calculating proration:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Update subscription with proration
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.subscriptionId - Subscription ID to update
 * @param {string} data.newPriceId - New price ID
 * @param {boolean} data.prorationBehavior - Proration behavior ('create_prorations', 'none', 'always_invoice')
 * @returns {Object} - Updated subscription details
 */
exports.updateSubscriptionWithProration = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is updating their own subscription
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only update their own subscriptions."
    );
  }

  try {
    const userRef = db.collection("users").doc(data.userId);
    
    // Get current subscription
    const currentSubscription = await getStripe().subscriptions.retrieve(data.subscriptionId);

    // Update subscription with proration
    const updatedSubscription = await getStripe().subscriptions.update(data.subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: data.newPriceId,
      }],
      proration_behavior: data.prorationBehavior || "create_prorations",
    });

    // Get new price details
    const newPrice = await getStripe().prices.retrieve(data.newPriceId, {
      expand: ["product"]
    });

    // Update subscription in Firestore
    await userRef.collection("subscriptions").doc(data.subscriptionId).update({
      priceId: data.newPriceId,
      planName: newPrice.product.name,
      status: updatedSubscription.status,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(updatedSubscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(updatedSubscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log subscription change
    await userRef.collection("subscriptionChanges").add({
      subscriptionId: data.subscriptionId,
      previousPriceId: currentSubscription.items.data[0].price.id,
      newPriceId: data.newPriceId,
      prorationBehavior: data.prorationBehavior || "create_prorations",
      changeType: "plan_change",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      newPriceId: data.newPriceId,
      planName: newPrice.product.name,
      currentPeriodEnd: updatedSubscription.current_period_end
    };
  } catch (error) {
    console.error("Error updating subscription with proration:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Calculate tax for a customer based on location
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.priceId - Price ID
 * @param {Object} data.customerDetails - Customer tax details
 * @param {string} data.customerDetails.address.country - Country code
 * @param {string} data.customerDetails.address.state - State/province
 * @param {string} data.customerDetails.address.postal_code - Postal code
 * @param {string} data.customerDetails.tax_id - Tax ID (optional)
 * @returns {Object} - Tax calculation details
 */
exports.calculateTax = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Verify the user is calculating tax for themselves
  if (data.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Users can only calculate tax for themselves."
    );
  }

  try {
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
      throw new functions.https.HttpsError(
        "not-found",
        "User does not have a Stripe customer ID."
      );
    }

    const customerId = userDoc.data().stripeCustomerId;

    // Get price details
    const price = await getStripe().prices.retrieve(data.priceId);

    // Create a tax calculation
    const taxCalculation = await getStripe().tax.calculations.create({
      currency: price.currency,
      customer_details: {
        address: data.customerDetails.address,
        address_source: "billing",
      },
      line_items: [{
        amount: price.unit_amount,
        reference: data.priceId,
      }],
    });

    // Update customer with tax information
    await getStripe().customers.update(customerId, {
      address: data.customerDetails.address,
      tax_exempt: data.customerDetails.tax_exempt || "none",
    });

    // Store tax calculation in Firestore
    await userRef.collection("taxCalculations").add({
      calculationId: taxCalculation.id,
      priceId: data.priceId,
      amount: price.unit_amount,
      currency: price.currency,
      taxAmount: taxCalculation.tax_amount_exclusive,
      totalAmount: taxCalculation.amount_total,
      customerDetails: data.customerDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      calculationId: taxCalculation.id,
      subtotal: price.unit_amount,
      taxAmount: taxCalculation.tax_amount_exclusive,
      totalAmount: taxCalculation.amount_total,
      currency: price.currency,
      taxBreakdown: taxCalculation.tax_breakdown.map(breakdown => ({
        jurisdiction: breakdown.jurisdiction,
        rate: breakdown.tax_rate_details.percentage_decimal,
        amount: breakdown.tax_amount
      }))
    };
  } catch (error) {
    console.error("Error calculating tax:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Create multi-currency pricing
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.productId - Product ID
 * @param {Array} data.currencies - Array of currency objects with rates
 * @param {number} data.baseAmount - Base amount in cents (USD)
 * @returns {Object} - Multi-currency pricing details
 */
exports.createMultiCurrencyPricing = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Admin-only function (you might want to add admin role checking)
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can create multi-currency pricing."
    );
  }

  try {
    const supportedCurrencies = ["usd", "eur", "gbp", "cad", "aud", "jpy"];
    const currencyPricing = {};

    // Create prices for each supported currency
    for (const currencyData of data.currencies) {
      const { currency, exchangeRate } = currencyData;
      
      if (!supportedCurrencies.includes(currency.toLowerCase())) {
        console.warn(`Unsupported currency: ${currency}`);
        continue;
      }

      // Calculate amount for this currency
      let amount = Math.round(data.baseAmount * exchangeRate);
      
      // Special handling for zero-decimal currencies (JPY)
      if (currency.toLowerCase() === "jpy") {
        amount = Math.round(amount / 100);
      }

      // Create price in Stripe
      const price = await getStripe().prices.create({
        product: data.productId,
        unit_amount: amount,
        currency: currency.toLowerCase(),
        recurring: data.recurring ? {
          interval: data.recurring.interval,
          interval_count: data.recurring.interval_count || 1
        } : undefined,
      });

      currencyPricing[currency.toLowerCase()] = {
        priceId: price.id,
        amount: amount,
        currency: currency.toLowerCase(),
        exchangeRate: exchangeRate,
        formattedAmount: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.toUpperCase(),
        }).format(currency.toLowerCase() === "jpy" ? amount : amount / 100)
      };
    }

    // Store multi-currency pricing in Firestore
    await db.collection("multiCurrencyPricing").doc(data.productId).set({
      productId: data.productId,
      baseAmount: data.baseAmount,
      baseCurrency: "usd",
      currencies: currencyPricing,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      productId: data.productId,
      currencies: currencyPricing,
      baseAmount: data.baseAmount,
      supportedCurrencies: Object.keys(currencyPricing)
    };
  } catch (error) {
    console.error("Error creating multi-currency pricing:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get pricing for user's currency
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.productId - Product ID
 * @param {string} data.currency - Preferred currency
 * @returns {Object} - Currency-specific pricing
 */
exports.getPricingForCurrency = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const userRef = db.collection("users").doc(data.userId);
    
    // Get multi-currency pricing for product
    const pricingDoc = await db.collection("multiCurrencyPricing").doc(data.productId).get();
    
    if (!pricingDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Multi-currency pricing not found for this product."
      );
    }

    const pricingData = pricingDoc.data();
    const requestedCurrency = data.currency.toLowerCase();

    // Check if requested currency is available
    if (!pricingData.currencies[requestedCurrency]) {
      // Fallback to USD if requested currency not available
      return {
        productId: data.productId,
        currency: "usd",
        pricing: pricingData.currencies.usd,
        fallback: true,
        availableCurrencies: Object.keys(pricingData.currencies)
      };
    }

    // Update user's preferred currency
    await userRef.update({
      preferredCurrency: requestedCurrency,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      productId: data.productId,
      currency: requestedCurrency,
      pricing: pricingData.currencies[requestedCurrency],
      fallback: false,
      availableCurrencies: Object.keys(pricingData.currencies)
    };
  } catch (error) {
    console.error("Error getting pricing for currency:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Create subscription with tax and currency support
 * @param {Object} data - Request data
 * @param {string} data.userId - Firebase user ID
 * @param {string} data.paymentMethodId - Payment method ID
 * @param {string} data.priceId - Price ID
 * @param {Object} data.customerDetails - Customer details including address for tax
 * @param {string} data.currency - Currency preference
 * @returns {Object} - Subscription with tax details
 */
exports.createAdvancedSubscription = functions.https.onCall(async (data, context) => {
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

  try {
    const userRef = db.collection("users").doc(data.userId);
    const userDoc = await userRef.get();

    // Get or create customer
    let customerId;
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      const user = await admin.auth().getUser(data.userId);
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { firebaseUserId: data.userId }
      });

      customerId = customer.id;
      await userRef.set({
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Update customer with address and tax information
    await getStripe().customers.update(customerId, {
      address: data.customerDetails.address,
      preferred_locales: [data.customerDetails.locale || "en"],
    });

    // Attach payment method
    await getStripe().paymentMethods.attach(data.paymentMethodId, {
      customer: customerId
    });

    // Create subscription with automatic tax calculation
    const subscription = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: data.priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      automatic_tax: { enabled: true },
      expand: ["latest_invoice.payment_intent"],
    });

    // Get price and product details
    const price = await getStripe().prices.retrieve(data.priceId, {
      expand: ["product"]
    });

    // Store enhanced subscription in Firestore
    await userRef.collection("subscriptions").doc(subscription.id).set({
      status: subscription.status,
      priceId: data.priceId,
      planName: price.product.name,
      currency: price.currency,
      amount: price.unit_amount,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      automaticTax: true,
      customerDetails: data.customerDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user subscription status
    await userRef.update({
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      preferredCurrency: price.currency,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currency: price.currency,
      amount: price.unit_amount,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      currentPeriodEnd: subscription.current_period_end
    };
  } catch (error) {
    console.error("Error creating advanced subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Export all functions
module.exports = {
  calculateProration: exports.calculateProration,
  updateSubscriptionWithProration: exports.updateSubscriptionWithProration,
  calculateTax: exports.calculateTax,
  createMultiCurrencyPricing: exports.createMultiCurrencyPricing,
  getPricingForCurrency: exports.getPricingForCurrency,
  createAdvancedSubscription: exports.createAdvancedSubscription
};