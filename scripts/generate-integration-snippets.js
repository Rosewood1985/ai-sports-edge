/**
 * Integration Snippets Generator
 *
 * This script generates code snippets for integrating:
 * 1. ThemeToggle component into identified screens
 * 2. Enhanced API service with caching into existing code
 *
 * Usage: node scripts/generate-integration-snippets.js [report-path]
 *
 * If report-path is not provided, it defaults to 'integration-points-report.md'
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Configuration
const ROOT_DIR = process.cwd();
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'integration-points-report.md');

// Snippet templates
const SNIPPETS = {
  themeToggle: {
    settingsScreen: `
// Import the ThemeToggle component
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your settings section in the render method
<View style={styles.settingItem}>
  <Text style={styles.settingLabel}>Dark Mode</Text>
  <ThemeToggle variant="switch" />
</View>
`,
    themeContext: `
// Import the useTheme hook
import { useTheme } from 'atomic/molecules/themeContext';

// Inside your component
const { effectiveTheme } = useTheme();
const isDarkMode = effectiveTheme === 'dark';

// Update your styles to use the theme
const dynamicStyles = {
  container: {
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
  },
  text: {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
};
`,
    navigationHeader: `
// In your navigation configuration
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your header right component
headerRight: () => (
  <ThemeToggle 
    variant="icon" 
    style={{ 
      marginRight: 16,
      backgroundColor: 'transparent',
    }}
  />
),
`,
  },
  apiService: {
    directApiCall: `
// Before:
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchData = async () => {
  try {
    // The apiService will automatically use cache if available
    const data = await apiService.makeRequest('/endpoint');
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
`,
    existingApiService: `
// Before:
import { OddsService } from 'services/OddsService';

const fetchOdds = async () => {
  try {
    const odds = await OddsService.getOdds(gameId);
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchOdds = async () => {
  try {
    // The apiService will automatically use cache if available
    const odds = await apiService.makeRequest('/odds', { gameId });
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};
`,
    cacheInvalidation: `
// After a data mutation (POST, PUT, DELETE), invalidate the cache
import { apiService } from 'atomic/organisms';

const updateData = async () => {
  try {
    // Make the update request
    await apiService.makeRequest('/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate the cache for this endpoint
    await apiService.clearCache('/endpoint');
    
    // Optionally, refetch the data
    const updatedData = await apiService.makeRequest('/endpoint');
    setData(updatedData);
  } catch (error) {
    console.error('Error updating data:', error);
  }
};
`,
  },
};

/**
 * Parse the integration points report
 */
async function parseReport(reportPath) {
  try {
    const content = await readFile(reportPath, 'utf8');

    // Extract sections
    const themeToggleSection =
      content.match(
        /## ThemeToggle Component Integration Points([\s\S]*?)(?=## Enhanced API Service Integration Points|$)/
      )?.[1] || '';
    const apiServiceSection =
      content.match(
        /## Enhanced API Service Integration Points([\s\S]*?)(?=## Integration Recommendations|$)/
      )?.[1] || '';

    // Extract files
    const themeToggleFiles = {
      potentialScreens: extractFiles(
        themeToggleSection,
        /### Potential Screens for ThemeToggle([\s\S]*?)(?=###|$)/
      ),
      themeUsageWithoutContext: extractFiles(
        themeToggleSection,
        /### Components Using Theme Without Context([\s\S]*?)(?=###|$)/
      ),
    };

    const apiServiceFiles = {
      directApiCalls: extractFiles(apiServiceSection, /### Direct API Calls([\s\S]*?)(?=###|$)/),
      existingApiServices: extractFiles(
        apiServiceSection,
        /### Existing API Services([\s\S]*?)(?=###|$)/
      ),
    };

    return {
      themeToggle: themeToggleFiles,
      apiService: apiServiceFiles,
    };
  } catch (error) {
    console.error(`Error parsing report ${reportPath}:`, error.message);
    return {
      themeToggle: { potentialScreens: [], themeUsageWithoutContext: [] },
      apiService: { directApiCalls: [], existingApiServices: [] },
    };
  }
}

/**
 * Extract files from a section
 */
function extractFiles(section, pattern) {
  const subsection = section.match(pattern)?.[1] || '';
  const fileMatches = subsection.matchAll(/\*\*(.*?)\*\*:/g);

  return Array.from(fileMatches).map(match => match[1].trim());
}

/**
 * Generate integration snippets
 */
function generateSnippets(files) {
  let output = '# Integration Snippets\n\n';

  // Theme Toggle Snippets
  output += '## ThemeToggle Component Integration\n\n';

  if (files.themeToggle.potentialScreens.length > 0) {
    output += '### Settings Screen Integration\n\n';
    output += 'Add the ThemeToggle component to your settings screen:\n\n';
    output += '```jsx\n' + SNIPPETS.themeToggle.settingsScreen.trim() + '\n```\n\n';

    output += 'Files to update:\n\n';
    files.themeToggle.potentialScreens.forEach(file => {
      output += `- \`${file}\`\n`;
    });
    output += '\n';
  }

  if (files.themeToggle.themeUsageWithoutContext.length > 0) {
    output += '### Theme Context Integration\n\n';
    output += 'Update components to use the theme context:\n\n';
    output += '```jsx\n' + SNIPPETS.themeToggle.themeContext.trim() + '\n```\n\n';

    output += 'Files to update:\n\n';
    files.themeToggle.themeUsageWithoutContext.forEach(file => {
      output += `- \`${file}\`\n`;
    });
    output += '\n';
  }

  output += '### Navigation Header Integration\n\n';
  output += 'Add the ThemeToggle component to your navigation header:\n\n';
  output += '```jsx\n' + SNIPPETS.themeToggle.navigationHeader.trim() + '\n```\n\n';

  // API Service Snippets
  output += '## Enhanced API Service Integration\n\n';

  if (files.apiService.directApiCalls.length > 0) {
    output += '### Direct API Calls Integration\n\n';
    output += 'Replace direct API calls with the enhanced apiService:\n\n';
    output += '```jsx\n' + SNIPPETS.apiService.directApiCall.trim() + '\n```\n\n';

    output += 'Files to update:\n\n';
    files.apiService.directApiCalls.forEach(file => {
      output += `- \`${file}\`\n`;
    });
    output += '\n';
  }

  if (files.apiService.existingApiServices.length > 0) {
    output += '### Existing API Services Integration\n\n';
    output += 'Update existing API services to use the enhanced apiService:\n\n';
    output += '```jsx\n' + SNIPPETS.apiService.existingApiService.trim() + '\n```\n\n';

    output += 'Files to update:\n\n';
    files.apiService.existingApiServices.forEach(file => {
      output += `- \`${file}\`\n`;
    });
    output += '\n';
  }

  output += '### Cache Invalidation\n\n';
  output += 'Add cache invalidation after data mutations:\n\n';
  output += '```jsx\n' + SNIPPETS.apiService.cacheInvalidation.trim() + '\n```\n\n';

  output += '## Integration Strategy\n\n';
  output += '1. Start with high-impact, low-risk changes\n';
  output += '2. Test each integration thoroughly before moving to the next\n';
  output += '3. Consider creating a separate branch for each integration\n';
  output += '4. Update tests to reflect the new implementations\n';
  output += '5. Document any issues or edge cases encountered during integration\n';

  return output;
}

/**
 * Main function
 */
async function main() {
  try {
    // Get report path from command line args or use default
    const reportPath = process.argv[2] || DEFAULT_REPORT_PATH;

    console.log(`Parsing integration points report from ${reportPath}...`);

    // Check if report exists
    if (!fs.existsSync(reportPath)) {
      console.error(`Report file not found: ${reportPath}`);
      console.error(
        'Please run scripts/identify-integration-points.js first to generate the report.'
      );
      process.exit(1);
    }

    // Parse report
    const files = await parseReport(reportPath);

    // Generate snippets
    const snippets = generateSnippets(files);

    // Write snippets to file
    const outputPath = path.join(ROOT_DIR, 'integration-snippets.md');
    await writeFile(outputPath, snippets);

    console.log(`Integration snippets generated and written to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();
