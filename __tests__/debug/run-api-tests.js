/**
 * Run API Service Tests
 * 
 * This script runs the API service tests and outputs the results.
 * It can be used to validate the improvements made to the API service.
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
  bgWhite: '\x1b[47m'
};

// Output directory for test results
const outputDir = path.join(__dirname, '..', '..', 'test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output file for test results
const outputFile = path.join(outputDir, 'api-service-test-results.txt');

// Log header
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  Running API Service Tests${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log();

try {
  // Run the tests
  console.log(`${colors.yellow}Running tests...${colors.reset}`);
  
  // Capture the output of the test command
  const output = execSync('npx jest --config=jest.config.js __tests__/debug/api-service-test.js --verbose', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
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
  console.log(`${colors.bright}${colors.cyan}Summary of API Service Improvements:${colors.reset}`);
  console.log();
  console.log(`${colors.bright}1. Enhanced Error Handling${colors.reset}`);
  console.log(`   - Added detailed error logging with context information`);
  console.log(`   - Integrated with the error tracking service`);
  console.log(`   - Added specific error handling for different error types`);
  console.log();
  console.log(`${colors.bright}2. Authentication Improvements${colors.reset}`);
  console.log(`   - Updated to use getAuth() instead of direct auth import`);
  console.log(`   - Added error handling for token retrieval`);
  console.log(`   - Added logging of authentication status for requests`);
  console.log();
  console.log(`${colors.bright}3. Network Layer Enhancements${colors.reset}`);
  console.log(`   - Added network connectivity check before making requests`);
  console.log(`   - Enhanced retry mechanism with detailed logging`);
  console.log(`   - Added performance metrics for request timing`);
  console.log();
  console.log(`${colors.bright}4. Request/Response Logging${colors.reset}`);
  console.log(`   - Added detailed logging for request details`);
  console.log(`   - Added logging of response status and timing`);
  console.log(`   - Added structured logging for API operations`);
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
console.log(`${colors.bright}${colors.cyan}  API Service Tests Complete${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);