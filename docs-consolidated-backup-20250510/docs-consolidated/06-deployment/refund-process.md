# Refund Process Documentation

This document outlines the refund process for AI Sports Edge, including policies, procedures, and technical implementation details.

## Table of Contents

1. [Refund Policies](#refund-policies)
2. [Refund Procedures](#refund-procedures)
3. [Technical Implementation](#technical-implementation)
4. [Testing Refunds](#testing-refunds)
5. [Troubleshooting](#troubleshooting)

## Refund Policies

### Subscription Refunds

- **Cancellation Refunds**: Prorated refunds are provided for the unused portion of a subscription when a user cancels.
- **Money-Back Guarantee**: Full refunds are provided within 14 days of initial subscription purchase if the user is not satisfied.
- **Service Outage Refunds**: Prorated refunds are provided for service outages lasting more than 24 hours.

### One-Time Purchase Refunds

- **Digital Content**: Refunds for digital content are provided within 48 hours of purchase if the content has not been accessed.
- **Feature Access**: Refunds for feature access are provided within 7 days if the feature is not functioning as advertised.

### Non-Refundable Items

- Subscriptions after the 14-day money-back guarantee period (only cancellation is available)
- Digital content that has been accessed or downloaded
- Promotional or discounted purchases marked as non-refundable

## Refund Procedures

### Customer-Initiated Refunds

1. **Request Submission**:
   - Customer submits a refund request through the app's "Request Refund" feature in Account Settings
   - Customer contacts customer support via email or chat
   - Customer initiates a refund through their payment provider (Stripe or PayPal)

2. **Review Process**:
   - System automatically checks eligibility based on purchase date and usage
   - Customer support reviews manual requests within 24 hours
   - Decision is made based on refund policy and specific circumstances

3. **Refund Processing**:
   - Approved refunds are processed within 1-3 business days
   - Customer receives email notification of refund status
   - Refund appears on customer's payment method within 5-10 business days

### Admin-Initiated Refunds

1. **Identifying Refund Needs**:
   - Service outage detected by monitoring system
   - Batch processing for affected customers
   - Proactive refunds for identified issues

2. **Approval Process**:
   - Manager approval required for batch refunds
   - Documentation of reason and affected users
   - Calculation of refund amounts

3. **Execution**:
   - Batch processing through admin dashboard
   - Customer notification via email
   - Record keeping for accounting purposes

## Technical Implementation

### Refund API Endpoints

#### Stripe Refunds

```javascript
// Process a Stripe refund
async function processStripeRefund(paymentIntentId, amount, reason) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // In cents
      reason: reason, // 'requested_by_customer', 'duplicate', 'fraudulent'
    });
    
    await saveRefundRecord(refund.id, paymentIntentId, amount, reason);
    return refund;
  } catch (error) {
    console.error('Stripe refund error:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}
```

#### PayPal Refunds

```javascript
// Process a PayPal refund
async function processPayPalRefund(captureId, amount, reason) {
  try {
    // Get access token
    const { access_token } = await getPayPalAccessToken();
    
    // Process refund
    const response = await fetch(`https://api-m.paypal.com/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        amount: {
          value: (amount / 100).toFixed(2), // Convert cents to dollars
          currency_code: 'USD'
        },
        note_to_payer: reason
      })
    });
    
    const refundData = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal refund failed: ${refundData.message}`);
    }
    
    await saveRefundRecord(refundData.id, captureId, amount, reason);
    return refundData;
  } catch (error) {
    console.error('PayPal refund error:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}
```

### Database Schema

```sql
CREATE TABLE refunds (
  id VARCHAR(255) PRIMARY KEY,
  payment_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  reason VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255) NOT NULL,
  payment_provider VARCHAR(50) NOT NULL,
  refund_type VARCHAR(50) NOT NULL,
  notes TEXT,
  admin_id VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE INDEX idx_refunds_user_id ON refunds(user_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_created_at ON refunds(created_at);
```

### Webhook Handlers

```javascript
// Stripe webhook handler for refund events
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'charge.refunded') {
    const refund = event.data.object;
    await updateRefundStatus(refund.id, refund.status);
    await notifyUserOfRefund(refund.payment_intent);
  }
  
  res.status(200).send('Webhook received');
});

// PayPal webhook handler for refund events
app.post('/api/webhooks/paypal', async (req, res) => {
  // Verify webhook signature
  // Process refund events
  if (req.body.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
    const refundData = req.body.resource;
    await updateRefundStatus(refundData.id, 'completed');
    await notifyUserOfRefund(refundData.supplementary_data.related_ids.order_id);
  }
  
  res.status(200).send('Webhook received');
});
```

## Testing Refunds

### Test Environment Setup

1. Use Stripe test mode with test API keys
2. Use PayPal sandbox environment
3. Create test customers and test payments
4. Verify webhook functionality with test events

### Test Cases

1. **Full Refund Test**:
   - Process a full refund for a recent payment
   - Verify refund is recorded in the database
   - Verify customer receives notification
   - Verify webhook handling

2. **Partial Refund Test**:
   - Process a partial refund for a payment
   - Verify correct amount is refunded
   - Verify remaining balance is correct

3. **Subscription Refund Test**:
   - Cancel a subscription with prorated refund
   - Verify correct prorated amount
   - Verify subscription is properly canceled

4. **Error Handling Test**:
   - Attempt to refund an already-refunded payment
   - Attempt to refund more than the original payment
   - Verify proper error handling and user feedback

5. **Batch Refund Test**:
   - Process refunds for multiple users
   - Verify all refunds are processed correctly
   - Verify notifications are sent to all users

### Running Tests

Use the `test-refund-procedures.sh` script to run automated tests for refund functionality:

```bash
./scripts/test-refund-procedures.sh --mode=full
./scripts/test-refund-procedures.sh --mode=partial
./scripts/test-refund-procedures.sh --mode=subscription
./scripts/test-refund-procedures.sh --mode=error
./scripts/test-refund-procedures.sh --mode=batch
```

## Troubleshooting

### Common Issues

1. **Refund Failed - Insufficient Funds**:
   - Check if the payment has already been refunded
   - Verify the payment method has sufficient funds for processing the refund
   - Contact the payment provider for assistance

2. **Webhook Events Not Received**:
   - Verify webhook URL is correctly configured
   - Check webhook logs for delivery attempts
   - Verify server is accessible from payment provider
   - Check webhook signature verification

3. **Database Inconsistencies**:
   - Run reconciliation script to match refunds in database with payment provider
   - Fix inconsistencies using the admin dashboard
   - Document discrepancies for accounting purposes

4. **Customer Did Not Receive Refund**:
   - Verify refund status with payment provider
   - Check if refund was processed to the correct payment method
   - Verify customer's payment method details
   - Check if refund is still processing (can take 5-10 business days)

### Support Procedures

1. **Customer Support**:
   - Provide refund ID and status to customer
   - Explain processing timeframes
   - Offer alternative refund methods if necessary

2. **Payment Provider Support**:
   - Stripe Dashboard: https://dashboard.stripe.com/refunds
   - PayPal Resolution Center: https://www.paypal.com/resolutioncenter

3. **Internal Escalation**:
   - Finance team for accounting issues
   - Engineering team for technical issues
   - Management approval for policy exceptions