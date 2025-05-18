/**
 * Validate Hreflang Implementation Script
 *
 * This script validates the hreflang implementation on the website to ensure that all pages
 * have proper hreflang tags for all supported languages.
 *
 * Usage:
 * node scripts/validate-hreflang.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import SEO config
const seoConfig = require('../config/seo');

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
 * Validate hreflang tags on a page
 * @param {string} url - URL to validate
 * @returns {Promise<{url: string, valid: boolean, missing: string[], issues: string[]}>} - Validation result
 */
async function validateHreflang(url) {
  console.log(`Validating hreflang tags on ${url}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract hreflang tags
    const hreflangTags = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(link => ({
        hreflang: link.getAttribute('hreflang'),
        href: link.getAttribute('href'),
      }));
    });

    // Get required languages from config
    const requiredLanguages = seoConfig.languages.map(lang => lang.hreflang);
    requiredLanguages.push('x-default'); // Add x-default

    // Check for missing languages
    const missingLanguages = requiredLanguages.filter(
      lang => !hreflangTags.some(tag => tag.hreflang === lang)
    );

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
    const canonicalUrl = await page.evaluate(() => {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      return canonicalLink ? canonicalLink.getAttribute('href') : null;
    });

    if (!canonicalUrl) {
      issues.push('Missing canonical URL');
    } else if (canonicalUrl !== url) {
      issues.push(`Canonical URL (${canonicalUrl}) does not match current URL (${url})`);
    }

    // Check for bidirectional linking
    for (const tag of hreflangTags) {
      if (tag.href !== url) {
        try {
          const otherPage = await browser.newPage();
          await otherPage.goto(tag.href, { waitUntil: 'networkidle2', timeout: 30000 });

          const hasBackLink = await otherPage.evaluate(currentUrl => {
            return !!document.querySelector(
              `link[rel="alternate"][hreflang][href="${currentUrl}"]`
            );
          }, url);

          if (!hasBackLink) {
            issues.push(`No bidirectional link from ${tag.href} back to ${url}`);
          }

          await otherPage.close();
        } catch (error) {
          issues.push(`Error checking bidirectional link for ${tag.href}: ${error.message}`);
        }
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
    console.error(`Error validating ${url}:`, error);
    return {
      url,
      valid: false,
      missing: [],
      issues: [`Error: ${error.message}`],
      hreflangTags: [],
    };
  } finally {
    await browser.close();
  }
}

/**
 * Validate all pages
 */
async function validateAllPages() {
  console.log('Validating hreflang implementation...');

  const results = [];

  for (const url of pagesToValidate) {
    const result = await validateHreflang(url);
    results.push(result);

    // Log result
    if (result.valid) {
      console.log(`✅ ${result.url} - Valid hreflang implementation`);
    } else {
      console.log(`❌ ${result.url} - Invalid hreflang implementation`);

      if (result.missing.length > 0) {
        console.log(`  Missing languages: ${result.missing.join(', ')}`);
      }

      if (result.issues.length > 0) {
        console.log('  Issues:');
        result.issues.forEach(issue => console.log(`  - ${issue}`));
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

  // Write report to file
  const reportPath = path.join(__dirname, '../reports/hreflang-validation.json');

  // Create directory if it doesn't exist
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report generated at ${reportPath}`);

  // Summary
  console.log('\nSummary:');
  console.log(`Total pages: ${report.totalPages}`);
  console.log(`Valid pages: ${report.validPages}`);
  console.log(`Invalid pages: ${report.invalidPages}`);

  if (report.invalidPages > 0) {
    console.log('\nFix the issues and run the validation again.');
    process.exit(1);
  } else {
    console.log('\nAll pages have valid hreflang implementation!');
    process.exit(0);
  }
}

// Run validation
validateAllPages().catch(error => {
  console.error('Error validating hreflang implementation:', error);
  process.exit(1);
});
