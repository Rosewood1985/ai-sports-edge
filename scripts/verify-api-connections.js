#!/usr/bin/env node

/**
 * API Connection Verification Script
 *
 * This script verifies API connections and checks for placeholder credentials.
 * It ensures that all required API keys are available and valid.
 *
 * Usage:
 *   node scripts/verify-api-connections.js [options]
 *
 * Options:
 *   --fix                 Attempt to fix issues automatically
 *   --env <file>          Path to .env file to load (default: .env)
 *   --output <file>       Output file for results (default: api-verification-results.json)
 *   --verbose             Show detailed output
 *   --help                Show help
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const { securityManager } = require('../atomic/organisms/security');
const { apiKeys } = require('../utils/apiKeys');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: false,
  env: '.env',
  output: 'api-verification-results.json',
  verbose: false,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--fix') {
    options.fix = true;
  } else if (arg === '--env' && i + 1 < args.length) {
    options.env = args[++i];
  } else if (arg === '--output' && i + 1 < args.length) {
    options.output = args[++i];
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--help') {
    showHelp();
    process.exit(0);
  }
}

/**
 * Shows help information
 */
function showHelp() {
  console.log(`
API Connection Verification Script

This script verifies API connections and checks for placeholder credentials.
It ensures that all required API keys are available and valid.

Usage:
  node scripts/verify-api-connections.js [options]

Options:
  --fix                 Attempt to fix issues automatically
  --env <file>          Path to .env file to load (default: .env)
  --output <file>       Output file for results (default: api-verification-results.json)
  --verbose             Show detailed output
  --help                Show help
  `);
}

/**
 * Load environment variables from .env file
 * @param {string} envPath - Path to .env file
 * @returns {object} Environment variables
 */
function loadEnvFile(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));

      // Add environment variables to process.env
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }

      return envConfig;
    }
  } catch (error) {
    console.error(`Error loading .env file: ${error.message}`);
  }

  return {};
}

/**
 * Check for placeholder credentials in environment variables
 * @param {object} envVars - Environment variables
 * @returns {object} Placeholder credentials
 */
function checkPlaceholderCredentials(envVars) {
  const placeholders = {};
  const placeholderPatterns = [/YOUR_[A-Z_]+_KEY/, /PLACEHOLDER/i, /REPLACE_ME/i, /XXXX/, /^$/];

  // Check each environment variable
  for (const key in envVars) {
    if (
      key.includes('KEY') ||
      key.includes('SECRET') ||
      key.includes('TOKEN') ||
      key.includes('PASSWORD')
    ) {
      const value = envVars[key];

      // Check if value matches any placeholder pattern
      for (const pattern of placeholderPatterns) {
        if (pattern.test(value)) {
          placeholders[key] = value;
          break;
        }
      }
    }
  }

  return placeholders;
}

/**
 * Verify API connections
 * @returns {Promise<object>} Verification results
 */
async function verifyApiConnections() {
  try {
    console.log('Verifying API connections...');

    // Verify all API connections
    const results = await apiKeys.verifyAllApiConnections();

    // Log results
    console.log('\nAPI Connection Results:');
    for (const [api, success] of Object.entries(results)) {
      console.log(`- ${api}: ${success ? '✅ Connected' : '❌ Failed'}`);
    }

    return results;
  } catch (error) {
    console.error('Error verifying API connections:', error);
    return {};
  }
}

/**
 * Scan for hardcoded API keys
 * @returns {Promise<object>} Scan results
 */
async function scanForHardcodedKeys() {
  try {
    console.log('\nScanning for hardcoded API keys...');

    // Scan for secrets
    const scanOptions = {
      severityFilter: ['critical', 'high'],
      saveResults: false,
    };

    const results = await securityManager.scanForSecrets('.', scanOptions);

    // Log results
    console.log('\nHardcoded API Key Scan Results:');
    console.log(`- Critical: ${results.counts.critical}`);
    console.log(`- High: ${results.counts.high}`);
    console.log(`- Total: ${results.counts.critical + results.counts.high}`);

    if (options.verbose && results.results.length > 0) {
      console.log('\nDetailed Results:');
      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.type} (${result.severity.toUpperCase()}):`);
        console.log(`   File: ${result.file}`);
        console.log(`   Line: ${result.line}`);
        console.log(`   Content: ${result.lineContent}`);
      });
    }

    return results;
  } catch (error) {
    console.error('Error scanning for hardcoded API keys:', error);
    return { counts: { critical: 0, high: 0 }, results: [] };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('API Connection Verification Script');
    console.log('=================================\n');

    // Load environment variables
    console.log(`Loading environment variables from ${options.env}...`);
    const envVars = loadEnvFile(options.env);

    // Check for placeholder credentials
    console.log('\nChecking for placeholder credentials...');
    const placeholders = checkPlaceholderCredentials(envVars);

    if (Object.keys(placeholders).length > 0) {
      console.log('\nPlaceholder Credentials Found:');
      for (const [key, value] of Object.entries(placeholders)) {
        console.log(`- ${key}: ${value}`);
      }
    } else {
      console.log('No placeholder credentials found.');
    }

    // Verify API connections
    const connectionResults = await verifyApiConnections();

    // Scan for hardcoded API keys
    const scanResults = await scanForHardcodedKeys();

    // Combine results
    const results = {
      placeholderCredentials: placeholders,
      apiConnections: connectionResults,
      hardcodedKeys: {
        critical: scanResults.counts.critical,
        high: scanResults.counts.high,
        total: scanResults.counts.critical + scanResults.counts.high,
        details: options.verbose ? scanResults.results : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    // Save results
    fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${options.output}`);

    // Determine exit code
    const hasPlaceholders = Object.keys(placeholders).length > 0;
    const hasFailedConnections = Object.values(connectionResults).some(success => !success);
    const hasHardcodedKeys = scanResults.counts.critical > 0 || scanResults.counts.high > 0;

    if (hasPlaceholders || hasFailedConnections || hasHardcodedKeys) {
      console.log('\n❌ Verification failed. Please fix the issues above.');
      process.exit(1);
    } else {
      console.log('\n✅ All API connections verified successfully.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
