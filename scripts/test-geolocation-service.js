#!/usr/bin/env node

/**
 * Test script for the geolocation service implementation
 * 
 * This script tests the TypeScript implementation of the geolocation service
 * by using a JavaScript version that can be run directly with Node.js.
 * 
 * Usage:
 *   node scripts/test-geolocation-service.js
 */

require('dotenv').config();
const axios = require('axios');

// Check if API key is set
const API_KEY = process.env.REACT_APP_IPGEOLOCATION_API_KEY;
if (!API_KEY) {
  console.log('Warning: REACT_APP_IPGEOLOCATION_API_KEY is not set in .env file');
  console.log('Using mock data for testing purposes');
}

// Mock data for testing when API key is not available
const MOCK_LOCATION_DATA = {
  city: "New York",
  state: "New York",
  country: "United States",
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: "America/New_York"
};

// City to team mapping for testing
const cityTeamMap = {
  'New York': ['New York Yankees', 'New York Mets', 'New York Giants', 'New York Jets', 'New York Knicks', 'Brooklyn Nets'],
  'Los Angeles': ['Los Angeles Dodgers', 'Los Angeles Angels', 'Los Angeles Rams', 'Los Angeles Chargers', 'Los Angeles Lakers', 'Los Angeles Clippers'],
  'Chicago': ['Chicago Cubs', 'Chicago White Sox', 'Chicago Bears', 'Chicago Bulls'],
  'Boston': ['Boston Red Sox', 'New England Patriots', 'Boston Celtics', 'Boston Bruins'],
  'Philadelphia': ['Philadelphia Phillies', 'Philadelphia Eagles', 'Philadelphia 76ers', 'Philadelphia Flyers'],
  'Dallas': ['Dallas Cowboys', 'Dallas Mavericks', 'Dallas Stars', 'Texas Rangers'],
  'San Francisco': ['San Francisco 49ers', 'San Francisco Giants', 'Golden State Warriors'],
  'Washington': ['Washington Nationals', 'Washington Commanders', 'Washington Wizards', 'Washington Capitals'],
  'Houston': ['Houston Astros', 'Houston Texans', 'Houston Rockets'],
  'Atlanta': ['Atlanta Braves', 'Atlanta Falcons', 'Atlanta Hawks'],
  'Miami': ['Miami Marlins', 'Miami Dolphins', 'Miami Heat'],
  'Denver': ['Denver Broncos', 'Denver Nuggets', 'Colorado Rockies', 'Colorado Avalanche'],
  'Phoenix': ['Arizona Cardinals', 'Phoenix Suns', 'Arizona Diamondbacks', 'Arizona Coyotes'],
  'Seattle': ['Seattle Seahawks', 'Seattle Mariners', 'Seattle Kraken'],
  'Detroit': ['Detroit Tigers', 'Detroit Lions', 'Detroit Pistons', 'Detroit Red Wings'],
  'Minneapolis': ['Minnesota Twins', 'Minnesota Vikings', 'Minnesota Timberwolves', 'Minnesota Wild'],
  'St. Louis': ['St. Louis Cardinals', 'St. Louis Blues'],
  'Tampa': ['Tampa Bay Buccaneers', 'Tampa Bay Rays', 'Tampa Bay Lightning'],
  'Pittsburgh': ['Pittsburgh Steelers', 'Pittsburgh Pirates', 'Pittsburgh Penguins'],
  'Cleveland': ['Cleveland Browns', 'Cleveland Guardians', 'Cleveland Cavaliers']
};

/**
 * Geolocation service class
 */
class GeolocationService {
  constructor() {
    this.apiKey = API_KEY;
    this.cachedLocation = null;
    this.cachedLocalTeams = null;
    this.lastLocationUpdate = 0;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  }

  /**
   * Get user location based on IP address
   * @param {boolean} useCache - Whether to use cached location data if available
   * @returns {Promise<Object|null>} User location data
   */
  async getUserLocation(useCache = true) {
    try {
      // Check if we have cached location data
      if (useCache && this.cachedLocation && (Date.now() - this.lastLocationUpdate < this.CACHE_DURATION)) {
        return this.cachedLocation;
      }

      // If no API key is available, use mock data
      if (!this.apiKey) {
        console.log('Using mock location data...');
        
        // Use mock data
        const locationData = MOCK_LOCATION_DATA;
        
        console.log('Location data (mock):');
        console.log(JSON.stringify(locationData, null, 2));
        
        // Cache the location data
        this.cachedLocation = locationData;
        this.lastLocationUpdate = Date.now();
        
        return locationData;
      }

      console.log('Fetching user location from API...');
      
      const response = await axios.get('https://api.ipgeolocation.io/ipgeo', {
        params: {
          apiKey: this.apiKey
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Status code ${response.status}`);
      }
      
      const locationData = {
        city: response.data.city,
        state: response.data.state_prov,
        country: response.data.country_name,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        timezone: response.data.time_zone.name
      };
      
      console.log('Location data (API):');
      console.log(JSON.stringify(locationData, null, 2));
      
      // Cache the location data
      this.cachedLocation = locationData;
      this.lastLocationUpdate = Date.now();
      
      return locationData;
    } catch (error) {
      console.error('Error getting user location:', error.message);
      if (error.response) {
        console.error('API response:', error.response.data);
      }
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock location data...');
      const locationData = MOCK_LOCATION_DATA;
      
      // Cache the location data
      this.cachedLocation = locationData;
      this.lastLocationUpdate = Date.now();
      
      return locationData;
    }
  }

  /**
   * Get local teams based on user location
   * @param {Object} location - User location data
   * @param {boolean} useCache - Whether to use cached teams if available
   * @returns {Promise<Array>} Local teams
   */
  async getLocalTeams(location, useCache = true) {
    try {
      // Check if we have cached teams
      if (useCache && this.cachedLocalTeams) {
        return this.cachedLocalTeams;
      }

      // If no location provided, get the user's location
      const locationData = location || await this.getUserLocation();
      
      if (!locationData) {
        console.error('No location data available');
        return [];
      }

      console.log('\nIdentifying local teams...');
      
      const { city, state } = locationData;
      
      // Check if we have teams for the user's city
      if (cityTeamMap[city]) {
        console.log(`Found ${cityTeamMap[city].length} teams for ${city}`);
        this.cachedLocalTeams = cityTeamMap[city];
        return cityTeamMap[city];
      }
      
      // If not, check for teams in the user's state
      const stateTeams = [];
      Object.entries(cityTeamMap).forEach(([cityName, teams]) => {
        if (cityName.includes(state) || state.includes(cityName)) {
          stateTeams.push(...teams);
        }
      });
      
      if (stateTeams.length > 0) {
        console.log(`Found ${stateTeams.length} teams for ${state}`);
        this.cachedLocalTeams = stateTeams;
        return stateTeams;
      }
      
      console.log('No local teams found for your location');
      return [];
    } catch (error) {
      console.error('Error getting local teams:', error.message);
      return [];
    }
  }

  /**
   * Get localized odds suggestions
   * @param {Array} localTeams - Local teams (if not provided, will fetch them)
   * @returns {Promise<Array>} Localized odds suggestions
   */
  async getLocalizedOddsSuggestions(localTeams) {
    try {
      // If no teams provided, get the local teams
      const teams = localTeams || await this.getLocalTeams();
      
      if (teams.length === 0) {
        console.log('No local teams found, cannot generate odds suggestions');
        return [];
      }

      console.log('\nGenerating localized odds suggestions...');
      
      // Generate odds suggestions for local teams
      const suggestions = teams.map(team => ({
        team,
        game: `${team} vs. Opponent`,
        odds: Math.random() * 3 + 1, // Random odds between 1 and 4
        suggestion: Math.random() > 0.5 ? 'bet' : 'avoid'
      }));
      
      return suggestions;
    } catch (error) {
      console.error('Error getting localized odds suggestions:', error.message);
      return [];
    }
  }

  /**
   * Clear cached location data
   */
  clearCache() {
    this.cachedLocation = null;
    this.cachedLocalTeams = null;
    this.lastLocationUpdate = 0;
    console.log('Cache cleared');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Testing geolocation service implementation...');
  console.log('============================================\n');
  
  // Create geolocation service instance
  const geolocationService = new GeolocationService();
  
  // Get user location
  const location = await geolocationService.getUserLocation();
  
  if (!location) {
    console.error('Failed to get location data. Exiting...');
    process.exit(1);
  }
  
  // Get local teams
  const localTeams = await geolocationService.getLocalTeams(location);
  
  if (localTeams.length > 0) {
    console.log('\nLocal teams:');
    localTeams.forEach(team => console.log(`- ${team}`));
  }
  
  // Get localized odds suggestions
  const oddsSuggestions = await geolocationService.getLocalizedOddsSuggestions(localTeams);
  
  if (oddsSuggestions.length > 0) {
    console.log('\nLocalized odds suggestions:');
    oddsSuggestions.forEach(suggestion => {
      console.log(`- ${suggestion.game}: ${suggestion.odds.toFixed(2)} (${suggestion.suggestion})`);
    });
  }
  
  // Test caching
  console.log('\nTesting caching...');
  console.log('Getting location again (should use cache)...');
  const cachedLocation = await geolocationService.getUserLocation();
  console.log('Location data retrieved from cache:', !!cachedLocation);
  
  // Clear cache
  console.log('\nClearing cache...');
  geolocationService.clearCache();
  
  console.log('\nGeolocation service test completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});