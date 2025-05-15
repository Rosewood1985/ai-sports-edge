# Stripe Tax Integration Options

This document outlines the different options for integrating Stripe Tax into AI Sports Edge, based on the Stripe Tax documentation.

## Table of Contents

1. [Overview](#overview)
2. [Integration Options](#integration-options)
   - [Dashboard Transactions (No-code)](#dashboard-transactions-no-code)
   - [Stripe Hosted Integrations (Low-code)](#stripe-hosted-integrations-low-code)
   - [Stripe Tax API (Custom Integration)](#stripe-tax-api-custom-integration)
3. [Implementation Details](#implementation-details)
4. [Recommended Approach](#recommended-approach)
5. [Next Steps](#next-steps)

## Overview

Stripe Tax provides automatic tax calculation for transactions, helping ensure compliance with tax regulations across different jurisdictions. There are three main approaches to integrating Stripe Tax, each with different levels of complexity and flexibility.

## Integration Options

### Dashboard Transactions (No-code)

**Description**: Use automatic tax calculation for items created in the Stripe Dashboard.

**Works with**:
- New Invoices
- Subscriptions
- Quotes
- Payment Links created in the Dashboard

**Pros**:
- No coding required
- Quick to set up
- Managed by Stripe

**Cons**:
- Limited to Dashboard-created items
- Less flexibility for custom checkout flows
- Not suitable for programmatic transaction creation

**Implementation Steps**:
1. Enable Stripe Tax in the Stripe Dashboard
2. Configure tax settings in the Dashboard
3. Create new items (invoices, subscriptions, etc.) in the Dashboard with automatic tax calculation enabled

### Stripe Hosted Integrations (Low-code)

**Description**: Use the `automatic_tax[enabled]` parameter for API transactions.

**Works with**:
- Checkout
- Invoices
- Subscriptions
- Quotes
- Payment Links created via the API

**Pros**:
- Relatively simple implementation
- Works with API-created transactions
- Maintains most of Stripe's built-in functionality

**Cons**:
- Less control over tax calculation details
- Limited customization options
- Tied to Stripe's payment flow

**Implementation Example**:

```javascript
// Example: Creating a Checkout Session with automatic tax
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: 'price_1234',
      quantity: 1,
    },
  ],
  automatic_tax: {
    enabled: true,
  },
  customer: 'cus_1234',
  customer_update: {
    address: 'auto',
  },
  mode: 'payment',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
});
```

```javascript
// Example: Creating a Subscription with automatic tax
const subscription = await stripe.subscriptions.create({
  customer: 'cus_1234',
  items: [
    {
      price: 'price_1234',
    },
  ],
  automatic_tax: {
    enabled: true,
  },
});
```

### Stripe Tax API (Custom Integration)

**Description**: Use the Calculate Tax API and Transaction API for custom checkout flows.

**Works with**:
- Custom checkout flows using Stripe payment APIs
- Non-Stripe payment processors

**Pros**:
- Maximum flexibility and control
- Works with any checkout flow
- Can be used with non-Stripe payment processors
- Detailed tax calculation and reporting

**Cons**:
- More complex implementation
- Requires more maintenance
- Need to handle tax calculation and reporting manually

**Implementation Example**:

```javascript
// Step 1: Calculate tax using the Calculate Tax API
const taxCalculation = await stripe.tax.calculations.create({
  currency: 'usd',
  customer: 'cus_1234',
  customer_details: {
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US',
    },
    address_source: 'shipping',
  },
  line_items: [
    {
      amount: 1000, // $10.00
      reference: 'product_123',
      tax_code: 'txcd_10103001', // Digital goods
      tax_behavior: 'exclusive',
    },
  ],
});

// Step 2: Create a PaymentIntent with the calculated tax
const paymentIntent = await stripe.paymentIntents.create({
  amount: taxCalculation.amount_total, // Amount including tax
  currency: 'usd',
  customer: 'cus_1234',
  metadata: {
    tax_calculation_id: taxCalculation.id,
  },
});

// Step 3: Record the transaction for tax reporting
await stripe.tax.transactions.createFromCalculation({
  calculation: taxCalculation.id,
  reference: paymentIntent.id,
});
```

**Custom Tax Transaction Example**:

For even more control, you can use the custom tax transaction approach:

```javascript
// Create a payment intent with custom tax details
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1500, // $15.00 (including $5.00 tax)
  currency: 'usd',
  customer: 'cus_1234',
  metadata: { order_id: '12345' },
  tax: {
    calculation_behavior: 'custom',
    transaction: {
      tax_date: new Date().toISOString().split('T')[0],
      shipping_cost: {
        amount: 0,
        tax_code: 'txcd_92010001', // Shipping tax code
      },
      line_items: [
        {
          amount: 1000, // $10.00
          reference: 'product_123',
          tax_code: 'txcd_10103001', // Digital goods
          tax_behavior: 'exclusive',
        },
      ],
      customer: {
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US',
        },
        tax_id: {
          type: 'us_ein',
          value: '123456789',
        },
      },
      tax_details: [
        {
          tax_type: 'sales_tax',
          tax_rate: 0.0725,
          tax_country: 'US',
          tax_state: 'CA',
          tax_jurisdiction: 'CA STATE TAX',
          tax_amount: 500, // $5.00
        },
      ],
    },
  },
});
```

## Implementation Details

### Common Requirements for All Options

1. **Customer Location Information**:
   - Collect and store customer address information
   - Implement address validation
   - Handle tax exemption certificates if applicable

2. **Product Tax Classification**:
   - Assign appropriate tax codes to products/services
   - Configure taxability rules
   - Handle special tax cases (e.g., digital goods)

3. **Tax Registration**:
   - Register for tax collection in relevant jurisdictions
   - Configure tax registration information in Stripe

### Database Schema Updates

For proper tax handling, the following database schema updates are recommended:

```sql
-- Add tax-related fields to transactions table
ALTER TABLE transactions
ADD COLUMN tax_amount DECIMAL(10, 2),
ADD COLUMN tax_rate DECIMAL(6, 4),
ADD COLUMN tax_jurisdiction VARCHAR(100),
ADD COLUMN tax_calculation_id VARCHAR(100),
ADD COLUMN tax_transaction_id VARCHAR(100);

-- Create tax exemptions table
CREATE TABLE tax_exemptions (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  exemption_type VARCHAR(50) NOT NULL,
  exemption_certificate VARCHAR(100),
  certificate_url VARCHAR(255),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### API Integration

For the Stripe Tax API approach, implement the following components:

1. **Tax Calculation Service**:
   - Create a service to handle tax calculation requests
   - Implement caching for tax calculations
   - Handle error cases and fallbacks

2. **Transaction Recording Service**:
   - Create a service to record transactions for tax reporting
   - Implement reconciliation with payment records
   - Handle failed transaction recording

3. **Tax Reporting Service**:
   - Create a service to generate tax reports
   - Implement export functionality for tax filing
   - Handle jurisdiction-specific reporting requirements

## Recommended Approach

Based on AI Sports Edge's requirements, we recommend the following approach:

### For Subscription and Recurring Payments

Use the **Stripe Hosted Integrations (Low-code)** approach with `automatic_tax[enabled]` parameter. This provides a good balance of simplicity and functionality for subscription-based payments.

### For Custom Checkout Flows

Use the **Stripe Tax API (Custom Integration)** approach for maximum flexibility and control. This is particularly important for:
- Custom pricing models
- Complex tax scenarios
- International transactions
- Marketplace transactions

### Implementation Plan

1. Start with the Stripe Hosted Integrations approach for subscription products
2. Implement the Stripe Tax API approach for custom checkout flows
3. Use the custom tax transaction approach for special cases where more control is needed

## Next Steps

1. **Enable Stripe Tax**:
   - Contact Stripe to enable Stripe Tax for your account
   - Configure tax settings in the Stripe Dashboard

2. **Update Database Schema**:
   - Implement the schema changes outlined above
   - Migrate existing data if necessary

3. **Implement Tax Calculation**:
   - Create a tax calculation service
   - Integrate with the checkout flow

4. **Implement Tax Reporting**:
   - Create a tax reporting service
   - Implement export functionality for tax filing

5. **Test and Validate**:
   - Test tax calculation in different scenarios
   - Validate tax reporting accuracy
   - Perform end-to-end testing of the checkout flow

6. **Monitor and Maintain**:
   - Monitor tax calculation accuracy
   - Keep tax codes and rules up to date
   - Stay informed about tax regulation changes