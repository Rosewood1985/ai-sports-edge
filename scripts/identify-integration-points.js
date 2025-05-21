/**
 * Integration Points Identification Script
 *
 * This script scans the codebase to identify potential integration points for:
 * 1. ThemeToggle component
 * 2. Enhanced API service with caching
 *
 * Usage: node scripts/identify-integration-points.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

// Configuration
const ROOT_DIR = process.cwd();
const DIRS_TO_SCAN = ['screens', 'components', 'services', 'hooks', 'atomic'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'build', 'dist', 'coverage'];
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to search for
const PATTERNS = {
  themeToggle: {
    settingsScreen: /SettingsScreen|settings/i,
    themeUsage: /theme|dark|light|mode|style|color/i,
    themeContext: /useTheme|ThemeContext|themeContext/i,
    styleConditionals: /(isDark|darkMode|theme\s*===\s*['"]dark['"]|theme\s*==\s*['"]dark['"])/i,
  },
  apiService: {
    directApiCalls: /(fetch\s*\(|axios\.|\.get\s*\(|\.post\s*\(|\.put\s*\(|\.delete\s*\()/i,
    existingApiServices:
      /(apiService|OddsService|SportsService|UserService|AuthService|DataService)/i,
    cachingRelated: /(cache|cached|caching|stale|fresh|ttl|expir)/i,
  },
};

// Results storage
const results = {
  themeToggle: {
    potentialScreens: [],
    themeUsageWithoutContext: [],
  },
  apiService: {
    directApiCalls: [],
    existingApiServices: [],
  },
};

/**
 * Recursively scan directories for files
 */
async function scanDirectory(dir) {
  const entries = await readdir(dir);

  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry)) {
          return scanDirectory(fullPath);
        }
        return [];
      } else {
        const ext = path.extname(fullPath);
        if (FILE_EXTENSIONS.includes(ext)) {
          return fullPath;
        }
        return null;
      }
    })
  );

  return files.flat().filter(Boolean);
}

/**
 * Analyze file content for integration points
 */
async function analyzeFile(filePath) {
  try {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const content = await readFile(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // Check for theme toggle integration points
    if (
      PATTERNS.themeToggle.settingsScreen.test(fileName) ||
      PATTERNS.themeToggle.settingsScreen.test(relativePath)
    ) {
      results.themeToggle.potentialScreens.push({
        file: relativePath,
        reason: 'Settings related screen',
      });
    }

    // Check for theme usage without context
    if (
      PATTERNS.themeToggle.themeUsage.test(content) &&
      PATTERNS.themeToggle.styleConditionals.test(content) &&
      !PATTERNS.themeToggle.themeContext.test(content)
    ) {
      results.themeToggle.themeUsageWithoutContext.push({
        file: relativePath,
        reason: 'Uses theme-related styling but might not use theme context',
        snippet: extractSnippet(content, PATTERNS.themeToggle.styleConditionals),
      });
    }

    // Check for direct API calls
    if (
      PATTERNS.apiService.directApiCalls.test(content) &&
      !PATTERNS.apiService.existingApiServices.test(content)
    ) {
      results.apiService.directApiCalls.push({
        file: relativePath,
        reason: 'Contains direct API calls that could use caching',
        snippet: extractSnippet(content, PATTERNS.apiService.directApiCalls),
      });
    }

    // Check for existing API services
    if (
      PATTERNS.apiService.existingApiServices.test(content) &&
      !content.includes('atomic/organisms/api') &&
      !content.includes('atomic/organisms')
    ) {
      results.apiService.existingApiServices.push({
        file: relativePath,
        reason: 'Uses existing API services that could be updated to use the new apiService',
        snippet: extractSnippet(content, PATTERNS.apiService.existingApiServices),
      });
    }
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error.message);
  }
}

/**
 * Extract a code snippet around the matched pattern
 */
function extractSnippet(content, pattern) {
  const match = content.match(pattern);
  if (!match || !match.index) return 'No snippet available';

  const startIndex = Math.max(0, match.index - 100);
  const endIndex = Math.min(content.length, match.index + match[0].length + 100);

  return content
    .substring(startIndex, endIndex)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Format results for console output
 */
function formatResults() {
  let output = '# Integration Points Identification Report\n\n';

  // Theme Toggle Integration Points
  output += '## ThemeToggle Component Integration Points\n\n';

  output += '### Potential Screens for ThemeToggle\n\n';
  if (results.themeToggle.potentialScreens.length === 0) {
    output += 'No potential screens identified.\n\n';
  } else {
    results.themeToggle.potentialScreens.forEach(item => {
      output += `- **${item.file}**: ${item.reason}\n`;
    });
    output += '\n';
  }

  output += '### Components Using Theme Without Context\n\n';
  if (results.themeToggle.themeUsageWithoutContext.length === 0) {
    output += 'No components identified.\n\n';
  } else {
    results.themeToggle.themeUsageWithoutContext.forEach(item => {
      output += `- **${item.file}**: ${item.reason}\n`;
      output += '  ```\n';
      output += `  ${item.snippet.split('\n').join('\n  ')}\n`;
      output += '  ```\n\n';
    });
  }

  // API Service Integration Points
  output += '## Enhanced API Service Integration Points\n\n';

  output += '### Direct API Calls\n\n';
  if (results.apiService.directApiCalls.length === 0) {
    output += 'No direct API calls identified.\n\n';
  } else {
    results.apiService.directApiCalls.forEach(item => {
      output += `- **${item.file}**: ${item.reason}\n`;
      output += '  ```\n';
      output += `  ${item.snippet.split('\n').join('\n  ')}\n`;
      output += '  ```\n\n';
    });
  }

  output += '### Existing API Services\n\n';
  if (results.apiService.existingApiServices.length === 0) {
    output += 'No existing API services identified.\n\n';
  } else {
    results.apiService.existingApiServices.forEach(item => {
      output += `- **${item.file}**: ${item.reason}\n`;
      output += '  ```\n';
      output += `  ${item.snippet.split('\n').join('\n  ')}\n`;
      output += '  ```\n\n';
    });
  }

  output += '## Integration Recommendations\n\n';

  // Theme Toggle Recommendations
  output += '### ThemeToggle Component\n\n';
  output +=
    '1. Add the ThemeToggle component to the SettingsScreen or create a dedicated AppearanceScreen\n';
  output += '2. Update components using theme-related styling to use the theme context\n';
  output += "3. Consider adding a theme toggle to the app's header or navigation drawer\n\n";

  // API Service Recommendations
  output += '### Enhanced API Service\n\n';
  output += '1. Replace direct API calls with the new apiService\n';
  output += '2. Update existing API services to use the new apiService internally\n';
  output += '3. Add cache invalidation after data mutations (POST, PUT, DELETE operations)\n';
  output += '4. Configure cache TTL for different endpoints based on data update frequency\n\n';

  return output;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Scanning codebase for integration points...');

    // Get all files to scan
    let filesToScan = [];
    for (const dir of DIRS_TO_SCAN) {
      const dirPath = path.join(ROOT_DIR, dir);
      if (fs.existsSync(dirPath)) {
        const files = await scanDirectory(dirPath);
        filesToScan = filesToScan.concat(files);
      }
    }

    console.log(`Found ${filesToScan.length} files to analyze.`);

    // Analyze each file
    for (const file of filesToScan) {
      await analyzeFile(file);
    }

    // Format and write results
    const formattedResults = formatResults();
    const outputPath = path.join(ROOT_DIR, 'integration-points-report.md');
    fs.writeFileSync(outputPath, formattedResults);

    console.log(`Analysis complete. Report written to ${outputPath}`);
    console.log('\nSummary:');
    console.log(
      `- ThemeToggle: ${results.themeToggle.potentialScreens.length} potential screens, ${results.themeToggle.themeUsageWithoutContext.length} components using theme without context`
    );
    console.log(
      `- API Service: ${results.apiService.directApiCalls.length} direct API calls, ${results.apiService.existingApiServices.length} existing API services`
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();
