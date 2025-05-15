# Revenue Reporting and Tax Compliance

## Overview

The revenue reporting and tax compliance features provide tools for tracking revenue, calculating taxes, and generating reports for financial and tax compliance purposes.

## Features

- Revenue tracking by category, period, and customer
- Report generation (daily, weekly, monthly, quarterly, annual)
- Automatic tax calculation based on customer location
- Tax reporting by jurisdiction
- Tax exemption management
- Stripe Tax API integration

## Configuration

### Database Configuration

The database configuration is stored in `config/database.json`.

### Stripe Tax Configuration

The Stripe Tax configuration is stored in `config/stripe-tax.json`.

## Usage

### Revenue Reporting

```typescript
import revenueReportingService from '../services/revenueReportingService';

// Generate a monthly report
const report = await revenueReportingService.generateReport({
  startDate: new Date('2025-03-01'),
  endDate: new Date('2025-03-31'),
  type: revenueReportingService.ReportType.MONTHLY,
});
```

### Tax Calculation

```typescript
import { calculateTax } from '../services/stripeTaxService';

// Calculate tax for a transaction
const taxCalculation = await calculateTax({
  currency: 'usd',
  customerId: 'cus_123456',
  customerDetails: {
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US',
    },
  },
  lineItems: [
    {
      id: 'item_1',
      amount: 100, // $100.00
      taxCode: 'txcd_10103001', // Digital goods
    },
  ],
});
```

## Scripts

- `scripts/run-migration.js`: Run database migrations
- `scripts/generate-report.js`: Generate revenue reports

## Database Schema

The database schema includes the following tables:

- `transactions`: Stores transaction data with tax information
- `revenue_reports`: Stores generated revenue reports
- `revenue_categories`: Stores revenue categories with tax codes
- `tax_jurisdictions`: Stores tax jurisdiction information
- `tax_rates`: Stores tax rates by jurisdiction
- `tax_exemptions`: Stores customer tax exemption information
- `financial_periods`: Stores financial period definitions

## Troubleshooting

### Common Issues

1. **Tax calculation fails**: Verify Stripe API keys and tax configuration
2. **Report generation fails**: Check database connection and schema
3. **Missing tax data**: Ensure Stripe Tax is enabled and configured correctly

### Support

For additional support, contact the development team.