/**
 * License Verification Service
 *
 * This service is responsible for verifying the licenses of third-party dependencies
 * to ensure compliance with their terms of use in production environments.
 */

import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Define license types
export enum LicenseType {
  MIT = 'MIT',
  Apache2 = 'Apache-2.0',
  BSD = 'BSD',
  GPL = 'GPL',
  LGPL = 'LGPL',
  ISC = 'ISC',
  Proprietary = 'Proprietary',
  Unknown = 'Unknown',
}

// Define license compatibility
export enum LicenseCompatibility {
  Compatible = 'Compatible',
  Incompatible = 'Incompatible',
  NeedsReview = 'Needs Review',
}

// Define license verification result
export interface LicenseVerificationResult {
  packageName: string;
  version: string;
  licenseType: LicenseType;
  compatibility: LicenseCompatibility;
  requiresAttribution: boolean;
  attributionText?: string;
  verificationDate: string;
}

/**
 * Verify the license of a third-party dependency
 * @param packageName Package name
 * @param version Package version
 * @returns Promise that resolves to a LicenseVerificationResult
 */
export const verifyLicense = async (
  packageName: string,
  version: string
): Promise<LicenseVerificationResult> => {
  try {
    // Check if we already have verification data for this package
    const db = getFirestore();
    const licenseRef = doc(db, 'licenses', `${packageName}@${version}`);
    const licenseDoc = await getDoc(licenseRef);

    if (licenseDoc.exists()) {
      // Return cached verification data
      return licenseDoc.data() as LicenseVerificationResult;
    }

    // In a real implementation, this would make an API call to a license verification service
    // For now, we'll simulate the verification process

    // Simulate license verification
    const result = await simulateLicenseVerification(packageName, version);

    // Cache the result
    await setDoc(licenseRef, {
      ...result,
      verificationDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error('Error verifying license:', error);

    // Return a default result indicating the license needs review
    return {
      packageName,
      version,
      licenseType: LicenseType.Unknown,
      compatibility: LicenseCompatibility.NeedsReview,
      requiresAttribution: true,
      verificationDate: new Date().toISOString(),
    };
  }
};

/**
 * Verify the licenses of multiple third-party dependencies
 * @param dependencies Array of dependencies to verify
 * @returns Promise that resolves to an array of LicenseVerificationResult
 */
export const verifyLicenses = async (
  dependencies: { packageName: string; version: string }[]
): Promise<LicenseVerificationResult[]> => {
  try {
    // Verify each dependency
    const results = await Promise.all(
      dependencies.map(({ packageName, version }) => verifyLicense(packageName, version))
    );

    return results;
  } catch (error) {
    console.error('Error verifying licenses:', error);
    throw error;
  }
};

/**
 * Generate a license report for all third-party dependencies
 * @param dependencies Array of dependencies to include in the report
 * @returns Promise that resolves to a string containing the license report
 */
export const generateLicenseReport = async (
  dependencies: { packageName: string; version: string }[]
): Promise<string> => {
  try {
    // Verify all licenses
    const results = await verifyLicenses(dependencies);

    // Generate report
    let report = '# Third-Party License Report\n\n';
    report +=
      'This report lists all third-party dependencies used in this application and their licenses.\n\n';

    // Group by license type
    const licenseGroups: Record<string, LicenseVerificationResult[]> = {};

    results.forEach(result => {
      if (!licenseGroups[result.licenseType]) {
        licenseGroups[result.licenseType] = [];
      }

      licenseGroups[result.licenseType].push(result);
    });

    // Add each license group to the report
    Object.entries(licenseGroups).forEach(([licenseType, results]) => {
      report += `## ${licenseType} Licenses\n\n`;

      results.forEach(result => {
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
  } catch (error) {
    console.error('Error generating license report:', error);
    throw error;
  }
};

/**
 * Simulate license verification for a package
 * @param packageName Package name
 * @param version Package version
 * @returns Promise that resolves to a LicenseVerificationResult
 */
const simulateLicenseVerification = async (
  packageName: string,
  version: string
): Promise<LicenseVerificationResult> => {
  // This is a simplified simulation
  // In a real implementation, this would make an API call to a license verification service

  // Common packages and their licenses
  const knownPackages: Record<
    string,
    {
      licenseType: LicenseType;
      compatibility: LicenseCompatibility;
      requiresAttribution: boolean;
      attributionText?: string;
    }
  > = {
    react: {
      licenseType: LicenseType.MIT,
      compatibility: LicenseCompatibility.Compatible,
      requiresAttribution: true,
      attributionText:
        'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
    },
    'react-native': {
      licenseType: LicenseType.MIT,
      compatibility: LicenseCompatibility.Compatible,
      requiresAttribution: true,
      attributionText:
        'MIT License\n\nCopyright (c) Facebook, Inc. and its affiliates.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
    },
    expo: {
      licenseType: LicenseType.MIT,
      compatibility: LicenseCompatibility.Compatible,
      requiresAttribution: true,
      attributionText:
        'MIT License\n\nCopyright (c) 2015-present 650 Industries, Inc. (aka Expo)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
    },
    firebase: {
      licenseType: LicenseType.Apache2,
      compatibility: LicenseCompatibility.Compatible,
      requiresAttribution: true,
      attributionText:
        'Apache License 2.0\n\nCopyright (c) Google Inc.\n\nLicensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at\n\nhttp://www.apache.org/licenses/LICENSE-2.0\n\nUnless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.',
    },
  };

  // Check if the package is known
  if (knownPackages[packageName]) {
    return {
      packageName,
      version,
      ...knownPackages[packageName],
      verificationDate: new Date().toISOString(),
    };
  }

  // For unknown packages, return a default result
  return {
    packageName,
    version,
    licenseType: LicenseType.Unknown,
    compatibility: LicenseCompatibility.NeedsReview,
    requiresAttribution: true,
    verificationDate: new Date().toISOString(),
  };
};
