#!/usr/bin/env node

/**
 * Test script for geolocation features
 *
 * This script tests the geolocation features across different locations and devices.
 * It simulates different locations and devices to ensure the features work correctly.
 *
 * Usage:
 *   node scripts/test-geolocation-features.js
 */

const axios = require('axios');
const chalk = require('chalk');

const { cacheService } = require('../services/cacheService');
const { geolocationService } = require('../services/geolocationService');
const { venueService } = require('../services/venueService');

// Mock Platform for testing
global.Platform = {
  OS: 'web', // Simulate web platform
};

// Test locations
const TEST_LOCATIONS = [
  {
    name: 'New York',
    data: {
      city: 'New York',
      state: 'New York',
      country: 'United States',
      latitude: 40.7128,
      longitude: -74.006,
      timezone: 'America/New_York',
    },
  },
  {
    name: 'Los Angeles',
    data: {
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      latitude: 34.0522,
      longitude: -118.2437,
      timezone: 'America/Los_Angeles',
    },
  },
  {
    name: 'Chicago',
    data: {
      city: 'Chicago',
      state: 'Illinois',
      country: 'United States',
      latitude: 41.8781,
      longitude: -87.6298,
      timezone: 'America/Chicago',
    },
  },
  {
    name: 'London',
    data: {
      city: 'London',
      state: 'England',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
    },
  },
];

// Test platforms
const TEST_PLATFORMS = [
  { name: 'Web', os: 'web' },
  { name: 'iOS', os: 'ios' },
  { name: 'Android', os: 'android' },
];

/**
 * Run tests for a specific location and platform
 * @param {Object} location Test location
 * @param {Object} platform Test platform
 */
async function runTest(location, platform) {
  console.log(chalk.blue(`\n=== Testing ${location.name} on ${platform.name} ===`));

  try {
    // Set platform for testing
    global.Platform.OS = platform.os;

    // Mock the getUserLocation method to return the test location
    const originalGetUserLocation = geolocationService.getUserLocation;
    geolocationService.getUserLocation = async () => location.data;

    // Clear cache before testing
    await cacheService.clearAll();
    geolocationService.clearCache();

    // Test 1: Get local teams
    console.log(chalk.yellow('\nTesting getLocalTeams:'));
    const teams = await geolocationService.getLocalTeams(location.data, false);
    console.log(`Found ${teams.length} teams for ${location.name}:`);
    console.log(teams);

    // Test 2: Get localized odds suggestions
    console.log(chalk.yellow('\nTesting getLocalizedOddsSuggestions:'));
    const suggestions = await geolocationService.getLocalizedOddsSuggestions(teams);
    console.log(`Found ${suggestions.length} odds suggestions:`);
    suggestions.forEach(suggestion => {
      console.log(`- ${suggestion.game}: ${suggestion.odds} (${suggestion.suggestion})`);
    });

    // Test 3: Get nearby venues
    console.log(chalk.yellow('\nTesting getNearbyVenues:'));
    const venues = await venueService.getNearbyVenues(location.data, 100, 5);
    console.log(`Found ${venues.length} venues near ${location.name}:`);
    venues.forEach(venue => {
      console.log(
        `- ${venue.name} (${venue.distance ? venue.distance.toFixed(1) + ' km' : 'unknown distance'})`
      );
    });

    // Test 4: Test caching
    console.log(chalk.yellow('\nTesting caching:'));
    console.log('Getting teams again (should use cache):');
    const cachedTeams = await geolocationService.getLocalTeams(location.data, true);
    console.log(`Found ${cachedTeams.length} teams from cache`);

    console.log('Getting odds again (should use cache):');
    const cachedSuggestions = await geolocationService.getLocalizedOddsSuggestions(cachedTeams);
    console.log(`Found ${cachedSuggestions.length} odds suggestions from cache`);

    console.log('Getting venues again (should use cache):');
    const cachedVenues = await venueService.getNearbyVenues(location.data, 100, 5);
    console.log(`Found ${cachedVenues.length} venues from cache`);

    // Restore original method
    geolocationService.getUserLocation = originalGetUserLocation;

    console.log(chalk.green('\nAll tests passed for this location and platform!'));
  } catch (error) {
    console.error(chalk.red(`Error testing ${location.name} on ${platform.name}:`), error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(chalk.green('=== Starting Geolocation Features Tests ===\n'));

  // Test each location on each platform
  for (const location of TEST_LOCATIONS) {
    for (const platform of TEST_PLATFORMS) {
      await runTest(location, platform);
    }
  }

  console.log(chalk.green('\n=== All tests completed ==='));
}

// Run the tests
runAllTests().catch(error => {
  console.error(chalk.red('Error running tests:'), error);
  process.exit(1);
});
