#!/usr/bin/env node

/**
 * Firebase Atomic Architecture Migration Script
 * 
 * This script helps automate the migration of files to use the consolidated Firebase service
 * with support for targeting specific directories and limiting the number of files processed.
 * 
 * Usage:
 *   node scripts/migrate-firebase-atomic.js [options]
 * 
 * Options:
 *   --directory=<path>   Target a specific directory (e.g., hooks, components)
 *   --limit=<number>     Limit the number of files to process
 *   --dry-run            Show what would be migrated without making changes
 *   --help               Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  directory: '.',
  limit: Infinity,
  dryRun: false,
  help: false
};

// Parse arguments
args.forEach(arg => {
  if (arg.startsWith('--directory=')) {
    options.directory = arg.split('=')[1];
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--help') {
    options.help = true;
  }
});

// Show help message
if (options.help) {
  console.log(`
Firebase Atomic Architecture Migration Script

Usage:
  node scripts/migrate-firebase-atomic.js [options]

Options:
  --directory=<path>   Target a specific directory (e.g., hooks, components)
  --limit=<number>     Limit the number of files to process
  --dry-run            Show what would be migrated without making changes
  --help               Show this help message

Examples:
  node scripts/migrate-firebase-atomic.js --directory=hooks --limit=5
  node scripts/migrate-firebase-atomic.js --directory=components --dry-run
  `);
  process.exit(0);
}

// Log file paths
const LOG_DIR = 'status';
const LOG_FILE = path.join(LOG_DIR, 'firebase-atomic-migration.log');
const SUMMARY_FILE = path.join(LOG_DIR, 'firebase-atomic-migration-summary.md');

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log file
if (!options.dryRun) {
  fs.writeFileSync(LOG_FILE, `# Firebase Atomic Architecture Migration Log\nStarted migration at ${new Date().toISOString()}\n\n`);
  fs.writeFileSync(SUMMARY_FILE, `# Firebase Atomic Architecture Migration Summary\nLast updated: ${new Date().toISOString()}\n\n## Progress\n\n`);
}

// Function to log messages
function logMessage(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
  if (!options.dryRun) {
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} - ${message}\n`);
  }
}

// Function to update summary
function updateSummary() {
  if (options.dryRun) return;

  try {
    // Count total files that need migration
    const totalFilesCmd = `grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | wc -l`;
    const totalFiles = parseInt(execSync(totalFilesCmd, { encoding: 'utf8' }).trim(), 10);
    
    // Count migrated files (files that import from atomic architecture)
    const migratedFilesCmd = `grep -r "import.*firebaseService.*from.*atomic" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | wc -l`;
    const migratedFiles = parseInt(execSync(migratedFilesCmd, { encoding: 'utf8' }).trim(), 10);
    
    // Calculate percentage
    const percentage = Math.round((migratedFiles / totalFiles) * 100);
    
    // Create temporary summary file
    const tempSummaryFile = `${SUMMARY_FILE}.tmp`;
    let summaryContent = `# Firebase Atomic Architecture Migration Summary\nLast updated: ${new Date().toISOString()}\n\n`;
    summaryContent += `## Progress\n\n`;
    summaryContent += `- Total files requiring migration: ${totalFiles}\n`;
    summaryContent += `- Files migrated: ${migratedFiles}\n`;
    summaryContent += `- Progress: ${percentage}%\n\n`;
    
    // Add recently migrated files
    summaryContent += `## Recently Migrated Files\n\n`;
    const recentlyMigratedCmd = `tail -n 10 "${LOG_FILE}" | grep "Migrated" | sed 's/.*Migrated /- /'`;
    try {
      const recentlyMigrated = execSync(recentlyMigratedCmd, { encoding: 'utf8' });
      summaryContent += recentlyMigrated;
    } catch (error) {
      summaryContent += "- No files migrated yet\n";
    }
    summaryContent += '\n';
    
    // Add files still needing migration
    summaryContent += `## Files Still Needing Migration\n\n`;
    const filesToMigrateCmd = `grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive" | grep -v "atomic" | head -n 20 | sed 's/\\(.*\\):\\(.*\\)/- \\1/'`;
    try {
      const filesToMigrate = execSync(filesToMigrateCmd, { encoding: 'utf8' });
      summaryContent += filesToMigrate;
    } catch (error) {
      summaryContent += "- No files found that need migration\n";
    }
    
    // Write to temporary file and replace the original
    fs.writeFileSync(tempSummaryFile, summaryContent);
    fs.renameSync(tempSummaryFile, SUMMARY_FILE);
    
    logMessage(`Updated migration summary: ${migratedFiles}/${totalFiles} files (${percentage}%)`);
  } catch (error) {
    logMessage(`Error updating summary: ${error.message}`, colors.red);
  }
}

// Function to migrate a file
function migrateFile(filePath) {
  if (options.dryRun) {
    logMessage(`[DRY RUN] Would migrate: ${filePath}`, colors.yellow);
    return;
  }

  logMessage(`Migrating ${filePath}...`, colors.yellow);
  
  try {
    // Create backup
    const backupFile = `${filePath}.bak`;
    fs.copyFileSync(filePath, backupFile);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add firebaseService import if not already present
    if (!content.includes('import { firebaseService }')) {
      content = content.replace(
        /import.*from/,
        `import { firebaseService } from '../src/atomic/organisms/firebaseService';\nimport`
      );
    }
    
    // Replace direct Firebase imports
    content = content
      .replace(/import { getAuth.* } from ['"]firebase\/auth['"];/g, '// Replaced with firebaseService')
      .replace(/import { getFirestore.* } from ['"]firebase\/firestore['"];/g, '// Replaced with firebaseService')
      .replace(/import { getFunctions.* } from ['"]firebase\/functions['"];/g, '// Replaced with firebaseService')
      .replace(/import { getStorage.* } from ['"]firebase\/storage['"];/g, '// Replaced with firebaseService')
      .replace(/import { getAnalytics.* } from ['"]firebase\/analytics['"];/g, '// Replaced with firebaseService');
    
    // Replace direct Firebase method calls
    content = content
      .replace(/getAuth\(\)/g, 'firebaseService.auth.instance')
      .replace(/getFirestore\(\)/g, 'firebaseService.firestore.instance')
      .replace(/getFunctions\(\)/g, 'firebaseService.functions.instance')
      .replace(/getStorage\(\)/g, 'firebaseService.storage.instance')
      .replace(/getAnalytics\(\)/g, 'firebaseService.analytics.instance')
      
      // Replace common Firestore methods
      .replace(/collection\(/g, 'firebaseService.firestore.collection(')
      .replace(/doc\(/g, 'firebaseService.firestore.doc(')
      .replace(/query\(/g, 'firebaseService.firestore.query(')
      .replace(/where\(/g, 'firebaseService.firestore.where(')
      .replace(/orderBy\(/g, 'firebaseService.firestore.orderBy(')
      .replace(/limit\(/g, 'firebaseService.firestore.limit(');
    
    // Write updated content back to file
    fs.writeFileSync(filePath, content);
    
    // Log the migration
    logMessage(`Migrated ${filePath} successfully`, colors.green);
    
    // Update summary
    updateSummary();
  } catch (error) {
    logMessage(`Error migrating ${filePath}: ${error.message}`, colors.red);
  }
}

// Function to find files that need migration
function findFilesToMigrate() {
  logMessage(`Searching for files that need migration in ${options.directory}...`, colors.blue);
  
  try {
    // Find files that import Firebase directly
    const cmd = `grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" ${options.directory} | grep -v "node_modules" | grep -v "archive" | grep -v "atomic" | cut -d: -f1 | sort -u`;
    const files = execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    
    logMessage(`Found ${files.length} files that need migration`, colors.blue);
    
    return files;
  } catch (error) {
    logMessage(`Error finding files to migrate: ${error.message}`, colors.red);
    return [];
  }
}

// Main execution
async function main() {
  logMessage(`Starting Firebase Atomic Architecture Migration${options.dryRun ? ' (DRY RUN)' : ''}`, colors.green);
  
  // Find files to migrate
  const filesToMigrate = findFilesToMigrate();
  
  if (filesToMigrate.length === 0) {
    logMessage('No files found that need migration', colors.yellow);
    return;
  }
  
  // Apply limit
  const filesToProcess = filesToMigrate.slice(0, options.limit);
  
  logMessage(`Will process ${filesToProcess.length} files${options.dryRun ? ' (DRY RUN)' : ''}`, colors.blue);
  
  // Process files
  for (const file of filesToProcess) {
    migrateFile(file);
  }
  
  // Final summary
  if (!options.dryRun) {
    updateSummary();
  }
  
  logMessage(`Migration ${options.dryRun ? 'dry run' : 'completed'}. ${options.dryRun ? '' : `See ${LOG_FILE} for details and ${SUMMARY_FILE} for summary.`}`, colors.green);
}

// Run the script
main().catch(error => {
  logMessage(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});