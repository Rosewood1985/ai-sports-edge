/**
 * Merge Translations Script
 * 
 * This script merges the error updates into the main Spanish translation file.
 * It ensures that all error messages are properly translated in both English and Spanish.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// File paths
const basePath = path.join(__dirname, '..');
const spanishFilePath = path.join(basePath, 'translations', 'es.json');
const updatesFilePath = path.join(basePath, 'translations', 'es-error-updates.json');
const backupFilePath = path.join(basePath, 'translations', 'es.json.bak');

// Log header
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  Merging Spanish Translation Updates${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log();

try {
  // Read the files
  console.log(`${colors.yellow}Reading translation files...${colors.reset}`);
  
  // Check if files exist
  if (!fs.existsSync(spanishFilePath)) {
    throw new Error(`Spanish translation file not found: ${spanishFilePath}`);
  }
  
  if (!fs.existsSync(updatesFilePath)) {
    throw new Error(`Updates file not found: ${updatesFilePath}`);
  }
  
  // Read and parse the files
  const spanishContent = fs.readFileSync(spanishFilePath, 'utf8');
  const updatesContent = fs.readFileSync(updatesFilePath, 'utf8');
  
  const spanishTranslations = JSON.parse(spanishContent);
  const updatesTranslations = JSON.parse(updatesContent);
  
  console.log(`${colors.green}Files read successfully.${colors.reset}`);
  
  // Create a backup of the original file
  console.log(`${colors.yellow}Creating backup of Spanish translation file...${colors.reset}`);
  fs.writeFileSync(backupFilePath, spanishContent);
  console.log(`${colors.green}Backup created: ${backupFilePath}${colors.reset}`);
  
  // Merge the translations
  console.log(`${colors.yellow}Merging translations...${colors.reset}`);
  
  // Helper function to deep merge objects
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && key in target) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  
  // Perform the merge
  const mergedTranslations = deepMerge(spanishTranslations, updatesTranslations);
  
  // Write the merged translations back to the Spanish file
  console.log(`${colors.yellow}Writing merged translations to file...${colors.reset}`);
  fs.writeFileSync(spanishFilePath, JSON.stringify(mergedTranslations, null, 2));
  
  console.log(`${colors.green}Translations merged successfully!${colors.reset}`);
  console.log();
  
  // Log summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`- Original Spanish translations backed up to: ${backupFilePath}`);
  console.log(`- Error updates merged into: ${spanishFilePath}`);
  console.log();
  
  // Log sections updated
  console.log(`${colors.bright}Sections updated:${colors.reset}`);
  Object.keys(updatesTranslations).forEach(section => {
    console.log(`- ${section}: ${Object.keys(updatesTranslations[section]).length} entries`);
  });
  
} catch (error) {
  console.error(`${colors.red}Error merging translations:${colors.reset}`, error.message);
  console.error(error.stack);
}

// Log footer
console.log();
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}  Translation Merge Complete${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=======================================${colors.reset}`);