/**
 * NcaaOddsService.js
 * Service for fetching and managing NCAA basketball odds data
 */

import oddsService from './OddsService';

/**
 * NcaaOddsService class for fetching and managing NCAA basketball odds data
 */
class NcaaOddsService {
  /**
   * Get NCAA men's basketball moneyline odds
   * @returns {Promise<Array>} Array of NCAA men's basketball games with moneyline odds
   */
  async getMensMoneylineOdds() {
    try {
      return await oddsService.getOdds('NCAA_MENS', 'h2h');
    } catch (error) {
      console.error("Error fetching NCAA men's basketball moneyline odds:", error);
      throw error;
    }
  }

  /**
   * Get NCAA women's basketball moneyline odds
   * @returns {Promise<Array>} Array of NCAA women's basketball games with moneyline odds
   */
  async getWomensMoneylineOdds() {
    try {
      return await oddsService.getOdds('NCAA_WOMENS', 'h2h');
    } catch (error) {
      console.error("Error fetching NCAA women's basketball moneyline odds:", error);
      throw error;
    }
  }

  /**
   * Get NCAA men's basketball spread odds
   * @returns {Promise<Array>} Array of NCAA men's basketball games with spread odds
   */
  async getMensSpreadOdds() {
    try {
      return await oddsService.getOdds('NCAA_MENS', 'spreads');
    } catch (error) {
      console.error("Error fetching NCAA men's basketball spread odds:", error);
      throw error;
    }
  }

  /**
   * Get NCAA women's basketball spread odds
   * @returns {Promise<Array>} Array of NCAA women's basketball games with spread odds
   */
  async getWomensSpreadOdds() {
    try {
      return await oddsService.getOdds('NCAA_WOMENS', 'spreads');
    } catch (error) {
      console.error("Error fetching NCAA women's basketball spread odds:", error);
      throw error;
    }
  }

  /**
   * Get NCAA men's basketball totals odds
   * @returns {Promise<Array>} Array of NCAA men's basketball games with totals odds
   */
  async getMensTotalsOdds() {
    try {
      return await oddsService.getOdds('NCAA_MENS', 'totals');
    } catch (error) {
      console.error("Error fetching NCAA men's basketball totals odds:", error);
      throw error;
    }
  }

  /**
   * Get NCAA women's basketball totals odds
   * @returns {Promise<Array>} Array of NCAA women's basketball games with totals odds
   */
  async getWomensTotalsOdds() {
    try {
      return await oddsService.getOdds('NCAA_WOMENS', 'totals');
    } catch (error) {
      console.error("Error fetching NCAA women's basketball totals odds:", error);
      throw error;
    }
  }

  /**
   * Get upcoming NCAA men's basketball events
   * @returns {Promise<Array>} Array of upcoming NCAA men's basketball events
   */
  async getUpcomingMensEvents() {
    try {
      return await oddsService.getUpcomingEvents('NCAA_MENS');
    } catch (error) {
      console.error("Error fetching upcoming NCAA men's basketball events:", error);
      throw error;
    }
  }

  /**
   * Get upcoming NCAA women's basketball events
   * @returns {Promise<Array>} Array of upcoming NCAA women's basketball events
   */
  async getUpcomingWomensEvents() {
    try {
      return await oddsService.getUpcomingEvents('NCAA_WOMENS');
    } catch (error) {
      console.error("Error fetching upcoming NCAA women's basketball events:", error);
      throw error;
    }
  }

  /**
   * Get NCAA basketball odds for a specific game
   * @param {string} gameId - Game ID
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Promise<Object>} Game with odds
   */
  async getGameOdds(gameId, gender = 'mens') {
    try {
      const allOdds =
        gender === 'mens' ? await this.getMensMoneylineOdds() : await this.getWomensMoneylineOdds();

      return allOdds.find(game => game.id === gameId);
    } catch (error) {
      console.error(`Error fetching NCAA basketball odds for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Get March Madness tournament odds
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Promise<Array>} Array of March Madness games with odds
   */
  async getMarchMadnessOdds(gender = 'mens') {
    try {
      // For March Madness, we'd typically filter by tournament name
      // This is a simplified implementation
      const events =
        gender === 'mens'
          ? await this.getUpcomingMensEvents()
          : await this.getUpcomingWomensEvents();

      // Filter for March Madness tournament
      const marchMadnessEvents = events.filter(
        event => event.tournament && event.tournament.toLowerCase().includes('ncaa tournament')
      );

      // Get odds for these events
      const allOdds =
        gender === 'mens' ? await this.getMensMoneylineOdds() : await this.getWomensMoneylineOdds();

      // Match events with odds
      return marchMadnessEvents.map(event => {
        const gameOdds = allOdds.find(game => game.id === event.id);
        return {
          ...event,
          odds: gameOdds ? gameOdds.bookmakers : [],
        };
      });
    } catch (error) {
      console.error(`Error fetching March Madness odds for ${gender}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for NCAA basketball games
   * @param {string} gender - 'mens' or 'womens'
   * @returns {Promise<Array>} Array of NCAA basketball games with best odds
   */
  async getBestOdds(gender = 'mens') {
    try {
      const games =
        gender === 'mens' ? await this.getMensMoneylineOdds() : await this.getWomensMoneylineOdds();

      return games.map(game => {
        // Find best odds for home team
        const homeOdds = game.bookmakers
          .map(bookmaker => {
            const market = bookmaker.markets.find(m => m.key === 'h2h');
            if (!market) return null;

            const outcome = market.outcomes.find(o => o.name === game.homeTeam);
            if (!outcome) return null;

            return {
              bookmaker: bookmaker.name,
              price: outcome.price,
            };
          })
          .filter(Boolean);

        // Find best odds for away team
        const awayOdds = game.bookmakers
          .map(bookmaker => {
            const market = bookmaker.markets.find(m => m.key === 'h2h');
            if (!market) return null;

            const outcome = market.outcomes.find(o => o.name === game.awayTeam);
            if (!outcome) return null;

            return {
              bookmaker: bookmaker.name,
              price: outcome.price,
            };
          })
          .filter(Boolean);

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
      console.error(`Error fetching best NCAA basketball odds for ${gender}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const ncaaOddsService = new NcaaOddsService();
export default ncaaOddsService;
