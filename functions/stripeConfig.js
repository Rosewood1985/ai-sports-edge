const functions = require('firebase-functions');

// Initialize Stripe with the secret key from environment variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Export the initialized Stripe instance
exports.stripe = stripe;