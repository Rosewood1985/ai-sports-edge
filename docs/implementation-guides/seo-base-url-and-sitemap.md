# SEO Base URL and Sitemap Implementation Guide

## Overview

This guide provides specific instructions for fixing the SEO base URL configuration and implementing sitemap generation for the AI Sports Edge application. These improvements will enhance search engine discoverability and ensure consistent URL handling across the application.

## Table of Contents

- [SEO Base URL Configuration](#seo-base-url-configuration)
- [Sitemap Generation](#sitemap-generation)
- [Multilingual SEO Best Practices](#multilingual-seo-best-practices)
- [Implementation Steps](#implementation-steps)
- [Testing and Verification](#testing-and-verification)
- [Maintenance](#maintenance)
- [Related Documentation](#related-documentation)

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

## Multilingual SEO Best Practices

This section provides comprehensive guidance for implementing SEO best practices for English and Spanish language versions of the AI Sports Edge website, with special attention to supporting multiple Spanish regional variants (es-US, es-MX, and es-ES).

### Hreflang Tag Implementation

#### Syntax and Placement

Hreflang tags tell search engines which language you're using on a specific page, so they can serve the right version to users. They should be placed in the `<head>` section of your HTML:

```html
<link rel="alternate" hreflang="en" href="https://aisportsedge.app/en/odds" />
<link rel="alternate" hreflang="es-US" href="https://aisportsedge.app/es-us/odds" />
<link rel="alternate" hreflang="es-MX" href="https://aisportsedge.app/es-mx/odds" />
<link rel="alternate" hreflang="es-ES" href="https://aisportsedge.app/es-es/odds" />
<link rel="alternate" hreflang="x-default" href="https://aisportsedge.app/en/odds" />
```

For React applications, implement this in your SEO component:

```jsx
// components/SEOMetadata.js
export const SEOMetadata = ({ title, description, image, url, type = 'website' }) => {
  // ... existing code ...

  // Get the current path without language prefix
  const pathWithoutLang = url.replace(/^\/(en|es|es-[a-z]{2})/i, '');

  return (
    <Helmet>
      {/* ... existing meta tags ... */}

      {/* Hreflang tags */}
      <link rel="alternate" hreflang="en" href={`${seoConfig.baseUrl}/en${pathWithoutLang}`} />
      <link
        rel="alternate"
        hreflang="es-US"
        href={`${seoConfig.baseUrl}/es-us${pathWithoutLang}`}
      />
      <link
        rel="alternate"
        hreflang="es-MX"
        href={`${seoConfig.baseUrl}/es-mx${pathWithoutLang}`}
      />
      <link
        rel="alternate"
        hreflang="es-ES"
        href={`${seoConfig.baseUrl}/es-es${pathWithoutLang}`}
      />
      <link
        rel="alternate"
        hreflang="x-default"
        href={`${seoConfig.baseUrl}/en${pathWithoutLang}`}
      />
    </Helmet>
  );
};
```

#### Regional Variants

For Spanish language variants, implement a hybrid model approach:

1. **Initial Language Detection**:

   ```javascript
   // utils/languageDetection.js
   export const detectUserLanguage = () => {
     // Browser language detection
     const browserLang = navigator.language || navigator.userLanguage;

     // Map browser language to supported variants
     if (browserLang.startsWith('es')) {
       // Extract region code if available
       const region = browserLang.split('-')[1]?.toUpperCase();

       // Map to supported Spanish variants
       if (region === 'US') return 'es-US';
       if (region === 'MX') return 'es-MX';
       if (region === 'ES') return 'es-ES';

       // Default to es-US for other Spanish variants
       return 'es-US';
     }

     // Default to English
     return 'en';
   };
   ```

2. **UI Implementation**:

   ```jsx
   // components/LanguageSelector.js
   const LanguageSelector = () => {
     const [showVariants, setShowVariants] = useState(false);
     const { currentLanguage, setLanguage } = useLanguage();

     return (
       <div className="language-settings">
         <select
           className="main-language-select"
           value={currentLanguage.split('-')[0]}
           onChange={e => {
             if (e.target.value === 'es') {
               setShowVariants(true);
               setLanguage('es-US'); // Default Spanish variant
             } else {
               setShowVariants(false);
               setLanguage(e.target.value);
             }
           }}
         >
           <option value="en">English</option>
           <option value="es">Español</option>
         </select>

         {showVariants && (
           <div className="variant-selector">
             <label>Spanish variant:</label>
             <select value={currentLanguage} onChange={e => setLanguage(e.target.value)}>
               <option value="es-US">Español (Estados Unidos)</option>
               <option value="es-MX">Español (México)</option>
               <option value="es-ES">Español (España)</option>
             </select>
           </div>
         )}
       </div>
     );
   };
   ```

3. **Fallback Logic**:

   ```javascript
   // utils/translationUtils.js
   export const getTranslation = (key, language) => {
     // Try to get translation for specific variant
     let translation = translations[language]?.[key];

     // Fallback to generic Spanish
     if (!translation && language.startsWith('es-')) {
       translation = translations['es']?.[key];
     }

     // Fallback to English
     if (!translation) {
       translation = translations['en']?.[key];
     }

     return translation || key; // Return key as last resort
   };
   ```

#### Self-referential Hreflang Tags

Always include the current page's language in the hreflang tags. For example, if you're on the Spanish (Mexico) version, you still need to include a hreflang tag for es-MX pointing to the current URL:

```html
<!-- On https://aisportsedge.app/es-mx/odds -->
<link rel="alternate" hreflang="en" href="https://aisportsedge.app/en/odds" />
<link rel="alternate" hreflang="es-US" href="https://aisportsedge.app/es-us/odds" />
<link rel="alternate" hreflang="es-MX" href="https://aisportsedge.app/es-mx/odds" />
<link rel="alternate" hreflang="es-ES" href="https://aisportsedge.app/es-es/odds" />
<link rel="alternate" hreflang="x-default" href="https://aisportsedge.app/en/odds" />
```

#### x-default Implementation

The `x-default` hreflang attribute specifies the default page when no language version matches the user's browser settings:

```html
<link rel="alternate" hreflang="x-default" href="https://aisportsedge.app/en/odds" />
```

For AI Sports Edge, we'll use the English version as the x-default since it's our primary language.

### Technical Considerations

#### URL Structure

We use a subdirectory approach with language prefixes:

```
English: https://aisportsedge.app/en/odds
Spanish (US): https://aisportsedge.app/es-us/odds
Spanish (Mexico): https://aisportsedge.app/es-mx/odds
Spanish (Spain): https://aisportsedge.app/es-es/odds
```

Benefits of this approach:

- Maintains domain authority across all language versions
- Easier to implement and maintain
- Better for SEO as search engines consider subdirectories as part of the same website
- Simpler user experience for switching between languages

Implementation in React Router:

```jsx
// App.js
const App = () => {
  return (
    <Router>
      <Routes>
        {/* English routes */}
        <Route path="/en/*" element={<EnglishRoutes />} />

        {/* Spanish routes */}
        <Route path="/es-us/*" element={<SpanishRoutes locale="es-US" />} />
        <Route path="/es-mx/*" element={<SpanishRoutes locale="es-MX" />} />
        <Route path="/es-es/*" element={<SpanishRoutes locale="es-ES" />} />

        {/* Redirect root to language-specific route based on detection */}
        <Route path="/*" element={<LanguageRedirect />} />
      </Routes>
    </Router>
  );
};
```

#### Content Duplication

To prevent duplicate content issues:

1. **Use proper hreflang tags** on all pages
2. **Implement canonical URLs** that point to the current language version
3. **Avoid automatic translation** of content; use proper localization
4. **Use structured data with language attributes**:

```jsx
// components/StructuredData.js
export const StructuredData = ({ title, description, url, language }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
    inLanguage: language, // e.g., "en", "es-US"
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};
```

#### Implementation Approaches

**Server-side vs. Client-side Rendering**:

For optimal SEO, use server-side rendering (SSR) or static site generation (SSG) for language-specific pages:

```javascript
// pages/[lang]/odds.js (Next.js example)
export async function getStaticProps({ params }) {
  const { lang } = params;

  return {
    props: {
      language: lang,
      translations: await loadTranslations(lang),
      // other props
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { lang: 'en' } },
      { params: { lang: 'es-us' } },
      { params: { lang: 'es-mx' } },
      { params: { lang: 'es-es' } },
    ],
    fallback: false,
  };
}
```

For React Native (Expo) web, use server-side rendering when possible, or ensure proper SEO metadata is generated on the client side.

#### Language Detection

Implement a robust language detection system:

```javascript
// components/LanguageRedirect.js
const LanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get stored language preference
    const storedLang = localStorage.getItem('language');

    if (storedLang) {
      // Use stored preference
      navigate(`/${storedLang}${location.pathname}`);
    } else {
      // Detect language from browser
      const detectedLang = detectUserLanguage();
      navigate(`/${detectedLang}${location.pathname}`);

      // Store for future visits
      localStorage.setItem('language', detectedLang);
    }
  }, []);

  return <div>Redirecting...</div>;
};
```

#### URL Parameters Handling

URL parameters can complicate hreflang implementation. Here's how to handle them:

1. **Parameter Standardization**:

   ```javascript
   // utils/urlUtils.js
   export const standardizeParams = params => {
     // Filter out session and tracking parameters
     const filteredParams = Object.entries(params).filter(([key]) => {
       const nonEssentialParams = ['sid', 'utm_source', 'utm_medium', 'utm_campaign'];
       return !nonEssentialParams.includes(key);
     });

     // Sort parameters alphabetically
     const sortedParams = filteredParams.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

     // Format as query string
     return sortedParams.length > 0
       ? '?' + sortedParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
       : '';
   };
   ```

2. **Hreflang Implementation with Parameters**:

   ```jsx
   // components/SEOMetadata.js
   export const SEOMetadata = ({ path, queryParams }) => {
     // Standardize parameters
     const standardizedParams = standardizeParams(queryParams);

     // Generate hreflang tags
     const languages = ['en', 'es-US', 'es-MX', 'es-ES'];

     return (
       <Helmet>
         {languages.map(lang => {
           const langPrefix = lang === 'en' ? '/en' : `/es-${lang.split('-')[1].toLowerCase()}`;
           return (
             <link
               key={lang}
               rel="alternate"
               hreflang={lang}
               href={`${seoConfig.baseUrl}${langPrefix}${path}${standardizedParams}`}
             />
           );
         })}
         <link
           rel="alternate"
           hreflang="x-default"
           href={`${seoConfig.baseUrl}/en${path}${standardizedParams}`}
         />
       </Helmet>
     );
   };
   ```

3. **Parameter-Based Content Variations**:

   For content that varies significantly based on parameters (e.g., `/odds?sport=nba` vs. `/odds?sport=nfl`), consider creating separate URLs instead of using parameters:

   ```
   /en/odds/nba instead of /en/odds?sport=nba
   /es-mx/odds/nba instead of /es-mx/odds?sport=nba
   ```

### Common Pitfalls

#### English/Spanish Implementation Issues

1. **Character Encoding**:

   - Always use UTF-8 encoding
   - Include proper meta tag: `<meta charset="UTF-8">`
   - Test Spanish special characters (á, é, í, ó, ú, ñ, ¿, ¡)

2. **Date and Number Formatting**:

   ```javascript
   // utils/formatUtils.js
   export const formatDate = (date, locale) => {
     return new Date(date).toLocaleDateString(locale, {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
     });
   };

   export const formatNumber = (number, locale) => {
     return new Intl.NumberFormat(locale).format(number);
   };

   export const formatCurrency = (amount, locale, currency = 'USD') => {
     return new Intl.NumberFormat(locale, {
       style: 'currency',
       currency,
     }).format(amount);
   };
   ```

3. **Mobile Display Issues**:
   - Test Spanish text with longer words that may cause layout issues
   - Ensure responsive design works with Spanish content
   - Test on various device sizes and browsers

#### Canonical and Hreflang Conflicts

Avoid conflicts by following these rules:

1. **Self-referential canonical URLs**: Each language version should have a canonical URL pointing to itself
2. **Complete hreflang sets**: Include all language versions in each page's hreflang tags
3. **Consistent URL structure**: Use the same URL structure across all language versions

```jsx
// components/SEOMetadata.js
export const SEOMetadata = ({ path, language }) => {
  const langPrefix = language === 'en' ? '/en' : `/es-${language.split('-')[1].toLowerCase()}`;
  const canonicalUrl = `${seoConfig.baseUrl}${langPrefix}${path}`;

  return (
    <Helmet>
      {/* Canonical URL points to current language version */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang tags include all language versions */}
      <link rel="alternate" hreflang="en" href={`${seoConfig.baseUrl}/en${path}`} />
      <link rel="alternate" hreflang="es-US" href={`${seoConfig.baseUrl}/es-us${path}`} />
      <link rel="alternate" hreflang="es-MX" href={`${seoConfig.baseUrl}/es-mx${path}`} />
      <link rel="alternate" hreflang="es-ES" href={`${seoConfig.baseUrl}/es-es${path}`} />
      <link rel="alternate" hreflang="x-default" href={`${seoConfig.baseUrl}/en${path}`} />
    </Helmet>
  );
};
```

#### Incomplete Tag Sets

Ensure all pages have complete hreflang tag sets by implementing automated validation:

```javascript
// scripts/validate-hreflang.js
const puppeteer = require('puppeteer');
const fs = require('fs');

async function validateHreflang(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Extract hreflang tags
  const hreflangTags = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(link => ({
      hreflang: link.getAttribute('hreflang'),
      href: link.getAttribute('href'),
    }));
  });

  // Check for required languages
  const requiredLanguages = ['en', 'es-US', 'es-MX', 'es-ES', 'x-default'];
  const missingLanguages = requiredLanguages.filter(
    lang => !hreflangTags.some(tag => tag.hreflang === lang)
  );

  if (missingLanguages.length > 0) {
    console.error(`Missing hreflang tags for: ${missingLanguages.join(', ')}`);
  } else {
    console.log('All required hreflang tags present');
  }

  await browser.close();
}

// Run validation for key pages
const pagesToValidate = [
  'https://aisportsedge.app/en/',
  'https://aisportsedge.app/en/odds',
  // Add more pages as needed
];

pagesToValidate.forEach(validateHreflang);
```

#### Mixed Content Handling

For pages with mixed language content:

1. **User-generated content**: Use the `lang` attribute to mark language sections:

   ```html
   <div lang="es">Este es un comentario en español</div>
   <div lang="en">This is a comment in English</div>
   ```

2. **Search engine handling**: Use the primary language of the page for hreflang tags

3. **Implementation recommendations**:
   - Keep user-generated content separate from main content
   - Consider language filtering options for users
   - Use language detection for user-generated content

### Market-Specific Optimization Strategies

#### Keyword Research

Spanish keyword research requires different approaches:

1. **Tools for Spanish keyword research**:

   - Google Keyword Planner with Spanish settings
   - SEMrush's Spanish databases
   - Ahrefs with language and country filters

2. **Regional variations**:

   - "Apuestas deportivas" (Spain) vs. "Apuestas de deportes" (Mexico)
   - "Pronósticos" (Spain) vs. "Predicciones" (Latin America)

3. **Implementation strategy**:
   ```javascript
   // config/seo.js
   export const seoKeywords = {
     en: {
       odds: ['sports betting odds', 'betting lines', 'sports odds comparison'],
       nba: ['nba betting odds', 'basketball betting', 'nba picks'],
     },
     'es-US': {
       odds: ['probabilidades de apuestas', 'líneas de apuestas', 'comparación de cuotas'],
       nba: [
         'probabilidades de apuestas de la NBA',
         'apuestas de baloncesto',
         'selecciones de la NBA',
       ],
     },
     'es-MX': {
       odds: ['momios deportivos', 'líneas de apuesta', 'comparación de momios'],
       nba: ['momios de la NBA', 'apuestas de basquetbol', 'picks de la NBA'],
     },
     'es-ES': {
       odds: ['cuotas de apuestas', 'líneas de apuestas', 'comparador de cuotas'],
       nba: ['cuotas NBA', 'apuestas baloncesto', 'pronósticos NBA'],
     },
   };
   ```

#### Cultural Considerations

Adapt content for different Spanish-speaking regions:

1. **Sports terminology variations**:

   - "Fútbol" (universal) vs. "Balompié" (Spain)
   - "Básquetbol" (Mexico) vs. "Baloncesto" (Spain)

2. **Betting terminology**:

   - "Momios" (Mexico) vs. "Cuotas" (Spain)
   - "Apuesta" (universal) vs. "Puesta" (some regions)

3. **Implementation example**:

   ```javascript
   // utils/culturalAdaptation.js
   export const getSportName = (sport, locale) => {
     const sportNames = {
       basketball: {
         'es-ES': 'baloncesto',
         'es-MX': 'básquetbol',
         'es-US': 'básquetbol',
       },
       soccer: {
         'es-ES': 'fútbol',
         'es-MX': 'fútbol',
         'es-US': 'fútbol',
       },
     };

     return sportNames[sport]?.[locale] || sport;
   };
   ```

#### Search Engine Preferences

Different search engines dominate in different regions:

1. **Google**: Dominant in most Spanish-speaking regions
2. **Bing**: Growing presence in US Spanish market
3. **Yandex**: Used by some Spanish speakers in Europe

Optimization strategies:

- Include `<meta name="robots" content="all">` for all search engines
- Submit sitemaps to Google Search Console, Bing Webmaster Tools
- Consider region-specific search features (e.g., Google's rich results)

#### Mobile Optimization

Mobile usage patterns vary by region:

1. **Latin America**: Higher mobile usage rates than desktop
2. **Spain**: More balanced mobile/desktop usage

Implementation recommendations:

- Prioritize mobile-first design for all language versions
- Test on popular devices in target regions
- Optimize page speed for mobile networks in target regions

### Performance Monitoring and Metrics

#### Key Performance Indicators

Track these language-specific metrics:

1. **Organic traffic by language**:

   ```javascript
   // Google Analytics 4 custom dimension
   gtag('config', 'G-XXXXXXXXXX', {
     language_version: 'es-MX', // or other language code
   });
   ```

2. **Keyword rankings by language**:

   - Set up language and region-specific tracking in SEO tools
   - Monitor position changes for key terms in each language

3. **Conversion rates by language**:

   ```javascript
   // Track language in conversion events
   gtag('event', 'conversion', {
     send_to: 'AW-XXXXXXXXXX',
     language: 'es-MX',
     value: 25.0,
     currency: 'USD',
   });
   ```

4. **Bounce rates by language**:

   - Compare bounce rates between language versions
   - Identify pages with high bounce rates in specific languages

5. **Page load times by language**:
   - Monitor Core Web Vitals for each language version
   - Identify performance issues specific to certain language versions

#### Monitoring Tools and Setup

1. **Google Search Console configuration**:

   - Add all language versions as separate properties
   - Set up property sets for combined reporting
   - Monitor hreflang errors in the "International Targeting" section

2. **Google Analytics implementation**:

   ```javascript
   // utils/analytics.js
   export const trackPageView = (path, language) => {
     gtag('config', 'G-XXXXXXXXXX', {
       page_path: path,
       language: language,
     });
   };
   ```

3. **Custom reports for language comparison**:
   - Create side-by-side comparisons of key metrics
   - Set up automated reporting for language performance

#### Performance Parity Framework

Ensure consistent performance across language versions:

1. **Baseline metrics**:

   - Establish performance baselines for each language
   - Set acceptable variance thresholds (e.g., ±10%)

2. **Regular comparative analysis**:

   - Weekly reviews of language-specific performance
   - Monthly deep dives into underperforming language versions

3. **A/B testing across languages**:
   - Test improvements simultaneously across language versions
   - Compare impact of changes between languages

#### Automated Alerting System

Set up alerts for performance discrepancies:

```javascript
// scripts/performance-monitor.js
const checkPerformanceParity = async () => {
  // Fetch performance data for each language
  const performanceData = await fetchPerformanceData();

  // Check for significant discrepancies
  const discrepancies = findDiscrepancies(performanceData);

  if (discrepancies.length > 0) {
    // Send alerts
    sendEmailAlert(discrepancies);
    sendSlackNotification(discrepancies);
  }
};

// Run daily
setInterval(checkPerformanceParity, 24 * 60 * 60 * 1000);
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

After implementing the SEO base URL, sitemap, and multilingual SEO improvements, verify that they are working correctly:

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

5. **Verify Multilingual Implementation**:

   - Check that hreflang tags are correctly implemented on all pages
   - Verify that language detection and redirection work properly
   - Test language switching functionality
   - Validate URL structure for all language versions
   - Test with different browser language settings

6. **Verify Regional Variants**:

   - Test detection and handling of Spanish regional variants
   - Verify correct implementation of es-US, es-MX, and es-ES variants
   - Check fallback behavior when translations are missing
   - Test URL parameter handling across language versions

7. **Verify Performance Monitoring**:
   - Check that language-specific analytics tracking is working
   - Verify that performance metrics are being collected for each language
   - Test automated alerting for performance discrepancies

## Maintenance

To maintain the SEO base URL, sitemap, and multilingual SEO implementation:

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

6. **Update Regional Variants**:

   - When adding new Spanish regional variants, update:
     - Language detection logic
     - Hreflang tag implementation
     - URL routing configuration
     - Translation fallback logic

7. **Monitor Performance Parity**:

   - Regularly review performance metrics across language versions
   - Address any significant discrepancies between languages
   - Update monitoring thresholds as the site evolves

8. **Update Keyword Targeting**:

   - Periodically review and update language-specific keywords
   - Adjust SEO strategy based on performance in different markets
   - Ensure content is optimized for regional search patterns

9. **Validate Hreflang Implementation**:
   - Run regular validation checks on hreflang implementation
   - Fix any errors or inconsistencies in hreflang tags
   - Ensure all new pages include proper hreflang annotations

## Related Documentation

- [Internationalization and SEO](../internationalization-and-seo.md) - For more information on internationalization and SEO
- [Deployment Guide](../deployment-guide.md) - For information on deploying the application
