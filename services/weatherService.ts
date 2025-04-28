import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { analyticsService } from './analyticsService';

// Cache keys
const WEATHER_CACHE_KEY_PREFIX = 'weather_cache_';
const WEATHER_CACHE_EXPIRY_KEY_PREFIX = 'weather_cache_expiry_';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// API configuration
// Get API key from centralized management
import apiKeys from '../utils/apiKeys';
const WEATHER_API_KEY = apiKeys.getWeatherApiKey();
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Weather data interface
 */
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  condition: string;
  conditionIcon: string;
  location: string;
  timestamp: Date;
}

/**
 * Weather performance correlation interface
 */
export interface WeatherPerformanceCorrelation {
  metric: string;
  correlation: number;
  confidence: number;
  insight: string;
}

/**
 * Get weather data for a specific venue
 * @param venueId Venue ID
 * @param forceRefresh Force refresh from API
 * @returns Weather data
 */
export const getVenueWeather = async (
  venueId: string,
  forceRefresh: boolean = false
): Promise<WeatherData> => {
  try {
    // Try to get from cache first
    if (!forceRefresh) {
      const cachedData = await getCachedWeather(venueId);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Get venue details from Firestore
    const db = firestore;
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const venueDoc = await getDoc(doc(db, 'venues', venueId));
    if (!venueDoc.exists()) {
      throw new Error(`Venue not found: ${venueId}`);
    }
    
    const venueData = venueDoc.data();
    const { latitude, longitude, name } = venueData;
    
    if (!latitude || !longitude) {
      throw new Error(`Venue coordinates not available: ${venueId}`);
    }
    
    // Call weather API
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'imperial' // Use imperial units (Fahrenheit)
      }
    });
    
    // Parse response
    const weatherData: WeatherData = {
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      windDirection: response.data.wind.deg,
      precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      condition: response.data.weather[0].main,
      conditionIcon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
      location: name,
      timestamp: new Date()
    };
    
    // Cache the data
    await cacheWeatherData(venueId, weatherData);
    
    // Track API call in analytics
    await analyticsService.trackEvent('weather_api_call', {
      venueId,
      location: name
    });
    
    return weatherData;
  } catch (error) {
    console.error('Error getting venue weather:', error);
    throw error;
  }
};

/**
 * Get weather data for a specific game
 * @param gameId Game ID
 * @param forceRefresh Force refresh from API
 * @returns Weather data
 */
export const getGameWeather = async (
  gameId: string,
  forceRefresh: boolean = false
): Promise<WeatherData> => {
  try {
    // Try to get from cache first
    if (!forceRefresh) {
      const cachedData = await getCachedWeather(`game_${gameId}`);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Get game details from Firestore
    const db = firestore;
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    if (!gameDoc.exists()) {
      throw new Error(`Game not found: ${gameId}`);
    }
    
    const gameData = gameDoc.data();
    const { venueId } = gameData;
    
    if (!venueId) {
      throw new Error(`Game venue not available: ${gameId}`);
    }
    
    // Get weather for the venue
    const weatherData = await getVenueWeather(venueId, forceRefresh);
    
    // Cache the data for the game
    await cacheWeatherData(`game_${gameId}`, weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Error getting game weather:', error);
    throw error;
  }
};

/**
 * Get weather performance correlations for a player
 * @param playerId Player ID
 * @param weatherCondition Weather condition
 * @returns Weather performance correlations
 */
export const getWeatherPerformanceInsights = async (
  playerId: string,
  weatherCondition: string
): Promise<WeatherPerformanceCorrelation[]> => {
  try {
    // Get player performance data from Firestore
    const db = firestore;
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Get player details
    const playerDoc = await getDoc(doc(db, 'players', playerId));
    if (!playerDoc.exists()) {
      throw new Error(`Player not found: ${playerId}`);
    }
    
    // Check if we have weather correlations in Firestore
    const correlationsDoc = await getDoc(doc(db, 'weatherCorrelations', playerId));
    
    if (correlationsDoc.exists()) {
      const correlationsData = correlationsDoc.data();
      
      // If we have correlations for the specific weather condition
      if (correlationsData[weatherCondition]) {
        return correlationsData[weatherCondition];
      }
    }
    
    // If no correlations found, generate some mock insights
    // In a real implementation, this would use historical data and ML algorithms
    const mockCorrelations: WeatherPerformanceCorrelation[] = [
      {
        metric: 'Points',
        correlation: weatherCondition === 'Rain' ? -0.15 : 0.05,
        confidence: 0.7,
        insight: weatherCondition === 'Rain' 
          ? 'Player tends to score fewer points in rainy conditions'
          : 'Weather has minimal impact on scoring'
      },
      {
        metric: 'Field Goal %',
        correlation: weatherCondition === 'Rain' ? -0.22 : 0.02,
        confidence: 0.8,
        insight: weatherCondition === 'Rain'
          ? 'Shooting percentage decreases significantly in rainy conditions'
          : 'Weather has minimal impact on shooting accuracy'
      },
      {
        metric: 'Assists',
        correlation: 0.03,
        confidence: 0.5,
        insight: 'Weather conditions show no significant impact on assist numbers'
      }
    ];
    
    // Store the mock correlations in Firestore for future use
    if (db) {
      await setDoc(doc(db, 'weatherCorrelations', playerId), {
        [weatherCondition]: mockCorrelations,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    // Track analytics event
    await analyticsService.trackEvent('weather_correlation_generated', {
      playerId,
      weatherCondition
    });
    
    return mockCorrelations;
  } catch (error) {
    console.error('Error getting weather performance insights:', error);
    return [];
  }
};

/**
 * Cache weather data
 * @param key Cache key
 * @param data Weather data
 */
const cacheWeatherData = async (key: string, data: WeatherData): Promise<void> => {
  try {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}${key}`;
    const expiryKey = `${WEATHER_CACHE_EXPIRY_KEY_PREFIX}${key}`;
    const expiryTime = Date.now() + CACHE_DURATION_MS;
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(expiryKey, expiryTime.toString());
  } catch (error) {
    console.error('Error caching weather data:', error);
  }
};

/**
 * Get cached weather data
 * @param key Cache key
 * @returns Cached weather data or null if not found or expired
 */
const getCachedWeather = async (key: string): Promise<WeatherData | null> => {
  try {
    const cacheKey = `${WEATHER_CACHE_KEY_PREFIX}${key}`;
    const expiryKey = `${WEATHER_CACHE_EXPIRY_KEY_PREFIX}${key}`;
    
    const expiryTimeStr = await AsyncStorage.getItem(expiryKey);
    if (!expiryTimeStr) {
      return null;
    }
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    if (Date.now() > expiryTime) {
      // Cache expired
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(expiryKey);
      return null;
    }
    
    const cachedDataStr = await AsyncStorage.getItem(cacheKey);
    if (!cachedDataStr) {
      return null;
    }
    
    return JSON.parse(cachedDataStr) as WeatherData;
  } catch (error) {
    console.error('Error getting cached weather data:', error);
    return null;
  }
};

/**
 * Clear weather cache
 */
export const clearWeatherCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const weatherKeys = keys.filter(key => 
      key.startsWith(WEATHER_CACHE_KEY_PREFIX) || 
      key.startsWith(WEATHER_CACHE_EXPIRY_KEY_PREFIX)
    );
    
    if (weatherKeys.length > 0) {
      await AsyncStorage.multiRemove(weatherKeys);
    }
  } catch (error) {
    console.error('Error clearing weather cache:', error);
  }
};

export default {
  getVenueWeather,
  getGameWeather,
  getWeatherPerformanceInsights,
  clearWeatherCache
};