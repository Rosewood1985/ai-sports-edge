#!/usr/bin/env node

/**
 * Daily Recap Generator
 * 
 * This script generates a daily recap from the batch-review.md and status-log.md files.
 * It's designed to be run at 9 AM as specified in the context checkpoint file.
 */

const fs = require('fs');
const path = require('path');

// File paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BATCH_REVIEW_FILE = path.join(PROJECT_ROOT, 'batch-review.md');
const STATUS_LOG_FILE = path.join(PROJECT_ROOT, 'status', 'status-log.md');
const RECAP_DIR = path.join(PROJECT_ROOT, 'recaps');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'daily-recap.log');

// Ensure directories exist
if (!fs.existsSync(RECAP_DIR)) {
  fs.mkdirSync(RECAP_DIR, { recursive: true });
}
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
 * Get the current date in YYYY-MM-DD format
 * @returns {string} - Current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Extract recent entries from the status log
 * @returns {string} - Recent entries from the status log
 */
function extractStatusLogEntries() {
  try {
    if (!fileExists(STATUS_LOG_FILE)) {
      log('Status log file does not exist');
      return 'Status log file not found';
    }

    const content = fs.readFileSync(STATUS_LOG_FILE, 'utf8');
    const lines = content.split('\n');
    
    // Find the most recent entries (last 2 major sections)
    let sections = [];
    let currentSection = [];
    let sectionCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for major section headers (## ...)
      if (line.startsWith('## ')) {
        if (currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
          currentSection = [];
          sectionCount++;
          
          // Only keep the last 2 sections
          if (sectionCount > 2) {
            sections.shift();
          }
        }
      }
      
      currentSection.push(line);
    }
    
    // Add the last section if it exists
    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
      
      // Only keep the last 2 sections
      if (sections.length > 2) {
        sections.shift();
      }
    }
    
    return sections.join('\n\n');
  } catch (error) {
    log(`Error extracting status log entries: ${error.message}`);
    return 'Error extracting status log entries';
  }
}

/**
 * Extract pending reviews from the batch review file
 * @returns {string} - Pending reviews from the batch review file
 */
function extractBatchReviews() {
  try {
    if (!fileExists(BATCH_REVIEW_FILE)) {
      log('Batch review file does not exist');
      return 'Batch review file not found';
    }

    const content = fs.readFileSync(BATCH_REVIEW_FILE, 'utf8');
    
    // Extract the "Pending Reviews" section
    const pendingMatch = content.match(/## Pending Reviews\s*\n([\s\S]*?)(?=\n##|$)/);
    const pendingReviews = pendingMatch ? pendingMatch[1].trim() : 'No pending reviews found';
    
    // Extract the "Completed Reviews" section
    const completedMatch = content.match(/## Completed Reviews\s*\n([\s\S]*?)(?=\n##|$)/);
    const completedReviews = completedMatch ? completedMatch[1].trim() : 'No completed reviews found';
    
    return `## Pending Reviews\n\n${pendingReviews}\n\n## Completed Reviews\n\n${completedReviews}`;
  } catch (error) {
    log(`Error extracting batch reviews: ${error.message}`);
    return 'Error extracting batch reviews';
  }
}

/**
 * Generate the daily recap
 */
function generateDailyRecap() {
  try {
    log('Generating daily recap...');
    
    const currentDate = getCurrentDate();
    const recapFile = path.join(RECAP_DIR, `daily-recap-${currentDate}.md`);
    
    // Extract content from status log and batch review
    const statusLogEntries = extractStatusLogEntries();
    const batchReviews = extractBatchReviews();
    
    // Generate the recap content
    const recapContent = `# Daily Recap - ${currentDate}

## 🧠 Current Context

${fs.readFileSync(path.join(PROJECT_ROOT, 'context', 'latest-checkpoint.md'), 'utf8').split('---')[0].trim()}

## 📋 Batch Reviews

${batchReviews}

## 📊 Recent Status Updates

${statusLogEntries}

---

Generated at: ${new Date().toISOString()}
`;
    
    // Write the recap to a file
    fs.writeFileSync(recapFile, recapContent);
    
    log(`Daily recap generated successfully: ${recapFile}`);
    console.log(`\n✅ Daily recap generated: ${recapFile}`);
    
    // Also output the recap to the console
    console.log('\n=== DAILY RECAP ===\n');
    console.log(`Date: ${currentDate}`);
    console.log('\nPending Reviews:');
    console.log(batchReviews.split('## Completed Reviews')[0].replace('## Pending Reviews', '').trim());
    console.log('\nRecent Status Updates:');
    const statusSummary = statusLogEntries.split('\n').filter(line => line.startsWith('## ')).join('\n').replace(/^## /gm, '- ');
    console.log(statusSummary || 'No recent updates');
    console.log('\n===================\n');
    
  } catch (error) {
    log(`Error generating daily recap: ${error.message}`);
    console.error(`Error generating daily recap: ${error.message}`);
  }
}

// Run the generator
generateDailyRecap();