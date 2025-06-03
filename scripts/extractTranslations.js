/**
 * Translation Key Extractor
 *
 * This script scans the codebase for translation keys used with the t() function
 * and generates a report of all keys found. It can also check for missing translations
 * in the translation files.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Directories to scan
const DIRS_TO_SCAN = ['components', 'screens', 'navigation'];

// Translation files
const TRANSLATION_FILES = {
  en: path.join(__dirname, '../translations/en.json'),
  es: path.join(__dirname, '../translations/es.json'),
};

// Output file for the report
const REPORT_FILE = path.join(__dirname, '../translations/report.md');

// Regular expression to match translation keys
// This matches t('key'), t("key"), and t(`key`)
const TRANSLATION_KEY_REGEX = /t\(\s*['"`]([^'"`]+)['"`]/g;

/**
 * Recursively scan a directory for files
 */
async function scanDirectory(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract translation keys from a file
 */
async function extractKeysFromFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  const keys = new Set();
  let match;

  while ((match = TRANSLATION_KEY_REGEX.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys);
}

/**
 * Load a translation file
 */
async function loadTranslationFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Check if a translation key exists in a translation object
 */
function hasTranslation(translations, key) {
  const parts = key.split('.');
  let current = translations;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }

  return true;
}

/**
 * Generate a report of translation keys
 */
async function generateReport(keys, translations) {
  let report = '# Translation Keys Report\n\n';
  report += `Generated on ${new Date().toLocaleString()}\n\n`;
  report += `Total unique keys found: ${keys.length}\n\n`;

  // Check for missing translations
  const missingTranslations = {};

  for (const [lang, trans] of Object.entries(translations)) {
    missingTranslations[lang] = [];

    for (const key of keys) {
      if (!hasTranslation(trans, key)) {
        missingTranslations[lang].push(key);
      }
    }

    report += `## Missing in ${lang.toUpperCase()}: ${missingTranslations[lang].length}\n\n`;

    if (missingTranslations[lang].length > 0) {
      report += '```\n';
      for (const key of missingTranslations[lang]) {
        report += `${key}\n`;
      }
      report += '```\n\n';
    }
  }

  // List all keys
  report += '## All Keys\n\n';
  report += '```\n';
  for (const key of keys.sort()) {
    report += `${key}\n`;
  }
  report += '```\n';

  return report;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Scanning codebase for translation keys...');

    // Scan directories for files
    const files = [];
    for (const dir of DIRS_TO_SCAN) {
      const dirPath = path.join(__dirname, '..', dir);
      try {
        const dirStat = await stat(dirPath);
        if (dirStat.isDirectory()) {
          const dirFiles = await scanDirectory(dirPath);
          files.push(...dirFiles);
        }
      } catch (error) {
        console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
      }
    }

    console.log(`Found ${files.length} files to scan.`);

    // Extract keys from files
    const allKeys = new Set();
    for (const file of files) {
      const keys = await extractKeysFromFile(file);
      for (const key of keys) {
        allKeys.add(key);
      }
    }

    console.log(`Found ${allKeys.size} unique translation keys.`);

    // Load translation files
    const translations = {};
    for (const [lang, filePath] of Object.entries(TRANSLATION_FILES)) {
      translations[lang] = await loadTranslationFile(filePath);
    }

    // Generate report
    const report = await generateReport(Array.from(allKeys), translations);
    await writeFile(REPORT_FILE, report, 'utf8');

    console.log(`Report generated at ${REPORT_FILE}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
