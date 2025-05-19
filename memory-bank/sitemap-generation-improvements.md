# Sitemap Generation Improvements

## Overview

This document outlines the improvements made to the sitemap generation process for AI Sports Edge. The changes address several issues with the previous implementation and enhance the functionality to ensure proper SEO for the application.

## Issues Addressed

1. **Hardcoded Routes**: The previous implementation had hardcoded routes in the sitemap generation script, which made it difficult to maintain and keep in sync with the actual application routes.

2. **Absolute URL References**: The sitemap index file referenced language-specific sitemaps using absolute URLs, which could cause issues if the base URL changed.

3. **No Validation**: There was no validation to ensure that referenced sitemaps actually existed.

4. **Fixed Output Directory**: The script output to a fixed directory with no configuration option, limiting flexibility for different build environments.

5. **SEO Configuration Inconsistency**: The TypeScript and JavaScript versions of the SEO configuration could get out of sync, as the update script only modified the TypeScript version.

## Implemented Solutions

### 1. Dynamic Route Discovery

The sitemap generation script now dynamically discovers routes from the application's routing configuration (`src/navigation/AppRoutes.js`). This ensures that the sitemap always reflects the actual routes in the application.

```javascript
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
    }
  } catch (error) {
    // Fallback to default routes if extraction fails
    console.error('Error extracting routes from AppRoutes.js:', error);
    console.log('Falling back to default routes');
    // ...
  }
}
```

### 2. Sitemap Validation

The script now validates that all referenced sitemaps actually exist before including them in the sitemap index:

```javascript
const validateSitemap = sitemapPath => {
  if (!fs.existsSync(sitemapPath)) {
    console.error(`Sitemap file not found: ${sitemapPath}`);
    return false;
  }
  return true;
};

// In generateSitemapIndex function:
if (validateSitemap(languageSitemaps[language])) {
  // Add sitemap to index
}
```

### 3. Configurable Output Directory

The output directory is now configurable via an environment variable, providing flexibility for different build environments:

```javascript
// Get output directory from environment variable or use default
const outputDir = process.env.SITEMAP_OUTPUT_DIR || path.join(__dirname, '../public');
```

### 4. SEO Configuration Consistency

The `update-seo-base-url.js` script has been updated to modify both the TypeScript and JavaScript versions of the SEO configuration, ensuring consistency between the two files:

```javascript
// Update both TypeScript and JavaScript config files
const tsUpdated = updateSeoConfigFile(seoConfigTsPath, baseUrl);
const jsUpdated = updateSeoConfigFile(seoConfigJsPath, baseUrl);

// Verify configuration consistency
try {
  if (tsUpdated && jsUpdated) {
    const tsConfig = require('../config/seo.ts');
    const jsConfig = require('../config/seo.js');

    if (tsConfig.baseUrl !== jsConfig.baseUrl) {
      console.warn(
        'Warning: TypeScript and JavaScript SEO configurations have different base URLs'
      );
      // ...
    } else {
      console.log('TypeScript and JavaScript SEO configurations are consistent');
    }
  }
} catch (error) {
  console.warn('Could not verify configuration consistency:', error.message);
}
```

## Benefits

1. **Maintainability**: The sitemap generation process is now more maintainable, as it automatically adapts to changes in the application's routing configuration.

2. **Reliability**: Validation ensures that all referenced sitemaps actually exist, preventing broken links in the sitemap index.

3. **Flexibility**: The configurable output directory allows for different build environments and deployment scenarios.

4. **Consistency**: The SEO configuration is now kept consistent between the TypeScript and JavaScript versions.

## Usage

### Generating Sitemaps

```bash
# Generate sitemaps with default output directory
node scripts/generateSitemap.js

# Generate sitemaps with custom output directory
SITEMAP_OUTPUT_DIR=./dist node scripts/generateSitemap.js
```

### Updating SEO Base URL

```bash
# Update SEO base URL
node scripts/update-seo-base-url.js https://aisportsedge.app
```

## Future Improvements

1. **Integration with CI/CD**: Integrate the sitemap generation process with the CI/CD pipeline to automatically generate sitemaps during deployment.

2. **Automated Testing**: Add automated tests for the sitemap generation process to ensure it continues to work correctly as the application evolves.

3. **Priority Customization**: Allow customization of the priority and change frequency for different types of pages.

4. **Incremental Updates**: Implement incremental updates to the sitemap to avoid regenerating the entire sitemap for small changes.
