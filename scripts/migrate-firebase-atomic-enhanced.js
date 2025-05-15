#!/usr/bin/env node

/**
 * Enhanced Firebase Atomic Architecture Migration Script
 * 
 * This script helps automate the migration of files to use the consolidated Firebase service
 * with support for targeting specific directories, testing, dependency analysis, and more.
 * 
 * Usage:
 *   node scripts/migrate-firebase-atomic-enhanced.js [options]
 * 
 * Options:
 *   --directory=<path>     Target a specific directory (e.g., hooks, components)
 *   --file=<path>          Target a specific file
 *   --limit=<number>       Limit the number of files to process
 *   --dry-run              Show what would be migrated without making changes
 *   --test                 Run tests after migration
 *   --analyze-deps         Analyze dependencies of files being migrated
 *   --create-branch        Create a Git branch for this migration batch
 *   --help                 Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');
const { exit } = require('process');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  directory: '.',
  file: null,
  limit: Infinity,
  dryRun: false,
  test: false,
  analyzeDeps: false,
  createBranch: false,
  help: false
};

// Parse arguments
args.forEach(arg => {
  if (arg.startsWith('--directory=')) {
    options.directory = arg.split('=')[1];
  } else if (arg.startsWith('--file=')) {
    options.file = arg.split('=')[1];
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--test') {
    options.test = true;
  } else if (arg === '--analyze-deps') {
    options.analyzeDeps = true;
  } else if (arg === '--create-branch') {
    options.createBranch = true;
  } else if (arg === '--help') {
    options.help = true;
  }
});

// Show help message
if (options.help) {
  console.log(`
Enhanced Firebase Atomic Architecture Migration Script

Usage:
  node scripts/migrate-firebase-atomic-enhanced.js [options]

Options:
  --directory=<path>     Target a specific directory (e.g., hooks, components)
  --file=<path>          Target a specific file
  --limit=<number>       Limit the number of files to process
  --dry-run              Show what would be migrated without making changes
  --test                 Run tests after migration
  --analyze-deps         Analyze dependencies of files being migrated
  --create-branch        Create a Git branch for this migration batch
  --help                 Show this help message

Examples:
  node scripts/migrate-firebase-atomic-enhanced.js --directory=hooks --limit=5
  node scripts/migrate-firebase-atomic-enhanced.js --file=services/authService.ts --test
  node scripts/migrate-firebase-atomic-enhanced.js --directory=components --analyze-deps --create-branch
  `);
  process.exit(0);
}

// Log file paths
const LOG_DIR = 'status';
const LOG_FILE = path.join(LOG_DIR, 'firebase-atomic-migration.log');
const SUMMARY_FILE = path.join(LOG_DIR, 'firebase-atomic-migration-summary.md');
const TEST_RESULTS_FILE = path.join(LOG_DIR, 'firebase-atomic-test-results.md');

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log file if not in dry run mode
if (!options.dryRun) {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, `# Firebase Atomic Architecture Migration Log\nStarted migration at ${new Date().toISOString()}\n\n`);
  }
  
  if (!fs.existsSync(SUMMARY_FILE)) {
    fs.writeFileSync(SUMMARY_FILE, `# Firebase Atomic Architecture Migration Summary\nLast updated: ${new Date().toISOString()}\n\n## Progress\n\n`);
  }
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
    
    // Add migration strategy section
    summaryContent += `\n## Migration Strategy\n\n`;
    summaryContent += `The migration to Firebase atomic architecture is being done incrementally, focusing on one directory at a time:\n\n`;
    
    // Check progress of each directory
    const directories = ['config', 'hooks', 'services', 'components', 'screens'];
    for (const dir of directories) {
      const totalInDirCmd = `grep -r "import.*firebase" --include="*.js" --include="*.ts" --include="*.tsx" ./${dir} | grep -v "node_modules" | grep -v "archive" | wc -l`;
      const migratedInDirCmd = `grep -r "import.*firebaseService.*from.*atomic" --include="*.js" --include="*.ts" --include="*.tsx" ./${dir} | grep -v "node_modules" | grep -v "archive" | wc -l`;
      
      let totalInDir = 0;
      let migratedInDir = 0;
      
      try {
        totalInDir = parseInt(execSync(totalInDirCmd, { encoding: 'utf8' }).trim(), 10);
      } catch (error) {
        // Directory might not exist
      }
      
      try {
        migratedInDir = parseInt(execSync(migratedInDirCmd, { encoding: 'utf8' }).trim(), 10);
      } catch (error) {
        // Directory might not exist
      }
      
      const dirPercentage = totalInDir > 0 ? Math.round((migratedInDir / totalInDir) * 100) : 0;
      const status = dirPercentage === 100 ? '✅' : dirPercentage > 0 ? '🔄' : '⏳';
      
      summaryContent += `${status} **${dir}/** directory: ${migratedInDir}/${totalInDir} files (${dirPercentage}%)\n`;
    }
    
    // Add next steps section
    summaryContent += `\n## Next Steps\n\n`;
    summaryContent += `1. Continue migrating files using the migration script:\n`;
    summaryContent += `   \`\`\`bash\n`;
    summaryContent += `   node scripts/migrate-firebase-atomic-enhanced.js --directory=services --limit=5 --test\n`;
    summaryContent += `   \`\`\`\n\n`;
    summaryContent += `2. Run tests after each migration batch:\n`;
    summaryContent += `   \`\`\`bash\n`;
    summaryContent += `   npm test\n`;
    summaryContent += `   \`\`\`\n\n`;
    
    // Write to temporary file and replace the original
    fs.writeFileSync(tempSummaryFile, summaryContent);
    fs.renameSync(tempSummaryFile, SUMMARY_FILE);
    
    logMessage(`Updated migration summary: ${migratedFiles}/${totalFiles} files (${percentage}%)`);
  } catch (error) {
    logMessage(`Error updating summary: ${error.message}`, colors.red);
  }
}

// Function to analyze dependencies
function analyzeDependencies(filePath) {
  logMessage(`Analyzing dependencies for ${filePath}...`, colors.magenta);
  
  try {
    // Find files that import the target file
    const importersCmd = `grep -r "import.*from.*${path.basename(filePath, path.extname(filePath))}" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v "archive"`;
    const importers = execSync(importersCmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    
    logMessage(`Found ${importers.length} files that import ${filePath}:`, colors.magenta);
    importers.forEach(importer => {
      const [file] = importer.split(':');
      logMessage(`  - ${file}`, colors.magenta);
    });
    
    return importers;
  } catch (error) {
    logMessage(`No dependencies found for ${filePath}`, colors.magenta);
    return [];
  }
}

// Function to run tests
function runTests() {
  logMessage(`Running tests...`, colors.cyan);
  
  try {
    const testOutput = execSync('npm test', { encoding: 'utf8' });
    logMessage(`Tests completed successfully`, colors.green);
    
    // Save test results
    if (!options.dryRun) {
      fs.appendFileSync(TEST_RESULTS_FILE, `\n## Test Results - ${new Date().toISOString()}\n\n`);
      fs.appendFileSync(TEST_RESULTS_FILE, `\`\`\`\n${testOutput}\n\`\`\`\n`);
    }
    
    return true;
  } catch (error) {
    logMessage(`Tests failed: ${error.message}`, colors.red);
    
    // Save test failure
    if (!options.dryRun) {
      fs.appendFileSync(TEST_RESULTS_FILE, `\n## Test Failure - ${new Date().toISOString()}\n\n`);
      fs.appendFileSync(TEST_RESULTS_FILE, `\`\`\`\n${error.stdout}\n\`\`\`\n`);
    }
    
    return false;
  }
}

// Function to create a Git branch
function createGitBranch() {
  const branchName = `firebase-atomic-migration-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  
  try {
    // Check if there are uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      logMessage(`Cannot create branch: You have uncommitted changes. Please commit or stash them first.`, colors.red);
      return false;
    }
    
    // Create and checkout new branch
    execSync(`git checkout -b ${branchName}`, { encoding: 'utf8' });
    logMessage(`Created and checked out new branch: ${branchName}`, colors.green);
    return true;
  } catch (error) {
    logMessage(`Failed to create Git branch: ${error.message}`, colors.red);
    return false;
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
    // Analyze dependencies if requested
    if (options.analyzeDeps) {
      analyzeDependencies(filePath);
    }
    
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
    
    // Run TypeScript check
    try {
      execSync(`tsc --noEmit ${filePath}`, { encoding: 'utf8' });
      logMessage(`TypeScript check passed for ${filePath}`, colors.green);
    } catch (tsError) {
      logMessage(`TypeScript check failed for ${filePath}. Manual fixes may be required.`, colors.red);
      logMessage(tsError.stdout, colors.red);
    }
    
    return true;
  } catch (error) {
    logMessage(`Error migrating ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

// Function to find files that need migration
function findFilesToMigrate() {
  const searchPath = options.file || options.directory;
  logMessage(`Searching for files that need migration in ${searchPath}...`, colors.blue);
  
  try {
    // If a specific file is provided, check if it needs migration
    if (options.file) {
      const fileContent = fs.readFileSync(options.file, 'utf8');
      if (fileContent.includes('import') && fileContent.includes('firebase/') && !fileContent.includes('firebaseService')) {
        return [options.file];
      }
      logMessage(`File ${options.file} does not need migration`, colors.blue);
      return [];
    }
    
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
  logMessage(`Starting Enhanced Firebase Atomic Architecture Migration${options.dryRun ? ' (DRY RUN)' : ''}`, colors.green);
  
  // Create Git branch if requested
  if (options.createBranch && !options.dryRun) {
    const branchCreated = createGitBranch();
    if (!branchCreated) {
      logMessage('Migration aborted due to branch creation failure', colors.red);
      return;
    }
  }
  
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
  let successCount = 0;
  let failureCount = 0;
  
  for (const file of filesToProcess) {
    const success = migrateFile(file);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  // Run tests if requested
  if (options.test && !options.dryRun && successCount > 0) {
    const testsSucceeded = runTests();
    if (!testsSucceeded) {
      logMessage('Some tests failed after migration. Consider reverting changes or fixing the issues.', colors.red);
    }
  }
  
  // Final summary
  if (!options.dryRun) {
    updateSummary();
  }
  
  logMessage(`Migration ${options.dryRun ? 'dry run' : 'completed'}.`, colors.green);
  logMessage(`Successfully migrated: ${successCount} files`, colors.green);
  
  if (failureCount > 0) {
    logMessage(`Failed to migrate: ${failureCount} files`, colors.red);
  }
  
  if (!options.dryRun) {
    logMessage(`See ${LOG_FILE} for details and ${SUMMARY_FILE} for summary.`, colors.green);
  }
}

// Run the script
main().catch(error => {
  logMessage(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});