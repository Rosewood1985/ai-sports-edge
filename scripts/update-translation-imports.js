/**
 * Script to update translation imports to use the atomic structure
 *
 * This script searches for imports from the old translations directory
 * and updates them to use the new atomic structure.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Backup directory
const backupDir = path.join(
  'backups',
  `translations-imports-${new Date().toISOString().replace(/:/g, '')}`
);

// Create backup directory
fs.mkdirSync(backupDir, { recursive: true });

// Find files that import from the translations directory
console.log('Searching for files that import from the translations directory...');
const grepCommand =
  "grep -r \"from '../translations/\" --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js' . | grep -v 'node_modules' | grep -v 'atomic/organisms/i18n'";

try {
  const grepOutput = execSync(grepCommand, { encoding: 'utf8' });
  const filesToUpdate = new Set();

  grepOutput.split('\n').forEach(line => {
    if (line.trim() === '') return;

    const filePath = line.split(':')[0];
    if (filePath && !filePath.includes('node_modules')) {
      filesToUpdate.add(filePath);
    }
  });

  console.log(`Found ${filesToUpdate.size} files to update.`);

  // Update each file
  filesToUpdate.forEach(filePath => {
    try {
      console.log(`Processing ${filePath}...`);

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');

      // Create backup
      const backupPath = path.join(backupDir, filePath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.writeFileSync(backupPath, content);

      // Update imports
      let updatedContent = content;

      // Update direct imports of translation files
      updatedContent = updatedContent.replace(
        /from ['"]\.\.\/translations\/([^'"]+)['"]/,
        "from 'atomic/atoms/translations/$1'"
      );

      // Update imports of multiple translation files
      updatedContent = updatedContent.replace(
        /from ['"]\.\.\/translations['"]/,
        "from 'atomic/atoms/translations'"
      );

      // Write updated content
      fs.writeFileSync(filePath, updatedContent);

      console.log(`Updated ${filePath}`);
    } catch (err) {
      console.error(`Error updating ${filePath}:`, err);
    }
  });

  console.log('Done updating translation imports.');
  console.log(`Backup created in ${backupDir}`);
} catch (err) {
  console.error('Error searching for files:', err);
}
