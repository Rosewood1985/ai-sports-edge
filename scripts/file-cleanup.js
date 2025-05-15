#!/usr/bin/env node
/**
 * File Cleanup Utilities for AI Sports Edge
 * 
 * Detects unused assets and generates cleanup plans.
 * Helps maintain a clean and efficient codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const orphanDetector = require('./libs/orphan-detector');
const { findContentDuplicates } = require('./file-content-duplicates');

// Add logging
fs.appendFileSync('.roocode/tool_usage.log', `${new Date()}: Running ${path.basename(__filename)}\n`);

// Configuration
const ASSETS_DIR = './src/assets';
const SRC_DIR = './src';
const BACKUP_DIR = './archive/assets-backup';
const REPORT_DIR = './reports';

/**
 * Find all asset files in the project
 * @returns {Array} Array of asset file paths
 */
function findAssetFiles() {
  try {
    // Find image files
    const imageCommand = `find ${ASSETS_DIR} -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" | grep -v "node_modules"`;
    const imageOutput = execSync(imageCommand, { encoding: 'utf8' });
    const imageFiles = imageOutput.split('\n').filter(Boolean);
    
    // Find font files
    const fontCommand = `find ${ASSETS_DIR} -type f -name "*.ttf" -o -name "*.otf" -o -name "*.woff" -o -name "*.woff2" | grep -v "node_modules"`;
    const fontOutput = execSync(fontCommand, { encoding: 'utf8' });
    const fontFiles = fontOutput.split('\n').filter(Boolean);
    
    // Find other asset files
    const otherCommand = `find ${ASSETS_DIR} -type f -name "*.json" -o -name "*.mp3" -o -name "*.mp4" -o -name "*.wav" | grep -v "node_modules"`;
    const otherOutput = execSync(otherCommand, { encoding: 'utf8' });
    const otherFiles = otherOutput.split('\n').filter(Boolean);
    
    return [...imageFiles, ...fontFiles, ...otherFiles];
  } catch (error) {
    console.error('Error finding asset files:', error.message);
    return [];
  }
}

/**
 * Find all source files that might reference assets
 * @returns {Array} Array of source file paths
 */
function findSourceFiles() {
  try {
    const command = `find ${SRC_DIR} -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.scss" | grep -v "node_modules"`;
    const output = execSync(command, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding source files:', error.message);
    return [];
  }
}

/**
 * Check if an asset is referenced in source files
 * @param {string} assetPath - Path to the asset file
 * @param {Array} sourceFiles - Array of source file paths
 * @returns {boolean} True if the asset is referenced
 */
function isAssetReferenced(assetPath, sourceFiles) {
  try {
    // Get the asset filename and possible variations
    const assetFilename = path.basename(assetPath);
    const assetName = path.basename(assetPath, path.extname(assetPath));
    
    // Check each source file for references
    for (const sourceFile of sourceFiles) {
      const content = fs.readFileSync(sourceFile, 'utf8');
      
      // Check for various ways the asset might be referenced
      if (content.includes(assetFilename) || 
          content.includes(assetName) || 
          content.includes(assetPath) || 
          content.includes(assetPath.replace(ASSETS_DIR, ''))) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking if asset ${assetPath} is referenced:`, error.message);
    return true; // Assume it's referenced to be safe
  }
}

/**
 * Find unused assets
 * @returns {Array} Array of unused asset file paths
 */
function findUnusedAssets() {
  const assetFiles = findAssetFiles();
  const sourceFiles = findSourceFiles();
  
  console.log(`Found ${assetFiles.length} asset files and ${sourceFiles.length} source files`);
  
  const unusedAssets = [];
  
  for (const assetFile of assetFiles) {
    if (!isAssetReferenced(assetFile, sourceFiles)) {
      unusedAssets.push(assetFile);
    }
  }
  
  return unusedAssets;
}

/**
 * Create a backup of assets
 * @param {Array} assetFiles - Array of asset file paths
 * @returns {boolean} True if backup was successful
 */
function backupAssets(assetFiles) {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Create timestamp for backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupSubdir = path.join(BACKUP_DIR, `backup-${timestamp}`);
    fs.mkdirSync(backupSubdir, { recursive: true });
    
    // Copy each asset to backup directory
    for (const assetFile of assetFiles) {
      const relativePath = path.relative(ASSETS_DIR, assetFile);
      const backupPath = path.join(backupSubdir, relativePath);
      
      // Create subdirectories if needed
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(assetFile, backupPath);
    }
    
    console.log(`Backed up ${assetFiles.length} assets to ${backupSubdir}`);
    return true;
  } catch (error) {
    console.error('Error backing up assets:', error.message);
    return false;
  }
}

/**
 * Generate a cleanup plan
 * @param {Array} unusedAssets - Array of unused asset file paths
 * @returns {Object} Cleanup plan
 */
function generateCleanupPlan(unusedAssets) {
  // Group assets by type
  const assetsByType = {};
  
  for (const asset of unusedAssets) {
    const ext = path.extname(asset).toLowerCase();
    if (!assetsByType[ext]) {
      assetsByType[ext] = [];
    }
    assetsByType[ext].push(asset);
  }
  
  // Generate cleanup commands
  const commands = [];
  
  // Command to create backup
  commands.push(`# Create backup of unused assets`);
  commands.push(`mkdir -p ${BACKUP_DIR}`);
  commands.push(`# Backup commands would be generated here`);
  commands.push(``);
  
  // Commands to remove assets by type
  for (const [type, assets] of Object.entries(assetsByType)) {
    commands.push(`# Remove unused ${type} files`);
    for (const asset of assets) {
      commands.push(`rm "${asset}"`);
    }
    commands.push(``);
  }
  
  return {
    unusedAssets,
    assetsByType,
    commands,
    timestamp: new Date().toISOString()
  };
}

/**
 * Save cleanup plan to a file
 * @param {Object} plan - Cleanup plan
 */
function saveCleanupPlan(plan) {
  try {
    // Create report directory if it doesn't exist
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    
    // Generate report filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(REPORT_DIR, `cleanup-plan-${timestamp}.json`);
    const scriptFile = path.join(REPORT_DIR, `cleanup-script-${timestamp}.sh`);
    
    // Save plan to JSON file
    fs.writeFileSync(reportFile, JSON.stringify(plan, null, 2));
    
    // Save commands to shell script
    fs.writeFileSync(scriptFile, `#!/bin/bash\n\n# Cleanup script generated on ${new Date().toISOString()}\n\n` + plan.commands.join('\n'));
    fs.chmodSync(scriptFile, 0o755); // Make executable
    
    console.log(`Cleanup plan saved to ${reportFile}`);
    console.log(`Cleanup script saved to ${scriptFile}`);
  } catch (error) {
    console.error('Error saving cleanup plan:', error.message);
  }
}

/**
 * Print cleanup summary
 * @param {Object} plan - Cleanup plan
 */
function printCleanupSummary(plan) {
  console.log('\n=== Cleanup Summary ===\n');
  
  console.log(`Found ${plan.unusedAssets.length} unused assets`);
  
  // Print by type
  for (const [type, assets] of Object.entries(plan.assetsByType)) {
    console.log(`- ${assets.length} unused ${type} files`);
  }
  
  console.log('\nTop 10 unused assets:');
  for (const asset of plan.unusedAssets.slice(0, 10)) {
    console.log(`- ${asset}`);
  }
  
  if (plan.unusedAssets.length > 10) {
    console.log(`... and ${plan.unusedAssets.length - 10} more`);
  }
  
  console.log('\nRecommendations:');
  console.log('1. Review the cleanup plan to ensure no assets are incorrectly marked as unused');
  console.log('2. Backup the assets before removing them');
  console.log('3. Run the cleanup script to remove the unused assets');
  console.log('4. Test the application thoroughly after cleanup');
}

/**
 * Standard cleanup function
 * @param {Object} options Options for the cleanup process
 * @returns {Promise<Object>} Results of the cleanup process
 */
async function cleanup(options = {}) {
  console.log('Analyzing asset usage...');
  
  // Find unused assets
  const unusedAssets = findUnusedAssets();
  
  if (unusedAssets.length === 0) {
    console.log('No unused assets found!');
    return { success: true, unusedAssets: [] };
  }
  
  // Backup assets
  const backupSuccess = backupAssets(unusedAssets);
  
  if (!backupSuccess) {
    console.error('Failed to backup assets. Aborting cleanup plan generation.');
    return { success: false, error: 'Failed to backup assets' };
  }
  
  // Generate and save cleanup plan
  const plan = generateCleanupPlan(unusedAssets);
  saveCleanupPlan(plan);
  printCleanupSummary(plan);
  
  // Find orphaned files if requested
  if (options.findOrphans) {
    console.log('\nSearching for orphaned files...');
    const orphanedFiles = await orphanDetector.findOrphanedFiles();
    
    if (orphanedFiles.length > 0) {
      console.log(`Found ${orphanedFiles.length} orphaned files`);
      // Add to plan or handle separately
    } else {
      console.log('No orphaned files found');
    }
  }
  
  return {
    success: true,
    unusedAssets,
    plan
  };
}

/**
 * Enhanced cleanup function that includes content-based duplicate detection
 * @param {Object} options Options for the cleanup process
 * @returns {Promise<Object>} Results of the cleanup process
 */
async function enhancedCleanup(options = {}) {
  // First, run the existing cleanup logic
  const cleanupResults = await cleanup(options);
  
  // Then, find and handle content-based duplicates
  console.log('\n🔍 Checking for content-based duplicates...');
  
  try {
    const duplicateResults = await findContentDuplicates({
      // Pass through options
      ...options,
      // Don't apply recommendations yet, just analyze
      applyRecommendations: false
    });
    
    if (duplicateResults.duplicateGroups.length > 0) {
      console.log(`\n📊 Found ${duplicateResults.duplicateGroups.length} groups of similar or duplicate files.`);
      console.log(`📝 Report available at: ${duplicateResults.reportPath}`);
      
      // Prompt user if they want to view or apply recommendations
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nWould you like to apply automatic cleanup recommendations? (y/n) ', async (answer) => {
        readline.close();
        
        if (answer.toLowerCase() === 'y') {
          // Run again with apply flag
          await findContentDuplicates({
            ...options,
            applyRecommendations: true,
            dryRun: false
          });
        } else {
          console.log('🛑 No changes applied. Review the report and run with --apply when ready.');
        }
      });
    } else {
      console.log('✅ No content-based duplicates found!');
    }
    
    return {
      ...cleanupResults,
      contentDuplicates: duplicateResults
    };
  } catch (error) {
    console.error('Error checking for content-based duplicates:', error);
    return cleanupResults;
  }
}

// If script is run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    findOrphans: args.includes('--find-orphans'),
    enhanced: args.includes('--enhanced')
  };
  
  // Run the appropriate cleanup function
  if (options.enhanced) {
    enhancedCleanup(options).catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
  } else {
    cleanup(options).catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
  }
}

// Export the cleanup functions
module.exports = {
  cleanup,
  enhancedCleanup
};