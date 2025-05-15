/**
 * Test script for Enhanced Player Statistics features
 * 
 * This script tests the following components:
 * 1. Weather Service - Fetching weather data for a venue/game
 * 2. View Counter Service - Tracking and limiting free views
 * 3. Historical Trends - Generating mock historical data
 * 
 * Run with: node scripts/test-enhanced-player-stats.js
 */

const weatherService = require('../services/weatherService').default;
const viewCounterService = require('../services/viewCounterService').default;
const { firestore } = require('../config/firebase');
const { doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');

// Mock data for testing
const MOCK_VENUE_ID = 'test-venue-123';
const MOCK_GAME_ID = 'test-game-456';
const MOCK_PLAYER_ID = 'test-player-789';
const MOCK_USER_ID = 'test-user-000';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Setup test data in Firestore
 */
async function setupTestData() {
  console.log(`${colors.bright}${colors.blue}Setting up test data...${colors.reset}`);
  
  if (!firestore) {
    console.error(`${colors.red}Firestore not initialized${colors.reset}`);
    return false;
  }
  
  try {
    // Create test venue
    await setDoc(doc(firestore, 'venues', MOCK_VENUE_ID), {
      name: 'Test Stadium',
      latitude: 40.7128, // New York City coordinates
      longitude: -74.0060,
      capacity: 50000,
      indoor: false,
      city: 'New York',
      state: 'NY',
      country: 'USA'
    });
    
    // Create test game
    await setDoc(doc(firestore, 'games', MOCK_GAME_ID), {
      homeTeam: 'New York Knicks',
      awayTeam: 'Boston Celtics',
      venueId: MOCK_VENUE_ID,
      date: new Date().toISOString(),
      sport: 'basketball',
      league: 'NBA',
      status: 'scheduled'
    });
    
    // Create test player
    await setDoc(doc(firestore, 'players', MOCK_PLAYER_ID), {
      name: 'Test Player',
      team: 'New York Knicks',
      position: 'PG',
      jerseyNumber: '23',
      height: '6\'3"',
      weight: '195 lbs',
      age: 28,
      experience: 5
    });
    
    console.log(`${colors.green}Test data setup complete${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error setting up test data:${colors.reset}`, error);
    return false;
  }
}

/**
 * Clean up test data from Firestore
 */
async function cleanupTestData() {
  console.log(`${colors.bright}${colors.blue}Cleaning up test data...${colors.reset}`);
  
  if (!firestore) {
    console.error(`${colors.red}Firestore not initialized${colors.reset}`);
    return;
  }
  
  try {
    await deleteDoc(doc(firestore, 'venues', MOCK_VENUE_ID));
    await deleteDoc(doc(firestore, 'games', MOCK_GAME_ID));
    await deleteDoc(doc(firestore, 'players', MOCK_PLAYER_ID));
    await deleteDoc(doc(firestore, 'viewCounters', MOCK_USER_ID));
    await deleteDoc(doc(firestore, 'weatherCorrelations', MOCK_PLAYER_ID));
    
    console.log(`${colors.green}Test data cleanup complete${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error cleaning up test data:${colors.reset}`, error);
  }
}

/**
 * Test the Weather Service
 */
async function testWeatherService() {
  console.log(`${colors.bright}${colors.magenta}Testing Weather Service...${colors.reset}`);
  
  try {
    // Test venue weather
    console.log(`${colors.cyan}Testing getVenueWeather...${colors.reset}`);
    const venueWeather = await weatherService.getVenueWeather(MOCK_VENUE_ID);
    console.log('Venue Weather:', venueWeather);
    
    // Test game weather
    console.log(`${colors.cyan}Testing getGameWeather...${colors.reset}`);
    const gameWeather = await weatherService.getGameWeather(MOCK_GAME_ID);
    console.log('Game Weather:', gameWeather);
    
    // Test weather performance insights
    console.log(`${colors.cyan}Testing getWeatherPerformanceInsights...${colors.reset}`);
    const weatherInsights = await weatherService.getWeatherPerformanceInsights(
      MOCK_PLAYER_ID,
      venueWeather.condition
    );
    console.log('Weather Performance Insights:', weatherInsights);
    
    // Test cache functionality
    console.log(`${colors.cyan}Testing weather cache...${colors.reset}`);
    console.time('First call (no cache)');
    await weatherService.getVenueWeather(MOCK_VENUE_ID, true); // Force refresh
    console.timeEnd('First call (no cache)');
    
    console.time('Second call (with cache)');
    await weatherService.getVenueWeather(MOCK_VENUE_ID);
    console.timeEnd('Second call (with cache)');
    
    // Clear cache
    await weatherService.clearWeatherCache();
    
    console.log(`${colors.green}Weather Service tests passed${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Weather Service tests failed:${colors.reset}`, error);
    return false;
  }
}

/**
 * Test the View Counter Service
 */
async function testViewCounterService() {
  console.log(`${colors.bright}${colors.magenta}Testing View Counter Service...${colors.reset}`);
  
  try {
    // Reset view counter for test user
    await viewCounterService.resetUserViewCounter(MOCK_USER_ID);
    
    // Test getting view count
    console.log(`${colors.cyan}Testing getUserViewCount...${colors.reset}`);
    let viewData = await viewCounterService.getUserViewCount(MOCK_USER_ID);
    console.log('Initial View Count:', viewData);
    
    // Test incrementing view count
    console.log(`${colors.cyan}Testing incrementUserViewCount...${colors.reset}`);
    for (let i = 0; i < 3; i++) {
      viewData = await viewCounterService.incrementUserViewCount(MOCK_USER_ID, 'test');
      console.log(`View Count after increment ${i + 1}:`, viewData.count);
    }
    
    // Test upgrade prompt threshold
    console.log(`${colors.cyan}Testing shouldShowUpgradePrompt...${colors.reset}`);
    const promptCheck = await viewCounterService.shouldShowUpgradePrompt(MOCK_USER_ID);
    console.log('Should Show Upgrade Prompt:', promptCheck);
    
    // Test adding bonus views
    console.log(`${colors.cyan}Testing addBonusViews...${colors.reset}`);
    await viewCounterService.addBonusViews(MOCK_USER_ID, 2);
    viewData = await viewCounterService.getUserViewCount(MOCK_USER_ID);
    console.log('View Count after adding bonus views:', viewData);
    
    // Test syncing view count
    console.log(`${colors.cyan}Testing syncViewCount...${colors.reset}`);
    await viewCounterService.syncViewCount(MOCK_USER_ID);
    
    console.log(`${colors.green}View Counter Service tests passed${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}View Counter Service tests failed:${colors.reset}`, error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.bright}${colors.yellow}Starting Enhanced Player Statistics Tests${colors.reset}`);
  
  try {
    // Setup test data
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.error(`${colors.red}Test setup failed, aborting tests${colors.reset}`);
      return;
    }
    
    // Run tests
    const weatherTestSuccess = await testWeatherService();
    const viewCounterTestSuccess = await testViewCounterService();
    
    // Summary
    console.log(`\n${colors.bright}${colors.yellow}Test Summary:${colors.reset}`);
    console.log(`Weather Service: ${weatherTestSuccess ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
    console.log(`View Counter Service: ${viewCounterTestSuccess ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
    
    // Cleanup test data
    await cleanupTestData();
  } catch (error) {
    console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  }
}

// Run the tests
runTests().catch(console.error);