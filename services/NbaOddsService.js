/**
 * NbaOddsService.js
 * Service for fetching and managing NBA odds data
 */

import oddsService from './OddsService';

/**
 * NbaOddsService class for fetching and managing NBA odds data
 */
class NbaOddsService {
  /**
   * Get NBA moneyline odds
   * @returns {Promise<Array>} Array of NBA games with moneyline odds
   */
  async getMoneylineOdds() {
    try {
      return await oddsService.getOdds('NBA', 'h2h');
    } catch (error) {
      console.error('Error fetching NBA moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get NBA spread odds
   * @returns {Promise<Array>} Array of NBA games with spread odds
   */
  async getSpreadOdds() {
    try {
      return await oddsService.getOdds('NBA', 'spreads');
    } catch (error) {
      console.error('Error fetching NBA spread odds:', error);
      throw error;
    }
  }

  /**
   * Get NBA totals odds
   * @returns {Promise<Array>} Array of NBA games with totals odds
   */
  async getTotalsOdds() {
    try {
      return await oddsService.getOdds('NBA', 'totals');
    } catch (error) {
      console.error('Error fetching NBA totals odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming NBA events
   * @returns {Promise<Array>} Array of upcoming NBA events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('NBA');
    } catch (error) {
      console.error('Error fetching upcoming NBA events:', error);
      throw error;
    }
  }

  /**
   * Get NBA odds for a specific game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId) {
    try {
      const allOdds = await this.getMoneylineOdds();
      return allOdds.find(game => game.id === gameId);
    } catch (error) {
      console.error(`Error fetching NBA odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for NBA games
   * @returns {Promise<Array>} Array of NBA games with best odds
   */
  async getBestOdds() {
    try {
      const games = await this.getMoneylineOdds();
      
      return games.map(game => {
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
        
        return {
          id: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          startTime: game.startTime,
          bestHomeOdds,
          bestAwayOdds,
        };
      });
    } catch (error) {
      console.error('Error fetching best NBA odds:', error);
      throw error;
    }
  }
}

// Export singleton instance
const nbaOddsService = new NbaOddsService();
export default nbaOddsService;