#!/usr/bin/env node

/**
 * Accessibility Testing Script for AI Sports Edge
 *
 * This script performs automated accessibility testing on the AI Sports Edge application.
 * It checks for common accessibility issues and generates a report.
 *
 * Usage:
 *   node scripts/accessibility-test.js [options]
 *
 * Options:
 *   --platform=<ios|android|web>  Platform to test (default: all)
 *   --verbose                     Show detailed output
 *   --report=<path>               Path to save the report (default: ./accessibility-report.json)
 *   --fix                         Attempt to fix simple issues automatically
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  platform: 'all',
  verbose: false,
  reportPath: './accessibility-report.json',
  fix: false,
  // Directories to scan for components
  directories: ['./screens', './components', './atomic'],
  // File extensions to check
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  // Accessibility rules to check
  rules: {
    // Component must have accessibility props
    accessibilityProps: true,
    // Text components should have accessibilityLabel
    textAccessibility: true,
    // TouchableOpacity should have accessibilityRole
    touchableAccessibility: true,
    // Images should have accessibilityLabel
    imageAccessibility: true,
    // Heading hierarchy should be proper
    headingHierarchy: true,
    // Color contrast should be sufficient
    colorContrast: true,
    // Font size should be accessible
    fontSize: true,
  },
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--platform=')) {
    config.platform = arg.split('=')[1];
  } else if (arg === '--verbose') {
    config.verbose = true;
  } else if (arg.startsWith('--report=')) {
    config.reportPath = arg.split('=')[1];
  } else if (arg === '--fix') {
    config.fix = true;
  }
});

// Results object
const results = {
  summary: {
    totalFiles: 0,
    filesWithIssues: 0,
    totalIssues: 0,
    issuesByType: {},
    issuesByComponent: {},
  },
  issues: [],
  timestamp: new Date().toISOString(),
};

/**
 * Check if a file has accessibility issues
 * @param {string} filePath - Path to the file
 * @returns {Array} - Array of issues found
 */
function checkFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Check for missing accessibility props
  if (config.rules.accessibilityProps) {
    // Check for View without accessibility props
    const viewWithoutAccessibility =
      (content.includes('<View') || content.includes('<ThemedView')) &&
      !content.includes('accessibilityLabel') &&
      !content.includes('AccessibleThemedView');

    if (viewWithoutAccessibility) {
      issues.push({
        type: 'accessibilityProps',
        component: fileName,
        description: 'View component without accessibility props',
        line: findLineNumber(content, '<View') || findLineNumber(content, '<ThemedView'),
        severity: 'medium',
        suggestion: 'Replace with AccessibleThemedView or add accessibilityLabel',
      });
    }
  }

  // Check for Text without accessibility
  if (config.rules.textAccessibility) {
    const textWithoutAccessibility =
      (content.includes('<Text') || content.includes('<ThemedText')) &&
      !content.includes('accessibilityLabel') &&
      !content.includes('AccessibleThemedText');

    if (textWithoutAccessibility) {
      issues.push({
        type: 'textAccessibility',
        component: fileName,
        description: 'Text component without accessibility props',
        line: findLineNumber(content, '<Text') || findLineNumber(content, '<ThemedText'),
        severity: 'high',
        suggestion: 'Replace with AccessibleThemedText or add accessibilityLabel',
      });
    }
  }

  // Check for TouchableOpacity without accessibility
  if (config.rules.touchableAccessibility) {
    const touchableWithoutAccessibility =
      content.includes('<TouchableOpacity') &&
      !content.includes('accessibilityRole') &&
      !content.includes('AccessibleTouchableOpacity');

    if (touchableWithoutAccessibility) {
      issues.push({
        type: 'touchableAccessibility',
        component: fileName,
        description: 'TouchableOpacity without accessibility props',
        line: findLineNumber(content, '<TouchableOpacity'),
        severity: 'high',
        suggestion:
          'Replace with AccessibleTouchableOpacity or add accessibilityRole and accessibilityLabel',
      });
    }
  }

  // Check for Image without accessibility
  if (config.rules.imageAccessibility) {
    const imageWithoutAccessibility =
      content.includes('<Image') && !content.includes('accessibilityLabel');

    if (imageWithoutAccessibility) {
      issues.push({
        type: 'imageAccessibility',
        component: fileName,
        description: 'Image without accessibilityLabel',
        line: findLineNumber(content, '<Image'),
        severity: 'high',
        suggestion: 'Add accessibilityLabel to describe the image',
      });
    }
  }

  // Check for heading hierarchy
  if (config.rules.headingHierarchy) {
    const hasH2WithoutH1 = content.includes('type="h2"') && !content.includes('type="h1"');

    if (hasH2WithoutH1 && isScreenComponent(filePath)) {
      issues.push({
        type: 'headingHierarchy',
        component: fileName,
        description: 'Screen has h2 heading without h1',
        line: findLineNumber(content, 'type="h2"'),
        severity: 'medium',
        suggestion: 'Add an h1 heading as the main screen title',
      });
    }
  }

  return issues;
}

/**
 * Find the line number for a pattern in content
 * @param {string} content - File content
 * @param {string} pattern - Pattern to find
 * @returns {number|null} - Line number or null if not found
 */
function findLineNumber(content, pattern) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i + 1;
    }
  }
  return null;
}

/**
 * Check if a file is a screen component
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if it's a screen component
 */
function isScreenComponent(filePath) {
  return (
    filePath.includes('/screens/') || filePath.includes('Screen.') || filePath.includes('Page.')
  );
}

/**
 * Scan directories for files to check
 * @param {Array} directories - Directories to scan
 * @returns {Array} - Array of file paths
 */
function scanDirectories(directories) {
  let files = [];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.warn(chalk.yellow(`Directory not found: ${dir}`));
      return;
    }

    const dirFiles = getAllFiles(dir);
    files = files.concat(dirFiles);
  });

  return files.filter(file => {
    const ext = path.extname(file);
    return config.extensions.includes(ext);
  });
}

/**
 * Get all files in a directory recursively
 * @param {string} dirPath - Directory path
 * @param {Array} arrayOfFiles - Array to add files to
 * @returns {Array} - Array of file paths
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Generate a report of accessibility issues
 * @param {Object} results - Results object
 */
function generateReport(results) {
  // Save JSON report
  fs.writeFileSync(config.reportPath, JSON.stringify(results, null, 2));

  // Generate HTML report
  const htmlReportPath = config.reportPath.replace('.json', '.html');
  const htmlReport = generateHtmlReport(results);
  fs.writeFileSync(htmlReportPath, htmlReport);

  console.log(chalk.green(`\nReport saved to ${config.reportPath} and ${htmlReportPath}`));
}

/**
 * Generate an HTML report
 * @param {Object} results - Results object
 * @returns {string} - HTML report
 */
function generateHtmlReport(results) {
  const issuesByType = Object.entries(results.summary.issuesByType)
    .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
    .join('');

  const issuesList = results.issues
    .map(
      issue => `
      <div class="issue ${issue.severity}">
        <h3>${issue.component} (Line ${issue.line})</h3>
        <p><strong>Type:</strong> ${issue.type}</p>
        <p><strong>Description:</strong> ${issue.description}</p>
        <p><strong>Severity:</strong> ${issue.severity}</p>
        <p><strong>Suggestion:</strong> ${issue.suggestion}</p>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Accessibility Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1, h2 { color: #333; }
        .summary { margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .issue { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .high { border-left: 5px solid #ff4d4d; }
        .medium { border-left: 5px solid #ffcc00; }
        .low { border-left: 5px solid #66cc66; }
      </style>
    </head>
    <body>
      <h1>Accessibility Test Report</h1>
      <p>Generated on: ${new Date(results.timestamp).toLocaleString()}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p>Total Files: ${results.summary.totalFiles}</p>
        <p>Files with Issues: ${results.summary.filesWithIssues}</p>
        <p>Total Issues: ${results.summary.totalIssues}</p>
        
        <h3>Issues by Type</h3>
        <table>
          <tr>
            <th>Type</th>
            <th>Count</th>
          </tr>
          ${issuesByType}
        </table>
      </div>
      
      <h2>Issues</h2>
      ${issuesList}
    </body>
    </html>
  `;
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('Starting accessibility tests...'));

  // Scan directories for files
  const files = scanDirectories(config.directories);
  results.summary.totalFiles = files.length;

  console.log(chalk.blue(`Found ${files.length} files to check`));

  // Check each file
  files.forEach(file => {
    if (config.verbose) {
      console.log(chalk.gray(`Checking ${file}...`));
    }

    const issues = checkFile(file);

    if (issues.length > 0) {
      results.summary.filesWithIssues++;
      results.summary.totalIssues += issues.length;

      // Add to issues by component
      const component = path.basename(file);
      results.summary.issuesByComponent[component] = issues.length;

      // Add to issues by type
      issues.forEach(issue => {
        results.summary.issuesByType[issue.type] =
          (results.summary.issuesByType[issue.type] || 0) + 1;
      });

      // Add to issues list
      results.issues.push(...issues);

      if (config.verbose) {
        console.log(chalk.yellow(`  Found ${issues.length} issues`));
      }
    }
  });

  // Print summary
  console.log(chalk.blue('\nAccessibility Test Results:'));
  console.log(chalk.blue(`Total Files: ${results.summary.totalFiles}`));
  console.log(chalk.blue(`Files with Issues: ${results.summary.filesWithIssues}`));
  console.log(chalk.blue(`Total Issues: ${results.summary.totalIssues}`));

  // Generate report
  generateReport(results);

  // Exit with error code if issues found
  if (results.summary.totalIssues > 0) {
    console.log(chalk.yellow('\nAccessibility issues found. See report for details.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\nNo accessibility issues found!'));
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  console.error(chalk.red('Error running accessibility tests:'), error);
  process.exit(1);
});
