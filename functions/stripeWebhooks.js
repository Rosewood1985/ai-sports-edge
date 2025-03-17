const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Stripe webhook handler
 * 
 * This function handles Stripe webhook events such as:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('No Stripe signature found');
    return res.status(400).send('Missing Stripe signature');
  }

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send({ received: true });
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    res.status(500).send(`Error handling webhook: ${err.message}`);
  }
});

/**
 * Handle successful payment intent
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // If this is a one-time payment (not subscription), handle it here
  if (paymentIntent.metadata && paymentIntent.metadata.type === 'one_time') {
    await handleOneTimePayment(paymentIntent);
  }
  
  // For subscription payments, we'll handle them in the invoice.payment_succeeded event
}

/**
 * Handle failed payment intent
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  const db = admin.firestore();
  
  // If this is a one-time payment, update its status
  if (paymentIntent.metadata && paymentIntent.metadata.type === 'one_time') {
    const userId = paymentIntent.metadata.userId;
    const productId = paymentIntent.metadata.productId;
    
    if (userId && productId) {
      const purchaseRef = db.collection('users').doc(userId)
        .collection('purchases').doc(paymentIntent.id);
      
      await purchaseRef.update({
        status: 'failed',
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify user about failed payment
      await notifyUserAboutFailedPayment(userId, 'one_time', productId);
    }
  }
  
  // For subscription payments, we'll handle them in the invoice.payment_failed event
}

/**
 * Handle subscription creation
 * @param {Object} subscription - Stripe subscription object
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const db = admin.firestore();
  const customerId = subscription.customer;
  
  // Find the Firebase user associated with this Stripe customer
  const userSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  
  // Get the price details
  const priceId = subscription.items.data[0].price.id;
  const priceSnapshot = await db.collection('products')
    .where('priceId', '==', priceId)
    .limit(1)
    .get();
  
  let planName = 'Premium';
  if (!priceSnapshot.empty) {
    planName = priceSnapshot.docs[0].data().name;
  }
  
  // Store subscription in Firestore
  await userRef.collection('subscriptions').doc(subscription.id).set({
    status: subscription.status,
    priceId: priceId,
    planName: planName,
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
}

/**
 * Handle subscription updates
 * @param {Object} subscription - Stripe subscription object
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const db = admin.firestore();
  const customerId = subscription.customer;
  
  // Find the Firebase user associated with this Stripe customer
  const userSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
  
  // Update subscription in Firestore
  await subscriptionRef.update({
    status: subscription.status,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update user's subscription status
  await userRef.update({
    subscriptionStatus: subscription.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle subscription deletion
 * @param {Object} subscription - Stripe subscription object
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const db = admin.firestore();
  const customerId = subscription.customer;
  
  // Find the Firebase user associated with this Stripe customer
  const userSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
  
  // Update subscription in Firestore
  await subscriptionRef.update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update user's subscription status
  await userRef.update({
    subscriptionStatus: 'canceled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle successful invoice payment
 * @param {Object} invoice - Stripe invoice object
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription');
    return;
  }
  
  const db = admin.firestore();
  const customerId = invoice.customer;
  
  // Find the Firebase user associated with this Stripe customer
  const userSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = userRef.collection('subscriptions').doc(invoice.subscription);
  
  // Update subscription payment status
  await subscriptionRef.update({
    lastInvoiceId: invoice.id,
    lastPaymentStatus: 'succeeded',
    lastPaymentDate: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Store the invoice
  await userRef.collection('invoices').doc(invoice.id).set({
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    paidAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle failed invoice payment
 * @param {Object} invoice - Stripe invoice object
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('Invoice is not for a subscription');
    return;
  }
  
  const db = admin.firestore();
  const customerId = invoice.customer;
  
  // Find the Firebase user associated with this Stripe customer
  const userSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }
  
  const userId = userSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = userRef.collection('subscriptions').doc(invoice.subscription);
  
  // Update subscription payment status
  await subscriptionRef.update({
    lastInvoiceId: invoice.id,
    lastPaymentStatus: 'failed',
    lastPaymentError: invoice.last_payment_error?.message || 'Payment failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Store the invoice
  await userRef.collection('invoices').doc(invoice.id).set({
    subscriptionId: invoice.subscription,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status,
    failedAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
    errorMessage: invoice.last_payment_error?.message || 'Payment failed',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Notify user about failed payment
  await notifyUserAboutFailedPayment(userId, 'subscription', invoice.subscription);
}

/**
 * Handle one-time payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handleOneTimePayment(paymentIntent) {
  const db = admin.firestore();
  const userId = paymentIntent.metadata.userId;
  const productId = paymentIntent.metadata.productId;
  
  if (!userId || !productId) {
    console.error('Missing userId or productId in payment intent metadata');
    return;
  }
  
  const userRef = db.collection('users').doc(userId);
  
  // Store the purchase
  await userRef.collection('purchases').doc(paymentIntent.id).set({
    productId: productId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'succeeded',
    paidAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // If this is a one-time purchase with duration (like a weekend pass)
  if (paymentIntent.metadata.duration) {
    const duration = parseInt(paymentIntent.metadata.duration, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
    
    await userRef.collection('purchases').doc(paymentIntent.id).update({
      duration: duration,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
    });
  }
}

/**
 * Notify user about failed payment
 * @param {string} userId - Firebase user ID
 * @param {string} type - Payment type ('subscription' or 'one_time')
 * @param {string} itemId - Subscription ID or product ID
 */
async function notifyUserAboutFailedPayment(userId, type, itemId) {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const user = await admin.auth().getUser(userId);
    
    // Create a notification in Firestore
    await userRef.collection('notifications').add({
      type: 'payment_failed',
      paymentType: type,
      itemId: itemId,
      title: 'Payment Failed',
      message: `Your ${type === 'subscription' ? 'subscription' : 'payment'} was not processed successfully. Please update your payment method.`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // In a real app, you would also send an email or push notification here
    console.log(`Notification created for user ${userId} about failed ${type} payment`);
    
    // For demonstration purposes, we'll log what would be sent
    console.log('Would send email to:', user.email);
    console.log('Email subject: Payment Failed');
    console.log(`Email body: Your ${type === 'subscription' ? 'subscription' : 'payment'} was not processed successfully. Please update your payment method.`);
  } catch (error) {
    console.error('Error notifying user about failed payment:', error);
  }
}

// Export the functions
module.exports = {
  stripeWebhook: exports.stripeWebhook
};