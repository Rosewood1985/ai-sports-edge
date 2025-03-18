#!/usr/bin/env node

/**
 * Test script for the geolocation service
 * 
 * This script tests the geolocation service by fetching the user's location,
 * identifying local teams, and generating localized odds suggestions.
 * 
 * Usage:
 *   node scripts/test-geolocation.js
 */

require('dotenv').config();

const axios = require('axios');

// Check if API key is set
const API_KEY = process.env.REACT_APP_IPGEOLOCATION_API_KEY;
if (!API_KEY) {
  console.error('Error: REACT_APP_IPGEOLOCATION_API_KEY is not set in .env file');
  console.log('Please add your IPgeolocation.io API key to the .env file:');
  console.log('REACT_APP_IPGEOLOCATION_API_KEY=your-api-key');
  process.exit(1);
}

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
 * Get user location based on IP address
 * @returns {Promise<Object>} User location data
 */
async function getUserLocation() {
  try {
    console.log('Fetching user location...');
    
    const response = await axios.get('https://api.ipgeolocation.io/ipgeo', {
      params: {
        apiKey: API_KEY
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Status code ${response.status}`);
    }
    
    const locationData = {
      city: response.data.city,
      state: response.data.state_prov,
      country: response.data.country_name,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timezone: response.data.time_zone.name
    };
    
    console.log('Location data:');
    console.log(JSON.stringify(locationData, null, 2));
    
    return locationData;
  } catch (error) {
    console.error('Error getting user location:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    return null;
  }
}

/**
 * Get local teams based on user location
 * @param {Object} location - User location data
 * @returns {Array} Local teams
 */
function getLocalTeams(location) {
  try {
    console.log('\nIdentifying local teams...');
    
    const { city, state } = location;
    
    // Check if we have teams for the user's city
    if (cityTeamMap[city]) {
      console.log(`Found ${cityTeamMap[city].length} teams for ${city}`);
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
 * @param {Array} localTeams - Local teams
 * @returns {Array} Localized odds suggestions
 */
function getLocalizedOddsSuggestions(localTeams) {
  try {
    console.log('\nGenerating localized odds suggestions...');
    
    if (localTeams.length === 0) {
      console.log('No local teams found, cannot generate odds suggestions');
      return [];
    }
    
    // Generate odds suggestions for local teams
    const suggestions = localTeams.map(team => ({
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
 * Main function
 */
async function main() {
  console.log('Testing geolocation service...');
  console.log('==============================\n');
  
  // Get user location
  const location = await getUserLocation();
  
  if (!location) {
    console.error('Failed to get location data. Exiting...');
    process.exit(1);
  }
  
  // Get local teams
  const localTeams = getLocalTeams(location);
  
  if (localTeams.length > 0) {
    console.log('\nLocal teams:');
    localTeams.forEach(team => console.log(`- ${team}`));
  }
  
  // Get localized odds suggestions
  const oddsSuggestions = getLocalizedOddsSuggestions(localTeams);
  
  if (oddsSuggestions.length > 0) {
    console.log('\nLocalized odds suggestions:');
    oddsSuggestions.forEach(suggestion => {
      console.log(`- ${suggestion.game}: ${suggestion.odds.toFixed(2)} (${suggestion.suggestion})`);
    });
  }
  
  console.log('\nGeolocation test completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});