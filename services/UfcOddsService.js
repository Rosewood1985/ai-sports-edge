/**
 * UfcOddsService.js
 * Service for fetching and managing UFC odds data
 */

import oddsService from './OddsService';

/**
 * UfcOddsService class for fetching and managing UFC odds data
 */
class UfcOddsService {
  /**
   * Get UFC moneyline odds
   * @returns {Promise<Array>} Array of UFC fights with moneyline odds
   */
  async getMoneylineOdds() {
    try {
      return await oddsService.getOdds('UFC', 'h2h');
    } catch (error) {
      console.error('Error fetching UFC moneyline odds:', error);
      throw error;
    }
  }

  /**
   * Get UFC method of victory odds
   * @returns {Promise<Array>} Array of UFC fights with method of victory odds
   */
  async getMethodOfVictoryOdds() {
    try {
      return await oddsService.getOdds('UFC', 'method_of_victory');
    } catch (error) {
      console.error('Error fetching UFC method of victory odds:', error);
      throw error;
    }
  }

  /**
   * Get UFC round betting odds
   * @returns {Promise<Array>} Array of UFC fights with round betting odds
   */
  async getRoundBettingOdds() {
    try {
      return await oddsService.getOdds('UFC', 'round_betting');
    } catch (error) {
      console.error('Error fetching UFC round betting odds:', error);
      throw error;
    }
  }

  /**
   * Get UFC total rounds odds
   * @returns {Promise<Array>} Array of UFC fights with total rounds odds
   */
  async getTotalRoundsOdds() {
    try {
      return await oddsService.getOdds('UFC', 'totals');
    } catch (error) {
      console.error('Error fetching UFC total rounds odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming UFC events
   * @returns {Promise<Array>} Array of upcoming UFC events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('UFC');
    } catch (error) {
      console.error('Error fetching upcoming UFC events:', error);
      throw error;
    }
  }

  /**
   * Get UFC odds for a specific fight
   * @param {string} fightId - Fight ID
   * @returns {Promise<Object>} Fight with odds
   */
  async getFightOdds(fightId) {
    try {
      const allOdds = await this.getMoneylineOdds();
      return allOdds.find(fight => fight.id === fightId);
    } catch (error) {
      console.error(`Error fetching UFC odds for fight ${fightId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for UFC fights
   * @returns {Promise<Array>} Array of UFC fights with best odds
   */
  async getBestOdds() {
    try {
      const fights = await this.getMoneylineOdds();

      return fights.map(fight => {
        // Find best odds for fighter 1
        const fighter1Odds = fight.bookmakers
          .map(bookmaker => {
            const market = bookmaker.markets.find(m => m.key === 'h2h');
            if (!market) return null;

            const outcome = market.outcomes.find(o => o.name === fight.homeTeam);
            if (!outcome) return null;

            return {
              bookmaker: bookmaker.name,
              price: outcome.price,
            };
          })
          .filter(Boolean);

        // Find best odds for fighter 2
        const fighter2Odds = fight.bookmakers
          .map(bookmaker => {
            const market = bookmaker.markets.find(m => m.key === 'h2h');
            if (!market) return null;

            const outcome = market.outcomes.find(o => o.name === fight.awayTeam);
            if (!outcome) return null;

            return {
              bookmaker: bookmaker.name,
              price: outcome.price,
            };
          })
          .filter(Boolean);

        // Sort by best price
        const bestFighter1Odds = fighter1Odds.sort((a, b) => b.price - a.price)[0] || null;
        const bestFighter2Odds = fighter2Odds.sort((a, b) => b.price - a.price)[0] || null;

        return {
          id: fight.id,
          sport: fight.sport,
          fighter1: fight.homeTeam,
          fighter2: fight.awayTeam,
          startTime: fight.startTime,
          bestFighter1Odds,
          bestFighter2Odds,
        };
      });
    } catch (error) {
      console.error('Error fetching best UFC odds:', error);
      throw error;
    }
  }

  /**
   * Get UFC prop bets
   * @param {string} fightId - Fight ID (optional)
   * @returns {Promise<Array>} Array of UFC prop bets
   */
  async getPropBets(fightId = null) {
    try {
      const odds = await oddsService.getOdds('UFC', 'props');

      if (fightId) {
        return odds.filter(fight => fight.id === fightId);
      }

      return odds;
    } catch (error) {
      console.error('Error fetching UFC prop bets:', error);
      throw error;
    }
  }
}

// Export singleton instance
const ufcOddsService = new UfcOddsService();
export default ufcOddsService;
