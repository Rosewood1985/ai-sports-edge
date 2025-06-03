/**
 * Accessibility Audit Script
 *
 * This script performs a comprehensive accessibility audit of the AI Sports Edge app.
 * It checks for compliance with WCAG 2.1 guidelines and best practices.
 *
 * Usage: node scripts/accessibility-audit.js [options]
 *
 * Options:
 *   --output=<path>    Output path for the audit report (default: ./accessibility-audit-report.json)
 *   --format=<format>  Output format (json, html, markdown) (default: json)
 *   --verbose          Enable verbose output
 *   --fix              Attempt to fix issues automatically
 *   --scope=<scope>    Audit scope (all, components, screens, navigation) (default: all)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  output: './accessibility-audit-report.json',
  format: 'json',
  verbose: false,
  fix: false,
  scope: 'all',
};

// Parse options
args.forEach(arg => {
  if (arg.startsWith('--output=')) {
    options.output = arg.split('=')[1];
  } else if (arg.startsWith('--format=')) {
    options.format = arg.split('=')[1];
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--fix') {
    options.fix = true;
  } else if (arg.startsWith('--scope=')) {
    options.scope = arg.split('=')[1];
  }
});

// WCAG 2.1 Success Criteria
const wcagCriteria = [
  {
    id: '1.1.1',
    name: 'Non-text Content',
    level: 'A',
    description: 'All non-text content has a text alternative',
  },
  {
    id: '1.2.1',
    name: 'Audio-only and Video-only',
    level: 'A',
    description: 'Alternatives for time-based media',
  },
  {
    id: '1.2.2',
    name: 'Captions',
    level: 'A',
    description: 'Captions are provided for all prerecorded audio',
  },
  {
    id: '1.2.3',
    name: 'Audio Description or Media Alternative',
    level: 'A',
    description: 'Alternative for time-based media or audio description',
  },
  {
    id: '1.3.1',
    name: 'Info and Relationships',
    level: 'A',
    description: 'Information, structure, and relationships can be programmatically determined',
  },
  {
    id: '1.3.2',
    name: 'Meaningful Sequence',
    level: 'A',
    description: 'Correct reading sequence can be programmatically determined',
  },
  {
    id: '1.3.3',
    name: 'Sensory Characteristics',
    level: 'A',
    description: "Instructions don't rely solely on sensory characteristics",
  },
  {
    id: '1.3.4',
    name: 'Orientation',
    level: 'AA',
    description: 'Content not restricted to specific orientation',
  },
  {
    id: '1.3.5',
    name: 'Identify Input Purpose',
    level: 'AA',
    description: 'Input purpose can be programmatically determined',
  },
  {
    id: '1.4.1',
    name: 'Use of Color',
    level: 'A',
    description: 'Color is not the only visual means of conveying information',
  },
  {
    id: '1.4.2',
    name: 'Audio Control',
    level: 'A',
    description: 'Mechanism to pause, stop, or control audio volume',
  },
  {
    id: '1.4.3',
    name: 'Contrast (Minimum)',
    level: 'AA',
    description: 'Text has contrast ratio of at least 4.5:1',
  },
  {
    id: '1.4.4',
    name: 'Resize Text',
    level: 'AA',
    description: 'Text can be resized up to 200% without loss of content or function',
  },
  {
    id: '1.4.5',
    name: 'Images of Text',
    level: 'AA',
    description: 'Text is used rather than images of text',
  },
  {
    id: '1.4.10',
    name: 'Reflow',
    level: 'AA',
    description: 'Content can be presented without loss of information or functionality',
  },
  {
    id: '1.4.11',
    name: 'Non-text Contrast',
    level: 'AA',
    description:
      'Visual presentation of UI components and graphical objects have contrast ratio of at least 3:1',
  },
  {
    id: '1.4.12',
    name: 'Text Spacing',
    level: 'AA',
    description: 'No loss of content or functionality when text spacing is adjusted',
  },
  {
    id: '1.4.13',
    name: 'Content on Hover or Focus',
    level: 'AA',
    description: 'Additional content that appears on hover or focus can be dismissed',
  },
  {
    id: '2.1.1',
    name: 'Keyboard',
    level: 'A',
    description: 'All functionality is available from a keyboard',
  },
  {
    id: '2.1.2',
    name: 'No Keyboard Trap',
    level: 'A',
    description: 'Keyboard focus is not trapped',
  },
  {
    id: '2.1.4',
    name: 'Character Key Shortcuts',
    level: 'A',
    description:
      'Shortcuts using only letter, punctuation, number, or symbol characters can be turned off or remapped',
  },
  {
    id: '2.2.1',
    name: 'Timing Adjustable',
    level: 'A',
    description: 'Time limits can be turned off, adjusted, or extended',
  },
  {
    id: '2.2.2',
    name: 'Pause, Stop, Hide',
    level: 'A',
    description:
      'Moving, blinking, scrolling, or auto-updating content can be paused, stopped, or hidden',
  },
  {
    id: '2.3.1',
    name: 'Three Flashes or Below Threshold',
    level: 'A',
    description: 'No content flashes more than three times in one second',
  },
  {
    id: '2.4.1',
    name: 'Bypass Blocks',
    level: 'A',
    description: 'Mechanism to bypass blocks of content that are repeated on multiple pages',
  },
  {
    id: '2.4.2',
    name: 'Page Titled',
    level: 'A',
    description: 'Pages have titles that describe topic or purpose',
  },
  {
    id: '2.4.3',
    name: 'Focus Order',
    level: 'A',
    description: 'Focus order preserves meaning and operability',
  },
  {
    id: '2.4.4',
    name: 'Link Purpose (In Context)',
    level: 'A',
    description: 'Purpose of each link can be determined from the link text or context',
  },
  {
    id: '2.4.5',
    name: 'Multiple Ways',
    level: 'AA',
    description: 'More than one way to locate a page',
  },
  {
    id: '2.4.6',
    name: 'Headings and Labels',
    level: 'AA',
    description: 'Headings and labels describe topic or purpose',
  },
  {
    id: '2.4.7',
    name: 'Focus Visible',
    level: 'AA',
    description: 'Keyboard focus indicator is visible',
  },
  {
    id: '2.5.1',
    name: 'Pointer Gestures',
    level: 'A',
    description:
      'All functionality that uses multipoint or path-based gestures can be operated with a single pointer',
  },
  {
    id: '2.5.2',
    name: 'Pointer Cancellation',
    level: 'A',
    description:
      'Functions that can be operated using a single pointer do not require down-event to complete',
  },
  {
    id: '2.5.3',
    name: 'Label in Name',
    level: 'A',
    description:
      'For user interface components with labels, the name contains the text that is presented visually',
  },
  {
    id: '2.5.4',
    name: 'Motion Actuation',
    level: 'A',
    description:
      'Functionality that can be operated by device motion or user motion can also be operated by user interface components',
  },
  {
    id: '3.1.1',
    name: 'Language of Page',
    level: 'A',
    description: 'Human language of page can be programmatically determined',
  },
  {
    id: '3.1.2',
    name: 'Language of Parts',
    level: 'AA',
    description: 'Human language of parts can be programmatically determined',
  },
  {
    id: '3.2.1',
    name: 'On Focus',
    level: 'A',
    description: 'When any component receives focus, it does not initiate a change of context',
  },
  {
    id: '3.2.2',
    name: 'On Input',
    level: 'A',
    description:
      'Changing the setting of any user interface component does not automatically cause a change of context',
  },
  {
    id: '3.2.3',
    name: 'Consistent Navigation',
    level: 'AA',
    description:
      'Navigational mechanisms that are repeated on multiple pages occur in the same relative order',
  },
  {
    id: '3.2.4',
    name: 'Consistent Identification',
    level: 'AA',
    description: 'Components that have the same functionality are identified consistently',
  },
  {
    id: '3.3.1',
    name: 'Error Identification',
    level: 'A',
    description: 'Input errors are identified and described to the user',
  },
  {
    id: '3.3.2',
    name: 'Labels or Instructions',
    level: 'A',
    description: 'Labels or instructions are provided when content requires user input',
  },
  {
    id: '3.3.3',
    name: 'Error Suggestion',
    level: 'AA',
    description: 'Suggestions for error correction are provided',
  },
  {
    id: '3.3.4',
    name: 'Error Prevention',
    level: 'AA',
    description:
      'For pages that cause legal commitments or financial transactions, submissions are reversible, checked, or confirmed',
  },
  { id: '4.1.1', name: 'Parsing', level: 'A', description: 'No major code errors' },
  {
    id: '4.1.2',
    name: 'Name, Role, Value',
    level: 'A',
    description:
      'For all user interface components, the name and role can be programmatically determined',
  },
  {
    id: '4.1.3',
    name: 'Status Messages',
    level: 'AA',
    description: 'Status messages can be programmatically determined',
  },
];

// Mobile-specific accessibility checks
const mobileChecks = [
  { id: 'M1', name: 'Touch Target Size', description: 'Touch targets are at least 44x44 points' },
  {
    id: 'M2',
    name: 'Gesture Alternatives',
    description: 'Complex gestures have simpler alternatives',
  },
  {
    id: 'M3',
    name: 'Screen Reader Compatibility',
    description: 'All elements are accessible to screen readers',
  },
  {
    id: 'M4',
    name: 'Screen Orientation',
    description: 'Content works in both portrait and landscape orientations',
  },
  {
    id: 'M5',
    name: 'Keyboard Accessibility',
    description: 'App is fully usable with external keyboard',
  },
  { id: 'M6', name: 'Voice Control', description: 'App is compatible with voice control features' },
  { id: 'M7', name: 'Haptic Feedback', description: 'Appropriate haptic feedback is provided' },
  {
    id: 'M8',
    name: 'Text Resizing',
    description: 'App handles system text size changes gracefully',
  },
  { id: 'M9', name: 'Color Inversion', description: 'App works correctly with color inversion' },
  { id: 'M10', name: 'Reduce Motion', description: 'App respects reduce motion settings' },
];

/**
 * Scan a file for accessibility issues
 * @param {string} filePath Path to the file
 * @returns {Array} Array of issues
 */
function scanFile(filePath) {
  if (options.verbose) {
    console.log(`Scanning file: ${filePath}`);
  }

  const issues = [];
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileExtension = path.extname(filePath);

  // Check for common accessibility issues based on file type
  if (fileExtension === '.tsx' || fileExtension === '.jsx') {
    // Check for missing accessibility props
    if (
      !fileContent.includes('accessibilityLabel') &&
      (fileContent.includes('<TouchableOpacity') ||
        fileContent.includes('<Button') ||
        fileContent.includes('<Pressable'))
    ) {
      issues.push({
        file: filePath,
        line:
          findLineNumber(fileContent, '<TouchableOpacity') ||
          findLineNumber(fileContent, '<Button') ||
          findLineNumber(fileContent, '<Pressable'),
        criterion: '4.1.2',
        severity: 'error',
        message: 'Interactive element missing accessibilityLabel',
        code: 'missing-accessibility-label',
        suggestion: 'Add accessibilityLabel prop to describe the purpose of this control',
      });
    }

    // Check for color contrast issues (simplified check)
    const colorRegex = /color:\s*['"]#([0-9a-f]{3}|[0-9a-f]{6})['"]/gi;
    let match;
    while ((match = colorRegex.exec(fileContent)) !== null) {
      const color = match[1];
      if (isLowContrast(color)) {
        issues.push({
          file: filePath,
          line: findLineNumber(fileContent, match[0]),
          criterion: '1.4.3',
          severity: 'warning',
          message: 'Potential low contrast text',
          code: 'low-contrast',
          suggestion: 'Ensure text has a contrast ratio of at least 4.5:1',
        });
      }
    }

    // Check for touch target size issues
    if (fileContent.includes('width:') && fileContent.includes('height:')) {
      const smallTouchTargetRegex = /width:\s*(\d+)(px|pt)?.+?height:\s*(\d+)(px|pt)?/gs;
      while ((match = smallTouchTargetRegex.exec(fileContent)) !== null) {
        const width = parseInt(match[1], 10);
        const height = parseInt(match[3], 10);

        if (
          ((width < 44 || height < 44) &&
            fileContent.substring(match.index - 200, match.index).includes('<TouchableOpacity')) ||
          fileContent.substring(match.index - 200, match.index).includes('<Button') ||
          fileContent.substring(match.index - 200, match.index).includes('<Pressable')
        ) {
          issues.push({
            file: filePath,
            line: findLineNumber(fileContent, match[0]),
            criterion: 'M1',
            severity: 'warning',
            message: 'Touch target may be too small',
            code: 'small-touch-target',
            suggestion: 'Ensure touch targets are at least 44x44 points',
          });
        }
      }
    }

    // Check for missing role
    if (fileContent.includes('<View') && !fileContent.includes('accessibilityRole')) {
      // Only flag if it seems like a control element
      if (fileContent.includes('onPress') || fileContent.includes('onLongPress')) {
        issues.push({
          file: filePath,
          line: findLineNumber(fileContent, '<View'),
          criterion: '4.1.2',
          severity: 'warning',
          message: 'Interactive View missing accessibilityRole',
          code: 'missing-accessibility-role',
          suggestion: 'Add accessibilityRole prop to define the role of this control',
        });
      }
    }

    // Check for hardcoded text sizes without accessibility consideration
    if (
      fileContent.includes('fontSize:') &&
      !fileContent.includes('getFontScale') &&
      !fileContent.includes('accessibilityService')
    ) {
      issues.push({
        file: filePath,
        line: findLineNumber(fileContent, 'fontSize:'),
        criterion: '1.4.4',
        severity: 'warning',
        message: "Hardcoded font size may not respect user's text size settings",
        code: 'hardcoded-font-size',
        suggestion:
          'Use accessibilityService.getFontScale() to adjust font sizes based on user preferences',
      });
    }
  }

  return issues;
}

/**
 * Find the line number for a string in file content
 * @param {string} content File content
 * @param {string} searchString String to search for
 * @returns {number|null} Line number or null if not found
 */
function findLineNumber(content, searchString) {
  const index = content.indexOf(searchString);
  if (index === -1) return null;

  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Check if a color has potentially low contrast
 * @param {string} color Hex color code
 * @returns {boolean} Whether the color might have low contrast
 */
function isLowContrast(color) {
  // This is a simplified check - a real implementation would calculate actual contrast ratios
  // against background colors, which requires more context

  // Expand 3-digit hex to 6-digit
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Check if color is potentially low contrast against white or black
  // This is very simplified - real contrast calculation would compare against actual background
  return luminance > 0.4 && luminance < 0.6;
}

/**
 * Scan a directory for accessibility issues
 * @param {string} dirPath Path to the directory
 * @returns {Array} Array of issues
 */
function scanDirectory(dirPath) {
  if (options.verbose) {
    console.log(`Scanning directory: ${dirPath}`);
  }

  let issues = [];

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (file !== 'node_modules' && file !== '.git' && file !== 'build' && file !== 'dist') {
        issues = issues.concat(scanDirectory(filePath));
      }
    } else {
      // Only scan source files
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        issues = issues.concat(scanFile(filePath));
      }
    }
  }

  return issues;
}

/**
 * Generate a report from issues
 * @param {Array} issues Array of issues
 * @returns {Object} Report object
 */
function generateReport(issues) {
  // Group issues by criterion
  const criterionIssues = {};

  wcagCriteria.forEach(criterion => {
    criterionIssues[criterion.id] = {
      name: criterion.name,
      level: criterion.level,
      description: criterion.description,
      issues: [],
    };
  });

  mobileChecks.forEach(check => {
    criterionIssues[check.id] = {
      name: check.name,
      level: 'Mobile',
      description: check.description,
      issues: [],
    };
  });

  // Add issues to their respective criteria
  issues.forEach(issue => {
    if (criterionIssues[issue.criterion]) {
      criterionIssues[issue.criterion].issues.push(issue);
    } else {
      // If criterion doesn't exist, add to 'other'
      if (!criterionIssues.other) {
        criterionIssues.other = {
          name: 'Other Issues',
          level: 'N/A',
          description: 'Issues not mapped to specific WCAG criteria',
          issues: [],
        };
      }
      criterionIssues.other.issues.push(issue);
    }
  });

  // Calculate statistics
  const totalIssues = issues.length;
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;
  const criteriaWithIssues = Object.keys(criterionIssues).filter(
    key => criterionIssues[key].issues.length > 0
  ).length;

  // Generate summary
  const summary = {
    totalIssues,
    errorCount,
    warningCount,
    criteriaWithIssues,
    passRate:
      wcagCriteria.length > 0
        ? Math.round(((wcagCriteria.length - criteriaWithIssues) / wcagCriteria.length) * 100)
        : 0,
    timestamp: new Date().toISOString(),
  };

  return {
    summary,
    criteria: criterionIssues,
    issues,
  };
}

/**
 * Format report as JSON
 * @param {Object} report Report object
 * @returns {string} JSON string
 */
function formatReportAsJson(report) {
  return JSON.stringify(report, null, 2);
}

/**
 * Format report as HTML
 * @param {Object} report Report object
 * @returns {string} HTML string
 */
function formatReportAsHtml(report) {
  const { summary, criteria, issues } = report;

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #0a7ea4; }
    .summary { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary-item { display: inline-block; margin-right: 30px; margin-bottom: 10px; }
    .summary-label { font-weight: bold; }
    .pass-rate { font-size: 24px; font-weight: bold; }
    .criterion { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
    .criterion-header { padding: 15px; background-color: #f9f9f9; border-bottom: 1px solid #ddd; }
    .criterion-name { margin: 0; }
    .criterion-description { margin: 5px 0 0; color: #666; }
    .criterion-level { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-left: 10px; }
    .level-a { background-color: #ffebee; color: #c62828; }
    .level-aa { background-color: #e8f5e9; color: #2e7d32; }
    .level-mobile { background-color: #e3f2fd; color: #1565c0; }
    .issues { padding: 0 15px 15px; }
    .issue { margin-top: 15px; padding: 10px; border-left: 4px solid; }
    .error { border-color: #f44336; background-color: #ffebee; }
    .warning { border-color: #ff9800; background-color: #fff3e0; }
    .issue-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .issue-location { font-family: monospace; color: #666; }
    .issue-message { font-weight: bold; }
    .issue-suggestion { margin-top: 5px; font-style: italic; color: #666; }
    .timestamp { color: #999; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Accessibility Audit Report</h1>
  
  <div class="summary">
    <div class="pass-rate">${summary.passRate}% Pass Rate</div>
    <div class="summary-item"><span class="summary-label">Total Issues:</span> ${summary.totalIssues}</div>
    <div class="summary-item"><span class="summary-label">Errors:</span> ${summary.errorCount}</div>
    <div class="summary-item"><span class="summary-label">Warnings:</span> ${summary.warningCount}</div>
    <div class="summary-item"><span class="summary-label">Criteria with Issues:</span> ${summary.criteriaWithIssues}</div>
  </div>
  
  <h2>Issues by Criterion</h2>
  `;

  // Add criteria with issues
  Object.keys(criteria).forEach(criterionId => {
    const criterion = criteria[criterionId];
    if (criterion.issues.length === 0) return;

    let levelClass = '';
    if (criterion.level === 'A') levelClass = 'level-a';
    else if (criterion.level === 'AA') levelClass = 'level-aa';
    else if (criterion.level === 'Mobile') levelClass = 'level-mobile';

    html += `
  <div class="criterion">
    <div class="criterion-header">
      <h3 class="criterion-name">${criterionId}: ${criterion.name} <span class="criterion-level ${levelClass}">${criterion.level}</span></h3>
      <p class="criterion-description">${criterion.description}</p>
    </div>
    <div class="issues">
    `;

    criterion.issues.forEach(issue => {
      html += `
      <div class="issue ${issue.severity}">
        <div class="issue-header">
          <div class="issue-message">${issue.message}</div>
          <div class="issue-location">${issue.file}:${issue.line}</div>
        </div>
        <div class="issue-suggestion">${issue.suggestion}</div>
      </div>
      `;
    });

    html += `
    </div>
  </div>
    `;
  });

  html += `
  <p class="timestamp">Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
</body>
</html>
  `;

  return html;
}

/**
 * Format report as Markdown
 * @param {Object} report Report object
 * @returns {string} Markdown string
 */
function formatReportAsMarkdown(report) {
  const { summary, criteria, issues } = report;

  let markdown = `# Accessibility Audit Report

## Summary

- **Pass Rate**: ${summary.passRate}%
- **Total Issues**: ${summary.totalIssues}
- **Errors**: ${summary.errorCount}
- **Warnings**: ${summary.warningCount}
- **Criteria with Issues**: ${summary.criteriaWithIssues}

## Issues by Criterion

`;

  // Add criteria with issues
  Object.keys(criteria).forEach(criterionId => {
    const criterion = criteria[criterionId];
    if (criterion.issues.length === 0) return;

    markdown += `### ${criterionId}: ${criterion.name} (${criterion.level})

${criterion.description}

`;

    criterion.issues.forEach(issue => {
      markdown += `- **${issue.severity === 'error' ? 'Error' : 'Warning'}**: ${issue.message}
  - **Location**: ${issue.file}:${issue.line}
  - **Suggestion**: ${issue.suggestion}

`;
    });
  });

  markdown += `\n\n*Generated on ${new Date(summary.timestamp).toLocaleString()}*`;

  return markdown;
}

/**
 * Save report to file
 * @param {Object} report Report object
 * @param {string} outputPath Output file path
 * @param {string} format Output format
 */
function saveReport(report, outputPath, format) {
  let content;

  switch (format) {
    case 'html':
      content = formatReportAsHtml(report);
      break;
    case 'markdown':
      content = formatReportAsMarkdown(report);
      break;
    case 'json':
    default:
      content = formatReportAsJson(report);
      break;
  }

  fs.writeFileSync(outputPath, content);
  console.log(`Report saved to ${outputPath}`);
}

/**
 * Run the accessibility audit
 */
function runAudit() {
  console.log('Running accessibility audit...');
  console.log(`Scope: ${options.scope}`);

  let issues = [];

  // Determine directories to scan based on scope
  const directories = [];

  switch (options.scope) {
    case 'components':
      directories.push('./components');
      break;
    case 'screens':
      directories.push('./screens');
      break;
    case 'navigation':
      directories.push('./navigation');
      break;
    case 'all':
    default:
      directories.push('./components');
      directories.push('./screens');
      directories.push('./navigation');
      directories.push('./services');
      directories.push('./hooks');
      directories.push('./utils');
      break;
  }

  // Scan directories
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      issues = issues.concat(scanDirectory(dir));
    } else {
      console.warn(`Directory not found: ${dir}`);
    }
  });

  // Generate report
  const report = generateReport(issues);

  // Save report
  saveReport(report, options.output, options.format);

  // Print summary
  console.log('\nAudit Summary:');
  console.log(`- Pass Rate: ${report.summary.passRate}%`);
  console.log(`- Total Issues: ${report.summary.totalIssues}`);
  console.log(`- Errors: ${report.summary.errorCount}`);
  console.log(`- Warnings: ${report.summary.warningCount}`);
  console.log(`- Criteria with Issues: ${report.summary.criteriaWithIssues}`);

  // Attempt to fix issues if requested
  if (options.fix) {
    console.log('\nAttempting to fix issues...');
    // This would implement automatic fixes for common issues
    console.log('Automatic fixing not implemented yet');
  }

  console.log('\nAudit completed successfully!');
}

// Run the audit
runAudit();
