#!/usr/bin/env node

// Test script for Stripe Tax service
const stripeTaxService = require('../services/stripeTaxService');

// Sample customer data
const customer = {
  id: 'cus_test_123456',
  details: {
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US',
    },
    address_source: 'shipping',
  },
};

// Sample line items
const lineItems = [
  {
    id: 'item_1',
    amount: 100, // $100.00
    taxCode: 'txcd_10103001', // Digital goods
  },
  {
    id: 'item_2',
    amount: 50, // $50.00
    taxCode: 'txcd_10103001', // Digital goods
  },
];

// Test tax calculation
async function testTaxCalculation() {
  try {
    console.log('Testing tax calculation...');
    console.log('Customer:', customer.id);
    console.log('Line items:');
    lineItems.forEach(item => {
      console.log(`  - ${item.id}: $${item.amount.toFixed(2)}`);
    });
    
    const result = await stripeTaxService.calculateTax({
      currency: 'usd',
      customerId: customer.id,
      customerDetails: customer.details,
      lineItems: lineItems,
    });
    
    console.log('\nTax calculation result:');
    console.log('  Tax amount (exclusive):', `$${(result.tax_amount_exclusive / 100).toFixed(2)}`);
    console.log('  Tax amount (inclusive):', `$${(result.tax_amount_inclusive / 100).toFixed(2)}`);
    
    if (result.tax_breakdown && result.tax_breakdown.length > 0) {
      console.log('\nTax breakdown:');
      result.tax_breakdown.forEach(breakdown => {
        console.log(`  - ${breakdown.jurisdiction_name}: $${(breakdown.tax_amount / 100).toFixed(2)} (${breakdown.tax_rate_percentage}%)`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Tax calculation failed:', error.message);
    process.exit(1);
  }
}

// Test tax rates for location
async function testTaxRates() {
  try {
    console.log('\nTesting tax rates for location...');
    console.log('Location: San Francisco, CA, US');
    
    const result = await stripeTaxService.getTaxRatesForLocation({
      countryCode: 'US',
      stateCode: 'CA',
      postalCode: '94111',
      city: 'San Francisco',
    });
    
    console.log('\nTax rates result:');
    console.log('  Calculation ID:', result.calculation_id);
    console.log('  Tax date:', result.tax_date);
    
    if (result.tax_breakdown && result.tax_breakdown.length > 0) {
      console.log('\nTax breakdown:');
      result.tax_breakdown.forEach(breakdown => {
        console.log(`  - ${breakdown.jurisdiction_name}: ${breakdown.tax_rate_percentage}%`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Tax rates lookup failed:', error.message);
    process.exit(1);
  }
}

// Run tests
async function runTests() {
  try {
    await testTaxCalculation();
    await testTaxRates();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testTaxCalculation, testTaxRates, runTests };