const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

// Create a simple Stripe webhook handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const stripe = require('stripe')(functions.config().stripe.secret_key);
    const webhookSecret = functions.config().stripe.webhook_secret;
    
    // Log the webhook request
    console.log('Received Stripe webhook request');
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send({ error: 'Webhook processing failed' });
  }
});

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout session:', session.id);
    const db = admin.firestore();
    
    // Get the customer and metadata
    const customerId = session.customer;
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    
    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }
    
    // Update the user's subscription status
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      stripeCustomerId: customerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Updated user ${userId} with Stripe customer ID ${customerId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle invoice paid
async function handleInvoicePaid(invoice) {
  try {
    console.log('Processing paid invoice:', invoice.id);
    const db = admin.firestore();
    
    // Get the subscription and customer
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    
    if (!subscriptionId) {
      console.log('No subscription associated with this invoice');
      return;
    }
    
    // Find the user with this customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);
    
    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set({
      id: subscriptionId,
      status: 'active',
      customerId: customerId,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(invoice.lines.data[0].period.end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update the user document
    await userRef.update({
      subscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Updated subscription ${subscriptionId} for user ${userId}`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('Processing failed invoice payment:', invoice.id);
    const db = admin.firestore();
    
    // Get the subscription and customer
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    
    if (!subscriptionId) {
      console.log('No subscription associated with this invoice');
      return;
    }
    
    // Find the user with this customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);
    
    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set({
      id: subscriptionId,
      status: 'past_due',
      customerId: customerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update the user document
    await userRef.update({
      subscriptionStatus: 'past_due',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Updated subscription ${subscriptionId} to past_due for user ${userId}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processing subscription created:', subscription.id);
    const db = admin.firestore();
    
    // Get the customer
    const customerId = subscription.customer;
    
    // Find the user with this customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);
    
    // Create the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      customerId: customerId,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update the user document
    await userRef.update({
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Created subscription ${subscription.id} for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription updated:', subscription.id);
    const db = admin.firestore();
    
    // Get the customer
    const customerId = subscription.customer;
    
    // Find the user with this customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);
    
    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      customerId: customerId,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update the user document
    await userRef.update({
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Updated subscription ${subscription.id} for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription deleted:', subscription.id);
    const db = admin.firestore();
    
    // Get the customer
    const customerId = subscription.customer;
    
    // Find the user with this customer ID
    const usersSnapshot = await db.collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`No user found with Stripe customer ID ${customerId}`);
      return;
    }
    
    const userId = usersSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userId);
    
    // Update the subscription in Firestore
    const subscriptionRef = userRef.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
      id: subscription.id,
      status: 'canceled',
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update the user document
    await userRef.update({
      subscriptionStatus: 'canceled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Marked subscription ${subscription.id} as canceled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Add user creation hook to set up Stripe customer
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    
    // Create a Stripe customer for the new user
    const stripe = require('stripe')(functions.config().stripe.secret_key);
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { firebaseUserId: user.uid }
    });
    
    // Store customer ID in Firestore
    await userRef.set({
      email: user.email,
      stripeCustomerId: customer.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`Created Stripe customer for user ${user.uid}`);
    return null;
  } catch (error) {
    console.error('Error creating Stripe customer on user creation:', error);
    return null;
  }
});

// Referral + Reward Functions
const { generateReferralCode } = require('./generateReferralCode');
const { rewardReferrer } = require('./rewardReferrer');
exports.generateReferralCode = generateReferralCode;
exports.rewardReferrer = rewardReferrer;