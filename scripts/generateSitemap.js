/**
 * Multilingual Sitemap Generator
 *
 * This script generates a multilingual XML sitemap for the AI Sports Edge website.
 * It includes hreflang annotations for each URL to indicate language alternatives.
 */

const fs = require('fs');
const path = require('path');

// Import SEO config
const seoConfig = require('../config/seo');

// Define your routes (paths without language prefix)
const routes = [
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

// Base URL of the website
const baseUrl = seoConfig.baseUrl || 'https://aisportsedge.app';

// Output directory
const outputDir = path.join(__dirname, '../public');

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
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  // Write sitemap to file
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap for ${language} generated successfully at ${outputPath}`);

  return outputPath;
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
    const sitemapUrl = `${baseUrl}/sitemap-${language}.xml`;

    sitemapIndex += '  <sitemap>\n';
    sitemapIndex += `    <loc>${sitemapUrl}</loc>\n`;
    sitemapIndex += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemapIndex += '  </sitemap>\n';
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
