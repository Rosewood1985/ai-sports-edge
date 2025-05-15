/**
 * NhlOddsService.js
 * Service for fetching and managing NHL odds data
 */

import oddsService from './OddsService';

/**
 * NhlOddsService class for fetching and managing NHL odds data
 */
class NhlOddsService {
  /**
   * Get NHL moneyline odds
   * @returns {Promise<Array>} Array of NHL games with moneyline odds
   */
  async getMoneylineOdds() {
    try {
      return await oddsService.getOdds('NHL', 'h2h');
    } catch (error) {
      console.error('Error fetching NHL moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get NHL puck line odds
   * @returns {Promise<Array>} Array of NHL games with puck line odds
   */
  async getPuckLineOdds() {
    try {
      return await oddsService.getOdds('NHL', 'spreads');
    } catch (error) {
      console.error('Error fetching NHL puck line odds:', error);
      throw error;
    }
  }

  /**
   * Get NHL totals odds
   * @returns {Promise<Array>} Array of NHL games with totals odds
   */
  async getTotalsOdds() {
    try {
      return await oddsService.getOdds('NHL', 'totals');
    } catch (error) {
      console.error('Error fetching NHL totals odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming NHL events
   * @returns {Promise<Array>} Array of upcoming NHL events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('NHL');
    } catch (error) {
      console.error('Error fetching upcoming NHL events:', error);
      throw error;
    }
  }

  /**
   * Get NHL odds for a specific game
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId) {
    try {
      const allOdds = await this.getMoneylineOdds();
      return allOdds.find(game => game.id === gameId);
    } catch (error) {
      console.error(`Error fetching NHL odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for NHL games
   * @returns {Promise<Array>} Array of NHL games with best odds
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
      console.error('Error fetching best NHL odds:', error);
      throw error;
    }
  }

  /**
   * Get NHL period betting odds
   * @param {string} gameId - Game ID (optional)
   * @returns {Promise<Array>} Array of NHL period betting odds
   */
  async getPeriodBettingOdds(gameId = null) {
    try {
      const odds = await oddsService.getOdds('NHL', 'period');
      
      if (gameId) {
        return odds.filter(game => game.id === gameId);
      }
      
      return odds;
    } catch (error) {
      console.error('Error fetching NHL period betting odds:', error);
      throw error;
    }
  }
}

// Export singleton instance
const nhlOddsService = new NhlOddsService();
export default nhlOddsService;