/**
 * Build Web Script
 * 
 * This script builds the web version of the app and generates the sitemap.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * Log a step with color
 */
function logStep(step, message) {
  console.log(`${colors.fg.cyan}[${step}]${colors.reset} ${message}`);
}

/**
 * Log a success message
 */
function logSuccess(message) {
  console.log(`${colors.fg.green}✓ ${message}${colors.reset}`);
}

/**
 * Log an error message
 */
function logError(message) {
  console.error(`${colors.fg.red}✗ ${message}${colors.reset}`);
}

/**
 * Execute a command and log the output
 */
function execute(command, options = {}) {
  try {
    logStep('EXEC', command);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    logError(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Build the web version of the app
 */
function buildWeb() {
  logStep('BUILD', 'Building web version...');
  
  // Run the Expo web build
  const success = execute('expo build:web');
  
  if (success) {
    logSuccess('Web build completed successfully');
    return true;
  } else {
    logError('Web build failed');
    return false;
  }
}

/**
 * Generate the sitemap
 */
function generateSitemap() {
  logStep('SITEMAP', 'Generating sitemap...');
  
  // Run the sitemap generator
  const success = execute('node ./scripts/generateSitemap.js');
  
  if (success) {
    logSuccess('Sitemap generated successfully');
    
    // Ensure the sitemap is copied to the web-build directory
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    const webBuildPath = path.join(__dirname, '../web-build/sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
      fs.copyFileSync(sitemapPath, webBuildPath);
      logSuccess(`Sitemap copied to ${webBuildPath}`);
    } else {
      logError(`Sitemap not found at ${sitemapPath}`);
    }
    
    return true;
  } else {
    logError('Sitemap generation failed');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bright}${colors.fg.cyan}=== AI Sports Edge Web Build ===${colors.reset}\n`);
  
  // Build the web version
  const buildSuccess = buildWeb();
  
  if (buildSuccess) {
    // Generate the sitemap
    const sitemapSuccess = generateSitemap();
    
    if (sitemapSuccess) {
      console.log(`\n${colors.bright}${colors.fg.green}=== Build Completed Successfully ===${colors.reset}`);
    } else {
      console.log(`\n${colors.bright}${colors.fg.yellow}=== Build Completed with Warnings ===${colors.reset}`);
      console.log('The web build was successful, but the sitemap generation failed.');
    }
  } else {
    console.log(`\n${colors.bright}${colors.fg.red}=== Build Failed ===${colors.reset}`);
    process.exit(1);
  }
}

// Run the main function
main();
