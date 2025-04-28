/**
 * WeatherAdjustmentService.js
 * Service for adjusting odds based on weather conditions for different sports
 */

import weatherService from './weatherService';

/**
 * WeatherAdjustmentService class for adjusting odds based on weather conditions
 */
class WeatherAdjustmentService {
  /**
   * Get weather adjustment factor for a specific sport and condition
   * @param {string} sport - Sport key (e.g., 'NBA', 'MLB')
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  async getWeatherAdjustmentFactor(sport, weatherData) {
    try {
      // Validate sport parameter
      if (!sport || typeof sport !== 'string') {
        console.error('Invalid sport parameter:', sport);
        return { factor: 1.0, impact: 'none', description: 'Invalid sport parameter' };
      }

      // Validate supported sports
      const supportedSports = ['MLB', 'NFL', 'NBA', 'WNBA', 'NCAA_MENS', 'NCAA_WOMENS',
                              'NHL', 'FORMULA_1', 'SOCCER_EPL', 'SOCCER_MLS',
                              'HORSE_RACING', 'UFC'];
      
      if (!supportedSports.includes(sport)) {
        console.error('Unsupported sport:', sport);
        return { factor: 1.0, impact: 'none', description: 'Unsupported sport' };
      }

      if (!weatherData) {
        return { factor: 1.0, impact: 'none', description: 'No weather data available' };
      }

      // Validate weatherData object
      if (typeof weatherData !== 'object') {
        console.error('Invalid weatherData parameter:', typeof weatherData);
        return { factor: 1.0, impact: 'none', description: 'Invalid weather data' };
      }

      // Get the weather condition with safe defaults
      const condition = weatherData.condition || 'Unknown';
      const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : 70;
      const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
      const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
      
      // Default adjustment (no impact)
      let factor = 1.0;
      let impact = 'none';
      let description = 'Weather has no significant impact on this sport';
      
      // Adjust based on sport and weather condition
      switch (sport) {
        case 'MLB':
          return this.getBaseballWeatherAdjustment(weatherData);
        
        case 'NFL':
          return this.getFootballWeatherAdjustment(weatherData);
        
        case 'NBA':
        case 'WNBA':
        case 'NCAA_MENS':
        case 'NCAA_WOMENS':
          // Basketball is mostly played indoors
          return { 
            factor: 1.0, 
            impact: 'none', 
            description: 'Basketball is played indoors and not affected by weather' 
          };
        
        case 'NHL':
          // Hockey is mostly played indoors
          return { 
            factor: 1.0, 
            impact: 'none', 
            description: 'Hockey is played indoors and not affected by weather' 
          };
        
        case 'FORMULA_1':
          return this.getFormula1WeatherAdjustment(weatherData);
        
        case 'SOCCER_EPL':
        case 'SOCCER_MLS':
          return this.getSoccerWeatherAdjustment(weatherData);
        
        case 'HORSE_RACING':
          return this.getHorseRacingWeatherAdjustment(weatherData);
        
        case 'UFC':
          // UFC is indoors
          return { 
            factor: 1.0, 
            impact: 'none', 
            description: 'UFC events are held indoors and not affected by weather' 
          };
        
        default:
          return { factor: 1.0, impact: 'none', description: 'No specific weather adjustment for this sport' };
      }
    } catch (error) {
      console.error('Error getting weather adjustment factor:', error);
      return { factor: 1.0, impact: 'none', description: 'Error calculating weather adjustment' };
    }
  }

  /**
   * Get baseball weather adjustment
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  getBaseballWeatherAdjustment(weatherData) {
    // Validate input
    if (!weatherData || typeof weatherData !== 'object') {
      return {
        factor: 1.0,
        impact: 'none',
        description: 'Invalid weather data for baseball adjustment'
      };
    }

    // Extract weather properties with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : 70;
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    let factor = 1.0;
    let impact = 'none';
    let description = 'Normal baseball conditions';

    // Temperature impact
    if (temperature < 40) {
      factor *= 0.9; // Cold weather reduces scoring
      impact = 'negative';
      description = 'Cold temperatures typically reduce scoring in baseball';
    } else if (temperature > 90) {
      factor *= 1.1; // Hot weather increases scoring
      impact = 'positive';
      description = 'Hot temperatures typically increase scoring in baseball';
    }

    // Wind impact
    if (windSpeed > 15) {
      factor *= 1.15; // High winds can increase home runs in the right direction
      impact = 'significant';
      description = 'High winds can significantly affect ball flight and scoring';
    }

    // Rain impact
    if (condition === 'Rain' || precipitation > 0.1) {
      factor *= 0.85; // Rain reduces scoring
      impact = 'negative';
      description = 'Rain typically reduces scoring and increases pitching advantage';
    }

    // Ensure factor is within reasonable bounds
    factor = Math.max(0.5, Math.min(factor, 2.0));

    return { factor, impact, description };
  }

  /**
   * Get football weather adjustment
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  getFootballWeatherAdjustment(weatherData) {
    // Validate input
    if (!weatherData || typeof weatherData !== 'object') {
      return {
        factor: 1.0,
        impact: 'none',
        description: 'Invalid weather data for football adjustment'
      };
    }

    // Extract weather properties with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : 70;
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    let factor = 1.0;
    let impact = 'none';
    let description = 'Normal football conditions';

    // Temperature impact
    if (temperature < 32) {
      factor *= 0.9; // Cold weather reduces scoring
      impact = 'negative';
      description = 'Freezing temperatures can affect passing game and scoring';
    }

    // Wind impact
    if (windSpeed > 20) {
      factor *= 0.85; // High winds reduce passing effectiveness
      impact = 'significant';
      description = 'High winds significantly affect the passing game';
    }

    // Rain/Snow impact
    if (condition === 'Rain' || condition === 'Snow' || precipitation > 0.2) {
      factor *= 0.8; // Rain/snow reduces scoring
      impact = 'significant';
      description = 'Precipitation significantly affects ball handling and scoring';
    }

    // Ensure factor is within reasonable bounds
    factor = Math.max(0.5, Math.min(factor, 2.0));

    return { factor, impact, description };
  }

  /**
   * Get Formula 1 weather adjustment
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  getFormula1WeatherAdjustment(weatherData) {
    // Validate input
    if (!weatherData || typeof weatherData !== 'object') {
      return {
        factor: 1.0,
        impact: 'none',
        description: 'Invalid weather data for Formula 1 adjustment'
      };
    }

    // Extract weather properties with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    let factor = 1.0;
    let impact = 'none';
    let description = 'Normal racing conditions';

    // Rain impact
    if (condition === 'Rain' || precipitation > 0) {
      factor *= 1.5; // Rain increases unpredictability
      impact = 'significant';
      description = 'Wet track conditions significantly increase race unpredictability';
    } else if (condition === 'Clouds') {
      factor *= 1.1; // Cloudy conditions can lead to changing track conditions
      impact = 'mild';
      description = 'Changing cloud cover can affect track temperature and grip';
    }

    // Ensure factor is within reasonable bounds
    factor = Math.max(0.5, Math.min(factor, 3.0)); // Allow higher upper bound for F1 due to high unpredictability

    return { factor, impact, description };
  }

  /**
   * Get soccer weather adjustment
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  getSoccerWeatherAdjustment(weatherData) {
    // Validate input
    if (!weatherData || typeof weatherData !== 'object') {
      return {
        factor: 1.0,
        impact: 'none',
        description: 'Invalid weather data for soccer adjustment'
      };
    }

    // Extract weather properties with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    let factor = 1.0;
    let impact = 'none';
    let description = 'Normal soccer conditions';

    // Wind impact
    if (windSpeed > 15) {
      factor *= 1.1; // High winds affect ball movement
      impact = 'moderate';
      description = 'High winds can affect long passes and shots';
    }

    // Rain impact
    if (condition === 'Rain' || precipitation > 0.1) {
      factor *= 0.9; // Rain reduces scoring
      impact = 'negative';
      description = 'Wet field conditions typically reduce scoring';
    }

    // Ensure factor is within reasonable bounds
    factor = Math.max(0.7, Math.min(factor, 1.5));

    return { factor, impact, description };
  }

  /**
   * Get horse racing weather adjustment
   * @param {Object} weatherData - Weather data
   * @returns {Object} Weather adjustment factors
   */
  getHorseRacingWeatherAdjustment(weatherData) {
    // Validate input
    if (!weatherData || typeof weatherData !== 'object') {
      return {
        factor: 1.0,
        impact: 'none',
        description: 'Invalid weather data for horse racing adjustment'
      };
    }

    // Extract weather properties with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    let factor = 1.0;
    let impact = 'none';
    let description = 'Normal track conditions';

    // Rain impact
    if (condition === 'Rain' || precipitation > 0) {
      factor *= 1.3; // Rain increases unpredictability
      impact = 'significant';
      description = 'Wet track conditions significantly affect race outcomes';
    } else if (condition === 'Clouds') {
      factor *= 1.05; // Cloudy conditions might lead to changing track conditions
      impact = 'mild';
      description = 'Changing weather conditions can affect track performance';
    }

    // Ensure factor is within reasonable bounds
    factor = Math.max(0.5, Math.min(factor, 2.5));

    return { factor, impact, description };
  }

  /**
   * Get weather-adjusted odds for a game
   * @param {string} gameId - Game ID
   * @param {string} sport - Sport key
   * @param {Array} odds - Original odds
   * @returns {Promise<Object>} Weather-adjusted odds and metadata
   */
  async getWeatherAdjustedOdds(gameId, sport, odds) {
    try {
      // Validate parameters
      if (!gameId || typeof gameId !== 'string') {
        console.error('Invalid gameId parameter:', gameId);
        return {
          odds,
          weatherAdjustment: {
            factor: 1.0,
            impact: 'none',
            description: 'Invalid game ID'
          }
        };
      }

      if (!sport || typeof sport !== 'string') {
        console.error('Invalid sport parameter:', sport);
        return {
          odds,
          weatherAdjustment: {
            factor: 1.0,
            impact: 'none',
            description: 'Invalid sport parameter'
          }
        };
      }

      if (!Array.isArray(odds)) {
        console.error('Invalid odds parameter:', typeof odds);
        return {
          odds: [],
          weatherAdjustment: {
            factor: 1.0,
            impact: 'none',
            description: 'Invalid odds data'
          }
        };
      }

      // Get weather data for the game
      const weatherData = await weatherService.getGameWeather(gameId);
      
      if (!weatherData) {
        return {
          odds,
          weatherAdjustment: {
            factor: 1.0,
            impact: 'none',
            description: 'No weather data available'
          }
        };
      }
      
      // Get weather adjustment factor
      const adjustment = await this.getWeatherAdjustmentFactor(sport, weatherData);
      
      // Apply adjustment to odds
      const adjustedOdds = odds.map(outcome => {
        // Validate outcome object
        if (!outcome || typeof outcome !== 'object') {
          return outcome;
        }

        // Only adjust the price if there's a significant impact
        if (adjustment.impact === 'none' || adjustment.impact === 'mild') {
          return outcome;
        }
        
        // Calculate adjusted price (ensure price is a number)
        const originalPrice = typeof outcome.price === 'number' ? outcome.price : 0;
        const adjustedPrice = originalPrice * adjustment.factor;
        
        return {
          ...outcome,
          originalPrice,
          price: adjustedPrice,
          weatherAdjusted: true
        };
      });
      
      // Sanitize weather data before returning (remove any sensitive information)
      const sanitizedWeatherData = {
        temperature: weatherData.temperature,
        feelsLike: weatherData.feelsLike,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        precipitation: weatherData.precipitation,
        condition: weatherData.condition,
        conditionIcon: weatherData.conditionIcon,
        location: weatherData.location,
        timestamp: weatherData.timestamp
      };
      
      return {
        odds: adjustedOdds,
        weatherAdjustment: adjustment,
        weatherData: sanitizedWeatherData
      };
    } catch (error) {
      // Log error without exposing sensitive details
      console.error(`Error getting weather-adjusted odds for game ${gameId}:`,
                    error.message || 'Unknown error');
      
      return {
        odds,
        weatherAdjustment: {
          factor: 1.0,
          impact: 'none',
          description: 'Error calculating weather adjustment'
        }
      };
    }
  }
}

// Export singleton instance
const weatherAdjustmentService = new WeatherAdjustmentService();
export default weatherAdjustmentService;