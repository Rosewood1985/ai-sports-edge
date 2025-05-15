/**
 * AI Sports Edge - Update Firebase Configuration
 * 
 * This script updates the firebase.json file to:
 * 1. Use the correct hosting site (aisportsedge-app)
 * 2. Configure custom domains (aisportsedge.app and www.aisportsedge.app)
 * 3. Set up proper security headers and HTTPS enforcement
 * 4. Configure redirects and rewrites
 */

const fs = require('fs');
const path = require('path');

// Configuration
const firebaseConfigPath = 'firebase.json';
const customDomains = ['aisportsedge.app', 'www.aisportsedge.app'];
const siteName = 'aisportsedge-app';

/**
 * Read and parse the firebase.json file
 * @returns {Object} Parsed firebase.json content
 */
function readFirebaseConfig() {
  try {
    if (fs.existsSync(firebaseConfigPath)) {
      const content = fs.readFileSync(firebaseConfigPath, 'utf8');
      return JSON.parse(content);
    } else {
      console.log(`${firebaseConfigPath} not found, creating a new one`);
      return {};
    }
  } catch (error) {
    console.error(`Error reading ${firebaseConfigPath}: ${error.message}`);
    return {};
  }
}

/**
 * Write the updated config back to firebase.json
 * @param {Object} config - Updated firebase.json content
 */
function writeFirebaseConfig(config) {
  try {
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(firebaseConfigPath, content);
    console.log(`Updated ${firebaseConfigPath}`);
  } catch (error) {
    console.error(`Error writing ${firebaseConfigPath}: ${error.message}`);
  }
}

/**
 * Update the hosting configuration
 * @param {Object} config - Firebase configuration
 * @returns {Object} Updated configuration
 */
function updateHostingConfig(config) {
  // Ensure hosting exists
  if (!config.hosting) {
    config.hosting = {};
  }
  
  // Convert to array if it's a single object
  if (!Array.isArray(config.hosting)) {
    config.hosting = [config.hosting];
  }
  
  // Find or create the hosting config for our site
  let siteConfig = config.hosting.find(site => site.site === siteName);
  if (!siteConfig) {
    siteConfig = { site: siteName };
    config.hosting.push(siteConfig);
  }
  
  // Update the hosting configuration
  siteConfig.public = 'dist';
  siteConfig.ignore = [
    'firebase.json',
    '**/.*',
    '**/node_modules/**'
  ];
  
  // Set up custom domains
  siteConfig.customDomains = customDomains;
  
  // Configure headers for security
  siteConfig.headers = [
    {
      "source": "**/*.@(js|html|css|json)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=3600"
        }
      ]
    },
    {
      "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico|woff|woff2|ttf|otf)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=604800"
        }
      ]
    },
    {
      "source": "**",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://www.google-analytics.com; font-src 'self'; frame-src 'self'; object-src 'none'"
        }
      ]
    }
  ];
  
  // Configure redirects
  siteConfig.redirects = [
    {
      "source": "/home",
      "destination": "/",
      "type": 301
    },
    {
      "source": "/index.html",
      "destination": "/",
      "type": 301
    }
  ];
  
  // Configure rewrites for SPA
  siteConfig.rewrites = [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ];
  
  // Configure clean URLs
  siteConfig.cleanUrls = true;
  
  // Configure HTTPS enforcement
  siteConfig.trailingSlash = false;
  
  return config;
}

/**
 * Update the Firebase configuration
 */
function updateFirebaseConfig() {
  // Read the current config
  const config = readFirebaseConfig();
  
  // Update the hosting configuration
  const updatedConfig = updateHostingConfig(config);
  
  // Write the updated config
  writeFirebaseConfig(updatedConfig);
}

/**
 * Main execution
 */
function main() {
  console.log('Updating Firebase configuration...');
  
  // Update the Firebase configuration
  updateFirebaseConfig();
  
  console.log('Firebase configuration updated successfully!');
  console.log(`
Next steps:
1. Run 'firebase login' if you haven't already
2. Run 'firebase use --add' and select your project
3. Run 'firebase target:apply hosting ${siteName} ${siteName}'
4. Run 'firebase deploy --only hosting:${siteName}'
5. Set up DNS records as described in the documentation
`);
}

// Run the script
main();