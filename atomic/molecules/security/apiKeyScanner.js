/**
 * API Key Scanner
 *
 * This module provides functionality for scanning code files to detect hardcoded API keys
 * and other sensitive information. It uses the patterns defined in the apiKeyPatterns atom.
 */

const fs = require('fs');
const path = require('path');

const {
  API_KEY_PATTERNS,
  SCAN_EXCLUSIONS,
  ALLOWLISTED_FILES,
} = require('../../atoms/security/apiKeyPatterns');

/**
 * Checks if a file should be excluded from scanning
 * @param {string} filePath - Path to the file
 * @returns {boolean} Whether the file should be excluded
 */
const shouldExcludeFile = filePath => {
  // Check if file is in an excluded directory
  for (const exclusion of SCAN_EXCLUSIONS) {
    if (exclusion.endsWith('/') && filePath.includes(exclusion)) {
      return true;
    }
  }

  // Check if file has an excluded extension
  const fileName = path.basename(filePath);
  for (const exclusion of SCAN_EXCLUSIONS) {
    if (exclusion.startsWith('*.') && fileName.endsWith(exclusion.substring(1))) {
      return true;
    }
  }

  // Check if file is explicitly excluded
  if (SCAN_EXCLUSIONS.includes(fileName)) {
    return true;
  }

  return false;
};

/**
 * Checks if a file is allowlisted (allowed to contain API keys)
 * @param {string} filePath - Path to the file
 * @returns {boolean} Whether the file is allowlisted
 */
const isFileAllowlisted = filePath => {
  const fileName = path.basename(filePath);

  // Check if file is explicitly allowlisted
  if (ALLOWLISTED_FILES.includes(fileName)) {
    return true;
  }

  // Check if file matches an allowlisted pattern
  for (const pattern of ALLOWLISTED_FILES) {
    if (pattern.startsWith('*.') && fileName.endsWith(pattern.substring(1))) {
      return true;
    }

    if (pattern.endsWith('/**/*') && filePath.includes(pattern.replace('/**/*', ''))) {
      return true;
    }
  }

  return false;
};

/**
 * Scans a file for API keys and other sensitive information
 * @param {string} filePath - Path to the file to scan
 * @returns {Array} Array of detected secrets
 */
const scanFile = filePath => {
  // Skip excluded files
  if (shouldExcludeFile(filePath)) {
    return [];
  }

  // Check if file is allowlisted
  const allowlisted = isFileAllowlisted(filePath);

  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Scan for API keys
    const results = [];

    lines.forEach((line, lineIndex) => {
      API_KEY_PATTERNS.forEach(({ name, pattern, severity, description }) => {
        const matches = line.match(pattern);

        if (matches) {
          results.push({
            file: filePath,
            line: lineIndex + 1,
            lineContent: line.trim(),
            match: matches[0],
            type: name,
            severity: allowlisted ? 'info' : severity,
            description: allowlisted ? `${description} (in allowlisted file)` : description,
            allowlisted,
          });
        }
      });
    });

    return results;
  } catch (error) {
    // Skip files that can't be read as text
    return [];
  }
};

/**
 * Recursively scans a directory for API keys
 * @param {string} dirPath - Path to the directory to scan
 * @param {Array} results - Array to store results
 * @returns {Array} Array of detected secrets
 */
const scanDirectory = (dirPath, results = []) => {
  // Get all files in the directory
  const files = fs.readdirSync(dirPath);

  // Scan each file
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip excluded directories
      if (SCAN_EXCLUSIONS.includes(file) || SCAN_EXCLUSIONS.includes(`${file}/`)) {
        return;
      }

      // Recursively scan subdirectories
      scanDirectory(filePath, results);
    } else {
      // Scan file
      const fileResults = scanFile(filePath);
      results.push(...fileResults);
    }
  });

  return results;
};

/**
 * Scans a project for API keys and other sensitive information
 * @param {string} projectPath - Path to the project to scan
 * @param {object} options - Scan options
 * @param {boolean} options.includeAllowlisted - Whether to include allowlisted files in results
 * @param {string[]} options.severityFilter - Array of severities to include (e.g., ['critical', 'high'])
 * @returns {object} Scan results
 */
const scanProject = (projectPath, options = {}) => {
  const {
    includeAllowlisted = false,
    severityFilter = ['critical', 'high', 'medium', 'low', 'info'],
  } = options;

  // Scan the project
  let results = scanDirectory(projectPath);

  // Filter results
  if (!includeAllowlisted) {
    results = results.filter(result => !result.allowlisted);
  }

  if (severityFilter && severityFilter.length > 0) {
    results = results.filter(result => severityFilter.includes(result.severity));
  }

  // Group results by severity
  const groupedResults = {
    critical: results.filter(result => result.severity === 'critical'),
    high: results.filter(result => result.severity === 'high'),
    medium: results.filter(result => result.severity === 'medium'),
    low: results.filter(result => result.severity === 'low'),
    info: results.filter(result => result.severity === 'info'),
  };

  // Count results by severity
  const counts = {
    critical: groupedResults.critical.length,
    high: groupedResults.high.length,
    medium: groupedResults.medium.length,
    low: groupedResults.low.length,
    info: groupedResults.info.length,
    total: results.length,
  };

  return {
    results,
    groupedResults,
    counts,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Formats scan results as a string for display
 * @param {object} scanResults - Results from scanProject
 * @returns {string} Formatted results
 */
const formatScanResults = scanResults => {
  const { results, counts } = scanResults;

  let output = '=== API Key Scan Results ===\n\n';

  // Add summary
  output += 'Summary:\n';
  output += `- Critical: ${counts.critical}\n`;
  output += `- High: ${counts.high}\n`;
  output += `- Medium: ${counts.medium}\n`;
  output += `- Low: ${counts.low}\n`;
  output += `- Info: ${counts.info}\n`;
  output += `- Total: ${counts.total}\n\n`;

  // Add detailed results
  if (results.length > 0) {
    output += 'Detailed Results:\n\n';

    results.forEach((result, index) => {
      output += `${index + 1}. ${result.type} (${result.severity.toUpperCase()}):\n`;
      output += `   File: ${result.file}\n`;
      output += `   Line: ${result.line}\n`;
      output += `   Content: ${result.lineContent}\n`;
      output += `   Description: ${result.description}\n\n`;
    });
  } else {
    output += 'No API keys or secrets found.\n';
  }

  return output;
};

/**
 * Saves scan results to a file
 * @param {object} scanResults - Results from scanProject
 * @param {string} outputPath - Path to save results to
 */
const saveScanResults = (scanResults, outputPath) => {
  const jsonResults = JSON.stringify(scanResults, null, 2);
  fs.writeFileSync(outputPath, jsonResults);
};

module.exports = {
  scanFile,
  scanDirectory,
  scanProject,
  formatScanResults,
  saveScanResults,
  shouldExcludeFile,
  isFileAllowlisted,
};
