/**
 * HorseRacingOddsService.js
 * Service for fetching and managing horse racing odds data
 */

import oddsService from './OddsService';
import weatherAdjustmentService from './WeatherAdjustmentService';

/**
 * HorseRacingOddsService class for fetching and managing horse racing odds data
 */
class HorseRacingOddsService {
  /**
   * Get win odds for horse races
   * @returns {Promise<Array>} Array of horse races with win odds
   */
  async getWinOdds() {
    try {
      return await oddsService.getOdds('HORSE_RACING', 'win');
    } catch (error) {
      console.error('Error fetching horse racing win odds:', error);
      throw error;
    }
  }

  /**
   * Get place odds for horse races
   * @returns {Promise<Array>} Array of horse races with place odds
   */
  async getPlaceOdds() {
    try {
      return await oddsService.getOdds('HORSE_RACING', 'place');
    } catch (error) {
      console.error('Error fetching horse racing place odds:', error);
      throw error;
    }
  }

  /**
   * Get show odds for horse races
   * @returns {Promise<Array>} Array of horse races with show odds
   */
  async getShowOdds() {
    try {
      return await oddsService.getOdds('HORSE_RACING', 'show');
    } catch (error) {
      console.error('Error fetching horse racing show odds:', error);
      throw error;
    }
  }

  /**
   * Get exacta odds for horse races
   * @returns {Promise<Array>} Array of horse races with exacta odds
   */
  async getExactaOdds() {
    try {
      return await oddsService.getOdds('HORSE_RACING', 'exacta');
    } catch (error) {
      console.error('Error fetching horse racing exacta odds:', error);
      throw error;
    }
  }

  /**
   * Get trifecta odds for horse races
   * @returns {Promise<Array>} Array of horse races with trifecta odds
   */
  async getTrifectaOdds() {
    try {
      return await oddsService.getOdds('HORSE_RACING', 'trifecta');
    } catch (error) {
      console.error('Error fetching horse racing trifecta odds:', error);
      throw error;
    }
  }

  /**
   * Get upcoming horse racing events
   * @returns {Promise<Array>} Array of upcoming horse racing events
   */
  async getUpcomingEvents() {
    try {
      return await oddsService.getUpcomingEvents('HORSE_RACING');
    } catch (error) {
      console.error('Error fetching upcoming horse racing events:', error);
      throw error;
    }
  }

  /**
   * Get odds for a specific race
   * @param {string} raceId - Race ID
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Object>} Race with odds
   */
  async getRaceOdds(raceId, includeWeather = false) {
    try {
      const allOdds = await this.getWinOdds();
      const race = allOdds.find(race => race.id === raceId);
      
      if (!race || !includeWeather) {
        return race;
      }
      
      // Get weather-adjusted odds
      const outcomes = race.bookmakers.flatMap(bookmaker =>
        bookmaker.markets
          .filter(market => market.key === 'win')
          .flatMap(market => market.outcomes)
      );
      
      const { odds: adjustedOdds, weatherAdjustment, weatherData } =
        await weatherAdjustmentService.getWeatherAdjustedOdds(raceId, 'HORSE_RACING', outcomes);
      
      return {
        ...race,
        weatherAdjustedOdds: adjustedOdds,
        weatherAdjustment,
        weatherData
      };
    } catch (error) {
      console.error(`Error fetching odds for race ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Get best odds for horses in a race
   * @param {string} raceId - Race ID (optional)
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Array>} Array of horses with best odds
   */
  async getBestHorseOdds(raceId = null, includeWeather = false) {
    try {
      const races = await this.getWinOdds();
      
      // Filter by race ID if provided
      const filteredRaces = raceId ? races.filter(race => race.id === raceId) : races;
      
      const processedRaces = await Promise.all(filteredRaces.map(async race => {
        // For horse racing, the structure might be different from team sports
        // We're assuming the outcomes are horse names
        const horseOdds = [];
        
        race.bookmakers.forEach(bookmaker => {
          const market = bookmaker.markets.find(m => m.key === 'win');
          if (!market) return;
          
          market.outcomes.forEach(outcome => {
            const existingHorse = horseOdds.find(h => h.name === outcome.name);
            
            if (!existingHorse) {
              horseOdds.push({
                name: outcome.name,
                bestOdds: {
                  bookmaker: bookmaker.name,
                  price: outcome.price,
                }
              });
            } else if (outcome.price > existingHorse.bestOdds.price) {
              existingHorse.bestOdds = {
                bookmaker: bookmaker.name,
                price: outcome.price,
              };
            }
          });
        });
        
        const result = {
          id: race.id,
          sport: race.sport,
          name: race.homeTeam, // In horse racing API, this might be the race name
          track: race.awayTeam, // In horse racing API, this might be the track name
          startTime: race.startTime,
          horses: horseOdds.sort((a, b) => a.bestOdds.price - b.bestOdds.price), // Sort by lowest odds (favorites first)
        };
        
        // Add weather adjustments if requested
        if (includeWeather) {
          const outcomes = horseOdds.map(horse => ({
            name: horse.name,
            price: horse.bestOdds.price
          }));
          
          const { odds: adjustedOdds, weatherAdjustment, weatherData } =
            await weatherAdjustmentService.getWeatherAdjustedOdds(race.id, 'HORSE_RACING', outcomes);
          
          // Map adjusted odds back to horses
          const horsesWithWeather = horseOdds.map(horse => {
            const adjustedHorse = adjustedOdds.find(o => o.name === horse.name);
            return {
              ...horse,
              weatherAdjustedOdds: adjustedHorse ? {
                price: adjustedHorse.price,
                originalPrice: adjustedHorse.originalPrice,
                weatherAdjusted: adjustedHorse.weatherAdjusted
              } : null
            };
          });
          
          return {
            ...result,
            horses: horsesWithWeather,
            weatherAdjustment,
            weatherData
          };
        }
        
        return result;
      }));
      
      return processedRaces;
    } catch (error) {
      console.error('Error fetching best horse racing odds:', error);
      throw error;
    }
  }

  /**
   * Get exotic bet options for a race
   * @param {string} raceId - Race ID
   * @param {boolean} includeWeather - Whether to include weather adjustments
   * @returns {Promise<Object>} Exotic bet options for the race
   */
  async getExoticBetOptions(raceId, includeWeather = false) {
    try {
      const exactaOdds = await this.getExactaOdds();
      const trifectaOdds = await this.getTrifectaOdds();
      
      const exacta = exactaOdds.find(race => race.id === raceId);
      const trifecta = trifectaOdds.find(race => race.id === raceId);
      
      const result = {
        raceId,
        exacta: exacta || null,
        trifecta: trifecta || null,
      };
      
      // Add weather adjustments if requested
      if (includeWeather) {
        const { weatherAdjustment, weatherData } =
          await weatherAdjustmentService.getWeatherAdjustedOdds(raceId, 'HORSE_RACING', []);
        
        return {
          ...result,
          weatherAdjustment,
          weatherData
        };
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching exotic bet options for race ${raceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get track condition based on weather
   * @param {string} raceId - Race ID
   * @returns {Promise<Object>} Track condition information
   */
  async getTrackCondition(raceId) {
    try {
      // Get weather data for the race
      const { weatherAdjustment, weatherData } =
        await weatherAdjustmentService.getWeatherAdjustedOdds(raceId, 'HORSE_RACING', []);
      
      if (!weatherData) {
        return {
          condition: 'unknown',
          description: 'Track condition information not available'
        };
      }
      
      // Determine track condition based on weather
      let condition = 'fast'; // Default for dry conditions
      let description = 'Track is fast and dry';
      
      if (weatherData.condition === 'Rain' || weatherData.precipitation > 0.1) {
        if (weatherData.precipitation > 0.5) {
          condition = 'sloppy';
          description = 'Track is sloppy due to heavy rain';
        } else {
          condition = 'muddy';
          description = 'Track is muddy due to rain';
        }
      } else if (weatherData.condition === 'Clouds' && weatherData.humidity > 80) {
        condition = 'good';
        description = 'Track is good but slightly damp';
      }
      
      return {
        condition,
        description,
        weatherData,
        weatherAdjustment
      };
    } catch (error) {
      console.error(`Error getting track condition for race ${raceId}:`, error);
      return {
        condition: 'unknown',
        description: 'Error retrieving track condition'
      };
    }
  }
  
  /**
   * Get weather impact for horse races
   * @returns {Promise<Array>} Array of horse races with weather impact
   */
  async getWeatherImpact() {
    try {
      const races = await this.getWinOdds();
      
      const racesWithWeatherImpact = await Promise.all(races.map(async race => {
        try {
          // Get weather data for the race
          const { weatherAdjustment, weatherData } =
            await weatherAdjustmentService.getWeatherAdjustedOdds(race.id, 'HORSE_RACING', []);
          
          // Get track condition
          const trackCondition = await this.getTrackCondition(race.id);
          
          return {
            id: race.id,
            sport: race.sport,
            name: race.homeTeam,
            track: race.awayTeam,
            startTime: race.startTime,
            weatherAdjustment,
            weatherData,
            trackCondition
          };
        } catch (error) {
          console.error(`Error getting weather impact for race ${race.id}:`, error);
          return {
            id: race.id,
            sport: race.sport,
            name: race.homeTeam,
            track: race.awayTeam,
            startTime: race.startTime,
            weatherAdjustment: {
              factor: 1.0,
              impact: 'none',
              description: 'Error getting weather data'
            },
            trackCondition: {
              condition: 'unknown',
              description: 'Error retrieving track condition'
            }
          };
        }
      }));
      
      return racesWithWeatherImpact;
    } catch (error) {
      console.error('Error fetching horse racing weather impact:', error);
      throw error;
    }
  }
}

// Export singleton instance
const horseRacingOddsService = new HorseRacingOddsService();
export default horseRacingOddsService;