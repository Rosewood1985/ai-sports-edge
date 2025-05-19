/**
 * Validate Hreflang Implementation Script
 *
 * This script validates the hreflang implementation on the website to ensure that all pages
 * have proper hreflang tags for all supported languages.
 *
 * Features:
 * - Validates hreflang tags without requiring a browser
 * - Checks bidirectional linking between language variants
 * - Verifies URL format and structure
 * - Provides detailed error reporting
 * - Supports headless mode for CI/CD pipelines
 *
 * Usage:
 * node scripts/validate-hreflang.js [--headless] [--verbose] [--output=<path>]
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const { program } = require('commander');

// Import SEO config
const seoConfig = require('../config/seo');

// Parse command line arguments
program
  .option('--headless', 'Run in headless mode (no console output, exit code only)')
  .option('--verbose', 'Show detailed validation information')
  .option('--output <path>', 'Output report to specified file path')
  .parse(process.argv);

const options = program.opts();

// URLs to validate
const pagesToValidate = [
  `${seoConfig.baseUrl}/en/`,
  `${seoConfig.baseUrl}/en/dashboard`,
  `${seoConfig.baseUrl}/en/betting`,
  `${seoConfig.baseUrl}/en/stats`,
  `${seoConfig.baseUrl}/en/news`,
  `${seoConfig.baseUrl}/en/picks`,
  `${seoConfig.baseUrl}/en/about`,
  `${seoConfig.baseUrl}/en/contact`,
];

/**
 * Custom logger that respects headless mode
 */
const logger = {
  log: message => {
    if (!options.headless) {
      console.log(message);
    }
  },
  error: message => {
    if (!options.headless) {
      console.error(message);
    }
  },
  verbose: message => {
    if (!options.headless && options.verbose) {
      console.log(`  ${message}`);
    }
  },
};

/**
 * Fetch HTML content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} - HTML content
 */
async function fetchHtml(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'AI-Sports-Edge-Hreflang-Validator/1.0',
        Accept: 'text/html',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`HTTP error ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network error: ${error.message}`);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

/**
 * Extract hreflang tags from HTML content
 * @param {string} html - HTML content
 * @returns {Array<{hreflang: string, href: string}>} - Extracted hreflang tags
 */
function extractHreflangTags(html) {
  const root = parse(html);
  const hreflangElements = root.querySelectorAll('link[rel="alternate"][hreflang]');

  return hreflangElements.map(element => ({
    hreflang: element.getAttribute('hreflang'),
    href: element.getAttribute('href'),
  }));
}

/**
 * Extract canonical URL from HTML content
 * @param {string} html - HTML content
 * @returns {string|null} - Canonical URL or null if not found
 */
function extractCanonicalUrl(html) {
  const root = parse(html);
  const canonicalElement = root.querySelector('link[rel="canonical"]');
  return canonicalElement ? canonicalElement.getAttribute('href') : null;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, issues: string[]}} - Validation result
 */
function validateUrlFormat(url) {
  const issues = [];

  try {
    const parsedUrl = new URL(url);

    // Check if URL has the correct base
    if (!url.startsWith(seoConfig.baseUrl)) {
      issues.push(`URL does not start with the configured base URL (${seoConfig.baseUrl})`);
    }

    // Check if URL has a language segment
    const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length === 0) {
      issues.push('URL does not contain a language segment');
    } else {
      const langSegment = pathSegments[0];
      const validLangs = seoConfig.languages.map(lang => lang.code);
      if (!validLangs.includes(langSegment)) {
        issues.push(`URL contains invalid language segment: ${langSegment}`);
      }
    }
  } catch (error) {
    issues.push(`Invalid URL format: ${error.message}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate hreflang tags on a page
 * @param {string} url - URL to validate
 * @param {Map<string, Set<string>>} validatedLinks - Map of already validated links
 * @returns {Promise<{url: string, valid: boolean, missing: string[], issues: string[], hreflangTags: Array}>} - Validation result
 */
async function validateHreflang(url, validatedLinks = new Map()) {
  logger.log(`Validating hreflang tags on ${url}...`);

  try {
    // Fetch HTML content
    const html = await fetchHtml(url);

    // Extract hreflang tags
    const hreflangTags = extractHreflangTags(html);
    logger.verbose(`Found ${hreflangTags.length} hreflang tags`);

    // Get required languages from config
    const requiredLanguages = seoConfig.languages.map(lang => lang.hreflang);
    requiredLanguages.push('x-default'); // Add x-default

    // Check for missing languages
    const missingLanguages = requiredLanguages.filter(
      lang => !hreflangTags.some(tag => tag.hreflang === lang)
    );

    if (missingLanguages.length > 0) {
      logger.verbose(`Missing languages: ${missingLanguages.join(', ')}`);
    }

    // Check for issues
    const issues = [];

    // Check for self-referential hreflang
    const currentLang = url.split('/')[3]; // Extract language from URL
    if (!hreflangTags.some(tag => tag.hreflang === currentLang && tag.href === url)) {
      issues.push(`Missing self-referential hreflang tag for ${currentLang}`);
    }

    // Check for x-default
    if (!hreflangTags.some(tag => tag.hreflang === 'x-default')) {
      issues.push('Missing x-default hreflang tag');
    }

    // Check for canonical URL
    const canonicalUrl = extractCanonicalUrl(html);

    if (!canonicalUrl) {
      issues.push('Missing canonical URL');
    } else if (canonicalUrl !== url) {
      issues.push(`Canonical URL (${canonicalUrl}) does not match current URL (${url})`);
    }

    // Check URL format for all hreflang tags
    for (const tag of hreflangTags) {
      const urlValidation = validateUrlFormat(tag.href);
      if (!urlValidation.valid) {
        issues.push(
          `Invalid URL format for hreflang=${tag.hreflang}: ${urlValidation.issues.join(', ')}`
        );
      }
    }

    // Check for bidirectional linking
    // Store the current URL's hreflang tags for later validation
    if (!validatedLinks.has(url)) {
      validatedLinks.set(url, new Set(hreflangTags.map(tag => tag.href)));
    }

    // Check if we need to validate any of the alternate URLs
    const alternateUrls = hreflangTags
      .filter(tag => tag.href !== url)
      .filter(tag => !validatedLinks.has(tag.href))
      .map(tag => tag.href);

    // Validate bidirectional linking for alternate URLs that haven't been validated yet
    for (const alternateUrl of alternateUrls) {
      try {
        logger.verbose(`Checking bidirectional link for ${alternateUrl}`);
        const alternateHtml = await fetchHtml(alternateUrl);
        const alternateHreflangTags = extractHreflangTags(alternateHtml);

        // Store this URL's hreflang tags for later validation
        validatedLinks.set(alternateUrl, new Set(alternateHreflangTags.map(tag => tag.href)));

        // Check if the alternate URL links back to the current URL
        if (!alternateHreflangTags.some(tag => tag.href === url)) {
          issues.push(`No bidirectional link from ${alternateUrl} back to ${url}`);
        }
      } catch (error) {
        issues.push(`Error checking bidirectional link for ${alternateUrl}: ${error.message}`);
      }
    }

    const valid = missingLanguages.length === 0 && issues.length === 0;

    return {
      url,
      valid,
      missing: missingLanguages,
      issues,
      hreflangTags,
    };
  } catch (error) {
    logger.error(`Error validating ${url}: ${error.message}`);
    return {
      url,
      valid: false,
      missing: [],
      issues: [`Error: ${error.message}`],
      hreflangTags: [],
    };
  }
}

/**
 * Validate all pages
 */
async function validateAllPages() {
  logger.log('Validating hreflang implementation...');

  const results = [];
  const validatedLinks = new Map();

  for (const url of pagesToValidate) {
    const result = await validateHreflang(url, validatedLinks);
    results.push(result);

    // Log result
    if (result.valid) {
      logger.log(`✅ ${result.url} - Valid hreflang implementation`);
    } else {
      logger.log(`❌ ${result.url} - Invalid hreflang implementation`);

      if (result.missing.length > 0) {
        logger.log(`  Missing languages: ${result.missing.join(', ')}`);
      }

      if (result.issues.length > 0) {
        logger.log('  Issues:');
        result.issues.forEach(issue => logger.log(`  - ${issue}`));
      }
    }
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: seoConfig.baseUrl,
    totalPages: results.length,
    validPages: results.filter(r => r.valid).length,
    invalidPages: results.filter(r => !r.valid).length,
    results,
  };

  // Determine report path
  let reportPath;
  if (options.output) {
    reportPath = options.output;
  } else {
    reportPath = path.join(__dirname, '../reports/hreflang-validation.json');
  }

  // Create directory if it doesn't exist
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Write report to file
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logger.log(`Report generated at ${reportPath}`);

  // Summary
  logger.log('\nSummary:');
  logger.log(`Total pages: ${report.totalPages}`);
  logger.log(`Valid pages: ${report.validPages}`);
  logger.log(`Invalid pages: ${report.invalidPages}`);

  if (report.invalidPages > 0) {
    logger.log('\nFix the issues and run the validation again.');
    process.exit(1);
  } else {
    logger.log('\nAll pages have valid hreflang implementation!');
    process.exit(0);
  }
}

// Run validation
validateAllPages().catch(error => {
  logger.error('Error validating hreflang implementation:', error);
  process.exit(1);
});
