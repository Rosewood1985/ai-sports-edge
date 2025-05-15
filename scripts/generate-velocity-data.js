#!/usr/bin/env node
/**
 * AI Sports Edge - Generate Velocity Data
 * 
 * This script analyzes git commits, Firebase migration tracking data, and project logs
 * to generate velocity metrics for the team dashboard.
 * 
 * The data is stored in Firebase Firestore for use by the VelocityChart component.
 */

// Add logging
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } = require('firebase/firestore');

// Ensure .roocode directory exists
if (!fs.existsSync('.roocode')) {
  fs.mkdirSync('.roocode');
}

// Log script execution
fs.appendFileSync('.roocode/tool_usage.log', `${new Date()}: Running ${path.basename(__filename)}\n`);

// Firebase configuration
const firebaseConfig = require('../src/config/firebase').firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration
const WEEKS_TO_ANALYZE = 8; // Number of weeks to analyze
const MIGRATION_LOG_DIR = '.roocode/migration_logs'; // Directory for migration logs
const VELOCITY_COLLECTION = 'projectMetrics'; // Firestore collection for velocity data

// Ensure migration log directory exists
if (!fs.existsSync(MIGRATION_LOG_DIR)) {
  fs.mkdirSync(MIGRATION_LOG_DIR, { recursive: true });
}

/**
 * Get the date for the end of a week (Sunday) given a week offset from current date
 * @param {number} weeksAgo - Number of weeks ago
 * @returns {Date} - Date object for the end of the specified week
 */
function getWeekEndDate(weeksAgo) {
  const date = new Date();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Move to the most recent Sunday
  date.setDate(date.getDate() - dayOfWeek);
  
  // Move back by the specified number of weeks
  date.setDate(date.getDate() - (7 * weeksAgo));
  
  // Set to end of day
  date.setHours(23, 59, 59, 999);
  
  return date;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get git commits for a specific week
 * @param {Date} startDate - Start date for the week
 * @param {Date} endDate - End date for the week
 * @returns {Array} - Array of commit objects
 */
function getGitCommits(startDate, endDate) {
  try {
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // Get git log for the date range
    const gitCommand = `git log --since="${startDateStr}" --until="${endDateStr}" --pretty=format:"%h|%an|%ad|%s" --date=short`;
    const output = execSync(gitCommand, { encoding: 'utf8' });
    
    // Parse git log output
    return output.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [hash, author, date, subject] = line.split('|');
        return { hash, author, date, subject };
      });
  } catch (error) {
    console.error(`Error getting git commits: ${error.message}`);
    return [];
  }
}

/**
 * Count completed tasks from commit messages
 * @param {Array} commits - Array of commit objects
 * @returns {number} - Number of completed tasks
 */
function countCompletedTasks(commits) {
  // Look for keywords indicating completed tasks
  const taskKeywords = [
    'fix', 'implement', 'add', 'update', 'complete', 'finish',
    'resolve', 'close', 'addresses', 'fixes', 'completes'
  ];
  
  // Count commits that likely represent completed tasks
  return commits.filter(commit => {
    const subject = commit.subject.toLowerCase();
    return taskKeywords.some(keyword => subject.includes(keyword));
  }).length;
}

/**
 * Estimate story points from commit messages
 * @param {Array} commits - Array of commit objects
 * @returns {number} - Estimated story points
 */
function estimateStoryPoints(commits) {
  // Base story points on commit message complexity and keywords
  let storyPoints = 0;
  
  commits.forEach(commit => {
    const subject = commit.subject.toLowerCase();
    
    // Large features or refactorings (5-8 points)
    if (subject.includes('refactor') || 
        subject.includes('feature') || 
        subject.includes('implement') || 
        subject.includes('integration')) {
      storyPoints += 5;
    }
    // Medium tasks (3 points)
    else if (subject.includes('add') || 
             subject.includes('update') || 
             subject.includes('improve')) {
      storyPoints += 3;
    }
    // Small fixes (1 point)
    else if (subject.includes('fix') || 
             subject.includes('tweak') || 
             subject.includes('adjust')) {
      storyPoints += 1;
    }
    // Default (1 point)
    else {
      storyPoints += 1;
    }
  });
  
  return storyPoints;
}

/**
 * Get migration data for a specific week
 * @param {Date} startDate - Start date for the week
 * @param {Date} endDate - End date for the week
 * @returns {Object} - Migration metrics
 */
function getMigrationData(startDate, endDate) {
  try {
    // Check if Firebase migration tracker logs exist
    const migrationLogFile = path.join(MIGRATION_LOG_DIR, `migration-${formatDate(startDate)}-to-${formatDate(endDate)}.json`);
    
    if (fs.existsSync(migrationLogFile)) {
      // Read from existing log file
      const logData = JSON.parse(fs.readFileSync(migrationLogFile, 'utf8'));
      return {
        migratedFiles: logData.migratedFiles || 0,
        totalFiles: logData.totalFiles || 0,
        completedPhases: logData.completedPhases || 0
      };
    }
    
    // If no log file exists, try to get data from firebase-migration-tracker.sh output
    const trackerCommand = 'scripts/firebase-migration-tracker.sh status';
    let trackerOutput;
    
    try {
      trackerOutput = execSync(trackerCommand, { encoding: 'utf8' });
    } catch (error) {
      console.log('Migration tracker not available, using estimates');
      return estimateMigrationData(startDate, endDate);
    }
    
    // Parse tracker output
    const migratedMatch = trackerOutput.match(/Migrated:\s+(\d+)/);
    const totalMatch = trackerOutput.match(/Total:\s+(\d+)/);
    const phasesMatch = trackerOutput.match(/Completed Phases:\s+(\d+)/);
    
    const migratedFiles = migratedMatch ? parseInt(migratedMatch[1]) : 0;
    const totalFiles = totalMatch ? parseInt(totalMatch[1]) : 0;
    const completedPhases = phasesMatch ? parseInt(phasesMatch[1]) : 0;
    
    // Save to log file for future reference
    const logData = { migratedFiles, totalFiles, completedPhases };
    fs.writeFileSync(migrationLogFile, JSON.stringify(logData, null, 2));
    
    return logData;
  } catch (error) {
    console.error(`Error getting migration data: ${error.message}`);
    return estimateMigrationData(startDate, endDate);
  }
}

/**
 * Estimate migration data based on git commits
 * @param {Date} startDate - Start date for the week
 * @param {Date} endDate - End date for the week
 * @returns {Object} - Estimated migration metrics
 */
function estimateMigrationData(startDate, endDate) {
  const commits = getGitCommits(startDate, endDate);
  
  // Count commits related to Firebase migration
  const migrationCommits = commits.filter(commit => {
    const subject = commit.subject.toLowerCase();
    return subject.includes('firebase') || 
           subject.includes('migration') || 
           subject.includes('refactor');
  });
  
  // Estimate 2-5 files per migration commit
  const migratedFiles = migrationCommits.reduce((total, commit) => {
    const subject = commit.subject.toLowerCase();
    if (subject.includes('multiple') || subject.includes('batch')) {
      return total + 5;
    } else {
      return total + 2;
    }
  }, 0);
  
  return {
    migratedFiles,
    totalFiles: 100, // Placeholder estimate
    completedPhases: 0
  };
}

/**
 * Generate velocity data for a specific week
 * @param {number} weeksAgo - Number of weeks ago
 * @returns {Object} - Velocity data for the week
 */
async function generateVelocityData(weeksAgo) {
  // Calculate week start and end dates
  const endDate = getWeekEndDate(weeksAgo);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  
  console.log(`Analyzing week ${formatDate(startDate)} to ${formatDate(endDate)}`);
  
  // Get git commits for the week
  const commits = getGitCommits(startDate, endDate);
  console.log(`Found ${commits.length} commits`);
  
  // Count completed tasks
  const completedTasks = countCompletedTasks(commits);
  
  // Estimate story points
  const storyPoints = estimateStoryPoints(commits);
  
  // Get migration data
  const migrationData = getMigrationData(startDate, endDate);
  
  // Return velocity data
  return {
    weekStarting: startDate,
    weekEnding: endDate,
    completedTasks,
    storyPoints,
    migratedFiles: migrationData.migratedFiles,
    totalFiles: migrationData.totalFiles,
    completedPhases: migrationData.completedPhases,
    commits: commits.length
  };
}

/**
 * Store velocity data in Firebase
 * @param {Object} velocityData - Velocity data to store
 */
async function storeVelocityData(velocityData) {
  try {
    // Check if data for this week already exists
    const velocityRef = collection(db, VELOCITY_COLLECTION);
    const startTimestamp = Timestamp.fromDate(velocityData.weekStarting);
    const endTimestamp = Timestamp.fromDate(velocityData.weekEnding);
    
    const q = query(
      velocityRef, 
      where('weekStarting', '==', startTimestamp),
      where('weekEnding', '==', endTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log(`Data for week ${formatDate(velocityData.weekStarting)} already exists`);
      return;
    }
    
    // Convert dates to Firestore timestamps
    const firestoreData = {
      ...velocityData,
      weekStarting: startTimestamp,
      weekEnding: endTimestamp,
      updatedAt: Timestamp.now()
    };
    
    // Add data to Firestore
    await addDoc(collection(db, VELOCITY_COLLECTION), firestoreData);
    console.log(`Stored velocity data for week ${formatDate(velocityData.weekStarting)}`);
  } catch (error) {
    console.error(`Error storing velocity data: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Generating velocity data...');
  
  // Generate velocity data for each week
  for (let i = WEEKS_TO_ANALYZE - 1; i >= 0; i--) {
    const velocityData = await generateVelocityData(i);
    await storeVelocityData(velocityData);
  }
  
  console.log('Velocity data generation complete');
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});