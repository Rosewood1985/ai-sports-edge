/**
 * Multilingual Sitemap Generator
 * 
 * This script generates a multilingual XML sitemap for the AI Sports Edge website.
 * It includes hreflang annotations for each URL to indicate language alternatives.
 */

const fs = require('fs');
const path = require('path');

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

// Define supported languages
const languages = ['en', 'es'];

// Base URL of the website
const baseUrl = 'https://ai-sports-edge.com';

// Output file path
const outputPath = path.join(__dirname, '../public/sitemap.xml');

// Generate sitemap
const generateSitemap = () => {
  console.log('Generating multilingual sitemap...');
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  sitemap += '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  // Add each route in each language
  routes.forEach(route => {
    languages.forEach(lang => {
      const url = `${baseUrl}/${lang}${route}`;
      
      sitemap += '  <url>\n';
      sitemap += `    <loc>${url}</loc>\n`;
      
      // Add hreflang references for all language alternatives
      languages.forEach(hrefLang => {
        sitemap += `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${baseUrl}/${hrefLang}${route}" />\n`;
      });
      
      // Add x-default (usually points to English)
      sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/en${route}" />\n`;
      
      // Add lastmod, changefreq, and priority
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';
      sitemap += '  </url>\n';
    });
  });
  
  sitemap += '</urlset>';
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write sitemap to file
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated successfully at ${outputPath}`);
};

// Run the generator
generateSitemap();

// Export for potential programmatic use
module.exports = { generateSitemap };