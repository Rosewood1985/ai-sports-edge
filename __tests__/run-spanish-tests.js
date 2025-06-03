/**
 * Run Spanish Language Tests
 *
 * This script runs the Spanish language tests to verify that the Spanish
 * translations are working correctly across the app.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Print a header
console.log(
  `\n${colors.bgBlue}${colors.white}${colors.bright} SPANISH LANGUAGE TESTS ${colors.reset}\n`
);
console.log(`${colors.cyan}Running tests to verify Spanish translations...${colors.reset}\n`);

// Create the test results directory if it doesn't exist
const testResultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir);
}

// Run the tests
try {
  console.log(`${colors.yellow}Running Spanish language tests...${colors.reset}`);

  // Run the tests with Jest
  const testCommand =
    'npx jest --testMatch="**/__tests__/i18n/spanish-language-test.js" --json --outputFile=test-results/spanish-test-results.json';
  execSync(testCommand, { stdio: 'inherit' });

  // Read the test results
  const testResults = JSON.parse(
    fs.readFileSync(path.join(testResultsDir, 'spanish-test-results.json'), 'utf8')
  );

  // Generate a summary
  const totalTests = testResults.numTotalTests;
  const passedTests = testResults.numPassedTests;
  const failedTests = testResults.numFailedTests;
  const skippedTests = testResults.numPendingTests;

  // Write the summary to a file
  const summary = `# Spanish Testing Summary

## Test Results
- Total Tests: ${totalTests}
- Passed Tests: ${passedTests}
- Failed Tests: ${failedTests}
- Skipped Tests: ${skippedTests}

## Test Suites
${testResults.testResults
  .map(suite => {
    return `### ${suite.name}
- Status: ${suite.status}
- Tests: ${suite.assertionResults.length}
- Passed: ${suite.assertionResults.filter(test => test.status === 'passed').length}
- Failed: ${suite.assertionResults.filter(test => test.status === 'failed').length}

${suite.assertionResults
  .map(test => {
    const status = test.status === 'passed' ? '✅' : '❌';
    return `- ${status} ${test.title}`;
  })
  .join('\n')}
`;
  })
  .join('\n')}

## Conclusion
${
  passedTests === totalTests
    ? '✅ All Spanish language tests passed. The Spanish translations are working correctly across the app.'
    : '❌ Some Spanish language tests failed. Please check the test results for details.'
}
`;

  fs.writeFileSync(path.join(__dirname, 'spanish-testing-summary.md'), summary);

  // Print the summary
  console.log(`\n${colors.green}${colors.bright}Test Summary:${colors.reset}`);
  console.log(`${colors.white}Total Tests: ${colors.reset}${totalTests}`);
  console.log(`${colors.green}Passed Tests: ${colors.reset}${passedTests}`);
  console.log(`${colors.red}Failed Tests: ${colors.reset}${failedTests}`);
  console.log(`${colors.yellow}Skipped Tests: ${colors.reset}${skippedTests}`);

  if (passedTests === totalTests) {
    console.log(
      `\n${colors.bgGreen}${colors.black}${colors.bright} SUCCESS ${colors.reset} ${colors.green}All Spanish language tests passed!${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.bgRed}${colors.white}${colors.bright} FAILURE ${colors.reset} ${colors.red}Some Spanish language tests failed!${colors.reset}`
    );
  }

  console.log(
    `\n${colors.cyan}Test summary written to: ${colors.reset}${path.join(__dirname, 'spanish-testing-summary.md')}`
  );
} catch (error) {
  console.error(
    `\n${colors.bgRed}${colors.white}${colors.bright} ERROR ${colors.reset} ${colors.red}Failed to run Spanish language tests:${colors.reset}`
  );
  console.error(error.message);
  process.exit(1);
}
