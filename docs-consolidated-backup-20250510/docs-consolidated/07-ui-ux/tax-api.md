# Tax API Documentation

This document provides information about the Tax API endpoints and how to use them.

## Overview

The Tax API provides endpoints for calculating taxes and retrieving tax rates for different locations. It integrates with Stripe Tax to ensure accurate tax calculation and compliance across different jurisdictions.

## Endpoints

### Calculate Tax

Calculates tax for a transaction based on customer location and line items.

**URL:** `/api/tax/calculate`

**Method:** `POST`

**Request Body:**

```json
{
  "currency": "usd",
  "customerId": "cus_123456",
  "customerDetails": {
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94111",
      "country": "US"
    },
    "address_source": "shipping"
  },
  "lineItems": [
    {
      "id": "item_1",
      "amount": 100,
      "taxCode": "txcd_10103001"
    },
    {
      "id": "item_2",
      "amount": 50,
      "taxCode": "txcd_10103001"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tax_amount_exclusive": 1237,
    "tax_amount_inclusive": 1237,
    "tax_breakdown": [
      {
        "jurisdiction_name": "California",
        "tax_rate_percentage": 7.25,
        "tax_amount": 1087
      },
      {
        "jurisdiction_name": "San Francisco",
        "tax_rate_percentage": 1.0,
        "tax_amount": 150
      }
    ]
  }
}
```

### Get Tax Rates

Retrieves tax rates for a specific location.

**URL:** `/api/tax/rates`

**Method:** `GET`

**Query Parameters:**

- `countryCode` (required): Country code (e.g., "US")
- `stateCode` (optional): State code (e.g., "CA")
- `postalCode` (optional): Postal code (e.g., "94111")
- `city` (optional): City name (e.g., "San Francisco")

**Response:**

```json
{
  "success": true,
  "data": {
    "calculation_id": "taxcalc_123456",
    "tax_date": "2025-03-24",
    "tax_breakdown": [
      {
        "jurisdiction_name": "California",
        "tax_rate_percentage": 7.25
      },
      {
        "jurisdiction_name": "San Francisco",
        "tax_rate_percentage": 1.0
      }
    ],
    "jurisdictions": [
      {
        "country": "US",
        "state": "CA",
        "type": "state",
        "name": "California"
      },
      {
        "country": "US",
        "state": "CA",
        "type": "city",
        "name": "San Francisco"
      }
    ]
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in case of failures:

- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Server-side errors

Error response format:

```json
{
  "error": "Error message"
}
```

## Testing

You can test the API endpoints using the provided test script:

```bash
./scripts/test-tax-api.js
```

## Integration with Frontend

The API can be integrated with the frontend using the `TaxSummary` component:

```jsx
import TaxSummary from './components/TaxSummary';

function CheckoutScreen() {
  // ... fetch tax data from API
  
  return (
    <View>
      <TaxSummary
        subtotal={150}
        taxAmount={12.37}
        taxBreakdown={taxData.tax_breakdown}
        currency="USD"
      />
    </View>
  );
}
```

## Related Files

- `api/tax-api.js`: API endpoint implementation
- `services/stripeTaxService.ts`: Stripe Tax service
- `utils/tax-report-generator.js`: Tax report generation utility
- `components/TaxSummary.jsx`: Frontend component for displaying tax information
- `scripts/test-tax-api.js`: Test script for API endpoints
- `scripts/test-tax.js`: Test script for Stripe Tax service