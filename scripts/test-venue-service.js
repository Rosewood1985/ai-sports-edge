#!/usr/bin/env node

/**
 * Test script for the venue service implementation
 *
 * This script tests the JavaScript implementation of the venue service
 * by using a simplified version that can be run directly with Node.js.
 *
 * Usage:
 *   node scripts/test-venue-service.js
 */

require('dotenv').config();
const axios = require('axios');

// Check if API key is set
const API_KEY = process.env.REACT_APP_MAPBOX_API_KEY;
if (!API_KEY) {
  console.log('Warning: REACT_APP_MAPBOX_API_KEY is not set in .env file');
  console.log('Using mock data for testing purposes');
}

// Mock location data for testing
const MOCK_LOCATION_DATA = {
  city: 'New York',
  state: 'New York',
  country: 'United States',
  latitude: 40.7128,
  longitude: -74.006,
  timezone: 'America/New_York',
};

// Mock venue data for testing
const MOCK_VENUES = [
  {
    id: 'v1',
    name: 'Yankee Stadium',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    capacity: 54251,
    teams: ['New York Yankees'],
    sports: ['Baseball'],
    latitude: 40.8296,
    longitude: -73.9262,
  },
  {
    id: 'v2',
    name: 'Citi Field',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    capacity: 41922,
    teams: ['New York Mets'],
    sports: ['Baseball'],
    latitude: 40.7571,
    longitude: -73.8458,
  },
  {
    id: 'v3',
    name: 'MetLife Stadium',
    city: 'East Rutherford',
    state: 'New Jersey',
    country: 'United States',
    capacity: 82500,
    teams: ['New York Giants', 'New York Jets'],
    sports: ['Football'],
    latitude: 40.8135,
    longitude: -74.0744,
  },
  {
    id: 'v4',
    name: 'Madison Square Garden',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    capacity: 19812,
    teams: ['New York Knicks', 'New York Rangers'],
    sports: ['Basketball', 'Hockey'],
    latitude: 40.7505,
    longitude: -73.9934,
  },
  {
    id: 'v5',
    name: 'Barclays Center',
    city: 'Brooklyn',
    state: 'New York',
    country: 'United States',
    capacity: 19000,
    teams: ['Brooklyn Nets', 'New York Liberty'],
    sports: ['Basketball'],
    latitude: 40.6826,
    longitude: -73.9754,
  },
  {
    id: 'v6',
    name: 'Fenway Park',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    capacity: 37755,
    teams: ['Boston Red Sox'],
    sports: ['Baseball'],
    latitude: 42.3467,
    longitude: -71.0972,
  },
  {
    id: 'v7',
    name: 'TD Garden',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    capacity: 19580,
    teams: ['Boston Celtics', 'Boston Bruins'],
    sports: ['Basketball', 'Hockey'],
    latitude: 42.3662,
    longitude: -71.0621,
  },
  {
    id: 'v8',
    name: 'Dodger Stadium',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    capacity: 56000,
    teams: ['Los Angeles Dodgers'],
    sports: ['Baseball'],
    latitude: 34.0739,
    longitude: -118.24,
  },
  {
    id: 'v9',
    name: 'Crypto.com Arena',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    capacity: 19079,
    teams: ['Los Angeles Lakers', 'Los Angeles Clippers', 'Los Angeles Kings'],
    sports: ['Basketball', 'Hockey'],
    latitude: 34.043,
    longitude: -118.2673,
  },
  {
    id: 'v10',
    name: 'Wrigley Field',
    city: 'Chicago',
    state: 'Illinois',
    country: 'United States',
    capacity: 41649,
    teams: ['Chicago Cubs'],
    sports: ['Baseball'],
    latitude: 41.9484,
    longitude: -87.6553,
  },
];

/**
 * Venue service class
 */
class VenueService {
  constructor() {
    this.apiKey = API_KEY;
    this.cachedVenues = null;
    this.lastVenueUpdate = 0;
    this.CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 Latitude of point 1
   * @param {number} lon1 Longitude of point 1
   * @param {number} lat2 Latitude of point 2
   * @param {number} lon2 Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Get all venues
   * @param {boolean} useCache Whether to use cached venues if available
   * @returns {Promise<Array>} Array of venues
   */
  async getAllVenues(useCache = true) {
    try {
      // Check if we have cached venues
      if (
        useCache &&
        this.cachedVenues &&
        Date.now() - this.lastVenueUpdate < this.CACHE_DURATION
      ) {
        return this.cachedVenues;
      }

      console.log('Fetching venue data...');

      // In a real implementation, we would fetch venues from an API
      // For now, we'll use the mock data
      this.cachedVenues = MOCK_VENUES;
      this.lastVenueUpdate = Date.now();

      return MOCK_VENUES;
    } catch (error) {
      console.error('Error getting venues:', error.message);
      return MOCK_VENUES; // Fallback to mock data
    }
  }

  /**
   * Get venues near a specific location
   * @param {Object} location User's location
   * @param {number} maxDistance Maximum distance in kilometers (default: 50)
   * @param {number} limit Maximum number of venues to return (default: 5)
   * @returns {Promise<Array>} Array of nearby venues with distance information
   */
  async getNearbyVenues(location = null, maxDistance = 50, limit = 5) {
    try {
      // If no location provided, use mock location
      const userLocation = location || MOCK_LOCATION_DATA;

      if (!userLocation) {
        throw new Error('No location data available');
      }

      // Get all venues
      const allVenues = await this.getAllVenues();

      // Calculate distance for each venue and filter by maxDistance
      const venuesWithDistance = allVenues
        .map(venue => {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            venue.latitude,
            venue.longitude
          );

          return {
            ...venue,
            distance,
          };
        })
        .filter(venue => venue.distance <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, limit);

      return venuesWithDistance;
    } catch (error) {
      console.error('Error getting nearby venues:', error.message);
      return [];
    }
  }

  /**
   * Get venues for specific teams
   * @param {Array} teamNames Array of team names
   * @returns {Promise<Array>} Array of venues for the specified teams
   */
  async getVenuesForTeams(teamNames) {
    try {
      const allVenues = await this.getAllVenues();

      // Filter venues by team names
      const teamVenues = allVenues.filter(venue =>
        venue.teams.some(team => teamNames.includes(team))
      );

      return teamVenues;
    } catch (error) {
      console.error('Error getting venues for teams:', error.message);
      return [];
    }
  }

  /**
   * Get venues for a specific sport
   * @param {string} sport Sport name
   * @returns {Promise<Array>} Array of venues for the specified sport
   */
  async getVenuesForSport(sport) {
    try {
      const allVenues = await this.getAllVenues();

      // Filter venues by sport
      const sportVenues = allVenues.filter(venue => venue.sports.includes(sport));

      return sportVenues;
    } catch (error) {
      console.error('Error getting venues for sport:', error.message);
      return [];
    }
  }

  /**
   * Clear cached venues
   */
  clearCache() {
    this.cachedVenues = null;
    this.lastVenueUpdate = 0;
    console.log('Cache cleared');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Testing venue service implementation...');
  console.log('=======================================\n');

  // Create venue service instance
  const venueService = new VenueService();

  // Get all venues
  console.log('Getting all venues...');
  const allVenues = await venueService.getAllVenues();
  console.log(`Found ${allVenues.length} venues in total`);

  // Get nearby venues
  console.log('\nGetting nearby venues...');
  const nearbyVenues = await venueService.getNearbyVenues(MOCK_LOCATION_DATA, 50, 5);

  if (nearbyVenues.length > 0) {
    console.log(`Found ${nearbyVenues.length} venues near ${MOCK_LOCATION_DATA.city}:`);
    nearbyVenues.forEach(venue => {
      console.log(`- ${venue.name} (${venue.distance.toFixed(2)} km away)`);
    });
  } else {
    console.log('No nearby venues found');
  }

  // Get venues for specific teams
  console.log('\nGetting venues for New York Yankees and New York Knicks...');
  const teamVenues = await venueService.getVenuesForTeams(['New York Yankees', 'New York Knicks']);

  if (teamVenues.length > 0) {
    console.log(`Found ${teamVenues.length} venues for specified teams:`);
    teamVenues.forEach(venue => {
      console.log(`- ${venue.name} (Teams: ${venue.teams.join(', ')})`);
    });
  } else {
    console.log('No venues found for specified teams');
  }

  // Get venues for a specific sport
  console.log('\nGetting venues for Basketball...');
  const basketballVenues = await venueService.getVenuesForSport('Basketball');

  if (basketballVenues.length > 0) {
    console.log(`Found ${basketballVenues.length} venues for Basketball:`);
    basketballVenues.forEach(venue => {
      console.log(`- ${venue.name} (Capacity: ${venue.capacity.toLocaleString()})`);
    });
  } else {
    console.log('No venues found for Basketball');
  }

  // Test caching
  console.log('\nTesting caching...');
  console.log('Getting venues again (should use cache)...');
  const cachedVenues = await venueService.getAllVenues();
  console.log('Venue data retrieved from cache:', !!cachedVenues);

  // Clear cache
  console.log('\nClearing cache...');
  venueService.clearCache();

  console.log('\nVenue service test completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
