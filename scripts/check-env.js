#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script checks if all required environment variables are set
 * and provides helpful error messages for missing variables.
 * 
 * Usage:
 *   node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENV_FILE = '.env';
const ENV_EXAMPLE_FILE = '.env.example';
const REQUIRED_VARIABLES = [
  // Firebase
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  
  // Stripe (only if using Stripe)
  // 'STRIPE_PUBLISHABLE_KEY',
  // 'STRIPE_SECRET_KEY',
  
  // Affiliate Links
  'FANDUEL_AFFILIATE_ID',
  'FANDUEL_AFFILIATE_LINK',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if the file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Load environment variables from a file
 * @param {string} filePath - Path to the .env file
 * @returns {Object} - Environment variables
 */
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;
      
      // Parse key=value pairs
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      }
    });
    
    return env;
  } catch (error) {
    console.error(`${colors.red}Error loading ${filePath}:${colors.reset}`, error.message);
    return {};
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.blue}Checking environment variables...${colors.reset}`);
  
  // Check if .env file exists
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  if (!fileExists(envPath)) {
    console.error(`${colors.red}Error: ${ENV_FILE} file not found.${colors.reset}`);
    console.log(`${colors.yellow}Please create a ${ENV_FILE} file by copying ${ENV_EXAMPLE_FILE}:${colors.reset}`);
    console.log(`cp ${ENV_EXAMPLE_FILE} ${ENV_FILE}`);
    process.exit(1);
  }
  
  // Load environment variables
  const env = loadEnvFile(envPath);
  
  // Check required variables
  const missingVars = REQUIRED_VARIABLES.filter(key => !env[key]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}Error: Missing required environment variables:${colors.reset}`);
    missingVars.forEach(key => {
      console.error(`  - ${colors.yellow}${key}${colors.reset}`);
    });
    console.log(`\n${colors.cyan}Please add these variables to your ${ENV_FILE} file.${colors.reset}`);
    console.log(`${colors.cyan}See ${ENV_EXAMPLE_FILE} for examples.${colors.reset}`);
    process.exit(1);
  }
  
  // Check for placeholder values
  const placeholderVars = REQUIRED_VARIABLES.filter(key => {
    const value = env[key];
    return value && (
      value.includes('your-') || 
      value.includes('placeholder') || 
      value === 'REPLACE_ME'
    );
  });
  
  if (placeholderVars.length > 0) {
    console.warn(`${colors.yellow}Warning: The following variables appear to have placeholder values:${colors.reset}`);
    placeholderVars.forEach(key => {
      console.warn(`  - ${colors.yellow}${key}${colors.reset}`);
    });
    console.log(`\n${colors.cyan}Please replace these with actual values in your ${ENV_FILE} file.${colors.reset}`);
  }
  
  // Success
  if (missingVars.length === 0 && placeholderVars.length === 0) {
    console.log(`${colors.green}All required environment variables are set.${colors.reset}`);
  }
}

// Run the script
main();