/**
 * OddsService.js
 * Service for fetching and managing sports odds data
 */

import apiKeys from '../utils/apiKeys';
import { apiService } from 'atomic/organisms';

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
  HORSE_RACING: 'horse_racing',
};

// Bookmakers to include
const BOOKMAKERS = ['fanduel', 'draftkings', 'betmgm', 'caesars', 'pointsbet'];

/**
 * OddsService class for fetching and managing sports odds data
 */
class OddsService {
  constructor() {
    // API configuration for apiService
    this.baseUrl = API_CONFIG.baseUrl;
    this.apiKey = API_CONFIG.apiKey;

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

      // Create the endpoint URL
      const endpoint = `${this.baseUrl}/sports`;

      // Set up the query parameters
      const params = {
        apiKey: this.apiKey,
        sport: sportKey,
        regions: region,
        markets: market,
        oddsFormat: 'american',
        bookmakers: BOOKMAKERS.join(','),
      };

      // Use apiService to make the request with caching
      const response = await apiService.makeRequest(endpoint, {
        method: 'GET',
        params,
        // Use the sport key as part of the cache key for better organization
        cacheKey: `odds_${sportKey}_${market}_${region}`,
        // Use the cacheTTL from this service
        cacheTTL: this.cacheTTL,
      });

      // Process the data
      const processedData = this.processOddsData(response, sport);

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

      // Create the endpoint URL
      const endpoint = `${this.baseUrl}/sports`;

      // Set up the query parameters
      const params = {
        apiKey: this.apiKey,
        sport: sportKey,
      };

      // Use apiService to make the request with caching
      const response = await apiService.makeRequest(endpoint, {
        method: 'GET',
        params,
        // Use the sport key as part of the cache key for better organization
        cacheKey: `events_${sportKey}`,
        // Use the cacheTTL from this service
        cacheTTL: this.cacheTTL,
      });

      // Process the data
      const processedData = this.processEventsData(response, sport);

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
   * Clear cache for a specific key or all odds-related cache
   * @param {string} key - Cache key (optional)
   */
  clearCache(key = null) {
    if (key) {
      // Clear specific cache key
      apiService.clearCache(key);
    } else {
      // Clear all odds-related cache keys
      apiService.clearCache(/^odds_|^events_/);
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
        celtics: 'NBA',
        nets: 'NBA',
        knicks: 'NBA',
        '76ers': 'NBA',
        raptors: 'NBA',
        bulls: 'NBA',
        cavaliers: 'NBA',
        pistons: 'NBA',
        pacers: 'NBA',
        bucks: 'NBA',
        hawks: 'NBA',
        hornets: 'NBA',
        heat: 'NBA',
        magic: 'NBA',
        wizards: 'NBA',
        nuggets: 'NBA',
        timberwolves: 'NBA',
        thunder: 'NBA',
        blazers: 'NBA',
        jazz: 'NBA',
        warriors: 'NBA',
        clippers: 'NBA',
        lakers: 'NBA',
        suns: 'NBA',
        kings: 'NBA',
        mavericks: 'NBA',
        rockets: 'NBA',
        grizzlies: 'NBA',
        pelicans: 'NBA',
        spurs: 'NBA',

        // WNBA Teams
        sparks: 'WNBA',
        liberty: 'WNBA',
        sky: 'WNBA',
        storm: 'WNBA',
        mercury: 'WNBA',
        mystics: 'WNBA',
        sun: 'WNBA',
        fever: 'WNBA',
        dream: 'WNBA',
        wings: 'WNBA',
        aces: 'WNBA',
        lynx: 'WNBA',

        // MLB Teams
        yankees: 'MLB',
        'red sox': 'MLB',
        'blue jays': 'MLB',
        orioles: 'MLB',
        rays: 'MLB',
        guardians: 'MLB',
        twins: 'MLB',
        royals: 'MLB',
        tigers: 'MLB',
        'white sox': 'MLB',
        astros: 'MLB',
        angels: 'MLB',
        athletics: 'MLB',
        mariners: 'MLB',
        rangers: 'MLB',
        braves: 'MLB',
        marlins: 'MLB',
        mets: 'MLB',
        phillies: 'MLB',
        nationals: 'MLB',
        cubs: 'MLB',
        reds: 'MLB',
        brewers: 'MLB',
        pirates: 'MLB',
        cardinals: 'MLB',
        diamondbacks: 'MLB',
        rockies: 'MLB',
        dodgers: 'MLB',
        padres: 'MLB',
        giants: 'MLB',

        // NHL Teams
        bruins: 'NHL',
        sabres: 'NHL',
        'red wings': 'NHL',
        panthers: 'NHL',
        canadiens: 'NHL',
        senators: 'NHL',
        lightning: 'NHL',
        'maple leafs': 'NHL',
        hurricanes: 'NHL',
        'blue jackets': 'NHL',
        devils: 'NHL',
        islanders: 'NHL',
        rangers: 'NHL',
        flyers: 'NHL',
        penguins: 'NHL',
        capitals: 'NHL',
        blackhawks: 'NHL',
        avalanche: 'NHL',
        stars: 'NHL',
        wild: 'NHL',
        predators: 'NHL',
        blues: 'NHL',
        jets: 'NHL',
        ducks: 'NHL',
        coyotes: 'NHL',
        flames: 'NHL',
        oilers: 'NHL',
        kings: 'NHL',
        sharks: 'NHL',
        kraken: 'NHL',
        'golden knights': 'NHL',
        canucks: 'NHL',

        // UFC Fighters (top fighters)
        jones: 'UFC',
        adesanya: 'UFC',
        ngannou: 'UFC',
        usman: 'UFC',
        volkanovski: 'UFC',
        oliveira: 'UFC',
        poirier: 'UFC',
        mcgregor: 'UFC',
        holloway: 'UFC',
        whittaker: 'UFC',
        gane: 'UFC',
        teixeira: 'UFC',
        sterling: 'UFC',
        yan: 'UFC',
        namajunas: 'UFC',
        shevchenko: 'UFC',
        nunes: 'UFC',

        // NCAA Teams
        wildcats: 'NCAA_MENS',
        'tar heels': 'NCAA_MENS',
        'blue devils': 'NCAA_MENS',
        jayhawks: 'NCAA_MENS',
        huskies: 'NCAA_WOMENS',
        gamecocks: 'NCAA_WOMENS',
        bears: 'NCAA_WOMENS',

        // Formula 1 Teams
        ferrari: 'FORMULA_1',
        mercedes: 'FORMULA_1',
        'red bull': 'FORMULA_1',
        mclaren: 'FORMULA_1',
        williams: 'FORMULA_1',
        'aston martin': 'FORMULA_1',
        alpine: 'FORMULA_1',
        'alfa romeo': 'FORMULA_1',
        haas: 'FORMULA_1',
        alphatauri: 'FORMULA_1',

        // Soccer Teams (EPL)
        arsenal: 'SOCCER_EPL',
        chelsea: 'SOCCER_EPL',
        liverpool: 'SOCCER_EPL',
        'manchester city': 'SOCCER_EPL',
        'manchester united': 'SOCCER_EPL',
        tottenham: 'SOCCER_EPL',

        // Soccer Teams (MLS)
        'atlanta united': 'SOCCER_MLS',
        'inter miami': 'SOCCER_MLS',
        'la galaxy': 'SOCCER_MLS',
        lafc: 'SOCCER_MLS',
        'seattle sounders': 'SOCCER_MLS',
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
      return allOdds
        .filter(game => {
          const homeTeam = game.homeTeam.toLowerCase();
          const awayTeam = game.awayTeam.toLowerCase();

          return homeTeam.includes(normalizedTeamName) || awayTeam.includes(normalizedTeamName);
        })
        .map(game => {
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
              decimalOdds = bestOdds / 100 + 1;
            } else {
              decimalOdds = 100 / Math.abs(bestOdds) + 1;
            }
          }

          return {
            team: teamName,
            game: `${teamName} vs. ${opponentName}`,
            odds: decimalOdds,
            suggestion: suggestion,
            timestamp: new Date().toISOString(),
            startTime: game.startTime,
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
