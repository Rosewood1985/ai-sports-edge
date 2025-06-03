#!/usr/bin/env node

/**
 * Migration Script: Replace Vulnerable OCR Services
 *
 * This script safely migrates from vulnerable OCR services to secure implementations.
 * It backs up existing files and updates imports throughout the codebase.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const MIGRATION_CONFIG = {
  backupDir: path.join(__dirname, '..', 'backups', `ocr-migration-${Date.now()}`),
  vulnerableServices: [
    {
      file: 'services/enhancedOCRService.js',
      backup: 'enhancedOCRService.js.vulnerable',
      replacement: 'services/secureEnhancedOCRService.js',
      newName: 'services/enhancedOCRService.js',
    },
    {
      file: 'services/multiProviderOCRService.js',
      backup: 'multiProviderOCRService.js.vulnerable',
      replacement: 'services/secureMultiProviderOCRService.js',
      newName: 'services/multiProviderOCRService.js',
    },
    {
      file: 'services/imagePreprocessingService.js',
      backup: 'imagePreprocessingService.js.vulnerable',
      replacement: 'services/secureImagePreprocessingService.js',
      newName: 'services/imagePreprocessingService.js',
    },
  ],

  // Files that import the vulnerable services (need import updates)
  importUpdates: [
    {
      pattern: /const.*=.*require\(['"]\.\/enhancedOCRService['"]\)/g,
      replacement: "const { secureEnhancedOCRService } = require('./secureEnhancedOCRService')",
    },
    {
      pattern: /const.*=.*require\(['"]\.\/multiProviderOCRService['"]\)/g,
      replacement:
        "const { secureMultiProviderOCRService } = require('./secureMultiProviderOCRService')",
    },
    {
      pattern: /const.*=.*require\(['"]\.\/imagePreprocessingService['"]\)/g,
      replacement:
        "const { secureImagePreprocessingService } = require('./secureImagePreprocessingService')",
    },
  ],
};

/**
 * Main migration function
 */
async function migrateToSecureOCR() {
  console.log('🔒 Starting migration to secure OCR services...');

  try {
    // Step 1: Create backup directory
    await createBackupDirectory();

    // Step 2: Backup vulnerable services
    await backupVulnerableServices();

    // Step 3: Replace with secure services
    await replaceWithSecureServices();

    // Step 4: Update imports throughout codebase
    await updateImports();

    // Step 5: Create migration summary
    await createMigrationSummary();

    console.log('✅ Migration completed successfully!');
    console.log(`📁 Backups stored in: ${MIGRATION_CONFIG.backupDir}`);
    console.log('🔧 Please restart your application to use secure OCR services.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('🔄 Attempting rollback...');
    await rollbackMigration();
    process.exit(1);
  }
}

/**
 * Creates backup directory
 */
async function createBackupDirectory() {
  console.log('📁 Creating backup directory...');
  await fs.mkdir(MIGRATION_CONFIG.backupDir, { recursive: true });
}

/**
 * Backs up vulnerable services
 */
async function backupVulnerableServices() {
  console.log('💾 Backing up vulnerable services...');

  for (const service of MIGRATION_CONFIG.vulnerableServices) {
    const sourcePath = path.join(__dirname, '..', service.file);
    const backupPath = path.join(MIGRATION_CONFIG.backupDir, service.backup);

    try {
      await fs.access(sourcePath);
      await fs.copyFile(sourcePath, backupPath);
      console.log(`✓ Backed up: ${service.file}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️  File not found (skipping): ${service.file}`);
      } else {
        throw new Error(`Failed to backup ${service.file}: ${error.message}`);
      }
    }
  }
}

/**
 * Replaces vulnerable services with secure versions
 */
async function replaceWithSecureServices() {
  console.log('🔄 Replacing with secure services...');

  for (const service of MIGRATION_CONFIG.vulnerableServices) {
    const sourcePath = path.join(__dirname, '..', service.replacement);
    const targetPath = path.join(__dirname, '..', service.newName);

    try {
      // Check if secure service exists
      await fs.access(sourcePath);

      // Copy secure service to replace vulnerable one
      await fs.copyFile(sourcePath, targetPath);
      console.log(`✓ Replaced: ${service.file} → ${service.replacement}`);
    } catch (error) {
      throw new Error(`Failed to replace ${service.file}: ${error.message}`);
    }
  }
}

/**
 * Updates imports throughout the codebase
 */
async function updateImports() {
  console.log('🔗 Updating imports throughout codebase...');

  const jsFiles = await findJavaScriptFiles();
  let updatedFiles = 0;

  for (const filePath of jsFiles) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let modified = false;

      // Apply import updates
      for (const update of MIGRATION_CONFIG.importUpdates) {
        if (update.pattern.test(content)) {
          content = content.replace(update.pattern, update.replacement);
          modified = true;
        }
      }

      // Write updated content if modified
      if (modified) {
        await fs.writeFile(filePath, content, 'utf-8');
        updatedFiles++;
        console.log(`✓ Updated imports in: ${path.relative(process.cwd(), filePath)}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not update imports in ${filePath}: ${error.message}`);
    }
  }

  console.log(`📝 Updated imports in ${updatedFiles} files`);
}

/**
 * Finds all JavaScript files in the project
 */
async function findJavaScriptFiles() {
  const files = [];
  const excludeDirs = ['node_modules', '.git', 'backups', 'build', 'dist'];

  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await scanDirectory(path.join(__dirname, '..'));
  return files;
}

/**
 * Creates migration summary
 */
async function createMigrationSummary() {
  console.log('📋 Creating migration summary...');

  const summary = {
    migrationDate: new Date().toISOString(),
    backupLocation: MIGRATION_CONFIG.backupDir,
    migratedServices: MIGRATION_CONFIG.vulnerableServices.map(s => ({
      original: s.file,
      backup: s.backup,
      replacement: s.replacement,
    })),
    securityImprovements: [
      'Command injection prevention through parameterized execution',
      'File path validation and sanitization',
      'Comprehensive input validation',
      'Secure file handling with proper cleanup',
      'Timeout controls for all operations',
      'Error handling and security incident logging',
    ],
    nextSteps: [
      'Restart the application',
      'Test OCR functionality with secure services',
      'Monitor logs for security incidents',
      'Remove backup files after verification (optional)',
    ],
  };

  const summaryPath = path.join(MIGRATION_CONFIG.backupDir, 'migration-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`📄 Migration summary saved to: ${summaryPath}`);
}

/**
 * Rolls back migration in case of failure
 */
async function rollbackMigration() {
  console.log('🔄 Rolling back migration...');

  try {
    for (const service of MIGRATION_CONFIG.vulnerableServices) {
      const backupPath = path.join(MIGRATION_CONFIG.backupDir, service.backup);
      const targetPath = path.join(__dirname, '..', service.file);

      try {
        await fs.access(backupPath);
        await fs.copyFile(backupPath, targetPath);
        console.log(`✓ Restored: ${service.file}`);
      } catch (error) {
        console.warn(`⚠️  Could not restore ${service.file}: ${error.message}`);
      }
    }

    console.log('✅ Rollback completed');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
  }
}

/**
 * Validates environment before migration
 */
async function validateEnvironment() {
  console.log('🔍 Validating environment...');

  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  try {
    await fs.access(packageJsonPath);
  } catch (error) {
    throw new Error('Not in project root directory (package.json not found)');
  }

  // Check if secure services exist
  for (const service of MIGRATION_CONFIG.vulnerableServices) {
    const securePath = path.join(__dirname, '..', service.replacement);
    try {
      await fs.access(securePath);
    } catch (error) {
      throw new Error(`Secure service not found: ${service.replacement}`);
    }
  }

  console.log('✓ Environment validation passed');
}

/**
 * Shows migration plan
 */
function showMigrationPlan() {
  console.log('\n📋 MIGRATION PLAN:');
  console.log('==================');
  console.log('This migration will:');
  console.log('1. Backup existing vulnerable OCR services');
  console.log('2. Replace them with secure implementations');
  console.log('3. Update imports throughout the codebase');
  console.log('4. Create a migration summary');
  console.log('\n🔒 SECURITY IMPROVEMENTS:');
  console.log('- Command injection prevention');
  console.log('- File path validation and sanitization');
  console.log('- Comprehensive input validation');
  console.log('- Secure file handling');
  console.log('- Timeout controls');
  console.log('- Security incident logging');
  console.log('\n⚠️  IMPORTANT: This will modify your codebase!');
  console.log('Backups will be created, but please ensure you have');
  console.log('your own backup before proceeding.\n');
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      showMigrationPlan();

      // Simple confirmation (in a real scenario, you might use a proper prompt library)
      if (process.argv.includes('--confirm')) {
        await validateEnvironment();
        await migrateToSecureOCR();
      } else {
        console.log('To proceed with migration, run:');
        console.log('node scripts/migrate-to-secure-ocr.js --confirm');
      }
    } catch (error) {
      console.error('❌ Migration script failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateToSecureOCR,
  MIGRATION_CONFIG,
};
