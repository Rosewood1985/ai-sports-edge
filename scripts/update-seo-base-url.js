/**
 * Update SEO Base URL Script
 *
 * This script updates the SEO base URL in the configuration file and environment variables.
 * It's useful for updating the base URL when deploying to different environments.
 *
 * Usage:
 * node scripts/update-seo-base-url.js https://aisportsedge.app
 */

const fs = require('fs');
const path = require('path');

// Get the base URL from command line arguments or use default
const baseUrl = process.argv[2] || 'https://aisportsedge.app';

// Path to the SEO config file
const seoConfigPath = path.join(__dirname, '../config/seo.ts');

// Read the current SEO config file
let seoConfig = fs.readFileSync(seoConfigPath, 'utf8');

// Replace the base URL
seoConfig = seoConfig.replace(
  /baseUrl: process\.env\.SEO_BASE_URL \|\| ['"].*?['"]/,
  `baseUrl: process.env.SEO_BASE_URL || '${baseUrl}'`
);

// Write the updated SEO config file
fs.writeFileSync(seoConfigPath, seoConfig);

console.log(`Updated SEO base URL to: ${baseUrl}`);

// Update environment variables in .env files
const envFiles = ['.env', '.env.development', '.env.production'];

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, '..', envFile);

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if SEO_BASE_URL already exists
    if (envContent.includes('SEO_BASE_URL=')) {
      // Update existing SEO_BASE_URL
      envContent = envContent.replace(/SEO_BASE_URL=.*$/m, `SEO_BASE_URL=${baseUrl}`);
    } else {
      // Add SEO_BASE_URL
      envContent += `\nSEO_BASE_URL=${baseUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`Updated ${envFile} with SEO_BASE_URL=${baseUrl}`);
  }
});

// Update the sitemap generation script
const sitemapScriptPath = path.join(__dirname, 'generateSitemap.js');

if (fs.existsSync(sitemapScriptPath)) {
  let sitemapScript = fs.readFileSync(sitemapScriptPath, 'utf8');

  // Replace the base URL in the sitemap script
  sitemapScript = sitemapScript.replace(
    /const baseUrl = .*?;/,
    `const baseUrl = seoConfig.baseUrl || '${baseUrl}';`
  );

  fs.writeFileSync(sitemapScriptPath, sitemapScript);
  console.log(`Updated sitemap script with base URL: ${baseUrl}`);
}

console.log('SEO base URL update completed successfully!');
