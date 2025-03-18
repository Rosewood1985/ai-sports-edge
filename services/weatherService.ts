import axios from 'axios';

// Free weather API endpoint
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
// This would be stored in environment variables in a real app
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your_api_key_here';

/**
 * Get current weather for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Weather data
 */
export const getCurrentWeather = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'imperial' // Use imperial units for US sports
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * Get weather forecast for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Forecast data
 */
export const getWeatherForecast = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'imperial'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
};

/**
 * Get weather impact on game
 * @param gameId Game ID
 * @returns Weather impact analysis
 */
export const getWeatherImpact = async (gameId: string) => {
  try {
    // Get game venue coordinates
    const game = await getGameDetails(gameId);
    if (!game || !game.venue || !game.venue.coordinates) {
      return null;
    }
    
    const { lat, lon } = game.venue.coordinates;
    
    // Get current weather
    const weather = await getCurrentWeather(lat, lon);
    if (!weather) {
      return null;
    }
    
    // Analyze weather impact
    return analyzeWeatherImpact(weather, game);
  } catch (error) {
    console.error('Error analyzing weather impact:', error);
    return null;
  }
};

/**
 * Analyze weather impact on game
 * @param weather Weather data
 * @param game Game data
 * @returns Weather impact analysis
 */
const analyzeWeatherImpact = (weather: any, game: any) => {
  // This would be a more sophisticated analysis in a real implementation
  const { main, wind, weather: conditions } = weather;
  const { temp, humidity } = main;
  const { speed: windSpeed } = wind;
  const condition = conditions[0].main;
  
  // Define the impact factor type
  type ImpactFactor = {
    factor: string;
    value: any;
    impact: string;
    description: string;
  };

  // Basic impact analysis
  const impact = {
    overall: 'neutral' as 'neutral' | 'moderate' | 'significant',
    factors: [] as ImpactFactor[],
    favoredTeam: null as string | null,
    description: ''
  };
  
  // Temperature impact
  if (temp < 40) {
    impact.factors.push({
      factor: 'temperature',
      value: temp,
      impact: 'negative',
      description: 'Cold temperatures may affect player performance'
    });
  } else if (temp > 90) {
    impact.factors.push({
      factor: 'temperature',
      value: temp,
      impact: 'negative',
      description: 'Hot temperatures may cause fatigue'
    });
  }
  
  // Wind impact
  if (windSpeed > 15) {
    impact.factors.push({
      factor: 'wind',
      value: windSpeed,
      impact: 'negative',
      description: 'High winds may affect passing and kicking'
    });
  }
  
  // Precipitation impact
  if (['Rain', 'Snow', 'Thunderstorm'].includes(condition)) {
    impact.factors.push({
      factor: 'precipitation',
      value: condition,
      impact: 'negative',
      description: `${condition} may affect ball handling and field conditions`
    });
  }
  
  // Overall impact
  if (impact.factors.length > 0) {
    const negativeFactors = impact.factors.filter(f => f.impact === 'negative');
    if (negativeFactors.length > 1) {
      impact.overall = 'significant';
    } else {
      impact.overall = 'moderate';
    }
    
    // Generate description
    impact.description = `Weather conditions may ${impact.overall === 'significant' ? 'significantly' : 'moderately'} impact this game.`;
  } else {
    impact.description = 'Weather conditions are not expected to significantly impact this game.';
  }
  
  return impact;
};

/**
 * Get game details
 * @param gameId Game ID
 * @returns Game details
 */
const getGameDetails = async (gameId: string) => {
  // This would fetch game details from your game service
  // For now, we'll return mock data
  return {
    id: gameId,
    venue: {
      name: 'Mock Stadium',
      coordinates: {
        lat: 40.7128,
        lon: -74.0060
      },
      isIndoor: false
    }
  };
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherImpact
};