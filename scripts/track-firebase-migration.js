#!/usr/bin/env node

/**
 * track-firebase-migration.js
 * 
 * This script tracks the progress of migrating Firebase implementations to the
 * consolidated firebaseService. It updates the task list in tasks/firebase-consolidation-tasks.md
 * with the current progress.
 * 
 * Usage: node scripts/track-firebase-migration.js [file-path]
 * 
 * If file-path is provided, it marks that file as migrated.
 * If no file-path is provided, it just updates the progress count.
 */

const fs = require('fs');
const path = require('path');

const TASK_FILE = 'tasks/firebase-consolidation-tasks.md';
const MIGRATION_REPORT = 'docs/firebase-migration-report.md';

// Get the file to mark as migrated (if provided)
const fileToMark = process.argv[2];

// Read the migration report to get the total number of files
function getTotalFilesToMigrate() {
  try {
    const reportContent = fs.readFileSync(MIGRATION_REPORT, 'utf8');
    const match = reportContent.match(/## Files to Migrate \((\d+)\)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  } catch (error) {
    console.error('Error reading migration report:', error);
  }
  return 0;
}

// Read the task file to get the current list of migrated files
function getCurrentProgress() {
  try {
    const taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    const progressMatch = taskContent.match(/Files migrated: (\d+)/);
    if (progressMatch && progressMatch[1]) {
      return parseInt(progressMatch[1], 10);
    }
  } catch (error) {
    console.error('Error reading task file:', error);
  }
  return 0;
}

// Update the task file with the new progress
function updateTaskFile(migratedCount, totalCount) {
  try {
    let taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    
    // Update the progress count
    const progressPercentage = totalCount > 0 ? Math.round((migratedCount / totalCount) * 100) : 0;
    taskContent = taskContent.replace(/Files migrated: \d+/, `Files migrated: ${migratedCount}`);
    taskContent = taskContent.replace(/Progress: \d+%/, `Progress: ${progressPercentage}%`);
    
    // If a file was provided, mark it as migrated in the high-priority list
    if (fileToMark) {
      const escapedFilePath = fileToMark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fileRegex = new RegExp(`- \\[ \\] \`${escapedFilePath}\``, 'g');
      taskContent = taskContent.replace(fileRegex, `- [x] \`${fileToMark}\``);
      console.log(`Marked ${fileToMark} as migrated`);
    }
    
    fs.writeFileSync(TASK_FILE, taskContent);
    console.log(`Updated migration progress: ${migratedCount}/${totalCount} (${progressPercentage}%)`);
  } catch (error) {
    console.error('Error updating task file:', error);
  }
}

// Main function
function main() {
  const totalCount = getTotalFilesToMigrate();
  let migratedCount = getCurrentProgress();
  
  // If a file was provided, increment the migrated count
  if (fileToMark) {
    migratedCount++;
  }
  
  updateTaskFile(migratedCount, totalCount);
}

main();