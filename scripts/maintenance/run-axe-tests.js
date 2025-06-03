#!/usr/bin/env node

/**
 * Axe Accessibility Testing Script
 *
 * This script runs accessibility tests on the web version of the app using Axe and Puppeteer.
 * It checks for WCAG 2.1 compliance issues and generates a report.
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// URLs to test
const urls = [
  'http://localhost:19006/', // Home screen
  'http://localhost:19006/settings', // Settings screen
  'http://localhost:19006/profile', // Profile screen
  'http://localhost:19006/game-details', // Game details screen
  'http://localhost:19006/betting-analytics', // Betting analytics screen
  'http://localhost:19006/parlay', // Parlay screen
  'http://localhost:19006/login', // Login screen
  'http://localhost:19006/ufc', // UFC screen
  'http://localhost:19006/legal', // Legal screen
  'http://localhost:19006/faq', // FAQ screen
];

// Results storage
const results = {
  summary: {
    total: 0,
    violations: 0,
    incomplete: 0,
    passes: 0,
    inapplicable: 0,
  },
  pages: [],
};

/**
 * Run Axe accessibility tests on a URL
 * @param {string} url - URL to test
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 */
async function testPage(url, browser) {
  console.log(`Testing ${url}...`);

  try {
    // Navigate to the page
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);

    // Run Axe tests
    const results = await new AxePuppeteer(page).analyze();

    // Close the page
    await page.close();

    // Return results
    return {
      url,
      violations: results.violations,
      incomplete: results.incomplete,
      passes: results.passes,
      inapplicable: results.inapplicable,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error testing ${url}:`, error);
    return {
      url,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log('Starting Axe accessibility tests...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Test each URL
    for (const url of urls) {
      const pageResults = await testPage(url, browser);
      results.pages.push(pageResults);

      // Update summary
      if (pageResults.violations) {
        results.summary.violations += pageResults.violations.length;
        results.summary.incomplete += pageResults.incomplete.length;
        results.summary.passes += pageResults.passes.length;
        results.summary.inapplicable += pageResults.inapplicable.length;
        results.summary.total++;

        // Log violations
        if (pageResults.violations.length > 0) {
          console.log(`\n❌ Found ${pageResults.violations.length} violations on ${url}:`);
          pageResults.violations.forEach((violation, index) => {
            console.log(`  ${index + 1}. ${violation.help} - ${violation.description}`);
            console.log(`     Impact: ${violation.impact}`);
            console.log(`     Tags: ${violation.tags.join(', ')}`);
          });
        } else {
          console.log(`\n✅ No violations found on ${url}`);
        }
      } else if (pageResults.error) {
        console.error(`\n❌ Error testing ${url}: ${pageResults.error}`);
      }
    }
  } finally {
    await browser.close();
  }

  // Save results to file
  const outputPath = path.join(process.cwd(), 'axe-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outputPath}`);

  // Print summary
  console.log('\n📊 Test Summary\n');
  console.log(`Total pages tested: ${results.summary.total}`);
  console.log(`Total violations: ${results.summary.violations}`);
  console.log(`Total incomplete: ${results.summary.incomplete}`);
  console.log(`Total passes: ${results.summary.passes}`);

  // Exit with error code if any violations were found
  if (results.summary.violations > 0) {
    console.error('\n❌ Accessibility violations found. See report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ No accessibility violations found!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
