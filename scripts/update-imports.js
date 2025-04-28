#!/usr/bin/env node

/**
 * Import Update Script
 * 
 * This script helps update imports from the old module structure to the new atomic structure.
 * It scans files for old import patterns and suggests replacements.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const SCAN_DIRS = ['src', 'components', 'screens', 'navigation'];
const EXCLUDE_DIRS = ['node_modules', 'build', 'dist', 'atomic'];

// Import mapping from old to new
const IMPORT_MAPPING = {
  // Environment module
  '../modules/environment/envConfig': '../atomic/atoms/envConfig',
  '../modules/environment/envCheck': '../atomic/molecules/environmentValidator',
  '../modules/environment/index': '../atomic/organisms/environmentBootstrap',
  
  // Firebase module
  '../modules/firebase/firebaseConfig': '../atomic/atoms/firebaseApp',
  '../modules/firebase/firebaseAuth': '../atomic/molecules/firebaseAuth',
  '../modules/firebase/firebaseFirestore': '../atomic/molecules/firebaseFirestore',
  '../modules/firebase/index': '../atomic/organisms/firebaseService',
  
  // Theme module
  '../modules/theme/themeConfig': '../atomic/atoms/themeColors',
  '../modules/theme/ThemeContext': '../atomic/molecules/themeContext',
  '../modules/theme/ThemeProvider': '../atomic/organisms/themeProvider',
  '../modules/theme/index': '../atomic/organisms/themeProvider',
  
  // Monitoring module
  '../modules/monitoring/errorUtils': '../atomic/atoms/errorUtils',
  '../modules/monitoring/errorTracking': '../atomic/molecules/errorTracking',
  '../modules/monitoring/index': '../atomic/organisms/monitoringService',
};

// Function to scan a file for imports
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^;]*|[^;]*)\s+from\s+['"]([^'"]*)['"]/g;
    
    let match;
    const matches = [];
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check if this import path needs to be updated
      for (const [oldPath, newPath] of Object.entries(IMPORT_MAPPING)) {
        if (importPath === oldPath || importPath.includes(oldPath)) {
          matches.push({
            file: filePath,
            line: content.substring(0, match.index).split('\n').length,
            oldImport: match[0],
            newImport: match[0].replace(oldPath, newPath),
          });
          break;
        }
      }
    }
    
    return matches;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return [];
  }
}

// Function to scan directories recursively
function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip excluded directories
    if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const fileResults = scanFile(fullPath);
      results.push(...fileResults);
    }
  }
  
  return results;
}

// Function to update imports in a file
function updateImports(file, changes) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Apply changes in reverse order to avoid offset issues
    changes.sort((a, b) => b.oldImport.index - a.oldImport.index);
    
    for (const change of changes) {
      content = content.replace(change.oldImport, change.newImport);
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${changes.length} imports in ${file}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating file ${file}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Scanning for imports to update...');
  
  const allResults = [];
  
  // Scan directories
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(ROOT_DIR, dir);
    
    if (fs.existsSync(dirPath)) {
      console.log(`Scanning ${dir}...`);
      const results = scanDirectory(dirPath);
      allResults.push(...results);
    } else {
      console.log(`Directory ${dir} not found, skipping.`);
    }
  }
  
  // Group results by file
  const fileGroups = {};
  for (const result of allResults) {
    if (!fileGroups[result.file]) {
      fileGroups[result.file] = [];
    }
    fileGroups[result.file].push(result);
  }
  
  // Print results
  console.log('\nFound imports to update:');
  console.log('========================\n');
  
  for (const [file, changes] of Object.entries(fileGroups)) {
    console.log(`File: ${file}`);
    
    for (const change of changes) {
      console.log(`  Line ${change.line}:`);
      console.log(`    Old: ${change.oldImport}`);
      console.log(`    New: ${change.newImport}`);
      console.log();
    }
  }
  
  // Ask for confirmation
  console.log(`Found ${allResults.length} imports to update in ${Object.keys(fileGroups).length} files.`);
  console.log('To update imports, run this script with the --update flag.');
  
  // Update if --update flag is provided
  if (process.argv.includes('--update')) {
    console.log('\nUpdating imports...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const [file, changes] of Object.entries(fileGroups)) {
      const success = updateImports(file, changes);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`\nUpdate complete: ${successCount} files updated, ${failCount} files failed.`);
  }
}

// Run the script
main();