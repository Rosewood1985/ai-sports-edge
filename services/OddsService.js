/**
 * OddsService.js
 * Service for fetching and managing sports odds data
 */

import axios from 'axios';
import apiKeys from '../utils/apiKeys';

// API configuration
const API_CONFIG = {
  baseUrl: 'https://api.the-odds-api.com/v4',
  apiKey: apiKeys.getOddsApiKey(),
  timeout: 10000,
};

// Sports mapping
const SPORTS = {
  NBA: 'basketball_nba',
  WNBA: 'basketball_wnba',
  NCAA_MENS: 'basketball_ncaa_mens',
  NCAA_WOMENS: 'basketball_ncaa_womens',
  MLB: 'baseball_mlb',
  NHL: 'hockey_nhl',
  UFC: 'mma_ufc',
  FORMULA_1: 'formula_1',
  SOCCER_EPL: 'soccer_epl',
  SOCCER_MLS: 'soccer_mls',
  HORSE_RACING: 'horse_racing'
};

// Bookmakers to include
const BOOKMAKERS = ['fanduel', 'draftkings', 'betmgm', 'caesars', 'pointsbet'];

/**
 * OddsService class for fetching and managing sports odds data
 */
class OddsService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      timeout: API_CONFIG.timeout,
      params: {
        apiKey: API_CONFIG.apiKey,
      },
    });

    // Initialize cache
    this.cache = {
      odds: {},
      lastUpdated: {},
    };

    // Cache TTL in milliseconds (30 minutes)
    this.cacheTTL = 30 * 60 * 1000;
  }

  /**
   * Get odds for a specific sport
   * @param {string} sport - Sport key (e.g., 'WNBA', 'NCAA_MENS')
   * @param {string} market - Market type (e.g., 'h2h', 'spreads', 'totals')
   * @param {string} region - Region for odds (e.g., 'us', 'uk', 'eu')
   * @returns {Promise<Array>} Array of games with odds
   */
  async getOdds(sport, market = 'h2h', region = 'us') {
    try {
      const sportKey = SPORTS[sport];
      
      if (!sportKey) {
        throw new Error(`Invalid sport: ${sport}`);
      }

      // Check cache first
      const cacheKey = `${sportKey}_${market}_${region}`;
      if (this.isCacheValid(cacheKey)) {
        console.log(`Using cached odds for ${sport}`);
        return this.cache.odds[cacheKey];
      }

      // Fetch fresh data
      console.log(`Fetching fresh odds for ${sport}`);
      const response = await this.client.get('/sports', {
        params: {
          sport: sportKey,
          regions: region,
          markets: market,
          oddsFormat: 'american',
          bookmakers: BOOKMAKERS.join(','),
        },
      });

      // Process and cache the data
      const processedData = this.processOddsData(response.data, sport);
      this.cacheData(cacheKey, processedData);

      return processedData;
    } catch (error) {
      console.error(`Error fetching odds for ${sport}:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming events for a specific sport
   * @param {string} sport - Sport key (e.g., 'WNBA', 'NCAA_MENS')
   * @returns {Promise<Array>} Array of upcoming events
   */
  async getUpcomingEvents(sport) {
    try {
      const sportKey = SPORTS[sport];
      
      if (!sportKey) {
        throw new Error(`Invalid sport: ${sport}`);
      }

      // Check cache first
      const cacheKey = `${sportKey}_events`;
      if (this.isCacheValid(cacheKey)) {
        console.log(`Using cached events for ${sport}`);
        return this.cache.odds[cacheKey];
      }

      // Fetch fresh data
      console.log(`Fetching fresh events for ${sport}`);
      const response = await this.client.get('/sports', {
        params: {
          sport: sportKey,
        },
      });

      // Process and cache the data
      const processedData = this.processEventsData(response.data, sport);
      this.cacheData(cacheKey, processedData);

      return processedData;
    } catch (error) {
      console.error(`Error fetching events for ${sport}:`, error);
      throw error;
    }
  }

  /**
   * Process odds data from API response
   * @param {Array} data - Raw API response data
   * @param {string} sport - Sport key
   * @returns {Array} Processed odds data
   */
  processOddsData(data, sport) {
    return data.map(game => ({
      id: game.id,
      sport,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      startTime: new Date(game.commence_time),
      bookmakers: game.bookmakers.map(bookmaker => ({
        name: bookmaker.key,
        markets: bookmaker.markets.map(market => ({
          key: market.key,
          outcomes: market.outcomes.map(outcome => ({
            name: outcome.name,
            price: outcome.price,
            point: outcome.point,
          })),
        })),
      })),
    }));
  }

  /**
   * Process events data from API response
   * @param {Array} data - Raw API response data
   * @param {string} sport - Sport key
   * @returns {Array} Processed events data
   */
  processEventsData(data, sport) {
    return data.map(event => ({
      id: event.id,
      sport,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      startTime: new Date(event.commence_time),
      completed: event.completed,
      tournament: event.tournament,
      location: event.location,
    }));
  }

  /**
   * Check if cache is valid for a given key
   * @param {string} key - Cache key
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid(key) {
    const lastUpdated = this.cache.lastUpdated[key];
    if (!lastUpdated) return false;

    const now = Date.now();
    return now - lastUpdated < this.cacheTTL;
  }

  /**
   * Cache data for a given key
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  cacheData(key, data) {
    this.cache.odds[key] = data;
    this.cache.lastUpdated[key] = Date.now();
  }

  /**
   * Clear cache for a specific key or all cache
   * @param {string} key - Cache key (optional)
   */
  clearCache(key = null) {
    if (key) {
      delete this.cache.odds[key];
      delete this.cache.lastUpdated[key];
    } else {
      this.cache = {
        odds: {},
        lastUpdated: {},
      };
    }
  }

  /**
   * Get odds for a specific team
   * @param {string} teamName - Team name to search for
   * @returns {Promise<Array>} Array of games with odds for the specified team
   */
  async getTeamOdds(teamName) {
    try {
      // Normalize team name for comparison
      const normalizedTeamName = teamName.toLowerCase();
      
      // Try to find the sport for this team
      let sportKey = null;
      
      // Map of team name fragments to sports
      const teamSportMap = {
        // NBA Teams
        'celtics': 'NBA',
        'nets': 'NBA',
        'knicks': 'NBA',
        '76ers': 'NBA',
        'raptors': 'NBA',
        'bulls': 'NBA',
        'cavaliers': 'NBA',
        'pistons': 'NBA',
        'pacers': 'NBA',
        'bucks': 'NBA',
        'hawks': 'NBA',
        'hornets': 'NBA',
        'heat': 'NBA',
        'magic': 'NBA',
        'wizards': 'NBA',
        'nuggets': 'NBA',
        'timberwolves': 'NBA',
        'thunder': 'NBA',
        'blazers': 'NBA',
        'jazz': 'NBA',
        'warriors': 'NBA',
        'clippers': 'NBA',
        'lakers': 'NBA',
        'suns': 'NBA',
        'kings': 'NBA',
        'mavericks': 'NBA',
        'rockets': 'NBA',
        'grizzlies': 'NBA',
        'pelicans': 'NBA',
        'spurs': 'NBA',
        
        // WNBA Teams
        'sparks': 'WNBA',
        'liberty': 'WNBA',
        'sky': 'WNBA',
        'storm': 'WNBA',
        'mercury': 'WNBA',
        'mystics': 'WNBA',
        'sun': 'WNBA',
        'fever': 'WNBA',
        'dream': 'WNBA',
        'wings': 'WNBA',
        'aces': 'WNBA',
        'lynx': 'WNBA',
        
        // MLB Teams
        'yankees': 'MLB',
        'red sox': 'MLB',
        'blue jays': 'MLB',
        'orioles': 'MLB',
        'rays': 'MLB',
        'guardians': 'MLB',
        'twins': 'MLB',
        'royals': 'MLB',
        'tigers': 'MLB',
        'white sox': 'MLB',
        'astros': 'MLB',
        'angels': 'MLB',
        'athletics': 'MLB',
        'mariners': 'MLB',
        'rangers': 'MLB',
        'braves': 'MLB',
        'marlins': 'MLB',
        'mets': 'MLB',
        'phillies': 'MLB',
        'nationals': 'MLB',
        'cubs': 'MLB',
        'reds': 'MLB',
        'brewers': 'MLB',
        'pirates': 'MLB',
        'cardinals': 'MLB',
        'diamondbacks': 'MLB',
        'rockies': 'MLB',
        'dodgers': 'MLB',
        'padres': 'MLB',
        'giants': 'MLB',
        
        // NHL Teams
        'bruins': 'NHL',
        'sabres': 'NHL',
        'red wings': 'NHL',
        'panthers': 'NHL',
        'canadiens': 'NHL',
        'senators': 'NHL',
        'lightning': 'NHL',
        'maple leafs': 'NHL',
        'hurricanes': 'NHL',
        'blue jackets': 'NHL',
        'devils': 'NHL',
        'islanders': 'NHL',
        'rangers': 'NHL',
        'flyers': 'NHL',
        'penguins': 'NHL',
        'capitals': 'NHL',
        'blackhawks': 'NHL',
        'avalanche': 'NHL',
        'stars': 'NHL',
        'wild': 'NHL',
        'predators': 'NHL',
        'blues': 'NHL',
        'jets': 'NHL',
        'ducks': 'NHL',
        'coyotes': 'NHL',
        'flames': 'NHL',
        'oilers': 'NHL',
        'kings': 'NHL',
        'sharks': 'NHL',
        'kraken': 'NHL',
        'golden knights': 'NHL',
        'canucks': 'NHL',
        
        // UFC Fighters (top fighters)
        'jones': 'UFC',
        'adesanya': 'UFC',
        'ngannou': 'UFC',
        'usman': 'UFC',
        'volkanovski': 'UFC',
        'oliveira': 'UFC',
        'poirier': 'UFC',
        'mcgregor': 'UFC',
        'holloway': 'UFC',
        'whittaker': 'UFC',
        'gane': 'UFC',
        'teixeira': 'UFC',
        'sterling': 'UFC',
        'yan': 'UFC',
        'namajunas': 'UFC',
        'shevchenko': 'UFC',
        'nunes': 'UFC',
        
        // NCAA Teams
        'wildcats': 'NCAA_MENS',
        'tar heels': 'NCAA_MENS',
        'blue devils': 'NCAA_MENS',
        'jayhawks': 'NCAA_MENS',
        'huskies': 'NCAA_WOMENS',
        'gamecocks': 'NCAA_WOMENS',
        'bears': 'NCAA_WOMENS',
        
        // Formula 1 Teams
        'ferrari': 'FORMULA_1',
        'mercedes': 'FORMULA_1',
        'red bull': 'FORMULA_1',
        'mclaren': 'FORMULA_1',
        'williams': 'FORMULA_1',
        'aston martin': 'FORMULA_1',
        'alpine': 'FORMULA_1',
        'alfa romeo': 'FORMULA_1',
        'haas': 'FORMULA_1',
        'alphatauri': 'FORMULA_1',
        
        // Soccer Teams (EPL)
        'arsenal': 'SOCCER_EPL',
        'chelsea': 'SOCCER_EPL',
        'liverpool': 'SOCCER_EPL',
        'manchester city': 'SOCCER_EPL',
        'manchester united': 'SOCCER_EPL',
        'tottenham': 'SOCCER_EPL',
        
        // Soccer Teams (MLS)
        'atlanta united': 'SOCCER_MLS',
        'inter miami': 'SOCCER_MLS',
        'la galaxy': 'SOCCER_MLS',
        'lafc': 'SOCCER_MLS',
        'seattle sounders': 'SOCCER_MLS'
      };
      
      // Try to determine the sport based on team name
      for (const [teamFragment, sport] of Object.entries(teamSportMap)) {
        if (normalizedTeamName.includes(teamFragment.toLowerCase())) {
          sportKey = sport;
          break;
        }
      }
      
      // If we couldn't determine the sport, return empty array
      if (!sportKey) {
        console.log(`Could not determine sport for team: ${teamName}`);
        return [];
      }
      
      // Get odds for the determined sport
      const allOdds = await this.getOdds(sportKey);
      
      // Filter games that include the team
      return allOdds.filter(game => {
        const homeTeam = game.homeTeam.toLowerCase();
        const awayTeam = game.awayTeam.toLowerCase();
        
        return homeTeam.includes(normalizedTeamName) ||
               awayTeam.includes(normalizedTeamName);
      }).map(game => {
        // Format the odds for the geolocation service
        const isHomeTeam = game.homeTeam.toLowerCase().includes(normalizedTeamName);
        const teamName = isHomeTeam ? game.homeTeam : game.awayTeam;
        const opponentName = isHomeTeam ? game.awayTeam : game.homeTeam;
        
        // Get the best odds for this team
        let bestOdds = null;
        let suggestion = 'avoid';
        
        if (game.bookmakers && game.bookmakers.length > 0) {
          // Find the best moneyline odds for this team
          game.bookmakers.forEach(bookmaker => {
            const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
            if (h2hMarket) {
              const teamOutcome = h2hMarket.outcomes.find(o =>
                o.name.toLowerCase().includes(normalizedTeamName)
              );
              
              if (teamOutcome && (bestOdds === null || teamOutcome.price > bestOdds)) {
                bestOdds = teamOutcome.price;
                // If odds are positive (underdog), might be worth a bet
                suggestion = teamOutcome.price > 0 ? 'bet' : 'avoid';
              }
            }
          });
        }
        
        // Convert American odds to decimal if needed
        let decimalOdds = 2.0; // Default
        if (bestOdds !== null) {
          if (bestOdds > 0) {
            decimalOdds = (bestOdds / 100) + 1;
          } else {
            decimalOdds = (100 / Math.abs(bestOdds)) + 1;
          }
        }
        
        return {
          team: teamName,
          game: `${teamName} vs. ${opponentName}`,
          odds: decimalOdds,
          suggestion: suggestion,
          timestamp: new Date().toISOString(),
          startTime: game.startTime
        };
      });
    } catch (error) {
      console.error(`Error getting odds for team ${teamName}:`, error);
      // Return empty array instead of simulated data
      console.error(`Error getting odds for team ${teamName}, returning empty array`);
      return [];
    }
  }
  
  // Method removed: generateSimulatedTeamOdds - No longer needed for production
}

// Export singleton instance
const oddsService = new OddsService();
export default oddsService;