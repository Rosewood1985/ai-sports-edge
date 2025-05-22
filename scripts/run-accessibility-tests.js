#!/usr/bin/env node
/**
 * Accessibility Testing Script
 *
 * This script runs accessibility tests on the AI Sports Edge application
 * using jest-axe to check for WCAG compliance.
 *
 * Usage:
 *   node scripts/run-accessibility-tests.js [options]
 *
 * Options:
 *   --component=<name>  Run tests only for the specified component
 *   --verbose           Show detailed test results
 *   --ci                Run in CI mode (exits with error code on failure)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  component: null,
  verbose: false,
  ci: false,
};

args.forEach(arg => {
  if (arg.startsWith('--component=')) {
    options.component = arg.split('=')[1];
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--ci') {
    options.ci = true;
  }
});

// Build the test command
let testCommand = 'npx jest';

// Add accessibility test pattern
if (options.component) {
  testCommand += ` ${options.component}`;
} else {
  testCommand += ' --testPathPattern=__tests__/accessibility';
}

// Add verbose flag if needed
if (options.verbose) {
  testCommand += ' --verbose';
}

// Add CI mode if needed
if (options.ci) {
  testCommand += ' --ci';
}

// Disable reporters that might not be installed
testCommand += ' --reporters=default';

// Exclude translations directory to avoid JSON parsing issues
testCommand += ' --testPathIgnorePatterns=node_modules --testPathIgnorePatterns=translations';

console.log(`\n🔍 Running Accessibility Tests\n`);
console.log(`Command: ${testCommand}\n`);

try {
  // Run the tests
  execSync(testCommand, { stdio: 'inherit' });

  console.log('\n✅ Accessibility Tests Passed\n');

  // Generate a report
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'accessibility-report.json');
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    result: 'passed',
    command: testCommand,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);

  process.exit(0);
} catch (error) {
  console.error('\n❌ Accessibility Tests Failed\n');

  if (options.verbose) {
    console.error(error.toString());
  }

  // Generate a failure report
  const reportDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'accessibility-report.json');
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    result: 'failed',
    command: testCommand,
    error: error.toString(),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Failure report saved to: ${reportPath}`);

  process.exit(options.ci ? 1 : 0);
}
