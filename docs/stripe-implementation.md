# Stripe Integration Implementation

This document outlines the implementation of Stripe payment processing in the AI Sports Edge app.

## Overview

The Stripe integration enables secure payment processing for subscriptions and one-time purchases within the app. The implementation follows best practices for security, reliability, and user experience.

## Architecture

The Stripe integration consists of the following components:

1. **Client-side components**:
   - `StripeProvider`: Wraps the app with the Stripe SDK
   - `PaymentScreen`: Collects payment information from users
   - `SubscriptionScreen`: Displays available subscription plans
   - `SubscriptionManagementScreen`: Manages existing subscriptions
   - `firebaseSubscriptionService`: Client-side service for interacting with Stripe via Firebase Functions

2. **Server-side components**:
   - Firebase Functions for Stripe operations:
     - `stripeWebhook`: Handles Stripe webhook events
     - `createStripeCustomer`: Creates a Stripe customer for a user
     - `createSubscription`: Creates a subscription for a user
     - `cancelSubscription`: Cancels a subscription
     - `updatePaymentMethod`: Updates a payment method
     - `createOneTimePayment`: Creates a one-time payment

3. **Data storage**:
   - Firestore collections for storing subscription and payment data:
     - `users/{userId}/subscriptions`: Stores subscription information
     - `users/{userId}/paymentMethods`: Stores payment method information
     - `users/{userId}/purchases`: Stores one-time purchase information
     - `users/{userId}/invoices`: Stores invoice information
     - `users/{userId}/notifications`: Stores payment-related notifications

## Security Measures

1. **Server-side operations**: All sensitive operations (creating customers, subscriptions, etc.) are performed on the server side using Firebase Functions.
2. **Environment variables**: Stripe API keys are stored as environment variables on the server.
3. **Webhook signature verification**: Stripe webhook events are verified using the webhook signature.
4. **User authentication**: All operations require user authentication.

## Webhook Handling

The `stripeWebhook` function handles the following Stripe events:

- `payment_intent.succeeded`: When a payment is successful
- `payment_intent.payment_failed`: When a payment fails
- `customer.subscription.created`: When a subscription is created
- `customer.subscription.updated`: When a subscription is updated
- `customer.subscription.deleted`: When a subscription is deleted
- `invoice.payment_succeeded`: When an invoice payment succeeds
- `invoice.payment_failed`: When an invoice payment fails

## Failed Payment Handling

When a payment fails, the system:

1. Updates the subscription status in Firestore
2. Creates a notification for the user
3. Sends an email notification to the user (in a production environment)
4. Provides a way for the user to update their payment method

## Subscription Management

Users can:

1. View their current subscription details
2. Cancel their subscription (at the end of the billing period or immediately)
3. Update their payment method
4. View their payment history

## One-Time Purchases

In addition to subscriptions, the system supports one-time purchases:

1. Weekend Pass: 48 hours of premium access
2. Game Day Pass: 24 hours of premium access
3. Microtransactions: Single predictions, parlay suggestions, etc.

## Testing

For testing purposes, use the following Stripe test card numbers:

- **Successful payment**: 4242 4242 4242 4242
- **Failed payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

## Future Improvements

1. **Subscription tiers**: Implement additional subscription tiers with different features and pricing.
2. **Promo codes**: Add support for promotional codes and discounts.
3. **Subscription upgrades/downgrades**: Allow users to upgrade or downgrade their subscription.
4. **Subscription pausing**: Allow users to pause their subscription temporarily.
5. **Subscription gifting**: Allow users to gift subscriptions to others.

## Troubleshooting

Common issues and their solutions:

1. **Webhook events not being processed**: Ensure the webhook URL is correctly configured in the Stripe dashboard and the webhook secret is correct.
2. **Payment failures**: Check the Stripe dashboard for detailed error messages and ensure the payment method is valid.
3. **Subscription status not updating**: Check the Firebase Functions logs for errors and ensure the Firestore security rules allow the necessary operations.