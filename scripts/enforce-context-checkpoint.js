#!/usr/bin/env node

/**
 * Context Checkpoint Enforcement System
 * 
 * This script enforces the behavior specified in the context checkpoint file.
 * It reads the checkpoint file, parses the primary mode and behavior flags,
 * and enforces them by setting environment variables and executing appropriate actions.
 * 
 * The script should be run at the beginning of every new session or context reload.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHECKPOINT_FILE = path.join(PROJECT_ROOT, 'context', 'latest-checkpoint.md');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'context-checkpoint-enforce.log');

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
 * Parse the checkpoint file to extract primary mode and behavior flags
 * @returns {Object|null} - Object containing primary mode and behavior flags, or null if parsing fails
 */
function parseCheckpointFile() {
  try {
    if (!fileExists(CHECKPOINT_FILE)) {
      log('❗ Checkpoint missing. Awaiting reinitialization.');
      return null;
    }

    const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    
    // Parse primary mode
    const primaryModeMatch = content.match(/### 🔘 Primary Mode.*?\n((?:- \[[x ]\].*?\n)+)/s);
    if (!primaryModeMatch) {
      log('Error: Could not parse primary mode from checkpoint file');
      return null;
    }
    
    const primaryModeLines = primaryModeMatch[1].trim().split('\n');
    let primaryMode = null;
    
    for (const line of primaryModeLines) {
      const modeMatch = line.match(/- \[([x ])\] (.*)/);
      if (modeMatch && modeMatch[1].trim() === 'x') {
        primaryMode = modeMatch[2].trim();
        break;
      }
    }
    
    if (!primaryMode) {
      log('Error: No primary mode selected in checkpoint file');
      return null;
    }
    
    // Parse behavior flags
    const behaviorFlagsMatch = content.match(/### 🧩 Optional Behavior Flags.*?\n((?:- \[[x ]\].*?\n)+)/s);
    if (!behaviorFlagsMatch) {
      log('Error: Could not parse behavior flags from checkpoint file');
      return null;
    }
    
    const behaviorFlagsLines = behaviorFlagsMatch[1].trim().split('\n');
    const behaviorFlags = [];
    
    for (const line of behaviorFlagsLines) {
      const flagMatch = line.match(/- \[([x ])\] (.*)/);
      if (flagMatch && flagMatch[1].trim() === 'x') {
        behaviorFlags.push(flagMatch[2].trim());
      }
    }
    
    return {
      primaryMode,
      behaviorFlags
    };
  } catch (error) {
    log(`Error parsing checkpoint file: ${error.message}`);
    return null;
  }
}

/**
 * Enforce the primary mode
 * @param {string} mode - The primary mode to enforce
 */
function enforcePrimaryMode(mode) {
  log(`Enforcing primary mode: ${mode}`);
  
  switch (mode) {
    case 'cleaning-only':
      log('Setting cleaning-only mode: Only code cleanup and refactoring allowed');
      process.env.ROO_PRIMARY_MODE = 'cleaning-only';
      break;
    case 'generation-allowed':
      log('Setting generation-allowed mode: Code generation is permitted');
      process.env.ROO_PRIMARY_MODE = 'generation-allowed';
      break;
    case 'read-only':
      log('Setting read-only mode: No file modifications allowed');
      process.env.ROO_PRIMARY_MODE = 'read-only';
      break;
    case 'consolidation-mode':
      log('Setting consolidation-mode: Focus on memory bank consolidation');
      process.env.ROO_PRIMARY_MODE = 'consolidation-mode';
      break;
    case 'formatting-mode':
      log('Setting formatting-mode: Focus on code formatting');
      process.env.ROO_PRIMARY_MODE = 'formatting-mode';
      break;
    case 'deployment-mode':
      log('Setting deployment-mode: Focus on deployment tasks');
      process.env.ROO_PRIMARY_MODE = 'deployment-mode';
      break;
    case 'review-mode':
      log('Setting review-mode: Focus on code review');
      process.env.ROO_PRIMARY_MODE = 'review-mode';
      break;
    case 'test-mode':
      log('Setting test-mode: Focus on testing');
      process.env.ROO_PRIMARY_MODE = 'test-mode';
      break;
    default:
      log(`Warning: Unknown primary mode "${mode}"`);
      process.env.ROO_PRIMARY_MODE = 'unknown';
  }
}

/**
 * Enforce behavior flags
 * @param {string[]} flags - The behavior flags to enforce
 */
function enforceBehaviorFlags(flags) {
  log(`Enforcing behavior flags: ${flags.join(', ')}`);
  
  // Set environment variables for all flags
  process.env.ROO_BEHAVIOR_FLAGS = flags.join(',');
  
  // Enforce specific flags
  for (const flag of flags) {
    switch (flag) {
      case 'no new file creation allowed':
        log('Enforcing: No new file creation allowed');
        process.env.ROO_NO_NEW_FILES = 'true';
        break;
      case 'memory-bank consolidation active':
        log('Enforcing: Memory bank consolidation active');
        process.env.ROO_MEMORY_BANK_CONSOLIDATION = 'true';
        break;
      case 'format with Prettier after each save':
        log('Enforcing: Format with Prettier after each save');
        process.env.ROO_FORMAT_WITH_PRETTIER = 'true';
        break;
      case 'allow code generation for missing modules':
        log('Enforcing: Allow code generation for missing modules');
        process.env.ROO_ALLOW_CODE_GENERATION = 'true';
        break;
      case 'auto-run test suite after file edits':
        log('Enforcing: Auto-run test suite after file edits');
        process.env.ROO_AUTO_RUN_TESTS = 'true';
        break;
      case 'auto-trigger deploy after checkpoint update':
        log('Enforcing: Auto-trigger deploy after checkpoint update');
        process.env.ROO_AUTO_TRIGGER_DEPLOY = 'true';
        break;
      case 'read-only for audit: no saves or formatting':
        log('Enforcing: Read-only for audit');
        process.env.ROO_READ_ONLY_AUDIT = 'true';
        break;
      default:
        log(`Warning: Unknown behavior flag "${flag}"`);
    }
  }
}

/**
 * Enforce the context checkpoint
 */
function enforceContextCheckpoint() {
  try {
    log('Starting context checkpoint enforcement...');
    
    // Parse the checkpoint file
    const checkpoint = parseCheckpointFile();
    if (!checkpoint) {
      log('Failed to parse checkpoint file, aborting enforcement');
      process.exit(1);
    }
    
    // Enforce primary mode
    enforcePrimaryMode(checkpoint.primaryMode);
    
    // Enforce behavior flags
    enforceBehaviorFlags(checkpoint.behaviorFlags);
    
    log('Context checkpoint enforcement completed successfully');
    
    // Output the current state
    console.log('\n✅ Roo Context Checkpoint Enforced');
    console.log(`🔘 Primary Mode: ${checkpoint.primaryMode}`);
    console.log('🧩 Active Behavior Flags:');
    for (const flag of checkpoint.behaviorFlags) {
      console.log(`  - ${flag}`);
    }
    console.log('\n');
    
  } catch (error) {
    log(`Error enforcing context checkpoint: ${error.message}`);
    process.exit(1);
  }
}

// Run the enforcement
enforceContextCheckpoint();