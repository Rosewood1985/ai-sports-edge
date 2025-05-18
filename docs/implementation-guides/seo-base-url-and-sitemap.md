# SEO Base URL and Sitemap Implementation Guide

## Overview

This guide provides specific instructions for fixing the SEO base URL configuration and implementing sitemap generation for the AI Sports Edge application. These improvements will enhance search engine discoverability and ensure consistent URL handling across the application.

## Table of Contents

- [SEO Base URL Configuration](#seo-base-url-configuration)
- [Sitemap Generation](#sitemap-generation)
- [Implementation Steps](#implementation-steps)
- [Testing and Verification](#testing-and-verification)
- [Maintenance](#maintenance)

## SEO Base URL Configuration

### Current Issues

The current SEO base URL implementation has the following issues:

1. Inconsistent base URL usage across different parts of the application
2. Hardcoded URLs in some components
3. Environment-specific URLs not properly handled
4. Missing canonical URL tags in some pages

### Solution

We'll implement a centralized SEO configuration with a consistent base URL approach:

1. Create a centralized SEO configuration file
2. Implement environment-specific base URL handling
3. Create utility functions for URL generation
4. Update components to use the centralized configuration

### Implementation

#### 1. Create/Update SEO Configuration File

```javascript
// config/seo.js
export const seoConfig = {
  // Base URL for the website (without trailing slash)
  baseUrl: process.env.SEO_BASE_URL || 'https://aisportsedge.app',

  // Default metadata
  defaultTitle: 'AI Sports Edge - Sports Betting Insights',
  defaultDescription:
    'Get AI-powered sports betting insights and odds comparison for smarter betting decisions.',
  defaultImage: '/images/og-default.jpg',

  // Social media handles
  twitter: {
    handle: '@AISportsEdge',
    site: '@AISportsEdge',
    cardType: 'summary_large_image',
  },

  // Sitemap settings
  sitemap: {
    excludePaths: ['/admin', '/login', '/signup', '/account'],
    changefreq: 'daily',
    priority: 0.7,
  },
};
```

#### 2. Create URL Utility Functions

```javascript
// utils/urlUtils.js
import { seoConfig } from '../config/seo';

/**
 * Generates an absolute URL from a relative path
 * @param {string} path - Relative path (with or without leading slash)
 * @returns {string} Absolute URL
 */
export const getAbsoluteUrl = path => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${seoConfig.baseUrl}${normalizedPath}`;
};

/**
 * Generates a canonical URL for the current page
 * @param {string} path - Relative path (with or without leading slash)
 * @returns {string} Canonical URL
 */
export const getCanonicalUrl = path => {
  return getAbsoluteUrl(path);
};

/**
 * Generates an image URL with the base URL
 * @param {string} imagePath - Relative image path
 * @returns {string} Absolute image URL
 */
export const getImageUrl = imagePath => {
  return getAbsoluteUrl(imagePath);
};
```

#### 3. Update SEO Metadata Component

```jsx
// components/SEOMetadata.js
import React from 'react';
import { Helmet } from 'react-helmet';
import { seoConfig } from '../config/seo';
import { getAbsoluteUrl, getImageUrl } from '../utils/urlUtils';

export const SEOMetadata = ({ title, description, image, url, type = 'website' }) => {
  const siteTitle = title || seoConfig.defaultTitle;
  const siteDescription = description || seoConfig.defaultDescription;
  const siteImage = image ? getImageUrl(image) : getImageUrl(seoConfig.defaultImage);
  const siteUrl = url ? getAbsoluteUrl(url) : seoConfig.baseUrl;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <link rel="canonical" href={siteUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={siteImage} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={seoConfig.defaultTitle} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={seoConfig.twitter.cardType} />
      <meta name="twitter:site" content={seoConfig.twitter.site} />
      <meta name="twitter:creator" content={seoConfig.twitter.handle} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={siteImage} />
    </Helmet>
  );
};
```

#### 4. Create Base URL Update Script

```javascript
// scripts/update-seo-base-url.js
const fs = require('fs');
const path = require('path');

// Get the base URL from command line arguments or use default
const baseUrl = process.argv[2] || 'https://aisportsedge.app';

// Path to the SEO config file
const seoConfigPath = path.join(__dirname, '../config/seo.js');

// Read the current SEO config file
let seoConfig = fs.readFileSync(seoConfigPath, 'utf8');

// Replace the base URL
seoConfig = seoConfig.replace(
  /baseUrl:.*?['"].*?['"]/,
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
```

## Sitemap Generation

### Current Issues

The current sitemap implementation has the following issues:

1. Outdated or missing sitemap.xml file
2. Manual sitemap updates required when new pages are added
3. No automated sitemap generation in the build process
4. Missing multilingual support in the sitemap

### Solution

We'll implement an automated sitemap generation process:

1. Create a script to generate the sitemap
2. Integrate the script into the build process
3. Add support for multilingual sitemaps
4. Implement proper URL handling with the SEO base URL

### Implementation

#### 1. Create Sitemap Generation Script

```javascript
// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { seoConfig } = require('../config/seo');

/**
 * Generate sitemap.xml file
 */
async function generateSitemap() {
  console.log('Generating sitemap...');

  // Get all routes from the application
  const routes = await getAllRoutes();

  // Filter out excluded paths
  const filteredRoutes = routes.filter(route => {
    return !seoConfig.sitemap.excludePaths.some(excludePath => route.path.startsWith(excludePath));
  });

  // Generate XML content
  const xml = generateSitemapXML(filteredRoutes);

  // Write to file
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml);

  console.log(`Sitemap generated at ${outputPath}`);

  // Copy to web-build directory if it exists
  const webBuildPath = path.join(__dirname, '../web-build');
  if (fs.existsSync(webBuildPath)) {
    fs.copyFileSync(outputPath, path.join(webBuildPath, 'sitemap.xml'));
    console.log(`Sitemap copied to ${path.join(webBuildPath, 'sitemap.xml')}`);
  }

  return true;
}

/**
 * Get all routes from the application
 * @returns {Promise<Array<{path: string, lastmod: string}>>}
 */
async function getAllRoutes() {
  // This implementation depends on your routing system
  // For a simple approach, we'll read from a routes file

  try {
    // Try to import routes from the routes file
    const { routes } = require('../src/navigation/routes');

    return routes.map(route => ({
      path: route.path,
      lastmod: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }));
  } catch (error) {
    console.warn('Could not import routes from routes file. Using fallback routes.');

    // Fallback: Define some common routes
    return [
      { path: '/', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/odds', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/nba', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/nfl', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/mlb', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/nhl', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/ufc', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/about', lastmod: new Date().toISOString().split('T')[0] },
      { path: '/faq', lastmod: new Date().toISOString().split('T')[0] },
    ];
  }
}

/**
 * Generate sitemap XML
 * @param {Array<{path: string, lastmod: string}>} routes
 * @returns {string} XML content
 */
function generateSitemapXML(routes) {
  const { baseUrl, sitemap } = seoConfig;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  routes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;

    if (route.lastmod) {
      xml += `    <lastmod>${route.lastmod}</lastmod>\n`;
    }

    if (sitemap.changefreq) {
      xml += `    <changefreq>${sitemap.changefreq}</changefreq>\n`;
    }

    if (sitemap.priority) {
      xml += `    <priority>${sitemap.priority}</priority>\n`;
    }

    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

// Run the function
generateSitemap().catch(error => {
  console.error('Error generating sitemap:', error);
  process.exit(1);
});
```

#### 2. Create Multilingual Sitemap Script

```javascript
// scripts/generate-multilingual-sitemap.js
const fs = require('fs');
const path = require('path');
const { seoConfig } = require('../config/seo');

/**
 * Generate multilingual sitemap
 */
async function generateMultilingualSitemap() {
  console.log('Generating multilingual sitemap...');

  // Get supported languages
  const languages = ['en', 'es']; // Add more languages as needed

  // Get all routes
  const routes = await getAllRoutes();

  // Filter out excluded paths
  const filteredRoutes = routes.filter(route => {
    return !seoConfig.sitemap.excludePaths.some(excludePath => route.path.startsWith(excludePath));
  });

  // Generate sitemap index XML
  const indexXml = generateSitemapIndexXML(languages);

  // Write sitemap index to file
  const indexOutputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(indexOutputPath, indexXml);
  console.log(`Sitemap index generated at ${indexOutputPath}`);

  // Generate language-specific sitemaps
  for (const lang of languages) {
    const langXml = generateLanguageSitemapXML(filteredRoutes, lang);
    const langOutputPath = path.join(__dirname, `../public/sitemap-${lang}.xml`);
    fs.writeFileSync(langOutputPath, langXml);
    console.log(`Language sitemap generated at ${langOutputPath}`);

    // Copy to web-build directory if it exists
    const webBuildPath = path.join(__dirname, '../web-build');
    if (fs.existsSync(webBuildPath)) {
      fs.copyFileSync(langOutputPath, path.join(webBuildPath, `sitemap-${lang}.xml`));
      fs.copyFileSync(indexOutputPath, path.join(webBuildPath, 'sitemap.xml'));
    }
  }

  return true;
}

/**
 * Generate sitemap index XML
 * @param {Array<string>} languages
 * @returns {string} XML content
 */
function generateSitemapIndexXML(languages) {
  const { baseUrl } = seoConfig;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  languages.forEach(lang => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/sitemap-${lang}.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });

  xml += '</sitemapindex>';
  return xml;
}

/**
 * Generate language-specific sitemap XML
 * @param {Array<{path: string, lastmod: string}>} routes
 * @param {string} language
 * @returns {string} XML content
 */
function generateLanguageSitemapXML(routes, language) {
  const { baseUrl, sitemap } = seoConfig;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  routes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/${language}${route.path}</loc>\n`;

    // Add alternate language links
    seoConfig.languageAlternates.forEach(alt => {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.language}" `;
      xml += `href="${baseUrl}/${alt.language}${route.path}" />\n`;
    });

    // Add x-default
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" `;
    xml += `href="${baseUrl}/en${route.path}" />\n`;

    if (route.lastmod) {
      xml += `    <lastmod>${route.lastmod}</lastmod>\n`;
    }

    if (sitemap.changefreq) {
      xml += `    <changefreq>${sitemap.changefreq}</changefreq>\n`;
    }

    if (sitemap.priority) {
      xml += `    <priority>${sitemap.priority}</priority>\n`;
    }

    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

// Run the function
generateMultilingualSitemap().catch(error => {
  console.error('Error generating multilingual sitemap:', error);
  process.exit(1);
});
```

#### 3. Update Build Script to Generate Sitemap

```javascript
// scripts/build-web.js
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ... existing build code ...

/**
 * Generate the sitemap
 */
function generateSitemap() {
  console.log('Generating sitemap...');

  try {
    // Run the sitemap generator
    execSync('node ./scripts/generate-sitemap.js', { stdio: 'inherit' });

    // Check if multilingual sitemap is needed
    if (process.env.MULTILINGUAL_SITEMAP === 'true') {
      execSync('node ./scripts/generate-multilingual-sitemap.js', { stdio: 'inherit' });
    }

    return true;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return false;
  }
}

// ... existing build code ...

// Main build process
async function build() {
  // ... existing build steps ...

  // Generate sitemap
  const sitemapSuccess = generateSitemap();

  // ... rest of build process ...
}

build();
```

## Implementation Steps

Follow these steps to implement the SEO base URL and sitemap improvements:

1. **Update SEO Configuration**:

   ```bash
   # Create or update the SEO configuration file
   cp config/seo.js.example config/seo.js
   # Edit the file to set the correct base URL
   ```

2. **Create URL Utilities**:

   ```bash
   # Create the URL utilities file
   mkdir -p utils
   touch utils/urlUtils.js
   # Add the URL utility functions
   ```

3. **Update SEO Metadata Component**:

   ```bash
   # Update the SEO metadata component
   mkdir -p components
   touch components/SEOMetadata.js
   # Add the SEO metadata component code
   ```

4. **Create Base URL Update Script**:

   ```bash
   # Create the base URL update script
   mkdir -p scripts
   touch scripts/update-seo-base-url.js
   # Add the script code
   ```

5. **Create Sitemap Generation Scripts**:

   ```bash
   # Create the sitemap generation scripts
   touch scripts/generate-sitemap.js
   touch scripts/generate-multilingual-sitemap.js
   # Add the script code
   ```

6. **Update Build Script**:

   ```bash
   # Update the build script to generate the sitemap
   # If the build script doesn't exist, create it
   touch scripts/build-web.js
   # Add the sitemap generation code
   ```

7. **Run the Base URL Update Script**:

   ```bash
   # Run the script to update the base URL
   node scripts/update-seo-base-url.js https://aisportsedge.app
   ```

8. **Generate the Sitemap**:
   ```bash
   # Generate the sitemap
   node scripts/generate-sitemap.js
   # Or generate the multilingual sitemap
   node scripts/generate-multilingual-sitemap.js
   ```

## Testing and Verification

After implementing the SEO base URL and sitemap improvements, verify that they are working correctly:

1. **Verify Base URL Configuration**:

   - Check that the SEO configuration file has the correct base URL
   - Verify that environment variables are set correctly
   - Test that URL utility functions generate correct URLs

2. **Verify Sitemap Generation**:

   - Check that the sitemap.xml file is generated correctly
   - Verify that all expected routes are included in the sitemap
   - Test that excluded paths are not included in the sitemap
   - Validate the sitemap XML using a sitemap validator

3. **Verify SEO Metadata**:

   - Check that canonical URLs are generated correctly
   - Verify that Open Graph and Twitter Card metadata use absolute URLs
   - Test that image URLs are absolute

4. **Verify Build Process**:
   - Check that the sitemap is generated during the build process
   - Verify that the sitemap is copied to the web-build directory

## Maintenance

To maintain the SEO base URL and sitemap implementation:

1. **Update Base URL When Needed**:

   ```bash
   # Update the base URL when the domain changes
   node scripts/update-seo-base-url.js https://new-domain.com
   ```

2. **Regenerate Sitemap When Routes Change**:

   ```bash
   # Regenerate the sitemap when routes change
   node scripts/generate-sitemap.js
   ```

3. **Add New Routes to Sitemap**:

   - Update the `getAllRoutes` function in the sitemap generation script
   - Or update the routes file that the script reads from

4. **Exclude New Paths from Sitemap**:

   - Update the `excludePaths` array in the SEO configuration file

5. **Add New Languages to Multilingual Sitemap**:
   - Update the `languages` array in the multilingual sitemap script
   - Add the new language to the `languageAlternates` array in the SEO configuration file

## Related Documentation

- [Internationalization and SEO](../internationalization-and-seo.md) - For more information on internationalization and SEO
- [Deployment Guide](../deployment-guide.md) - For information on deploying the application
