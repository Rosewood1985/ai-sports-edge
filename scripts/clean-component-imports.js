/**
 * Script to clean up component imports by removing the old imports from ThemedComponents
 * and keeping only the atomic imports
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Function to recursively scan directories
async function scanDirectory(dir) {
  const entries = await readdir(dir);

  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (
          entry === 'node_modules' ||
          entry === '.git' ||
          entry === 'build' ||
          entry === 'dist' ||
          entry === 'backups'
        ) {
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

// Function to clean up imports in a file
async function cleanImports(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let updated = false;

    // Check for old imports from ThemedComponents
    const oldImportRegex =
      /import\s+{\s*(?:ThemedText|ThemedView)(?:\s*,\s*(?:ThemedText|ThemedView))?\s*}\s+from\s+['"][^'"]*components\/ThemedComponents['"];?/g;

    if (oldImportRegex.test(content)) {
      // Check if the file already has the new atomic imports
      const hasThemedTextImport =
        /import\s+{\s*ThemedText\s*}\s+from\s+['"][^'"]*atomic\/atoms\/ThemedText['"];?/.test(
          content
        );
      const hasThemedViewImport =
        /import\s+{\s*ThemedView\s*}\s+from\s+['"][^'"]*atomic\/atoms\/ThemedView['"];?/.test(
          content
        );

      // Remove the old import if the new imports are present
      if (hasThemedTextImport && hasThemedViewImport) {
        content = content.replace(oldImportRegex, '');
        updated = true;
      }
    }

    // Remove commented out duplicate imports
    const commentedImportRegex = /\/\/\s*Removed duplicate import/g;
    if (commentedImportRegex.test(content)) {
      content = content.replace(commentedImportRegex, '');
      updated = true;
    }

    if (updated) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Cleaned imports in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error cleaning imports in ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Scanning for files with imports to clean...');
    const files = await scanDirectory('.');
    console.log(`Found ${files.length} files to check.`);

    let cleanedCount = 0;

    for (const file of files) {
      const cleaned = await cleanImports(file);
      if (cleaned) {
        cleanedCount++;
      }
    }

    console.log(`\nCleaned imports in ${cleanedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
