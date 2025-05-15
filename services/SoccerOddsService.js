/**
 * SoccerOddsService.js
 * Service for fetching and managing soccer odds data
 */

import oddsService from './OddsService';
import weatherAdjustmentService from './WeatherAdjustmentService';

/**
 * SoccerOddsService class for fetching and managing soccer odds data
 */
class SoccerOddsService {
  /**
   * Get EPL moneyline odds
   * @returns {Promise<Array>} Array of EPL games with moneyline odds
   */
  async getEplMoneylineOdds() {
    try {
      return await oddsService.getOdds('SOCCER_EPL', 'h2h');
    } catch (error) {
      console.error('Error fetching EPL moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get MLS moneyline odds
   * @returns {Promise<Array>} Array of MLS games with moneyline odds
   */
  async getMlsMoneylineOdds() {
    try {
      return await oddsService.getOdds('SOCCER_MLS', 'h2h');
    } catch (error) {
      console.error('Error fetching MLS moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get EPL spread odds
   * @returns {Promise<Array>} Array of EPL games with spread odds
   */
  async getEplSpreadOdds() {
    try {
      return await oddsService.getOdds('SOCCER_EPL', 'spreads');
    } catch (error) {
      console.error('Error fetching EPL spread odds:', error);
      throw error;
    }
  }

  /**
   * Get MLS spread odds
   * @returns {Promise<Array>} Array of MLS games with spread odds
   */
  async getMlsSpreadOdds() {
    try {
      return await oddsService.getOdds('SOCCER_MLS', 'spreads');
    } catch (error) {
      console.error('Error fetching MLS spread odds:', error);
      throw error;
    }
  }

  /**
   * Get EPL totals odds
   * @returns {Promise<Array>} Array of EPL games with totals odds
   */
  async getEplTotalsOdds() {
    try {
      return await oddsService.getOdds('SOCCER_EPL', 'totals');
    } catch (error) {
      console.error('Error fetching EPL totals odds:', error);
      throw error;
    }
  }

  /**
   * Get MLS totals odds
   * @returns {Promise<Array>} Array of MLS games with totals odds
   */
  async getMlsTotalsOdds() {
    try {
      return await oddsService.getOdds('SOCCER_MLS', 'totals');
    } catch (error) {
      console.error('Error fetching MLS totals odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming EPL events
   * @returns {Promise<Array>} Array of upcoming EPL events
   */
  async getUpcomingEplEvents() {
    try {
      return await oddsService.getUpcomingEvents('SOCCER_EPL');
    } catch (error) {
      console.error('Error fetching upcoming EPL events:', error);
      throw error;
    }
  }

  /**
   * Get upcoming MLS events
   * @returns {Promise<Array>} Array of upcoming MLS events
   */
  async getUpcomingMlsEvents() {
    try {
      return await oddsService.getUpcomingEvents('SOCCER_MLS');
    } catch (error) {
      console.error('Error fetching upcoming MLS events:', error);
      throw error;
    }
  }

  /**
   * Get soccer odds for a specific game
   * @param {string} gameId - Game ID
   * @param {string} league - League ('EPL' or 'MLS')
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId, league = 'EPL', includeWeather = false) {
    try {
      const allOdds = league === 'EPL'
        ? await this.getEplMoneylineOdds()
        : await this.getMlsMoneylineOdds();
      
      const game = allOdds.find(game => game.id === gameId);
      
      if (!game || !includeWeather) {
        return game;
      }
      
      // Get weather-adjusted odds
      const sportKey = league === 'EPL' ? 'SOCCER_EPL' : 'SOCCER_MLS';
      const outcomes = game.bookmakers.flatMap(bookmaker =>
        bookmaker.markets
          .filter(market => market.key === 'h2h')
          .flatMap(market => market.outcomes)
      );
      
      const { odds: adjustedOdds, weatherAdjustment, weatherData } =
        await weatherAdjustmentService.getWeatherAdjustedOdds(gameId, sportKey, outcomes);
      
      return {
        ...game,
        weatherAdjustedOdds: adjustedOdds,
        weatherAdjustment,
        weatherData
      };
    } catch (error) {
      console.error(`Error fetching ${league} odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for EPL games
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Array>} Array of EPL games with best odds
   */
  async getBestEplOdds(includeWeather = false) {
    try {
      const games = await this.getEplMoneylineOdds();
      return this.processBestOdds(games, 'SOCCER_EPL', includeWeather);
    } catch (error) {
      console.error('Error fetching best EPL odds:', error);
      throw error;
    }
  }

  /**
   * Get best odds for MLS games
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Array>} Array of MLS games with best odds
   */
  async getBestMlsOdds(includeWeather = false) {
    try {
      const games = await this.getMlsMoneylineOdds();
      return this.processBestOdds(games, 'SOCCER_MLS', includeWeather);
    } catch (error) {
      console.error('Error fetching best MLS odds:', error);
      throw error;
    }
  }

  /**
   * Process best odds for soccer games
   * @param {Array} games - Array of soccer games
   * @param {string} sportKey - Sport key
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Array>} Processed games with best odds
   * @private
   */
  async processBestOdds(games, sportKey, includeWeather = false) {
    const processedGames = await Promise.all(games.map(async game => {
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
      
      // Find best odds for draw
      const drawOdds = game.bookmakers.map(bookmaker => {
        const market = bookmaker.markets.find(m => m.key === 'h2h');
        if (!market) return null;
        
        const outcome = market.outcomes.find(o => o.name === 'Draw');
        if (!outcome) return null;
        
        return {
          bookmaker: bookmaker.name,
          price: outcome.price,
        };
      }).filter(Boolean);
      
      // Sort by best price
      const bestHomeOdds = homeOdds.sort((a, b) => b.price - a.price)[0] || null;
      const bestAwayOdds = awayOdds.sort((a, b) => b.price - a.price)[0] || null;
      const bestDrawOdds = drawOdds.sort((a, b) => b.price - a.price)[0] || null;
      
      const result = {
        id: game.id,
        sport: game.sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        startTime: game.startTime,
        bestHomeOdds,
        bestAwayOdds,
        bestDrawOdds,
      };
      
      // Add weather adjustments if requested
      if (includeWeather) {
        const outcomes = [
          bestHomeOdds && { name: game.homeTeam, price: bestHomeOdds.price },
          bestAwayOdds && { name: game.awayTeam, price: bestAwayOdds.price },
          bestDrawOdds && { name: 'Draw', price: bestDrawOdds.price }
        ].filter(Boolean);
        
        const { odds: adjustedOdds, weatherAdjustment, weatherData } =
          await weatherAdjustmentService.getWeatherAdjustedOdds(game.id, sportKey, outcomes);
        
        // Map adjusted odds back to home/away/draw
        const adjustedHomeOdds = adjustedOdds.find(o => o.name === game.homeTeam);
        const adjustedAwayOdds = adjustedOdds.find(o => o.name === game.awayTeam);
        const adjustedDrawOdds = adjustedOdds.find(o => o.name === 'Draw');
        
        return {
          ...result,
          weatherAdjustedHomeOdds: adjustedHomeOdds,
          weatherAdjustedAwayOdds: adjustedAwayOdds,
          weatherAdjustedDrawOdds: adjustedDrawOdds,
          weatherAdjustment,
          weatherData
        };
      }
      
      return result;
    }));
    
    return processedGames;
  }
  
  /**
   * Get weather impact for soccer games
   * @param {string} league - League ('EPL' or 'MLS')
   * @returns {Promise<Array>} Array of soccer games with weather impact
   */
  async getWeatherImpact(league = 'EPL') {
    try {
      const sportKey = league === 'EPL' ? 'SOCCER_EPL' : 'SOCCER_MLS';
      const games = league === 'EPL'
        ? await this.getEplMoneylineOdds()
        : await this.getMlsMoneylineOdds();
      
      const gamesWithWeatherImpact = await Promise.all(games.map(async game => {
        try {
          // Get weather data for the game
          const { weatherAdjustment, weatherData } =
            await weatherAdjustmentService.getWeatherAdjustedOdds(game.id, sportKey, []);
          
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
      console.error(`Error fetching ${league} weather impact:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const soccerOddsService = new SoccerOddsService();
export default soccerOddsService;