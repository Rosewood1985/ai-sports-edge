/**
 * MlbOddsService.js
 * Service for fetching and managing MLB odds data
 */

import oddsService from './OddsService';
import weatherAdjustmentService from './WeatherAdjustmentService';

/**
 * MlbOddsService class for fetching and managing MLB odds data
 */
class MlbOddsService {
  /**
   * Get MLB moneyline odds
   * @returns {Promise<Array>} Array of MLB games with moneyline odds
   */
  async getMoneylineOdds() {
    try {
      return await oddsService.getOdds('MLB', 'h2h');
    } catch (error) {
      console.error('Error fetching MLB moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get MLB run line odds
   * @returns {Promise<Array>} Array of MLB games with run line odds
   */
  async getRunLineOdds() {
    try {
      return await oddsService.getOdds('MLB', 'spreads');
    } catch (error) {
      console.error('Error fetching MLB run line odds:', error);
      throw error;
    }
  }

  /**
   * Get MLB totals odds
   * @returns {Promise<Array>} Array of MLB games with totals odds
   */
  async getTotalsOdds() {
    try {
      return await oddsService.getOdds('MLB', 'totals');
    } catch (error) {
      console.error('Error fetching MLB totals odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming MLB events
   * @returns {Promise<Array>} Array of upcoming MLB events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('MLB');
    } catch (error) {
      console.error('Error fetching upcoming MLB events:', error);
      throw error;
    }
  }

  /**
   * Get MLB odds for a specific game
   * @param {string} gameId - Game ID
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId, includeWeather = false) {
    try {
      const allOdds = await this.getMoneylineOdds();
      const game = allOdds.find(game => game.id === gameId);
      
      if (!game || !includeWeather) {
        return game;
      }
      
      // Get weather-adjusted odds
      const outcomes = game.bookmakers.flatMap(bookmaker =>
        bookmaker.markets
          .filter(market => market.key === 'h2h')
          .flatMap(market => market.outcomes)
      );
      
      const { odds: adjustedOdds, weatherAdjustment, weatherData } =
        await weatherAdjustmentService.getWeatherAdjustedOdds(gameId, 'MLB', outcomes);
      
      return {
        ...game,
        weatherAdjustedOdds: adjustedOdds,
        weatherAdjustment,
        weatherData
      };
    } catch (error) {
      console.error(`Error fetching MLB odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for MLB games
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Array>} Array of MLB games with best odds
   */
  async getBestOdds(includeWeather = false) {
    try {
      const games = await this.getMoneylineOdds();
      
      const gamesWithOdds = await Promise.all(games.map(async game => {
        // Find best odds for home team
        const homeOdds = game.bookmakers.map(bookmaker => {
          const market = bookmaker.markets.find(m => m.key === 'h2h');
          if (!market) return null;
          
          const outcome = market.outcomes.find(o => o.name === game.homeTeam);
          if (!outcome) return null;
          
          return {
            bookmaker: bookmaker.name,
            price: outcome.price,
          };
        }).filter(Boolean);
        
        // Find best odds for away team
        const awayOdds = game.bookmakers.map(bookmaker => {
          const market = bookmaker.markets.find(m => m.key === 'h2h');
          if (!market) return null;
          
          const outcome = market.outcomes.find(o => o.name === game.awayTeam);
          if (!outcome) return null;
          
          return {
            bookmaker: bookmaker.name,
            price: outcome.price,
          };
        }).filter(Boolean);
        
        // Sort by best price
        const bestHomeOdds = homeOdds.sort((a, b) => b.price - a.price)[0] || null;
        const bestAwayOdds = awayOdds.sort((a, b) => b.price - a.price)[0] || null;
        
        const result = {
          id: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          startTime: game.startTime,
          bestHomeOdds,
          bestAwayOdds,
        };
        
        // Add weather adjustments if requested
        if (includeWeather) {
          const outcomes = [
            bestHomeOdds && { name: game.homeTeam, price: bestHomeOdds.price },
            bestAwayOdds && { name: game.awayTeam, price: bestAwayOdds.price }
          ].filter(Boolean);
          
          const { odds: adjustedOdds, weatherAdjustment, weatherData } =
            await weatherAdjustmentService.getWeatherAdjustedOdds(game.id, 'MLB', outcomes);
          
          // Map adjusted odds back to home/away
          const adjustedHomeOdds = adjustedOdds.find(o => o.name === game.homeTeam);
          const adjustedAwayOdds = adjustedOdds.find(o => o.name === game.awayTeam);
          
          return {
            ...result,
            weatherAdjustedHomeOdds: adjustedHomeOdds,
            weatherAdjustedAwayOdds: adjustedAwayOdds,
            weatherAdjustment,
            weatherData
          };
        }
        
        return result;
      }));
      
      return gamesWithOdds;
    } catch (error) {
      console.error('Error fetching best MLB odds:', error);
      throw error;
    }
  }

  /**
   * Get MLB player prop odds
   * @param {string} gameId - Game ID (optional)
   * @returns {Promise<Array>} Array of MLB player prop odds
   */
  async getPlayerPropOdds(gameId = null) {
    try {
      const odds = await oddsService.getOdds('MLB', 'player_props');
      
      if (gameId) {
        return odds.filter(game => game.id === gameId);
      }
      
      return odds;
    } catch (error) {
      console.error('Error fetching MLB player prop odds:', error);
      throw error;
    }
  }
  
  /**
   * Get weather impact for MLB games
   * @returns {Promise<Array>} Array of MLB games with weather impact
   */
  async getWeatherImpact() {
    try {
      const games = await this.getMoneylineOdds();
      
      const gamesWithWeatherImpact = await Promise.all(games.map(async game => {
        try {
          // Get weather data for the game
          const { weatherAdjustment, weatherData } =
            await weatherAdjustmentService.getWeatherAdjustedOdds(game.id, 'MLB', []);
          
          return {
            id: game.id,
            sport: game.sport,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            startTime: game.startTime,
            weatherAdjustment,
            weatherData
          };
        } catch (error) {
          console.error(`Error getting weather impact for game ${game.id}:`, error);
          return {
            id: game.id,
            sport: game.sport,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            startTime: game.startTime,
            weatherAdjustment: {
              factor: 1.0,
              impact: 'none',
              description: 'Error getting weather data'
            }
          };
        }
      }));
      
      return gamesWithWeatherImpact;
    } catch (error) {
      console.error('Error fetching MLB weather impact:', error);
      throw error;
    }
  }
}

// Export singleton instance
const mlbOddsService = new MlbOddsService();
export default mlbOddsService;