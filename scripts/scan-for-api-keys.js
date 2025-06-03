#!/usr/bin/env node

/**
 * API Key Scanner Script
 *
 * This script scans the codebase for hardcoded API keys and other sensitive information.
 * It uses the security utilities from the atomic architecture to perform the scan.
 *
 * Usage:
 *   node scripts/scan-for-api-keys.js [options]
 *
 * Options:
 *   --path <path>             Path to scan (default: current directory)
 *   --output <file>           Output file for results (default: api-key-scan-results.json)
 *   --include-allowlisted     Include allowlisted files in results
 *   --severity <level>        Minimum severity level to report (critical, high, medium, low, info)
 *   --format <format>         Output format (json, text)
 *   --help                    Show help
 */

const fs = require('fs');
const path = require('path');

const { securityManager } = require('../atomic/organisms/security');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  path: '.',
  output: 'api-key-scan-results.json',
  includeAllowlisted: false,
  severityFilter: ['critical', 'high', 'medium', 'low', 'info'],
  format: 'json',
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--path' && i + 1 < args.length) {
    options.path = args[++i];
  } else if (arg === '--output' && i + 1 < args.length) {
    options.output = args[++i];
  } else if (arg === '--include-allowlisted') {
    options.includeAllowlisted = true;
  } else if (arg === '--severity' && i + 1 < args.length) {
    const severity = args[++i].toLowerCase();

    if (severity === 'critical') {
      options.severityFilter = ['critical'];
    } else if (severity === 'high') {
      options.severityFilter = ['critical', 'high'];
    } else if (severity === 'medium') {
      options.severityFilter = ['critical', 'high', 'medium'];
    } else if (severity === 'low') {
      options.severityFilter = ['critical', 'high', 'medium', 'low'];
    } else if (severity === 'info') {
      options.severityFilter = ['critical', 'high', 'medium', 'low', 'info'];
    }
  } else if (arg === '--format' && i + 1 < args.length) {
    options.format = args[++i].toLowerCase();
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
API Key Scanner Script

This script scans the codebase for hardcoded API keys and other sensitive information.
It uses the security utilities from the atomic architecture to perform the scan.

Usage:
  node scripts/scan-for-api-keys.js [options]

Options:
  --path <path>             Path to scan (default: current directory)
  --output <file>           Output file for results (default: api-key-scan-results.json)
  --include-allowlisted     Include allowlisted files in results
  --severity <level>        Minimum severity level to report (critical, high, medium, low, info)
  --format <format>         Output format (json, text)
  --help                    Show help
  `);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(`Scanning for API keys in ${options.path}...`);

    // Scan for secrets
    const scanOptions = {
      includeAllowlisted: options.includeAllowlisted,
      severityFilter: options.severityFilter,
      saveResults: true,
      outputPath: options.output,
    };

    const results = await securityManager.scanForSecrets(options.path, scanOptions);

    // Display results
    if (options.format === 'text') {
      const formattedResults = require('../atomic/molecules/security').formatScanResults(results);
      console.log(formattedResults);
    } else {
      // Display summary
      console.log('\nScan Summary:');
      console.log(`- Critical: ${results.counts.critical}`);
      console.log(`- High: ${results.counts.high}`);
      console.log(`- Medium: ${results.counts.medium}`);
      console.log(`- Low: ${results.counts.low}`);
      console.log(`- Info: ${results.counts.info}`);
      console.log(`- Total: ${results.counts.total}`);

      console.log(`\nResults saved to ${options.output}`);
    }

    // Exit with error code if critical or high severity issues found
    if (results.counts.critical > 0 || results.counts.high > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error scanning for API keys:', error);
    process.exit(1);
  }
}

// Run the main function
main();
