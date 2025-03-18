/**
 * Formula1OddsService.js
 * Service for fetching and managing Formula 1 odds data
 */

import oddsService from './OddsService';

/**
 * Formula1OddsService class for fetching and managing Formula 1 odds data
 */
class Formula1OddsService {
  /**
   * Get Formula 1 race winner odds
   * @returns {Promise<Array>} Array of Formula 1 races with winner odds
   */
  async getRaceWinnerOdds() {
    try {
      return await oddsService.getOdds('FORMULA_1', 'h2h');
    } catch (error) {
      console.error('Error fetching Formula 1 race winner odds:', error);
      throw error;
    }
  }

  /**
   * Get Formula 1 podium finish odds
   * @returns {Promise<Array>} Array of Formula 1 races with podium finish odds
   */
  async getPodiumFinishOdds() {
    try {
      // For podium finish, we might need a different market type
      // This is a placeholder and might need adjustment based on the actual API
      return await oddsService.getOdds('FORMULA_1', 'outrights');
    } catch (error) {
      console.error('Error fetching Formula 1 podium finish odds:', error);
      throw error;
    }
  }

  /**
   * Get Formula 1 constructor championship odds
   * @returns {Promise<Array>} Array of Formula 1 constructor championship odds
   */
  async getConstructorChampionshipOdds() {
    try {
      // For constructor championship, we might need a different market type
      // This is a placeholder and might need adjustment based on the actual API
      return await oddsService.getOdds('FORMULA_1', 'outrights');
    } catch (error) {
      console.error('Error fetching Formula 1 constructor championship odds:', error);
      throw error;
    }
  }

  /**
   * Get Formula 1 driver championship odds
   * @returns {Promise<Array>} Array of Formula 1 driver championship odds
   */
  async getDriverChampionshipOdds() {
    try {
      // For driver championship, we might need a different market type
      // This is a placeholder and might need adjustment based on the actual API
      return await oddsService.getOdds('FORMULA_1', 'outrights');
    } catch (error) {
      console.error('Error fetching Formula 1 driver championship odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming Formula 1 events
   * @returns {Promise<Array>} Array of upcoming Formula 1 events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('FORMULA_1');
    } catch (error) {
      console.error('Error fetching upcoming Formula 1 events:', error);
      throw error;
    }
  }

  /**
   * Get Formula 1 odds for a specific race
   * @param {string} raceId - Race ID
   * @returns {Promise<Object>} Race with odds
   */
  async getRaceOdds(raceId) {
    try {
      const allOdds = await this.getRaceWinnerOdds();
      return allOdds.find(race => race.id === raceId);
    } catch (error) {
      console.error(`Error fetching Formula 1 odds for race ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for Formula 1 drivers in a race
   * @param {string} raceId - Race ID (optional)
   * @returns {Promise<Array>} Array of drivers with best odds
   */
  async getBestDriverOdds(raceId = null) {
    try {
      const races = await this.getRaceWinnerOdds();
      
      // Filter by race ID if provided
      const filteredRaces = raceId ? races.filter(race => race.id === raceId) : races;
      
      return filteredRaces.map(race => {
        // For F1, the structure might be different from team sports
        // We're assuming the outcomes are driver names
        const driverOdds = [];
        
        race.bookmakers.forEach(bookmaker => {
          const market = bookmaker.markets.find(m => m.key === 'h2h');
          if (!market) return;
          
          market.outcomes.forEach(outcome => {
            const existingDriver = driverOdds.find(d => d.name === outcome.name);
            
            if (!existingDriver) {
              driverOdds.push({
                name: outcome.name,
                bestOdds: {
                  bookmaker: bookmaker.name,
                  price: outcome.price,
                }
              });
            } else if (outcome.price > existingDriver.bestOdds.price) {
              existingDriver.bestOdds = {
                bookmaker: bookmaker.name,
                price: outcome.price,
              };
            }
          });
        });
        
        return {
          id: race.id,
          sport: race.sport,
          name: race.homeTeam, // In F1 API, this might be the race name
          startTime: race.startTime,
          drivers: driverOdds.sort((a, b) => b.bestOdds.price - a.bestOdds.price),
        };
      });
    } catch (error) {
      console.error('Error fetching best Formula 1 driver odds:', error);
      throw error;
    }
  }

  /**
   * Get head-to-head driver comparison odds
   * @param {string} driver1 - First driver name
   * @param {string} driver2 - Second driver name
   * @returns {Promise<Array>} Array of head-to-head odds for the specified drivers
   */
  async getHeadToHeadOdds(driver1, driver2) {
    try {
      const races = await this.getRaceWinnerOdds();
      
      return races.map(race => {
        const driver1Odds = [];
        const driver2Odds = [];
        
        race.bookmakers.forEach(bookmaker => {
          const market = bookmaker.markets.find(m => m.key === 'h2h');
          if (!market) return;
          
          const outcome1 = market.outcomes.find(o => o.name === driver1);
          const outcome2 = market.outcomes.find(o => o.name === driver2);
          
          if (outcome1) {
            driver1Odds.push({
              bookmaker: bookmaker.name,
              price: outcome1.price,
            });
          }
          
          if (outcome2) {
            driver2Odds.push({
              bookmaker: bookmaker.name,
              price: outcome2.price,
            });
          }
        });
        
        // Sort by best price
        const bestDriver1Odds = driver1Odds.sort((a, b) => b.price - a.price)[0] || null;
        const bestDriver2Odds = driver2Odds.sort((a, b) => b.price - a.price)[0] || null;
        
        return {
          id: race.id,
          sport: race.sport,
          name: race.homeTeam, // In F1 API, this might be the race name
          startTime: race.startTime,
          driver1: {
            name: driver1,
            bestOdds: bestDriver1Odds,
          },
          driver2: {
            name: driver2,
            bestOdds: bestDriver2Odds,
          },
        };
      });
    } catch (error) {
      console.error(`Error fetching head-to-head odds for ${driver1} vs ${driver2}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const formula1OddsService = new Formula1OddsService();
export default formula1OddsService;