# Stripe Integration Guide

This guide explains how to use the Stripe payment and tax integration in the AI Sports Edge app.

## Overview

The Stripe integration follows the atomic design pattern:

- **Atoms**: Basic configuration and constants
- **Molecules**: Core payment and tax functionality
- **Organisms**: Complete payment service and React components

## Setup

### 1. Environment Variables

Ensure the following environment variables are set:

```
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

For production, use the production keys:

```
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### 2. Initialize Stripe in Your App

Add the StripeProvider to your app's entry point:

```jsx
import React from 'react';
import { StripeProvider } from 'atomic/organisms/stripe';
import App from './App';

export default function Root() {
  return (
    <StripeProvider>
      <App />
    </StripeProvider>
  );
}
```

## Usage

### Processing Payments

Use the `useStripe` hook to access the Stripe service:

```jsx
import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { useStripe } from 'atomic/organisms/stripe';

export default function PaymentScreen() {
  const { processPayment } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const result = await processPayment({
        amount: 19.99,
        currency: 'usd',
        customerId: 'cus_123456789',
        customerDetails: {
          address: {
            country: 'US',
            state: 'CA',
            postal_code: '94111',
            city: 'San Francisco',
          },
          address_source: 'billing',
        },
        lineItems: [
          {
            amount: 19.99,
            id: 'premium_subscription',
            taxCode: 'txcd_10103001', // Digital goods
          },
        ],
        paymentMethodId: 'pm_123456789',
      });

      Alert.alert('Success', 'Payment processed successfully');
      console.log('Payment result:', result);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? 'Processing...' : 'Pay $19.99'}
        onPress={handlePayment}
        disabled={loading}
      />
    </View>
  );
}
```

### Setting Up a Customer

```jsx
import React, { useState } from 'react';
import { View, Button, TextInput, Alert } from 'react-native';
import { useStripe } from 'atomic/organisms/stripe';

export default function CustomerSetupScreen() {
  const { setupCustomer } = useStripe();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await setupCustomer({
        email,
        name,
        address: {
          country: 'US',
          state: 'CA',
          postal_code: '94111',
          city: 'San Francisco',
        },
      });

      Alert.alert('Success', 'Customer created successfully');
      console.log('Customer result:', result);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <Button
        title={loading ? 'Creating...' : 'Create Customer'}
        onPress={handleSetup}
        disabled={loading}
      />
    </View>
  );
}
```

### Getting Tax Information

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useStripe } from 'atomic/organisms/stripe';

export default function TaxInfoScreen() {
  const { getTaxInfo } = useStripe();
  const [taxInfo, setTaxInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxInfo = async () => {
      try {
        const info = await getTaxInfo({
          countryCode: 'US',
          stateCode: 'CA',
          postalCode: '94111',
          city: 'San Francisco',
        });

        setTaxInfo(info);
      } catch (error) {
        console.error('Error fetching tax info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxInfo();
  }, []);

  if (loading) {
    return <Text>Loading tax information...</Text>;
  }

  return (
    <View>
      <Text>Tax Enabled: {taxInfo?.enabled ? 'Yes' : 'No'}</Text>
      <Text>Display Prices Including Tax: {taxInfo?.displayPricesIncludingTax ? 'Yes' : 'No'}</Text>
      {taxInfo?.rates?.tax_breakdown && (
        <View>
          <Text>Tax Breakdown:</Text>
          {taxInfo.rates.tax_breakdown.map((item, index) => (
            <Text key={index}>
              {item.jurisdiction_name}: {(item.tax_rate * 100).toFixed(2)}%
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
```

## US-Only Restrictions

The payment service is configured to only accept payments from customers in the United States. This is enforced through several validation checks:

1. Country code validation (must be 'US')
2. Postal code format validation (must be a valid US ZIP code)
3. Payment method validation (must be issued by a US bank)

If you need to support international payments, you'll need to modify the `isCustomerInUS` function in `atomic/molecules/stripe/stripePayment.js`.

## Tax Configuration

The tax service is configured to use Stripe Tax for automatic tax calculation. Tax rates are determined based on the customer's location.

To configure tax settings for different countries, modify the `getTaxSettingsForCountry` function in `atomic/atoms/stripe/stripeTaxConfig.js`.

## Error Handling

All Stripe operations include proper error handling and logging. Errors are logged to the console and can be monitored through your logging service.

## Testing

To test the Stripe integration, use the test mode keys and the following test card numbers:

- **Successful payment**: 4242 4242 4242 4242
- **Failed payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

For more test cards, see the [Stripe testing documentation](https://stripe.com/docs/testing).
