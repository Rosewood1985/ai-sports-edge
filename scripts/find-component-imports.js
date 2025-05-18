/**
 * Script to find components that import from the traditional components/ path
 * This helps identify which files need to be updated to use the atomic/ path
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Components to look for
const targetComponents = ['ResponsiveText', 'ThemedText', 'ThemedView'];

// Regular expressions to match imports
const importRegexes = targetComponents.map(component => ({
  component,
  regex: new RegExp(
    `import\\s+{[^}]*\\b${component}\\b[^}]*}\\s+from\\s+['"]([^'"]*components[^'"]*)['"](;?)`,
    'g'
  ),
}));

// Function to recursively scan directories
async function scanDirectory(dir) {
  const entries = await readdir(dir);

  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (entry === 'node_modules' || entry === '.git' || entry === 'build' || entry === 'dist') {
          return [];
        }
        return scanDirectory(fullPath);
      } else if (
        stats.isFile() &&
        (fullPath.endsWith('.js') ||
          fullPath.endsWith('.jsx') ||
          fullPath.endsWith('.ts') ||
          fullPath.endsWith('.tsx'))
      ) {
        return [fullPath];
      }
      return [];
    })
  );

  return files.flat();
}

// Function to check a file for imports
async function checkFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const results = [];

    for (const { component, regex } of importRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({
          component,
          importPath: match[1],
          file: filePath,
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Main function
async function main() {
  try {
    console.log('Scanning for component imports...');
    const files = await scanDirectory('.');
    console.log(`Found ${files.length} files to check.`);

    const allResults = [];
    for (const file of files) {
      const results = await checkFile(file);
      allResults.push(...results);
    }

    // Group results by component
    const groupedResults = {};
    for (const result of allResults) {
      if (!groupedResults[result.component]) {
        groupedResults[result.component] = [];
      }
      groupedResults[result.component].push({
        file: result.file,
        importPath: result.importPath,
      });
    }

    // Print results
    console.log('\nResults:');
    for (const component of targetComponents) {
      const results = groupedResults[component] || [];
      console.log(`\n${component}: ${results.length} imports found`);

      if (results.length > 0) {
        console.log('Files:');
        for (const result of results) {
          console.log(`  ${result.file} (imports from ${result.importPath})`);
        }
      }
    }

    // Write results to a file
    const outputPath = 'component-imports-report.md';
    let output = '# Component Imports Report\n\n';
    output += 'This report shows components that import from the traditional components/ path.\n\n';

    for (const component of targetComponents) {
      const results = groupedResults[component] || [];
      output += `## ${component}: ${results.length} imports found\n\n`;

      if (results.length > 0) {
        output += '| File | Import Path |\n';
        output += '| ---- | ----------- |\n';
        for (const result of results) {
          output += `| ${result.file} | ${result.importPath} |\n`;
        }
        output += '\n';
      }
    }

    fs.writeFileSync(outputPath, output);
    console.log(`\nReport written to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
