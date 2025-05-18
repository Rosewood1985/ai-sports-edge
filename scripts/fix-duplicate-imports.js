/**
 * Script to fix duplicate imports that might have been created by the update-component-imports.js script
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Components to check
const componentsToCheck = ['ThemedText', 'ThemedView', 'ResponsiveText'];

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

// Function to fix duplicate imports in a file
async function fixDuplicateImports(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let updated = false;

    for (const component of componentsToCheck) {
      // Check for duplicate imports of the component
      const atomicImportRegex = new RegExp(
        `import\\s+{\\s*${component}\\s*}\\s+from\\s+['"][^'"]*atomic[^'"]*['"]`,
        'g'
      );
      const matches = content.match(atomicImportRegex);

      if (matches && matches.length > 1) {
        // Keep only the first import
        const firstImport = matches[0];
        for (let i = 1; i < matches.length; i++) {
          content = content.replace(matches[i], '');
        }
        updated = true;
      }
    }

    if (updated) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Fixed duplicate imports in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing duplicate imports in ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Scanning for files with duplicate imports...');
    const files = await scanDirectory('.');
    console.log(`Found ${files.length} files to check.`);

    let fixedCount = 0;

    for (const file of files) {
      const fixed = await fixDuplicateImports(file);
      if (fixed) {
        fixedCount++;
      }
    }

    console.log(`\nFixed duplicate imports in ${fixedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
