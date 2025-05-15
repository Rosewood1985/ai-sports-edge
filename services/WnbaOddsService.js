/**
 * WnbaOddsService.js
 * Service for fetching and managing WNBA odds data
 */

import oddsService from './OddsService';

/**
 * WnbaOddsService class for fetching and managing WNBA odds data
 */
class WnbaOddsService {
  /**
   * Get WNBA moneyline odds
   * @returns {Promise<Array>} Array of WNBA games with moneyline odds
   */
  async getMoneylineOdds() {
    try {
      return await oddsService.getOdds('WNBA', 'h2h');
    } catch (error) {
      console.error('Error fetching WNBA moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get WNBA spread odds
   * @returns {Promise<Array>} Array of WNBA games with spread odds
   */
  async getSpreadOdds() {
    try {
      return await oddsService.getOdds('WNBA', 'spreads');
    } catch (error) {
      console.error('Error fetching WNBA spread odds:', error);
      throw error;
    }
  }

  /**
   * Get WNBA totals odds
   * @returns {Promise<Array>} Array of WNBA games with totals odds
   */
  async getTotalsOdds() {
    try {
      return await oddsService.getOdds('WNBA', 'totals');
    } catch (error) {
      console.error('Error fetching WNBA totals odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming WNBA events
   * @returns {Promise<Array>} Array of upcoming WNBA events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('WNBA');
    } catch (error) {
      console.error('Error fetching upcoming WNBA events:', error);
      throw error;
    }
  }

  /**
   * Get WNBA odds for a specific game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId) {
    try {
      const allOdds = await this.getMoneylineOdds();
      return allOdds.find(game => game.id === gameId);
    } catch (error) {
      console.error(`Error fetching WNBA odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for WNBA games
   * @returns {Promise<Array>} Array of WNBA games with best odds
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
      console.error('Error fetching best WNBA odds:', error);
      throw error;
    }
  }
}

// Export singleton instance
const wnbaOddsService = new WnbaOddsService();
export default wnbaOddsService;