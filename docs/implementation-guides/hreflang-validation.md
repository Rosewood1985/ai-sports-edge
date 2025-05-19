# Hreflang Validation

This document explains how to use the hreflang validation script to ensure proper implementation of hreflang tags across the AI Sports Edge website.

## Overview

The hreflang validation script checks that all pages have proper hreflang tags for all supported languages. It validates:

- Presence of hreflang tags for all required languages
- Self-referential hreflang tags
- x-default hreflang tag
- Canonical URL
- Bidirectional linking between language variants
- URL format and structure

## Implementation

The validation script uses a lightweight HTTP client (axios) to fetch HTML content and validate hreflang tags without requiring a browser. This approach is more efficient than the previous implementation that used Puppeteer.

### Key Features

- **No Browser Dependency**: Uses axios instead of Puppeteer for improved performance and reduced resource usage
- **Efficient Validation**: Implements a more efficient approach to validate bidirectional linking
- **Detailed Error Reporting**: Provides clear, actionable error messages
- **Headless Mode**: Supports running in CI/CD pipelines with no console output
- **Verbose Mode**: Provides detailed validation information when needed
- **Custom Output Path**: Allows specifying a custom output path for the validation report

## Usage

### Basic Usage

```bash
npm run validate:hreflang
```

### CI/CD Pipeline Usage

```bash
npm run validate:hreflang:ci
```

### Command Line Options

The script supports the following command line options:

- `--headless`: Run in headless mode (no console output, exit code only)
- `--verbose`: Show detailed validation information
- `--output <path>`: Output report to specified file path

Example:

```bash
node scripts/validate-hreflang.js --verbose --output=./custom-reports/hreflang-report.json
```

## Validation Process

1. The script fetches HTML content from each URL to validate
2. It extracts hreflang tags and checks for required languages
3. It validates self-referential hreflang tags and x-default tag
4. It checks the canonical URL
5. It validates URL format and structure
6. It checks bidirectional linking between language variants
7. It generates a validation report

## Validation Report

The validation report is a JSON file that includes:

- Timestamp
- Base URL
- Total pages validated
- Number of valid pages
- Number of invalid pages
- Detailed results for each page

Example report structure:

```json
{
  "timestamp": "2025-05-19T00:30:00.000Z",
  "baseUrl": "https://aisportsedge.app",
  "totalPages": 8,
  "validPages": 7,
  "invalidPages": 1,
  "results": [
    {
      "url": "https://aisportsedge.app/en/",
      "valid": true,
      "missing": [],
      "issues": [],
      "hreflangTags": [...]
    },
    {
      "url": "https://aisportsedge.app/en/dashboard",
      "valid": false,
      "missing": ["es-MX"],
      "issues": ["Missing hreflang tag for es-MX"],
      "hreflangTags": [...]
    }
  ]
}
```

## Troubleshooting

If the validation script reports issues, check the following:

1. Ensure all required languages are defined in the SEO configuration
2. Verify that all pages have the correct hreflang tags
3. Check that all language variants link back to each other
4. Ensure the canonical URL matches the current URL
5. Verify that the URL format is correct

## Implementation Notes

The script uses:

- `axios` for making HTTP requests
- `node-html-parser` for parsing HTML content
- `commander` for command-line argument parsing

These dependencies are more lightweight than Puppeteer, resulting in faster execution and lower resource usage.
