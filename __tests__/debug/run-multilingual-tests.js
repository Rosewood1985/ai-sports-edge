/**
 * Run Multilingual Error Tests
 *
 * This script runs the multilingual error tests and outputs the results.
 * It can be used to validate the multilingual error handling improvements.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output formatting
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

// Output directory for test results
const outputDir = path.join(__dirname, '..', '..', 'test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output file for test results
const outputFile = path.join(outputDir, 'multilingual-error-test-results.txt');

// Log header
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  Running Multilingual Error Tests${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log();

try {
  // Run the tests
  console.log(`${colors.yellow}Running tests...${colors.reset}`);

  // Capture the output of the test command
  const output = execSync(
    'npx jest --config=jest.config.js __tests__/debug/multilingual-error-test.js --verbose',
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  );

  // Write the output to the file
  fs.writeFileSync(outputFile, output);

  // Parse the output to determine if tests passed
  const passed = !output.includes('FAIL');

  if (passed) {
    console.log(`${colors.green}All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}Some tests failed. See ${outputFile} for details.${colors.reset}`);
  }

  // Log the test results
  console.log();
  console.log(`${colors.bright}Test Results:${colors.reset}`);
  console.log(output);

  // Log the output file location
  console.log();
  console.log(`${colors.bright}Test results saved to:${colors.reset} ${outputFile}`);

  // Generate a summary of the improvements
  console.log();
  console.log(
    `${colors.bright}${colors.cyan}Summary of Multilingual Error Handling Improvements:${colors.reset}`
  );
  console.log();
  console.log(`${colors.bright}1. Translation Integration${colors.reset}`);
  console.log(`   - Error messages are now properly translated in both English and Spanish`);
  console.log(`   - Added missing error translations to Spanish translation file`);
  console.log(`   - Created a merge script to keep translations in sync`);
  console.log();
  console.log(`${colors.bright}2. Error Handling${colors.reset}`);
  console.log(`   - Error messages now use the translation system`);
  console.log(`   - Added comprehensive error handling for authentication and API errors`);
  console.log(`   - Improved error recovery in critical operations`);
  console.log();
  console.log(`${colors.bright}3. Logging${colors.reset}`);
  console.log(`   - Added detailed logging for errors in both languages`);
  console.log(`   - Integrated with error tracking service`);
  console.log(`   - Added context information to log entries`);
  console.log();
  console.log(`${colors.bright}4. Testing${colors.reset}`);
  console.log(`   - Added tests for multilingual error handling`);
  console.log(
    `   - Tests verify that error messages are properly displayed in different languages`
  );
  console.log(`   - Tests verify that language switching updates error messages`);
  console.log();
} catch (error) {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error.message);

  // Write the error to the file
  fs.writeFileSync(outputFile, `Error running tests: ${error.message}\n\n${error.stack}`);

  // Log the output file location
  console.log();
  console.log(`${colors.bright}Error details saved to:${colors.reset} ${outputFile}`);
}

// Log footer
console.log();
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  Multilingual Error Tests Complete${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
