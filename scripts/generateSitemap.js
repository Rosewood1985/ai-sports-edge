/**
 * Multilingual Sitemap Generator
 *
 * This script generates a multilingual XML sitemap for the AI Sports Edge website.
 * It includes hreflang annotations for each URL to indicate language alternatives.
 *
 * Features:
 * - Dynamic route discovery from application's routing configuration
 * - Configurable output directory
 * - Validation of sitemap references
 * - Support for different build environments
 */

const fs = require('fs');
const path = require('path');

// Import SEO config
const seoConfig = require('../config/seo');

// Import routes from the application's routing configuration
const appRoutesPath = path.join(__dirname, '../src/navigation/AppRoutes.js');
let routes = [];

// Function to extract routes from the application's routing configuration
function extractRoutesFromAppRoutes() {
  try {
    // Read the AppRoutes.js file
    const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');

    // Extract route paths using regex
    const routeRegex = /['"]\/[^'"]*['"]/g;
    const matches = appRoutesContent.match(routeRegex);

    if (matches && matches.length > 0) {
      // Clean up the matches to get just the route paths
      routes = matches
        .map(match => match.replace(/['"]/g, ''))
        // Remove dynamic route parameters (e.g., :id)
        .map(route => route.replace(/\/:[^\/]+/g, ''))
        // Remove duplicates
        .filter((route, index, self) => self.indexOf(route) === index)
        // Filter out excluded paths
        .filter(
          route =>
            !seoConfig.sitemap.excludePaths.some(
              exclude => route === exclude || route.startsWith(`${exclude}/`)
            )
        );

      console.log(`Extracted ${routes.length} routes from AppRoutes.js`);
    } else {
      console.warn('No routes found in AppRoutes.js, falling back to default routes');
      // Fallback to default routes if extraction fails
      routes = [
        '/',
        '/dashboard',
        '/betting',
        '/stats',
        '/news',
        '/picks',
        '/account',
        '/subscription',
        '/about',
        '/contact',
        '/terms',
        '/privacy',
      ];
    }
  } catch (error) {
    console.error('Error extracting routes from AppRoutes.js:', error);
    console.log('Falling back to default routes');
    // Fallback to default routes if extraction fails
    routes = [
      '/',
      '/dashboard',
      '/betting',
      '/stats',
      '/news',
      '/picks',
      '/account',
      '/subscription',
      '/about',
      '/contact',
      '/terms',
      '/privacy',
    ];
  }
}

// Extract routes from the application's routing configuration
extractRoutesFromAppRoutes();

// Base URL of the website
const baseUrl = seoConfig.baseUrl || 'https://aisportsedge.app';

// Get output directory from environment variable or use default
const outputDir = process.env.SITEMAP_OUTPUT_DIR || path.join(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output file paths
const sitemapIndexPath = path.join(outputDir, 'sitemap.xml');
const languageSitemapPaths = {};

/**
 * Generate language-specific sitemap
 * @param {string} language - Language code
 * @returns {string} - Path to the generated sitemap file
 */
const generateLanguageSitemap = language => {
  console.log(`Generating sitemap for language: ${language}...`);

  const outputPath = path.join(outputDir, `sitemap-${language}.xml`);
  languageSitemapPaths[language] = outputPath;

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  sitemap += '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // Add each route for this language
  routes.forEach(route => {
    const url = `${baseUrl}/${language}${route}`;

    sitemap += '  <url>\n';
    sitemap += `    <loc>${url}</loc>\n`;

    // Add hreflang references for all language alternatives
    seoConfig.languages.forEach(langConfig => {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${langConfig.hreflang}" href="${baseUrl}/${langConfig.code}${route}" />\n`;
    });

    // Add x-default (usually points to English)
    sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/en${route}" />\n`;

    // Add lastmod, changefreq, and priority
    sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemap += `    <changefreq>${seoConfig.sitemap.changefreq || 'weekly'}</changefreq>\n`;
    sitemap += `    <priority>${seoConfig.sitemap.priority || 0.8}</priority>\n`;
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  // Write sitemap to file
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap for ${language} generated successfully at ${outputPath}`);

  return outputPath;
};

/**
 * Validate sitemap file exists
 * @param {string} sitemapPath - Path to the sitemap file
 * @returns {boolean} - Whether the sitemap file exists
 */
const validateSitemap = sitemapPath => {
  if (!fs.existsSync(sitemapPath)) {
    console.error(`Sitemap file not found: ${sitemapPath}`);
    return false;
  }
  return true;
};

/**
 * Generate sitemap index file
 * @param {Object} languageSitemaps - Map of language codes to sitemap file paths
 */
const generateSitemapIndex = languageSitemaps => {
  console.log('Generating sitemap index...');

  let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add each language sitemap
  Object.keys(languageSitemaps).forEach(language => {
    // Validate that the sitemap file exists
    if (validateSitemap(languageSitemaps[language])) {
      // Use relative URLs for sitemap references to avoid issues with base URL changes
      const sitemapUrl = `${baseUrl}/sitemap-${language}.xml`;

      sitemapIndex += '  <sitemap>\n';
      sitemapIndex += `    <loc>${sitemapUrl}</loc>\n`;
      sitemapIndex += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemapIndex += '  </sitemap>\n';
    }
  });

  sitemapIndex += '</sitemapindex>';

  // Write sitemap index to file
  fs.writeFileSync(sitemapIndexPath, sitemapIndex);
  console.log(`Sitemap index generated successfully at ${sitemapIndexPath}`);
};

/**
 * Generate all sitemaps
 */
const generateSitemap = () => {
  console.log('Generating multilingual sitemaps...');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Routes: ${routes.join(', ')}`);

  // Generate language-specific sitemaps
  seoConfig.languages.forEach(langConfig => {
    generateLanguageSitemap(langConfig.code);
  });

  // Generate sitemap index
  generateSitemapIndex(languageSitemapPaths);

  console.log('All sitemaps generated successfully!');
};

// Run the generator
generateSitemap();

// Export for potential programmatic use
module.exports = { generateSitemap };
