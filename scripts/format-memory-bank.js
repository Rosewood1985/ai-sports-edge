#!/usr/bin/env node

/**
 * Memory Bank Formatting Script
 * 
 * This script formats all memory bank files using Prettier.
 * It ensures consistent formatting across all memory bank files.
 * 
 * Usage:
 *   node scripts/format-memory-bank.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Primary paths
  memoryBankDir: path.join(__dirname, '..', 'memory-bank'),
  roocodeMemoryBank: path.join(__dirname, '..', '.roocode', 'memory_bank.md'),
  checkpointFile: path.join(__dirname, '..', 'context', 'latest-checkpoint.md'),
  
  // File patterns to format
  filePatterns: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss', '.html'],
  
  // Prettier config
  prettierConfig: path.join(__dirname, '..', '.prettierrc'),
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

// Check if prettier is installed
function checkPrettier() {
  try {
    execSync('npx prettier --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('Prettier is not installed. Installing...', 'WARNING');
    try {
      execSync('npm install --save-dev prettier', { stdio: 'inherit' });
      log('Prettier installed successfully.', 'INFO');
      return true;
    } catch (installError) {
      log(`Failed to install Prettier: ${installError.message}`, 'ERROR');
      return false;
    }
  }
}

// Format a file with prettier
function formatFile(filePath) {
  try {
    // Check file size first
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Skip large files (> 100MB)
    if (fileSizeMB > 100) {
      log(`Skipping large file ${filePath} (${fileSizeMB.toFixed(2)} MB)`, 'WARNING');
      return true; // Return true to not count as an error
    }
    
    log(`Formatting ${filePath}...`);
    execSync(`npx prettier --write "${filePath}"`, { stdio: 'pipe' });
    log(`Successfully formatted ${filePath}.`);
    return true;
  } catch (error) {
    log(`Error formatting ${filePath}: ${error.message}`, 'ERROR');
    return false;
  }
}

// Get all memory bank files
function getMemoryBankFiles() {
  const files = [];
  
  // Get files from memory-bank directory
  if (fs.existsSync(CONFIG.memoryBankDir)) {
    const dirFiles = fs.readdirSync(CONFIG.memoryBankDir)
      .filter(file => {
        // Only include files with extensions in filePatterns
        const ext = path.extname(file).toLowerCase();
        return CONFIG.filePatterns.includes(ext);
      })
      .map(file => path.join(CONFIG.memoryBankDir, file));
    
    files.push(...dirFiles);
  }
  
  // Add .roocode/memory_bank.md if it exists
  if (fs.existsSync(CONFIG.roocodeMemoryBank)) {
    files.push(CONFIG.roocodeMemoryBank);
  }
  
  log(`Found ${files.length} memory bank files for formatting`);
  return files;
}

// Update the checkpoint file
function updateCheckpoint() {
  const checkpointDir = path.dirname(CONFIG.checkpointFile);
  ensureDirectoryExists(checkpointDir);
  
  const timestamp = new Date().toISOString();
  const checkpointContent = `# Memory Bank Formatting Checkpoint\n\nLast formatted: ${timestamp}\n\nAll memory bank files have been formatted with Prettier according to the project's .prettierrc configuration.\n`;
  
  try {
    fs.writeFileSync(CONFIG.checkpointFile, checkpointContent);
    log(`Updated checkpoint file: ${CONFIG.checkpointFile}`);
    return true;
  } catch (error) {
    log(`Error updating checkpoint file: ${error.message}`, 'ERROR');
    return false;
  }
}

// Main function
function main() {
  log('Memory Bank Formatting Script');
  log('===============================');
  
  // Check if prettier is installed
  if (!checkPrettier()) {
    log('Prettier is required for formatting. Please install it manually.', 'ERROR');
    process.exit(1);
  }
  
  // Check if .prettierrc exists
  if (!fs.existsSync(CONFIG.prettierConfig)) {
    log('.prettierrc not found. Creating default configuration...', 'WARNING');
    const defaultConfig = {
      "semi": true,
      "singleQuote": true,
      "printWidth": 100,
      "tabWidth": 2,
      "trailingComma": "es5",
      "arrowParens": "avoid"
    };
    fs.writeFileSync(CONFIG.prettierConfig, JSON.stringify(defaultConfig, null, 2));
    log('Created default .prettierrc configuration.');
  }
  
  // Get all memory bank files
  const files = getMemoryBankFiles();
  
  // Format each file
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    if (formatFile(file)) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  // Update checkpoint
  updateCheckpoint();
  
  // Print summary
  log(`Formatting complete. ${successCount} files formatted successfully, ${errorCount} errors.`);
}

// Run the script
main();