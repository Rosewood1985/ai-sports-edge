# US-Only Payment Implementation

This document provides information about the US-only payment implementation for AI Sports Edge.

## Overview

AI Sports Edge has implemented a US-only payment system that restricts payments to customers located in the United States. This implementation includes:

1. Server-side validation of customer location
2. Client-side validation of postal codes
3. React Native component for mobile applications
4. Web-based payment form for testing

## Implementation Details

### Server-Side Validation

The `paymentService.js` file implements server-side validation to ensure that payments are only accepted from customers in the United States. This validation includes:

- Checking the customer's country code in the address
- Validating US postal code format
- Optional IP geolocation check (can be implemented with a third-party service)

```javascript
function isCustomerInUS(customerDetails, ipAddress) {
  // Check address country code
  if (customerDetails?.address?.country && customerDetails.address.country !== 'US') {
    return false;
  }
  
  // Check postal code format
  if (customerDetails?.address?.postal_code) {
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZipRegex.test(customerDetails.address.postal_code)) {
      return false;
    }
  }
  
  // IP geolocation check could be added here
  
  return true;
}
```

### Payment Intent Creation

When creating a payment intent, the service enforces USD currency and US-only restrictions:

```javascript
async function createPaymentIntent(options) {
  const { amount, currency, customerDetails, ipAddress, customerId, metadata } = options;
  
  // Validate currency is USD
  if (currency.toLowerCase() !== 'usd') {
    throw new Error('Only USD currency is supported');
  }
  
  // Validate customer is in the US
  if (!isCustomerInUS(customerDetails, ipAddress)) {
    throw new Error('Payments are only accepted from customers in the United States');
  }
  
  // Create payment intent with Stripe
  // ...
}
```

### Client-Side Components

#### React Native Component

The `USOnlyPaymentForm.jsx` component provides a React Native implementation for mobile applications. It includes:

- Card input field with postal code validation
- US-only messaging
- Error handling for non-US payments

```jsx
<CardField
  postalCodeEnabled={true}
  placeholder={{
    number: '4242 4242 4242 4242',
  }}
  cardStyle={{
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  }}
  style={styles.cardField}
  onCardChange={(cardDetails) => {
    if (cardDetails.postalCode) {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (!usZipRegex.test(cardDetails.postalCode)) {
        setError('Payments are only accepted from the United States');
      } else {
        setError(null);
      }
    }
  }}
/>
```

#### Web Implementation

The `test-us-payment.html` file provides a web-based implementation for testing. It includes:

- Country selection dropdown (restricted to US)
- Postal code validation
- Clear messaging about US-only restrictions
- Test card information for different scenarios

## API Endpoints

### Create Payment

**URL:** `/api/create-payment`

**Method:** `POST`

**Request Body:**

```json
{
  "userId": "user_123",
  "productId": "product_456",
  "productName": "Premium Subscription",
  "price": 49.99,
  "currency": "usd",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94111",
      "country": "US"
    }
  }
}
```

**Response:**

```json
{
  "clientSecret": "pi_1234_secret_5678"
}
```

**Error Response:**

```json
{
  "error": "Payments are only accepted from customers in the United States"
}
```

## Testing

### Test Cards

Use these test card numbers with any future expiration date and any 3-digit CVC:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment (US) |
| 4000 0000 0000 0069 | Declined payment (insufficient funds) |
| 4000 0000 0000 0127 | Declined payment (incorrect CVC) |
| 4000 0000 0000 0101 | Declined payment (expired card) |

### Test Postal Codes

For testing non-US payments, use these postal codes:

| Country | Postal Code |
|---------|-------------|
| United States | 90210 |
| Canada | V6B 2E7 |
| United Kingdom | SW1A 1AA |
| Australia | 2000 |

### Test Page

A test page is available at `/test-us-payment` for testing the US-only payment implementation. This page includes:

- Form fields for customer information
- Country selection dropdown
- Stripe Elements integration for card input
- Test card information
- Error handling for non-US payments

## Security Considerations

1. **Server-Side Validation**: Always validate customer location on the server side, as client-side validation can be bypassed.
2. **IP Geolocation**: Consider implementing IP geolocation as an additional layer of validation.
3. **Fraud Prevention**: Monitor for suspicious patterns, such as VPN usage to bypass location restrictions.
4. **Clear Messaging**: Provide clear messaging about US-only restrictions to avoid customer confusion.

## Future Enhancements

1. **IP Geolocation**: Implement IP geolocation to further validate customer location.
2. **Address Verification**: Enhance address verification to ensure US addresses are valid.
3. **State Restrictions**: If needed, implement restrictions for specific US states.
4. **International Expansion**: If business requirements change, the implementation can be extended to support additional countries.