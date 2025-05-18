/**
 * Script to update imports from contexts/I18nContext and contexts/LanguageContext
 * to use the atomic versions instead.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the import mappings
const importMappings = {
  '../contexts/I18nContext': '../../atomic/organisms/i18n/I18nContext',
  '../contexts/LanguageContext': '../../atomic/organisms/i18n/LanguageContext',
  '../../contexts/I18nContext': '../../../atomic/organisms/i18n/I18nContext',
  '../../contexts/LanguageContext': '../../../atomic/organisms/i18n/LanguageContext',
  '../../../contexts/I18nContext': '../../../../atomic/organisms/i18n/I18nContext',
  '../../../contexts/LanguageContext': '../../../../atomic/organisms/i18n/LanguageContext',
  'contexts/I18nContext': '../atomic/organisms/i18n/I18nContext',
  'contexts/LanguageContext': '../atomic/organisms/i18n/LanguageContext',
};

// Create a backup directory
const backupDir = path.join(
  __dirname,
  '../backups/context-imports-' + new Date().toISOString().replace(/:/g, '')
);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Find all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'build/**', 'dist/**', 'coverage/**', 'backups/**', 'scripts/**'],
  cwd: path.join(__dirname, '..'),
});

// Process each file
let updatedFiles = 0;
files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  // Skip directories
  if (fs.statSync(filePath).isDirectory()) {
    return;
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${file}: ${error.message}`);
    return;
  }

  let originalContent = content;
  let hasChanges = false;

  // Check for imports from contexts/I18nContext or contexts/LanguageContext
  Object.entries(importMappings).forEach(([oldImport, newImport]) => {
    const importRegex = new RegExp(`(import\\s+[^;]+\\s+from\\s+['"])${oldImport}(['"])`, 'g');
    if (importRegex.test(content)) {
      content = content.replace(importRegex, `$1${newImport}$2`);
      hasChanges = true;
      console.log(`Updated import in ${file}: ${oldImport} -> ${newImport}`);
    }
  });

  // If changes were made, backup the original file and write the updated content
  if (hasChanges) {
    // Create backup
    const backupPath = path.join(backupDir, file);
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }
    fs.writeFileSync(backupPath, originalContent);

    // Write updated content
    fs.writeFileSync(filePath, content);
    updatedFiles++;
  }
});

console.log(`Updated ${updatedFiles} files. Backups saved to ${backupDir}`);
