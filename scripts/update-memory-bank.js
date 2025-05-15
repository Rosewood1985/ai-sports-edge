#!/usr/bin/env node

/**
 * Memory Bank Update Script
 * 
 * This script automatically updates the memory bank files with the latest
 * project state, detects context loss, and provides recovery mechanisms.
 * 
 * Usage:
 *   node scripts/update-memory-bank.js [--force] [--checkpoint]
 * 
 * Options:
 *   --force      Force update even if no changes detected
 *   --checkpoint Create a checkpoint of the current memory bank state
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  memoryBankDir: path.join(__dirname, '..', 'memory-bank'),
  checkpointDir: path.join(__dirname, '..', 'memory-bank', 'checkpoints'),
  serviceDir: path.join(__dirname, '..', 'services'),
  atomicDir: path.join(__dirname, '..', 'src', 'atomic'),
  lastUpdateFile: path.join(__dirname, '..', 'memory-bank', '.last-update'),
  migrationStatusFile: path.join(__dirname, '..', 'memory-bank', '.migration-status.json'),
  updateInterval: 30 * 60 * 1000, // 30 minutes
  checkpointInterval: 24 * 60 * 60 * 1000, // 24 hours
};

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(CONFIG.memoryBankDir)) {
    fs.mkdirSync(CONFIG.memoryBankDir, { recursive: true });
    console.log(`Created memory bank directory: ${CONFIG.memoryBankDir}`);
  }

  if (!fs.existsSync(CONFIG.checkpointDir)) {
    fs.mkdirSync(CONFIG.checkpointDir, { recursive: true });
    console.log(`Created checkpoints directory: ${CONFIG.checkpointDir}`);
  }
}

// Check if update is needed
function isUpdateNeeded(force = false) {
  if (force) return true;

  if (!fs.existsSync(CONFIG.lastUpdateFile)) {
    return true;
  }

  const lastUpdate = parseInt(fs.readFileSync(CONFIG.lastUpdateFile, 'utf8'), 10);
  const now = Date.now();
  
  return (now - lastUpdate) > CONFIG.updateInterval;
}

// Record last update time
function recordUpdateTime() {
  fs.writeFileSync(CONFIG.lastUpdateFile, Date.now().toString(), 'utf8');
  console.log(`Recorded update time: ${new Date().toISOString()}`);
}

// Create a checkpoint of the current memory bank state
function createCheckpoint() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointDir = path.join(CONFIG.checkpointDir, `checkpoint-${timestamp}`);
  
  fs.mkdirSync(checkpointDir, { recursive: true });
  
  // Copy all memory bank files to the checkpoint directory
  fs.readdirSync(CONFIG.memoryBankDir).forEach(file => {
    if (file === 'checkpoints' || file.startsWith('.')) return;
    
    const srcPath = path.join(CONFIG.memoryBankDir, file);
    const destPath = path.join(checkpointDir, file);
    
    fs.copyFileSync(srcPath, destPath);
  });
  
  console.log(`Created checkpoint: ${checkpointDir}`);
  return checkpointDir;
}

// Check if checkpoint is needed
function isCheckpointNeeded() {
  if (!fs.existsSync(CONFIG.migrationStatusFile)) {
    return true;
  }

  const status = JSON.parse(fs.readFileSync(CONFIG.migrationStatusFile, 'utf8'));
  const now = Date.now();
  
  return !status.lastCheckpoint || (now - status.lastCheckpoint) > CONFIG.checkpointInterval;
}

// Update migration status
function updateMigrationStatus(checkpointPath = null) {
  let status = { 
    lastUpdate: Date.now(),
    migratedFiles: [],
    pendingFiles: [],
    lastCheckpoint: null
  };
  
  if (fs.existsSync(CONFIG.migrationStatusFile)) {
    status = JSON.parse(fs.readFileSync(CONFIG.migrationStatusFile, 'utf8'));
  }
  
  status.lastUpdate = Date.now();
  
  if (checkpointPath) {
    status.lastCheckpoint = Date.now();
  }
  
  // Scan for migrated and pending files
  const serviceFiles = fs.readdirSync(CONFIG.serviceDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  
  // Check for atomic imports to determine if a file has been migrated
  for (const file of serviceFiles) {
    const filePath = path.join(CONFIG.serviceDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const hasMigrated = content.includes('import { firebaseService }') || 
                        content.includes("import { firebaseService }");
    
    if (hasMigrated) {
      if (!status.migratedFiles.includes(file)) {
        status.migratedFiles.push(file);
      }
      // Remove from pending if it was there
      status.pendingFiles = status.pendingFiles.filter(f => f !== file);
    } else if (
      (content.includes('firebase') || content.includes('firestore') || content.includes('functions')) &&
      !status.migratedFiles.includes(file) && 
      !status.pendingFiles.includes(file)
    ) {
      status.pendingFiles.push(file);
    }
  }
  
  fs.writeFileSync(CONFIG.migrationStatusFile, JSON.stringify(status, null, 2), 'utf8');
  console.log(`Updated migration status: ${status.migratedFiles.length} migrated, ${status.pendingFiles.length} pending`);
  
  return status;
}

// Update activeContext.md
function updateActiveContext(status) {
  const activeContextPath = path.join(CONFIG.memoryBankDir, 'activeContext.md');
  let content = `# Active Context for Firebase Atomic Migration\n\n`;
  
  // Current focus
  content += `## Current Focus\n`;
  if (status.pendingFiles.length > 0) {
    content += `- Migrating ${status.pendingFiles[0]} to Firebase atomic architecture\n`;
  } else {
    content += `- Migration complete! All service files have been migrated.\n`;
  }
  content += `\n`;
  
  // Migration status
  content += `## Migration Status\n`;
  for (const file of status.migratedFiles) {
    content += `- ✅ ${file} (completed)\n`;
  }
  for (const file of status.pendingFiles) {
    content += `- 📋 ${file} (pending)\n`;
  }
  content += `\n`;
  
  // Last updated
  const now = new Date();
  content += `## Last Updated\n`;
  content += `- Date: ${now.toISOString().split('T')[0]}\n`;
  content += `- Time: ${now.toTimeString().split(' ')[0]} UTC\n`;
  
  fs.writeFileSync(activeContextPath, content, 'utf8');
  console.log(`Updated active context: ${activeContextPath}`);
}

// Update progress.md
function updateProgress(status) {
  const progressPath = path.join(CONFIG.memoryBankDir, 'progress.md');
  
  if (!fs.existsSync(progressPath)) {
    console.log(`Progress file not found: ${progressPath}`);
    return;
  }
  
  let content = fs.readFileSync(progressPath, 'utf8');
  
  // Update completed migrations section
  let completedSection = `## Completed Migrations\n| Service File | Status | Date Completed | Notes |\n|-------------|--------|----------------|-------|\n`;
  for (const file of status.migratedFiles) {
    completedSection += `| ${file} | ✅ Completed | ${new Date().toISOString().split('T')[0]} | All functions migrated to use firebaseService |\n`;
  }
  
  // Update pending migrations section
  let pendingSection = `\n## Pending Migrations\n| Service File | Status | Priority | Notes |\n|-------------|--------|----------|-------|\n`;
  for (const file of status.pendingFiles) {
    pendingSection += `| ${file} | 📋 Pending | Medium | Contains Firebase references |\n`;
  }
  
  // Replace sections in the content
  const completedRegex = /## Completed Migrations\n\|[^#]+/;
  const pendingRegex = /## Pending Migrations\n\|[^#]+/;
  
  content = content.replace(completedRegex, completedSection);
  content = content.replace(pendingRegex, pendingSection);
  
  fs.writeFileSync(progressPath, content, 'utf8');
  console.log(`Updated progress: ${progressPath}`);
}

// Detect context loss by checking if memory bank files have been accessed recently
function detectContextLoss() {
  const files = [
    path.join(CONFIG.memoryBankDir, 'activeContext.md'),
    path.join(CONFIG.memoryBankDir, 'progress.md'),
    path.join(CONFIG.memoryBankDir, 'systemPatterns.md'),
    path.join(CONFIG.memoryBankDir, 'decisionLog.md'),
    path.join(CONFIG.memoryBankDir, 'productContext.md')
  ];
  
  const now = Date.now();
  const accessTimes = files
    .filter(file => fs.existsSync(file))
    .map(file => fs.statSync(file).atimeMs);
  
  if (accessTimes.length === 0) return false;
  
  // If any file hasn't been accessed in the last 2 hours, consider it context loss
  const twoHours = 2 * 60 * 60 * 1000;
  const oldestAccess = Math.min(...accessTimes);
  
  return (now - oldestAccess) > twoHours;
}

// Recover from context loss
function recoverContext() {
  console.log('Context loss detected! Recovering...');
  
  // Find the most recent checkpoint
  const checkpoints = fs.readdirSync(CONFIG.checkpointDir)
    .filter(dir => dir.startsWith('checkpoint-'))
    .map(dir => path.join(CONFIG.checkpointDir, dir));
  
  if (checkpoints.length === 0) {
    console.log('No checkpoints found for recovery');
    return;
  }
  
  // Sort by creation time (newest first)
  checkpoints.sort((a, b) => {
    return fs.statSync(b).ctimeMs - fs.statSync(a).ctimeMs;
  });
  
  const latestCheckpoint = checkpoints[0];
  console.log(`Recovering from checkpoint: ${latestCheckpoint}`);
  
  // Copy files from checkpoint to memory bank
  fs.readdirSync(latestCheckpoint).forEach(file => {
    const srcPath = path.join(latestCheckpoint, file);
    const destPath = path.join(CONFIG.memoryBankDir, file);
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`Restored: ${file}`);
  });
  
  console.log('Context recovery complete');
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const checkpoint = args.includes('--checkpoint');
  
  console.log('Memory Bank Update Script');
  console.log('========================');
  
  ensureDirectories();
  
  // Check for context loss
  if (detectContextLoss()) {
    recoverContext();
  }
  
  // Check if update is needed
  if (!isUpdateNeeded(force)) {
    console.log('No update needed. Use --force to update anyway.');
    return;
  }
  
  // Create checkpoint if needed or requested
  let checkpointPath = null;
  if (checkpoint || isCheckpointNeeded()) {
    checkpointPath = createCheckpoint();
  }
  
  // Update migration status
  const status = updateMigrationStatus(checkpointPath);
  
  // Update memory bank files
  updateActiveContext(status);
  updateProgress(status);
  
  // Record update time
  recordUpdateTime();
  
  console.log('Memory bank update complete!');
}

// Run the script
main();