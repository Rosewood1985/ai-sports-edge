#!/usr/bin/env node

/**
 * License Verification Script
 *
 * This script verifies the licenses of all third-party dependencies used in the project
 * to ensure compliance with their terms of use in production environments.
 *
 * Usage:
 *   node scripts/verify-licenses.js
 *
 * Options:
 *   --report  Generate a license report (default: false)
 *   --output  Output file for the license report (default: licenses-report.md)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define license types
const LicenseType = {
  MIT: 'MIT',
  Apache2: 'Apache-2.0',
  BSD: 'BSD',
  GPL: 'GPL',
  LGPL: 'LGPL',
  ISC: 'ISC',
  Proprietary: 'Proprietary',
  Unknown: 'Unknown',
};

// Define license compatibility
const LicenseCompatibility = {
  Compatible: 'Compatible',
  Incompatible: 'Incompatible',
  NeedsReview: 'Needs Review',
};

// Parse command line arguments
const args = process.argv.slice(2);
const generateReport = args.includes('--report');
const outputFile = args.includes('--output')
  ? args[args.indexOf('--output') + 1]
  : 'licenses-report.md';

// Main function
async function main() {
  try {
    console.log('Verifying third-party licenses...');

    // Get all dependencies from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
      packageName: name,
      version: version.replace(/^\^|~/, ''),
    }));

    const devDependencies = Object.entries(packageJson.devDependencies || {}).map(
      ([name, version]) => ({
        packageName: name,
        version: version.replace(/^\^|~/, ''),
      })
    );

    console.log(
      `Found ${dependencies.length} dependencies and ${devDependencies.length} dev dependencies.`
    );

    // Verify licenses
    const results = await verifyLicenses([...dependencies, ...devDependencies]);

    // Check for incompatible licenses
    const incompatibleLicenses = results.filter(
      result => result.compatibility === LicenseCompatibility.Incompatible
    );

    const licensesNeedingReview = results.filter(
      result => result.compatibility === LicenseCompatibility.NeedsReview
    );

    // Print results
    console.log('\nLicense Verification Results:');
    console.log(`- Total Dependencies: ${results.length}`);
    console.log(
      `- Compatible Licenses: ${results.filter(r => r.compatibility === LicenseCompatibility.Compatible).length}`
    );
    console.log(`- Incompatible Licenses: ${incompatibleLicenses.length}`);
    console.log(`- Licenses Needing Review: ${licensesNeedingReview.length}`);

    // Print incompatible licenses
    if (incompatibleLicenses.length > 0) {
      console.log('\nIncompatible Licenses:');
      incompatibleLicenses.forEach(result => {
        console.log(`- ${result.packageName}@${result.version} (${result.licenseType})`);
      });
    }

    // Print licenses needing review
    if (licensesNeedingReview.length > 0) {
      console.log('\nLicenses Needing Review:');
      licensesNeedingReview.forEach(result => {
        console.log(`- ${result.packageName}@${result.version} (${result.licenseType})`);
      });
    }

    // Generate report if requested
    if (generateReport) {
      const report = generateLicenseReport(results);
      fs.writeFileSync(outputFile, report);
      console.log(`\nLicense report generated: ${outputFile}`);
    }

    // Exit with error if there are incompatible licenses
    if (incompatibleLicenses.length > 0) {
      console.error(
        '\nError: Incompatible licenses found. Please review and resolve before deploying to production.'
      );
      process.exit(1);
    }

    console.log('\nLicense verification completed successfully.');
  } catch (error) {
    console.error('Error verifying licenses:', error);
    process.exit(1);
  }
}

/**
 * Verify the licenses of multiple third-party dependencies
 * @param dependencies Array of dependencies to verify
 * @returns Promise that resolves to an array of license verification results
 */
async function verifyLicenses(dependencies) {
  // In a real implementation, this would make API calls to a license verification service
  // For now, we'll simulate the verification process

  // Get license info from npm
  const results = [];

  for (const { packageName, version } of dependencies) {
    try {
      // Get license info from package.json
      const licenseInfo = getLicenseInfo(packageName);

      results.push({
        packageName,
        version,
        licenseType: licenseInfo.licenseType,
        compatibility: licenseInfo.compatibility,
        requiresAttribution: licenseInfo.requiresAttribution,
        attributionText: licenseInfo.attributionText,
        verificationDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error verifying license for ${packageName}@${version}:`, error);

      // Add a default result
      results.push({
        packageName,
        version,
        licenseType: LicenseType.Unknown,
        compatibility: LicenseCompatibility.NeedsReview,
        requiresAttribution: true,
        verificationDate: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Get license info for a package
 * @param packageName Package name
 * @returns License info
 */
function getLicenseInfo(packageName) {
  try {
    // Try to get license info from node_modules
    const packageJsonPath = path.join('node_modules', packageName, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const license = packageJson.license || 'Unknown';

      // Check license compatibility
      const compatibility = getLicenseCompatibility(license);

      // Get attribution text
      let attributionText = '';
      const licensePath = path.join('node_modules', packageName, 'LICENSE');
      const licenseTextPath = path.join('node_modules', packageName, 'LICENSE.txt');
      const licenseMarkdownPath = path.join('node_modules', packageName, 'LICENSE.md');

      if (fs.existsSync(licensePath)) {
        attributionText = fs.readFileSync(licensePath, 'utf8');
      } else if (fs.existsSync(licenseTextPath)) {
        attributionText = fs.readFileSync(licenseTextPath, 'utf8');
      } else if (fs.existsSync(licenseMarkdownPath)) {
        attributionText = fs.readFileSync(licenseMarkdownPath, 'utf8');
      }

      return {
        licenseType: license,
        compatibility,
        requiresAttribution: true,
        attributionText,
      };
    }

    // If package.json not found, try to get license info from npm
    const npmInfo = JSON.parse(execSync(`npm view ${packageName} --json`, { encoding: 'utf8' }));

    const license = npmInfo.license || 'Unknown';
    const compatibility = getLicenseCompatibility(license);

    return {
      licenseType: license,
      compatibility,
      requiresAttribution: true,
      attributionText: '',
    };
  } catch (error) {
    console.error(`Error getting license info for ${packageName}:`, error);

    return {
      licenseType: LicenseType.Unknown,
      compatibility: LicenseCompatibility.NeedsReview,
      requiresAttribution: true,
      attributionText: '',
    };
  }
}

/**
 * Get license compatibility
 * @param license License type
 * @returns License compatibility
 */
function getLicenseCompatibility(license) {
  // Define compatible licenses
  const compatibleLicenses = [
    'MIT',
    'Apache-2.0',
    'BSD',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'CC0-1.0',
    'Unlicense',
  ];

  // Define incompatible licenses
  const incompatibleLicenses = ['GPL', 'GPL-2.0', 'GPL-3.0', 'AGPL', 'AGPL-3.0'];

  if (compatibleLicenses.includes(license)) {
    return LicenseCompatibility.Compatible;
  } else if (incompatibleLicenses.includes(license)) {
    return LicenseCompatibility.Incompatible;
  } else {
    return LicenseCompatibility.NeedsReview;
  }
}

/**
 * Generate a license report
 * @param results License verification results
 * @returns License report
 */
function generateLicenseReport(results) {
  // Generate report
  let report = '# Third-Party License Report\n\n';
  report +=
    'This report lists all third-party dependencies used in this application and their licenses.\n\n';

  // Group by license type
  const licenseGroups = {};

  results.forEach(result => {
    if (!licenseGroups[result.licenseType]) {
      licenseGroups[result.licenseType] = [];
    }

    licenseGroups[result.licenseType].push(result);
  });

  // Add each license group to the report
  Object.entries(licenseGroups).forEach(([licenseType, groupResults]) => {
    report += `## ${licenseType} Licenses\n\n`;

    groupResults.forEach(result => {
      report += `### ${result.packageName}@${result.version}\n\n`;
      report += `- **Compatibility:** ${result.compatibility}\n`;
      report += `- **Requires Attribution:** ${result.requiresAttribution ? 'Yes' : 'No'}\n`;

      if (result.attributionText) {
        report += `- **Attribution Text:**\n\n\`\`\`\n${result.attributionText}\n\`\`\`\n\n`;
      }
    });
  });

  // Add summary
  report += '## Summary\n\n';
  report += `- **Total Dependencies:** ${results.length}\n`;
  report += `- **Compatible Licenses:** ${results.filter(r => r.compatibility === LicenseCompatibility.Compatible).length}\n`;
  report += `- **Incompatible Licenses:** ${results.filter(r => r.compatibility === LicenseCompatibility.Incompatible).length}\n`;
  report += `- **Licenses Needing Review:** ${results.filter(r => r.compatibility === LicenseCompatibility.NeedsReview).length}\n`;

  return report;
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
