const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const stripeWebhooks = require('./stripeWebhooks');
const stripeSubscriptions = require('./stripeSubscriptions');

// Export all functions
exports.stripeWebhook = stripeWebhooks.stripeWebhook;
exports.createStripeCustomer = stripeSubscriptions.createStripeCustomer;
exports.createSubscription = stripeSubscriptions.createSubscription;
exports.cancelSubscription = stripeSubscriptions.cancelSubscription;
exports.updatePaymentMethod = stripeSubscriptions.updatePaymentMethod;
exports.createOneTimePayment = stripeSubscriptions.createOneTimePayment;

// Add any existing functions from the project
try {
  const playerPlusMinusNotifications = require('./playerPlusMinusNotifications');
  exports.sendPlayerPlusMinusNotifications = playerPlusMinusNotifications.sendPlayerPlusMinusNotifications;
} catch (error) {
  console.log('playerPlusMinusNotifications module not found or has errors');
}

// Add user creation hook to set up Stripe customer
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    
    // Create a Stripe customer for the new user
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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