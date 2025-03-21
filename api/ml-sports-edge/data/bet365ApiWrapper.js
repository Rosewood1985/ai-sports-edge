/**
 * Bet365 API Wrapper
 * A JavaScript wrapper for the Bet365 API scraper
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Cache directory
const CACHE_DIR = path.join(__dirname, 'cache', 'bet365');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Execute the Python Bet365 scraper
 * @param {string} sport - Sport filter
 * @returns {Promise<Object>} - Bet365 data
 */
async function executeBet365Scraper(sport = null) {
  return new Promise((resolve, reject) => {
    // Check if cached data exists and is less than 15 minutes old
    const cacheFile = path.join(CACHE_DIR, `bet365_data_${sport || 'all'}.json`);
    
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      const fileAge = (Date.now() - stats.mtime) / 1000; // Age in seconds
      
      if (fileAge < 900) { // 15 minutes
        console.log(`Using cached Bet365 data from ${cacheFile}`);
        try {
          const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          return resolve(data);
        } catch (error) {
          console.error('Error reading cached Bet365 data:', error);
          // Continue with scraper execution
        }
      }
    }
    
    console.log(`Executing Bet365 scraper for sport: ${sport || 'all'}`);
    
    // Prepare arguments for the Python script
    const args = [path.join(__dirname, 'bet365_scraper.py')];
    if (sport) {
      args.push('--sport', sport);
    }
    
    // Spawn Python process
    const pythonProcess = spawn('python3', args);
    
    let dataString = '';
    let errorString = '';
    
    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    // Collect errors from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Bet365 scraper exited with code ${code}`);
        console.error(`Error: ${errorString}`);
        return reject(new Error(`Bet365 scraper failed with code ${code}: ${errorString}`));
      }
      
      try {
        // Parse the output as JSON
        const data = JSON.parse(dataString);
        
        // Cache the data
        fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
        
        resolve(data);
      } catch (error) {
        console.error('Error parsing Bet365 scraper output:', error);
        reject(error);
      }
    });
  });
}

/**
 * Get odds data from Bet365
 * @param {string} sport - Sport filter
 * @returns {Promise<Object>} - Bet365 odds data
 */
async function getOdds(sport = null) {
  try {
    console.log(`Fetching Bet365 odds for sport: ${sport || 'all'}`);
    
    // Execute the Python scraper
    const data = await executeBet365Scraper(sport);
    
    // Process the data
    const processedData = processOddsData(data, sport);
    
    return processedData;
  } catch (error) {
    console.error('Error fetching Bet365 odds:', error);
    return null;
  }
}

/**
 * Process odds data from Bet365
 * @param {Array} data - Raw Bet365 data
 * @param {string} sport - Sport filter
 * @returns {Object} - Processed odds data
 */
function processOddsData(data, sport) {
  // Map to store processed data by sport
  const processedData = {
    sport: sport || 'all',
    timestamp: new Date().toISOString(),
    events: []
  };
  
  // Process each event
  data.forEach(event => {
    const processedEvent = {
      league: event.league,
      homeTeam: event.home_team || '',
      awayTeam: event.away_team || '',
      startTime: event.timestamp,
      odds: {
        homeMoneyline: convertDecimalToAmerican(event.odds.home),
        awayMoneyline: convertDecimalToAmerican(event.odds.away),
        drawMoneyline: event.odds.draw ? convertDecimalToAmerican(event.odds.draw) : null
      },
      scores: {
        homeScore: event.home_score,
        awayScore: event.away_score
      },
      status: event.betting_status,
      source: 'bet365'
    };
    
    processedData.events.push(processedEvent);
  });
  
  return processedData;
}

/**
 * Convert decimal odds to American odds
 * @param {number} decimalOdds - Decimal odds
 * @returns {number} - American odds
 */
function convertDecimalToAmerican(decimalOdds) {
  if (!decimalOdds) return null;
  
  if (decimalOdds >= 2.0) {
    // Positive American odds
    return Math.round((decimalOdds - 1) * 100);
  } else {
    // Negative American odds
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Find matching events between Bet365 and other data sources
 * @param {Array} bet365Events - Bet365 events
 * @param {Array} otherEvents - Events from other sources
 * @returns {Array} - Matched events
 */
function findMatchingEvents(bet365Events, otherEvents) {
  const matches = [];
  
  bet365Events.forEach(bet365Event => {
    // Normalize team names
    const homeTeam = bet365Event.homeTeam.toLowerCase();
    const awayTeam = bet365Event.awayTeam.toLowerCase();
    
    // Find matching event in other data source
    const matchingEvent = otherEvents.find(event => {
      const eventHomeTeam = (event.homeTeam || '').toLowerCase();
      const eventAwayTeam = (event.awayTeam || '').toLowerCase();
      
      // Check if team names match (partial match is acceptable)
      const homeMatch = homeTeam.includes(eventHomeTeam) || eventHomeTeam.includes(homeTeam);
      const awayMatch = awayTeam.includes(eventAwayTeam) || eventAwayTeam.includes(awayTeam);
      
      return homeMatch && awayMatch;
    });
    
    if (matchingEvent) {
      matches.push({
        bet365Event,
        matchingEvent
      });
    }
  });
  
  return matches;
}

/**
 * Compare odds between Bet365 and other sources to find value bets
 * @param {Array} bet365Events - Bet365 events
 * @param {Array} otherEvents - Events from other sources
 * @returns {Array} - Value bets
 */
function findValueBets(bet365Events, otherEvents) {
  const valueBets = [];
  
  // Find matching events
  const matches = findMatchingEvents(bet365Events, otherEvents);
  
  matches.forEach(match => {
    const { bet365Event, matchingEvent } = match;
    
    // Compare home team odds
    if (bet365Event.odds.homeMoneyline && matchingEvent.odds?.homeMoneyline) {
      const bet365Implied = 1 / (bet365Event.odds.homeMoneyline / 100 + 1);
      const otherImplied = 1 / (matchingEvent.odds.homeMoneyline / 100 + 1);
      
      // If Bet365 gives better odds (lower implied probability)
      if (bet365Implied < otherImplied * 0.95) {
        valueBets.push({
          type: 'home',
          bet365Event,
          matchingEvent,
          bet365Odds: bet365Event.odds.homeMoneyline,
          otherOdds: matchingEvent.odds.homeMoneyline,
          valuePercentage: (otherImplied / bet365Implied - 1) * 100
        });
      }
    }
    
    // Compare away team odds
    if (bet365Event.odds.awayMoneyline && matchingEvent.odds?.awayMoneyline) {
      const bet365Implied = 1 / (bet365Event.odds.awayMoneyline / 100 + 1);
      const otherImplied = 1 / (matchingEvent.odds.awayMoneyline / 100 + 1);
      
      // If Bet365 gives better odds (lower implied probability)
      if (bet365Implied < otherImplied * 0.95) {
        valueBets.push({
          type: 'away',
          bet365Event,
          matchingEvent,
          bet365Odds: bet365Event.odds.awayMoneyline,
          otherOdds: matchingEvent.odds.awayMoneyline,
          valuePercentage: (otherImplied / bet365Implied - 1) * 100
        });
      }
    }
  });
  
  return valueBets;
}

module.exports = {
  getOdds,
  findMatchingEvents,
  findValueBets
};