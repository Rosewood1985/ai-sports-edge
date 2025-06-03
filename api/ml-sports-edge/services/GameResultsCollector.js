/**
 * GameResultsCollector.js
 * Fetches official game results from league APIs
 */

const axios = require('axios');
const NodeCache = require('node-cache');

const logger = require('../utils/logger');

// Cache for API responses
const resultsCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour TTL

class GameResultsCollector {
  constructor() {
    // API configuration
    this.apiConfig = {
      NBA: {
        baseUrl: 'https://api.sportsdata.io/v3/nba/scores/json',
        apiKey: process.env.SPORTSDATA_NBA_API_KEY,
      },
      NFL: {
        baseUrl: 'https://api.sportsdata.io/v3/nfl/scores/json',
        apiKey: process.env.SPORTSDATA_NFL_API_KEY,
      },
      MLB: {
        baseUrl: 'https://api.sportsdata.io/v3/mlb/scores/json',
        apiKey: process.env.SPORTSDATA_MLB_API_KEY,
      },
      NHL: {
        baseUrl: 'https://api.sportsdata.io/v3/nhl/scores/json',
        apiKey: process.env.SPORTSDATA_NHL_API_KEY,
      },
      WNBA: {
        baseUrl: 'https://api.sportsdata.io/v3/wnba/scores/json',
        apiKey: process.env.SPORTSDATA_WNBA_API_KEY,
      },
      NCAA: {
        baseUrl: 'https://api.sportsdata.io/v3/cbb/scores/json',
        apiKey: process.env.SPORTSDATA_NCAA_API_KEY,
      },
      F1: {
        baseUrl: 'https://api.sportsdata.io/v3/formula1/scores/json',
        apiKey: process.env.SPORTSDATA_F1_API_KEY,
      },
    };
  }

  /**
   * Fetch game results for a specific game
   * @param {Object} game - Game to fetch results for
   * @returns {Promise<Object>} Game results
   */
  async fetchGameResults(game) {
    try {
      const sport = game.sport;
      const gameDate = new Date(game.date);

      // Check if we have a configured API for this sport
      if (!this.apiConfig[sport]) {
        logger.warn(`No API configuration for sport: ${sport}`);
        return null;
      }

      // Format date for API
      const formattedDate = this.formatDateForApi(gameDate, sport);

      // Check cache first
      const cacheKey = `${sport}_${game._id}`;
      const cachedResults = resultsCache.get(cacheKey);

      if (cachedResults) {
        logger.info(`Using cached results for ${sport} game ${game._id}`);
        return cachedResults;
      }

      // Fetch results from API
      const results = await this.fetchFromApi(sport, formattedDate, game);

      if (results) {
        // Cache results
        resultsCache.set(cacheKey, results);
        return results;
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching results for ${game.sport} game ${game._id}:`, error);
      return null;
    }
  }

  /**
   * Fetch results from API
   * @param {string} sport - Sport key
   * @param {string} date - Formatted date
   * @param {Object} game - Game to match
   * @returns {Promise<Object>} Game results
   */
  async fetchFromApi(sport, date, game) {
    try {
      const config = this.apiConfig[sport];

      // Build API URL based on sport
      let url;
      const params = { key: config.apiKey };

      switch (sport) {
        case 'NBA':
        case 'WNBA':
        case 'NHL':
        case 'MLB':
        case 'NCAA':
          url = `${config.baseUrl}/ScoresByDate/${date}`;
          break;
        case 'NFL':
          // NFL uses week instead of date
          const week = this.getNflWeek(new Date(game.date));
          url = `${config.baseUrl}/ScoresByWeek/2024/${week}`;
          break;
        case 'F1':
          // F1 uses race ID
          url = `${config.baseUrl}/RaceResults/${date}`;
          break;
        default:
          logger.warn(`Unsupported sport for API: ${sport}`);
          return null;
      }

      // Make API request
      logger.info(`Fetching ${sport} results from ${url}`);
      const response = await axios.get(url, { params });

      if (response.status !== 200) {
        logger.error(`API error: ${response.status} ${response.statusText}`);
        return null;
      }

      // Find the matching game in the response
      const games = response.data;

      if (!Array.isArray(games)) {
        logger.error('API response is not an array');
        return null;
      }

      logger.info(`Received ${games.length} games from ${sport} API`);

      // Match game based on teams
      const matchedGame = this.matchGame(games, game);

      if (!matchedGame) {
        logger.warn(`No matching game found for ${game.homeTeam.name} vs ${game.awayTeam.name}`);
        return null;
      }

      // Extract results
      return this.extractResults(matchedGame, sport);
    } catch (error) {
      logger.error(`API error for ${sport}:`, error);
      return null;
    }
  }

  /**
   * Match game from API response to our game
   * @param {Array} apiGames - Games from API
   * @param {Object} ourGame - Our game to match
   * @returns {Object} Matched game
   */
  matchGame(apiGames, ourGame) {
    // This matching logic would be more sophisticated in a real system
    // For now, we'll just match on team names

    return apiGames.find(apiGame => {
      const homeTeam = apiGame.HomeTeam || apiGame.HomeTeamName;
      const awayTeam = apiGame.AwayTeam || apiGame.AwayTeamName;

      // Check if team names match (case insensitive)
      const homeMatch =
        homeTeam && ourGame.homeTeam.name.toLowerCase().includes(homeTeam.toLowerCase());
      const awayMatch =
        awayTeam && ourGame.awayTeam.name.toLowerCase().includes(awayTeam.toLowerCase());

      return homeMatch && awayMatch;
    });
  }

  /**
   * Extract results from API game
   * @param {Object} apiGame - Game from API
   * @param {string} sport - Sport key
   * @returns {Object} Game results
   */
  extractResults(apiGame, sport) {
    // Extract scores based on sport
    let homeScore, awayScore;

    switch (sport) {
      case 'NBA':
      case 'WNBA':
      case 'NCAA':
        homeScore = apiGame.HomeTeamScore;
        awayScore = apiGame.AwayTeamScore;
        break;
      case 'NFL':
        homeScore = apiGame.HomeScore;
        awayScore = apiGame.AwayScore;
        break;
      case 'MLB':
      case 'NHL':
        homeScore = apiGame.HomeTeamRuns || apiGame.HomeTeamScore;
        awayScore = apiGame.AwayTeamRuns || apiGame.AwayTeamScore;
        break;
      case 'F1':
        // F1 doesn't have traditional scores
        // We might use finishing position or points
        homeScore = apiGame.HomePoints || 0;
        awayScore = apiGame.AwayPoints || 0;
        break;
      default:
        homeScore = 0;
        awayScore = 0;
    }

    // Extract additional statistics if available
    const stats = this.extractGameStats(apiGame, sport);

    return {
      homeScore,
      awayScore,
      status: 'final',
      source: `${sport} API`,
      stats,
      timestamp: new Date(),
    };
  }

  /**
   * Extract detailed game statistics
   * @param {Object} apiGame - Game from API
   * @param {string} sport - Sport key
   * @returns {Object} Game statistics
   */
  extractGameStats(apiGame, sport) {
    // This would extract detailed statistics based on the sport
    // For now, we'll just return a placeholder

    switch (sport) {
      case 'NBA':
      case 'WNBA':
        return {
          homeFGPercentage: apiGame.HomeFGPercentage,
          awayFGPercentage: apiGame.AwayFGPercentage,
          homeRebounds: apiGame.HomeRebounds,
          awayRebounds: apiGame.AwayRebounds,
          homeAssists: apiGame.HomeAssists,
          awayAssists: apiGame.AwayAssists,
          homeTurnovers: apiGame.HomeTurnovers,
          awayTurnovers: apiGame.AwayTurnovers,
        };
      case 'NFL':
        return {
          homeFirstDowns: apiGame.HomeFirstDowns,
          awayFirstDowns: apiGame.AwayFirstDowns,
          homeTotalYards: apiGame.HomeTotalYards,
          awayTotalYards: apiGame.AwayTotalYards,
          homeTurnovers: apiGame.HomeTurnovers,
          awayTurnovers: apiGame.AwayTurnovers,
        };
      case 'MLB':
        return {
          homeHits: apiGame.HomeHits,
          awayHits: apiGame.AwayHits,
          homeErrors: apiGame.HomeErrors,
          awayErrors: apiGame.AwayErrors,
          homeLeftOnBase: apiGame.HomeLeftOnBase,
          awayLeftOnBase: apiGame.AwayLeftOnBase,
        };
      case 'NHL':
        return {
          homeShots: apiGame.HomeShots,
          awayShots: apiGame.AwayShots,
          homePowerPlays: apiGame.HomePowerPlays,
          awayPowerPlays: apiGame.AwayPowerPlays,
          homePowerPlayGoals: apiGame.HomePowerPlayGoals,
          awayPowerPlayGoals: apiGame.AwayPowerPlayGoals,
        };
      case 'F1':
        return {
          fastestLap: apiGame.FastestLap,
          polePosition: apiGame.PolePosition,
          weather: apiGame.Weather,
          trackCondition: apiGame.TrackCondition,
        };
      default:
        return {};
    }
  }

  /**
   * Format date for API
   * @param {Date} date - Date to format
   * @param {string} sport - Sport key
   * @returns {string} Formatted date
   */
  formatDateForApi(date, sport) {
    // Different APIs expect different date formats
    switch (sport) {
      case 'NBA':
      case 'WNBA':
      case 'NHL':
      case 'MLB':
      case 'NCAA':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'F1':
        return date.getFullYear(); // Just the year for F1
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Get NFL week from date
   * @param {Date} date - Date to get week for
   * @returns {number} NFL week
   */
  getNflWeek(date) {
    // This would be a more complex calculation in a real system
    // For now, we'll just return a placeholder

    // NFL season typically starts in September
    const month = date.getMonth(); // 0-based (0 = January)
    const day = date.getDate();

    if (month < 8) {
      // Before September
      return 1; // Preseason
    }

    // Rough calculation of week based on month and day
    if (month === 8) {
      // September
      return Math.ceil(day / 7);
    } else if (month === 9) {
      // October
      return Math.ceil(day / 7) + 4;
    } else if (month === 10) {
      // November
      return Math.ceil(day / 7) + 8;
    } else {
      // December or later
      return Math.ceil(day / 7) + 12;
    }
  }

  /**
   * Fetch results for multiple games
   * @param {Array} games - Games to fetch results for
   * @returns {Promise<Array>} Game results
   */
  async fetchMultipleGameResults(games) {
    const results = [];

    for (const game of games) {
      const result = await this.fetchGameResults(game);

      if (result) {
        results.push({
          gameId: game._id,
          result,
        });
      }
    }

    return results;
  }
}

module.exports = GameResultsCollector;
