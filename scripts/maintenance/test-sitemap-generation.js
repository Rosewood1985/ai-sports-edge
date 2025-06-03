/**
 * Test Sitemap Generation Script
 *
 * This script tests the sitemap generation process with different configurations.
 * It verifies that the dynamic route discovery, validation, and configurable output
 * directory features work as expected.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const testConfigs = [
  {
    name: 'Default configuration',
    env: {},
    expectedOutputDir: path.join(__dirname, '../public'),
  },
  {
    name: 'Custom output directory',
    env: { SITEMAP_OUTPUT_DIR: path.join(__dirname, '../test-output') },
    expectedOutputDir: path.join(__dirname, '../test-output'),
  },
];

// Function to clean up test directories
function cleanupTestDirectories() {
  console.log('Cleaning up test directories...');

  testConfigs.forEach(config => {
    if (config.env.SITEMAP_OUTPUT_DIR && fs.existsSync(config.env.SITEMAP_OUTPUT_DIR)) {
      try {
        fs.rmSync(config.env.SITEMAP_OUTPUT_DIR, { recursive: true, force: true });
        console.log(`Removed directory: ${config.env.SITEMAP_OUTPUT_DIR}`);
      } catch (error) {
        console.error(`Error removing directory ${config.env.SITEMAP_OUTPUT_DIR}:`, error);
      }
    }
  });
}

// Function to verify sitemap files
function verifySitemapFiles(outputDir, languages) {
  console.log(`Verifying sitemap files in ${outputDir}...`);

  // Check sitemap index file
  const sitemapIndexPath = path.join(outputDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapIndexPath)) {
    console.error(`❌ Sitemap index file not found: ${sitemapIndexPath}`);
    return false;
  }
  console.log(`✅ Sitemap index file found: ${sitemapIndexPath}`);

  // Check language-specific sitemap files
  let allSitemapsExist = true;
  languages.forEach(language => {
    const sitemapPath = path.join(outputDir, `sitemap-${language}.xml`);
    if (!fs.existsSync(sitemapPath)) {
      console.error(`❌ Language sitemap file not found: ${sitemapPath}`);
      allSitemapsExist = false;
    } else {
      console.log(`✅ Language sitemap file found: ${sitemapPath}`);
    }
  });

  return allSitemapsExist;
}

// Function to verify sitemap content
function verifySitemapContent(outputDir) {
  console.log(`Verifying sitemap content in ${outputDir}...`);

  // Check sitemap index file content
  const sitemapIndexPath = path.join(outputDir, 'sitemap.xml');
  const sitemapIndexContent = fs.readFileSync(sitemapIndexPath, 'utf8');

  // Verify sitemap index contains references to language sitemaps
  const containsLanguageSitemaps =
    sitemapIndexContent.includes('<loc>') &&
    sitemapIndexContent.includes('sitemap-en.xml') &&
    sitemapIndexContent.includes('sitemap-es.xml');

  if (!containsLanguageSitemaps) {
    console.error('❌ Sitemap index does not contain references to language sitemaps');
    return false;
  }
  console.log('✅ Sitemap index contains references to language sitemaps');

  // Check language sitemap content
  const enSitemapPath = path.join(outputDir, 'sitemap-en.xml');
  const enSitemapContent = fs.readFileSync(enSitemapPath, 'utf8');

  // Verify language sitemap contains hreflang annotations
  const containsHreflang =
    enSitemapContent.includes('hreflang="en"') &&
    enSitemapContent.includes('hreflang="es"') &&
    enSitemapContent.includes('hreflang="x-default"');

  if (!containsHreflang) {
    console.error('❌ Language sitemap does not contain hreflang annotations');
    return false;
  }
  console.log('✅ Language sitemap contains hreflang annotations');

  return true;
}

// Function to run the test
async function runTest() {
  try {
    // Clean up test directories first
    cleanupTestDirectories();

    // Run tests for each configuration
    for (const config of testConfigs) {
      console.log(`\n=== Testing: ${config.name} ===\n`);

      // Create output directory if it doesn't exist
      if (config.env.SITEMAP_OUTPUT_DIR && !fs.existsSync(config.env.SITEMAP_OUTPUT_DIR)) {
        fs.mkdirSync(config.env.SITEMAP_OUTPUT_DIR, { recursive: true });
      }

      // Set environment variables
      const envVars = Object.entries(config.env)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

      // Run the sitemap generation script
      const command = `${envVars} node ${path.join(__dirname, 'generateSitemap.js')}`;
      console.log(`Running command: ${command}`);

      try {
        execSync(command, { stdio: 'inherit' });
        console.log('Sitemap generation completed successfully');

        // Verify the output
        const languages = ['en', 'es', 'es-US', 'es-MX', 'es-ES'];
        const filesExist = verifySitemapFiles(config.expectedOutputDir, languages);
        const contentValid = filesExist && verifySitemapContent(config.expectedOutputDir);

        if (filesExist && contentValid) {
          console.log(`\n✅ Test passed for: ${config.name}\n`);
        } else {
          console.error(`\n❌ Test failed for: ${config.name}\n`);
        }
      } catch (error) {
        console.error(`Error running sitemap generation:`, error);
        console.error(`\n❌ Test failed for: ${config.name}\n`);
      }
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Clean up test directories
    cleanupTestDirectories();
  }
}

// Run the tests
runTest().then(() => {
  console.log('All tests completed');
});
