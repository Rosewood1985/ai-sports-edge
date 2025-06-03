#!/usr/bin/env node

/**
 * Test Script for Tax API Endpoints
 *
 * This script tests the tax API endpoints by making HTTP requests to the server.
 *
 * Usage:
 *   node test-tax-api.js
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  host: 'localhost',
  port: 3000,
  basePath: '/api/tax',
  useHttps: false,
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = config.useHttps ? https : http;

    const req = client.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test tax calculation endpoint
async function testTaxCalculation() {
  console.log('Testing tax calculation endpoint...');

  const options = {
    host: config.host,
    port: config.port,
    path: `${config.basePath}/calculate`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const data = {
    currency: 'usd',
    customerId: 'cus_test_123456',
    customerDetails: {
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94111',
        country: 'US',
      },
      address_source: 'shipping',
    },
    lineItems: [
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
    ],
  };

  try {
    const response = await makeRequest(options, data);

    console.log(`Status code: ${response.statusCode}`);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    return response;
  } catch (error) {
    console.error('Error testing tax calculation endpoint:', error.message);
    throw error;
  }
}

// Test tax rates endpoint
async function testTaxRates() {
  console.log('\nTesting tax rates endpoint...');

  const options = {
    host: config.host,
    port: config.port,
    path: `${config.basePath}/rates?countryCode=US&stateCode=CA&postalCode=94111&city=San%20Francisco`,
    method: 'GET',
  };

  try {
    const response = await makeRequest(options);

    console.log(`Status code: ${response.statusCode}`);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    return response;
  } catch (error) {
    console.error('Error testing tax rates endpoint:', error.message);
    throw error;
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
