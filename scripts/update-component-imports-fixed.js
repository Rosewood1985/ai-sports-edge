/**
 * Script to update component imports from traditional components/ path to atomic/ path
 * This script will update import statements in files to use the atomic versions of components
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Components to update
const componentsToUpdate = [
  {
    name: 'ThemedText',
    oldPaths: [
      '@/components/ThemedText',
      '../components/ThemedText',
      '../../components/ThemedText',
      '../components/ThemedComponents',
      '../../components/ThemedComponents',
    ],
    newPath: '../atomic/atoms/ThemedText',
  },
  {
    name: 'ThemedView',
    oldPaths: [
      '@/components/ThemedView',
      '../components/ThemedView',
      '../../components/ThemedView',
      '../components/ThemedComponents',
      '../../components/ThemedComponents',
    ],
    newPath: '../atomic/atoms/ThemedView',
  },
  {
    name: 'ResponsiveText',
    oldPaths: [
      '@/components/ResponsiveText',
      '../components/ResponsiveText',
      '../../components/ResponsiveText',
    ],
    newPath: '../atomic/atoms/ResponsiveText',
  },
];

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

// Function to update imports in a file
async function updateImports(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let updated = false;

    for (const component of componentsToUpdate) {
      for (const oldPath of component.oldPaths) {
        // Match import statements for the component
        const importRegex = new RegExp(
          `import\\s+{([^}]*\\b${component.name}\\b[^}]*)}\\s+from\\s+['"]${oldPath}['"]`,
          'g'
        );

        if (importRegex.test(content)) {
          // Reset regex lastIndex
          importRegex.lastIndex = 0;

          // Replace the import statement
          content = content.replace(importRegex, (match, importedComponents) => {
            // Check if other components are imported from the same path
            const otherComponents = importedComponents
              .split(',')
              .map(comp => comp.trim())
              .filter(comp => !comp.includes(component.name));

            // If there are other components, keep the original import and add a new import for the component
            if (otherComponents.length > 0) {
              const newImport = `import { ${component.name} } from '${component.newPath}'`;
              return `${match}\n${newImport}`;
            }

            // Otherwise, replace the import with the new path
            return `import { ${importedComponents} } from '${component.newPath}'`;
          });

          updated = true;
        }
      }
    }

    if (updated) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Updated imports in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Scanning for files to update...');
    const files = await scanDirectory('.');
    console.log(`Found ${files.length} files to check.`);

    let updatedCount = 0;

    for (const file of files) {
      const updated = await updateImports(file);
      if (updated) {
        updatedCount++;
      }
    }

    console.log(`\nUpdated imports in ${updatedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
