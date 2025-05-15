# Deployment Health Check for AI Sports Edge

This document describes the deployment health check system for AI Sports Edge, which provides automated validation of the deployed website.

## Overview

The deployment health check script (`verify-deployment-health.sh`) performs comprehensive validation of the deployed site at https://aisportsedge.app to ensure it's functioning correctly and free of common frontend issues.

## Features

The health check validates:

- **Accessibility**: Confirms the site is accessible with HTTP 200 status
- **Frontend Issues**: Scans for common problems:
  - Reload loops
  - Service worker interference
  - Integrity/crossorigin attribute errors
  - CSP violations
  - MIME-type errors
  - Firebase configuration issues
- **SEO Elements**: Verifies meta tags and other SEO elements:
  - Meta description
  - Open Graph tags
  - Twitter Card tags
  - Language attributes
- **Functionality**: Checks for Spanish toggle functionality
- **Visual Validation**: Takes screenshots of homepage and login page
- **Reporting**: Generates a detailed health report with:
  - Pass/fail status for each check
  - Suggestions for fixing failed checks
  - Screenshots for visual verification
  - Timestamp and summary

## Usage

### Manual Execution

Run the script from the project root:

```bash
./scripts/verify-deployment-health.sh
```

### Outputs

The script generates:

- **Health Report**: `./health-report/aisportsedge-YYYYMMDD-HHMM.txt`
- **Screenshots**: 
  - `./health-report/screenshots/home.png`
  - `./health-report/screenshots/login.png`

### Requirements

The script requires:

- `curl` for HTTP requests
- `node` and `puppeteer` for screenshots (will attempt to install puppeteer if missing)

## Integration with CI/CD

This script can be integrated into CI/CD pipelines to automatically validate deployments:

### GitHub Actions Example

```yaml
name: Deployment Health Check

on:
  deployment_status:
    states: [success]

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Puppeteer
        run: npm install -g puppeteer
      - name: Run Health Check
        run: ./scripts/verify-deployment-health.sh
      - name: Upload Health Report
        uses: actions/upload-artifact@v3
        with:
          name: health-report
          path: ./health-report/
```

## Extending the Health Check

To add new checks:

1. Add a new entry in the `RESULTS` and `SUGGESTIONS` arrays
2. Implement the check logic in the main script
3. Update the report generation to include the new check

## Troubleshooting

If the script fails:

1. Ensure all dependencies are installed (`curl`, `node`, `puppeteer`)
2. Check permissions (`chmod +x scripts/verify-deployment-health.sh`)
3. Verify the site is accessible from your network
4. Check for any firewall or network restrictions

## Maintenance

The health check script should be updated when:

- New frontend features are added that require validation
- New potential issues are identified
- The site structure changes significantly
- New SEO requirements are implemented