#!/usr/bin/env node

/**
 * Context Checkpoint System
 * 
 * This script updates the context checkpoint file based on specified triggers:
 * - Current mode changes
 * - Status log updates
 * - Memory-bank file modifications
 * - Progress milestones
 * 
 * The checkpoint file serves as a required boot context that must be loaded
 * at the beginning of every new session or context reload.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHECKPOINT_FILE = path.join(PROJECT_ROOT, 'context', 'latest-checkpoint.md');
const STATUS_LOG_FILE = path.join(PROJECT_ROOT, 'status', 'status-log.md');
const PROGRESS_FILE = path.join(PROJECT_ROOT, 'memory-bank', 'progress.md');
const MEMORY_BANK_DIR = path.join(PROJECT_ROOT, 'memory-bank');
const BATCH_REVIEW_FILE = path.join(PROJECT_ROOT, 'batch-review.md');

// Logging
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'context-checkpoint-update.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log a message to the log file
 * @param {string} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if the file exists, false otherwise
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    log(`Error checking if file exists: ${error.message}`);
    return false;
  }
}

/**
 * Get the last modified time of a file
 * @param {string} filePath - Path to the file
 * @returns {Date|null} - Last modified time or null if file doesn't exist
 */
function getLastModifiedTime(filePath) {
  try {
    if (fileExists(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.mtime;
    }
    return null;
  } catch (error) {
    log(`Error getting last modified time: ${error.message}`);
    return null;
  }
}

/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} - Current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Update the timestamp in the checkpoint file
 * @param {string} content - The content of the checkpoint file
 * @returns {string} - Updated content with new timestamp
 */
function updateTimestamp(content) {
  const currentDate = getCurrentDate();
  return content.replace(/Last Updated: .*/, `Last Updated: ${currentDate}`);
}

/**
 * Check if the batch review file exists, create it if it doesn't
 */
function ensureBatchReviewExists() {
  if (!fileExists(BATCH_REVIEW_FILE)) {
    log('Creating batch-review.md file...');
    const content = `# Batch Review

Last Updated: ${getCurrentDate()}

## Pending Reviews

- None

## Completed Reviews

- None

## Notes

- Initial batch review file created by context checkpoint system
`;
    fs.writeFileSync(BATCH_REVIEW_FILE, content);
    log('Created batch-review.md file');
  }
}

/**
 * Check if any memory bank files have been modified
 * @param {Date} lastCheckpointUpdate - Last time the checkpoint was updated
 * @returns {boolean} - True if any memory bank files have been modified
 */
function checkMemoryBankModifications(lastCheckpointUpdate) {
  try {
    if (!fileExists(MEMORY_BANK_DIR)) {
      log('Memory bank directory does not exist');
      return false;
    }

    const files = fs.readdirSync(MEMORY_BANK_DIR);
    for (const file of files) {
      const filePath = path.join(MEMORY_BANK_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtime > lastCheckpointUpdate) {
        log(`Memory bank file modified: ${file}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log(`Error checking memory bank modifications: ${error.message}`);
    return false;
  }
}

/**
 * Check if the status log has been updated
 * @param {Date} lastCheckpointUpdate - Last time the checkpoint was updated
 * @returns {boolean} - True if the status log has been updated
 */
function checkStatusLogUpdates(lastCheckpointUpdate) {
  try {
    if (!fileExists(STATUS_LOG_FILE)) {
      log('Status log file does not exist');
      return false;
    }

    const statusLogModified = getLastModifiedTime(STATUS_LOG_FILE);
    if (statusLogModified && statusLogModified > lastCheckpointUpdate) {
      log('Status log has been updated');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error checking status log updates: ${error.message}`);
    return false;
  }
}

/**
 * Check if new milestones have been added to the progress file
 * @param {Date} lastCheckpointUpdate - Last time the checkpoint was updated
 * @returns {boolean} - True if new milestones have been added
 */
function checkProgressMilestones(lastCheckpointUpdate) {
  try {
    if (!fileExists(PROGRESS_FILE)) {
      log('Progress file does not exist');
      return false;
    }

    const progressModified = getLastModifiedTime(PROGRESS_FILE);
    if (progressModified && progressModified > lastCheckpointUpdate) {
      log('Progress file has been updated');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error checking progress milestones: ${error.message}`);
    return false;
  }
}

/**
 * Update the context checkpoint file
 */
function updateContextCheckpoint() {
  try {
    log('Starting context checkpoint update...');

    // Check if checkpoint file exists
    if (!fileExists(CHECKPOINT_FILE)) {
      log('Checkpoint file does not exist, creating it...');
      // This shouldn't happen as we've already created it, but just in case
      return;
    }

    // Get last checkpoint update time
    const lastCheckpointUpdate = getLastModifiedTime(CHECKPOINT_FILE);
    if (!lastCheckpointUpdate) {
      log('Could not determine last checkpoint update time');
      return;
    }

    // Check if any triggers have been activated
    const memoryBankModified = checkMemoryBankModifications(lastCheckpointUpdate);
    const statusLogUpdated = checkStatusLogUpdates(lastCheckpointUpdate);
    const progressUpdated = checkProgressMilestones(lastCheckpointUpdate);

    // If any triggers are activated, update the checkpoint file
    if (memoryBankModified || statusLogUpdated || progressUpdated) {
      log('Triggers activated, updating checkpoint file...');
      
      // Read the current content
      const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
      
      // Update the timestamp
      const updatedContent = updateTimestamp(content);
      
      // Write the updated content
      fs.writeFileSync(CHECKPOINT_FILE, updatedContent);
      
      log('Checkpoint file updated successfully');
    } else {
      log('No triggers activated, checkpoint file remains unchanged');
    }

    // Ensure batch review file exists
    ensureBatchReviewExists();

  } catch (error) {
    log(`Error updating context checkpoint: ${error.message}`);
  }
}

// Run the update
updateContextCheckpoint();