/**
 * Historical Data Collector
 * Collects and stores historical sports data for model training
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { fetchESPNData, fetchOddsData } = require('./fetch-enhanced');

// Data directories
const HISTORICAL_DATA_DIR = path.join(__dirname, 'historical');
const PROCESSED_DATA_DIR = path.join(__dirname, 'processed');

// Ensure data directories exist
if (!fs.existsSync(HISTORICAL_DATA_DIR)) {
  fs.mkdirSync(HISTORICAL_DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PROCESSED_DATA_DIR)) {
  fs.mkdirSync(PROCESSED_DATA_DIR, { recursive: true });
}

/**
 * Save historical data to file
 * @param {string} sport - Sport key
 * @param {string} league - League key
 * @param {string} season - Season year
 * @param {Object} data - Historical data
 */
function saveHistoricalData(sport, league, season, data) {
  const filename = `${sport.toLowerCase()}_${league.toLowerCase()}_${season}_historical.json`;
  const filePath = path.join(HISTORICAL_DATA_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved historical data to ${filePath}`);
}

/**
 * Save processed historical data to file
 * @param {string} sport - Sport key
 * @param {string} league - League key
 * @param {string} season - Season year
 * @param {Object} data - Processed historical data
 */
function saveProcessedData(sport, league, season, data) {
  const filename = `${sport.toLowerCase()}_${league.toLowerCase()}_${season}_processed.json`;
  const filePath = path.join(PROCESSED_DATA_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved processed historical data to ${filePath}`);
}

/**
 * Fetch historical data from ESPN API
 * @param {string} sport - Sport key (e.g., 'basketball', 'football')
 * @param {string} league - League key (e.g., 'nba', 'nfl')
 * @param {string} season - Season year (e.g., '2024')
 * @returns {Promise<Object>} - Historical data
 */
async function fetchESPNHistoricalData(sport, league, season) {
  try {
    console.log(`Fetching ESPN historical data for ${sport}/${league} (${season})...`);
    
    // Construct the ESPN API URL for historical data
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${season}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    // Save raw historical data
    saveHistoricalData(sport, league, season, data);
    
    return data;
  } catch (error) {
    console.error(`Error fetching ESPN historical data for ${sport}/${league} (${season}):`, error.message);
    return null;
  }
}

/**
 * Process historical data
 * @param {string} sport - Sport key
 * @param {string} league - League key
 * @param {string} season - Season year
 * @param {Object} data - Raw historical data
 * @returns {Object} - Processed historical data
 */
function processHistoricalData(sport, league, season, data) {
  console.log(`Processing historical data for ${sport}/${league} (${season})...`);
  
  // Extract events from raw data
  const events = data.events || [];
  
  // Process each event
  const processedEvents = events.map(event => {
    const gameId = event.id;
    const date = new Date(event.date);
    const competitors = event.competitions[0]?.competitors || [];
    const homeTeam = competitors.find(team => team.homeAway === 'home')?.team || {};
    const awayTeam = competitors.find(team => team.homeAway === 'away')?.team || {};
    
    // Create processed event
    return {
      id: gameId,
      sport,
      league,
      season,
      date: date.toISOString(),
      timestamp: date.getTime(),
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.displayName || 'TBD',
        abbreviation: homeTeam.abbreviation,
        score: parseInt(competitors.find(team => team.homeAway === 'home')?.score) || null
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.displayName || 'TBD',
        abbreviation: awayTeam.abbreviation,
        score: parseInt(competitors.find(team => team.homeAway === 'away')?.score) || null
      },
      status: {
        state: event.status?.type?.state || 'pre',
        detail: event.status?.type?.description || ''
      },
      venue: {
        name: event.competitions[0]?.venue?.fullName || '',
        city: event.competitions[0]?.venue?.address?.city || '',
        state: event.competitions[0]?.venue?.address?.state || '',
        country: event.competitions[0]?.venue?.address?.country || ''
      }
    };
  });
  
  // Create processed data object
  const processedData = {
    sport,
    league,
    season,
    timestamp: new Date().toISOString(),
    events: processedEvents
  };
  
  // Save processed data
  saveProcessedData(sport, league, season, processedData);
  
  return processedData;
}

/**
 * Fetch historical data for multiple seasons
 * @param {string} sport - Sport key
 * @param {string} league - League key
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - Historical data for all seasons
 */
async function fetchHistoricalDataForSeasons(sport, league, startYear, endYear) {
  console.log(`Fetching historical data for ${sport}/${league} from ${startYear} to ${endYear}...`);
  
  const allData = {
    sport,
    league,
    startYear,
    endYear,
    seasons: {}
  };
  
  // Fetch data for each season
  for (let year = startYear; year <= endYear; year++) {
    try {
      // Fetch raw historical data
      const rawData = await fetchESPNHistoricalData(sport, league, year.toString());
      
      if (rawData) {
        // Process historical data
        const processedData = processHistoricalData(sport, league, year.toString(), rawData);
        
        // Add to all data
        allData.seasons[year] = {
          rawData,
          processedData
        };
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error fetching data for ${sport}/${league} (${year}):`, error);
      // Continue with next season
    }
  }
  
  return allData;
}

/**
 * Fetch historical data for NBA
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - NBA historical data
 */
async function fetchNBAHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('basketball', 'nba', startYear, endYear);
}

/**
 * Fetch historical data for NFL
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - NFL historical data
 */
async function fetchNFLHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('football', 'nfl', startYear, endYear);
}

/**
 * Fetch historical data for MLB
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - MLB historical data
 */
async function fetchMLBHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('baseball', 'mlb', startYear, endYear);
}

/**
 * Fetch historical data for NHL
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - NHL historical data
 */
async function fetchNHLHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('hockey', 'nhl', startYear, endYear);
}

/**
 * Fetch historical data for NCAA Men's Basketball
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - NCAA Men's Basketball historical data
 */
async function fetchNCAAMensHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('basketball', 'mens-college-basketball', startYear, endYear);
}

/**
 * Fetch historical data for NCAA Women's Basketball
 * @param {number} startYear - Start year
 * @param {number} endYear - End year
 * @returns {Promise<Object>} - NCAA Women's Basketball historical data
 */
async function fetchNCAAWomensHistoricalData(startYear, endYear) {
  return fetchHistoricalDataForSeasons('basketball', 'womens-college-basketball', startYear, endYear);
}

/**
 * Main function to fetch historical data for all sports
 */
async function fetchAllHistoricalData() {
  console.log('Starting historical data collection process...');
  
  // Current year
  const currentYear = new Date().getFullYear();
  
  // Fetch historical data for each sport (last 5 years)
  const startYear = currentYear - 5;
  const endYear = currentYear - 1; // Exclude current year
  
  try {
    // Fetch NBA historical data
    await fetchNBAHistoricalData(startYear, endYear);
    
    // Fetch NFL historical data
    await fetchNFLHistoricalData(startYear, endYear);
    
    // Fetch MLB historical data
    await fetchMLBHistoricalData(startYear, endYear);
    
    // Fetch NHL historical data
    await fetchNHLHistoricalData(startYear, endYear);
    
    // Fetch NCAA Men's Basketball historical data
    await fetchNCAAMensHistoricalData(startYear, endYear);
    
    // Fetch NCAA Women's Basketball historical data
    await fetchNCAAWomensHistoricalData(startYear, endYear);
    
    console.log('Historical data collection process completed');
  } catch (error) {
    console.error('Error in historical data collection process:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  fetchAllHistoricalData()
    .then(() => {
      console.log('Historical data collection script completed successfully');
    })
    .catch(error => {
      console.error('Error in historical data collection script:', error);
      process.exit(1);
    });
}

module.exports = {
  fetchESPNHistoricalData,
  processHistoricalData,
  fetchHistoricalDataForSeasons,
  fetchNBAHistoricalData,
  fetchNFLHistoricalData,
  fetchMLBHistoricalData,
  fetchNHLHistoricalData,
  fetchNCAAMensHistoricalData,
  fetchNCAAWomensHistoricalData,
  fetchAllHistoricalData
};