/**
 * Test script for player plus-minus statistics functionality
 * 
 * This script demonstrates how to:
 * 1. Fetch player plus-minus data from an API
 * 2. Store it in Firestore
 * 3. Set up real-time updates
 */

const { fetchPlayerPlusMinus, schedulePlayerPlusMinusUpdates } = require('../services/playerStatsService');

// Sample game ID - replace with a real game ID from your system
const SAMPLE_GAME_ID = 'nba_2025_03_16_lal_bos';

// Function to test fetching player plus-minus data
async function testFetchPlayerPlusMinus() {
  console.log(`Fetching player plus-minus data for game: ${SAMPLE_GAME_ID}`);
  
  try {
    await fetchPlayerPlusMinus(SAMPLE_GAME_ID);
    console.log('Successfully fetched and stored player plus-minus data');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Function to test scheduling updates
function testScheduleUpdates() {
  console.log(`Setting up scheduled updates for game: ${SAMPLE_GAME_ID}`);
  
  // Schedule updates every 30 seconds for testing purposes
  // In production, you would use a longer interval like 1-2 minutes
  const stopUpdates = schedulePlayerPlusMinusUpdates(SAMPLE_GAME_ID, 0.5);
  
  console.log('Updates scheduled. Will run for 2 minutes for testing purposes.');
  
  // Stop updates after 2 minutes
  setTimeout(() => {
    stopUpdates();
    console.log('Scheduled updates stopped');
  }, 2 * 60 * 1000);
}

// Run the tests
async function runTests() {
  // First, fetch data once
  await testFetchPlayerPlusMinus();
  
  // Then set up scheduled updates
  testScheduleUpdates();
}

// Execute the tests
runTests().catch(console.error);

/**
 * Usage instructions:
 * 
 * 1. Make sure your Firebase config is properly set up
 * 2. Replace SAMPLE_GAME_ID with a real game ID
 * 3. Run this script with: node scripts/test-player-stats.js
 * 
 * Expected output:
 * - Initial fetch of player data
 * - Updates every 30 seconds for 2 minutes
 * - Data stored in Firestore collection 'playerPlusMinus'
 */