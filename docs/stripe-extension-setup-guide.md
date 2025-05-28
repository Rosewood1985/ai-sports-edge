# Stripe Firebase Extension Setup Guide

This guide covers the complete setup of the Firestore Stripe Payments Extension to replace the custom Stripe integration with the official Firebase extension.

## Overview

The Firestore Stripe Payments Extension provides:
- Automatic customer creation and management
- Subscription handling with webhooks
- Product and pricing management
- Tax calculation integration
- Secure payment processing
- Real-time sync between Stripe and Firestore

## Prerequisites

1. **Firebase Project**: `aisportsedge-app`
2. **Stripe Account**: With API keys ready
3. **Firebase CLI**: Installed and authenticated
4. **Billing**: Enabled on Firebase project (required for extensions)

## Installation Steps

### 1. Install the Extension

```bash
# Navigate to project directory
cd /workspaces/ai-sports-edge-restore

# Install Firestore Stripe Payments Extension
firebase ext:install stripe/firestore-stripe-payments --project=aisportsedge-app
```

### 2. Configure Extension Parameters

When prompted, use these configuration values:

#### Basic Configuration
- **Stripe Secret Key**: Your live or test secret key
- **Stripe Publishable Key**: Corresponding publishable key
- **Stripe Webhook Secret**: Generated after extension installation
- **Customers Collection**: `customers`
- **Products Collection**: `products`

#### Advanced Configuration
- **Sync Users on Create**: `true` (automatically create Stripe customers)
- **Delete Stripe Customers**: `false` (preserve customer data)
- **Automatic Tax**: `true` (enable tax calculation)
- **Tax Rates Collection**: `tax_rates`

#### Email Configuration (Optional)
- **SMTP Connection URI**: Your email service URI
- **Email Templates Collection**: `mail`

### 3. Set Up Webhook Endpoint

After installation, the extension provides a webhook endpoint:
```
https://us-central1-aisportsedge-app.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents
```

Add this to your Stripe Dashboard:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint with the URL above
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

### 4. Update Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Stripe Extension Rules
match /customers/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;

  match /checkout_sessions/{id} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  match /subscriptions/{id} {
    allow read: if request.auth != null && request.auth.uid == uid;
  }
  match /payments/{id} {
    allow read: if request.auth != null && request.auth.uid == uid;
  }
}

match /products/{id} {
  allow read: if true;

  match /prices/{id} {
    allow read: if true;
  }
}
```

## Integration with Existing Code

### 1. Update Subscription Service

Replace custom Stripe calls with extension-compatible code:

```typescript
// services/stripeExtensionService.ts
import { doc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export class StripeExtensionService {
  
  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const checkoutSessionRef = collection(db, 'customers', auth.currentUser.uid, 'checkout_sessions');
    
    const docRef = await addDoc(checkoutSessionRef, {
      price: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: true,
      tax_id_collection: true,
      allow_promotion_codes: true
    });
    
    // Listen for the checkout session URL
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        if (data?.url) {
          unsubscribe();
          resolve(data.url);
        }
        if (data?.error) {
          unsubscribe();
          reject(new Error(data.error.message));
        }
      });
    });
  }
  
  async getSubscriptions() {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const subscriptionsRef = collection(db, 'customers', auth.currentUser.uid, 'subscriptions');
    // Return subscription data
  }
  
  async cancelSubscription(subscriptionId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const subscriptionRef = doc(db, 'customers', auth.currentUser.uid, 'subscriptions', subscriptionId);
    // Update subscription to cancel
  }
}
```

### 2. Update Components

Replace existing Stripe components:

```typescript
// components/StripeExtensionCheckout.tsx
import React from 'react';
import { StripeExtensionService } from '../services/stripeExtensionService';

const stripeService = new StripeExtensionService();

export const StripeExtensionCheckout: React.FC<{priceId: string}> = ({ priceId }) => {
  const handleCheckout = async () => {
    try {
      const checkoutUrl = await stripeService.createCheckoutSession(
        priceId,
        window.location.origin + '/success',
        window.location.origin + '/cancel'
      );
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };
  
  return (
    <button onClick={handleCheckout}>
      Subscribe Now
    </button>
  );
};
```

## Database Schema

The extension creates these collections:

### `/customers/{userId}`
```typescript
interface Customer {
  email: string;
  stripeId: string;
  // Other customer data
}
```

### `/customers/{userId}/subscriptions/{subscriptionId}`
```typescript
interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: Timestamp;
  current_period_end: Timestamp;
  price: {
    id: string;
    product: string;
    recurring: {
      interval: 'month' | 'year';
    };
  };
}
```

### `/customers/{userId}/payments/{paymentId}`
```typescript
interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'processing';
  created: Timestamp;
  subscription?: string;
}
```

### `/products/{productId}`
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  active: boolean;
  images: string[];
  metadata: Record<string, string>;
}
```

## Testing

### 1. Test Mode Setup
- Use Stripe test keys during development
- Test webhook events using Stripe CLI:
```bash
stripe listen --forward-to https://us-central1-aisportsedge-app.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents
```

### 2. Test Scenarios
1. **Subscription Creation**: Verify checkout flow creates subscription
2. **Payment Processing**: Confirm successful payments update Firestore
3. **Subscription Cancellation**: Test cancellation workflow
4. **Failed Payments**: Verify failed payment handling
5. **Webhook Processing**: Ensure all events are processed

## Migration Plan

### Phase 1: Parallel Implementation
1. Install extension alongside existing Stripe integration
2. Update new subscriptions to use extension
3. Test thoroughly in development

### Phase 2: Data Migration
1. Migrate existing subscriptions to extension format
2. Update customer records to match extension schema
3. Verify data integrity

### Phase 3: Code Migration
1. Replace custom Stripe functions with extension-compatible code
2. Update frontend components
3. Remove old Stripe integration code

### Phase 4: Production Deployment
1. Deploy extension to production
2. Update webhook endpoints
3. Monitor for issues
4. Complete migration

## Benefits of the Extension

1. **Reduced Maintenance**: Official Firebase extension with automatic updates
2. **Security**: Secure by default with proper authentication
3. **Scalability**: Handles high-volume transactions efficiently
4. **Features**: Built-in tax calculation, invoicing, and reporting
5. **Compliance**: PCI DSS compliance handled automatically

## Current Integration Status

✅ **Created Extension Configuration Files**
- `extensions/firestore-stripe-payments.env` - Environment variables
- `functions/stripeExtensionIntegration.js` - Integration functions
- Updated `functions/index.js` with new exports

✅ **Webhook Integration**
- Firestore triggers for payment events
- Subscription status management
- User analytics updates

🔄 **Next Steps**
1. Install extension in Firebase Console
2. Configure webhook endpoints in Stripe
3. Update client-side code to use extension
4. Test integration end-to-end
5. Migrate existing subscriptions

## Support and Troubleshooting

### Common Issues
1. **Webhook Signature Verification**: Ensure webhook secret is correctly configured
2. **CORS Issues**: Use the extension's built-in CORS handling
3. **Authentication**: Verify Firebase Auth integration
4. **Tax Calculation**: Configure tax rates in Stripe Dashboard

### Monitoring
- Use Firebase Console to monitor extension logs
- Set up Stripe Dashboard alerts for failed payments
- Monitor Firestore writes for performance impact

### Documentation
- [Official Extension Documentation](https://firebase.google.com/products/extensions/stripe-firestore-stripe-payments)
- [Stripe Firebase Integration Guide](https://stripe.com/docs/firebase)
- [Firebase Extensions Guide](https://firebase.google.com/docs/extensions)