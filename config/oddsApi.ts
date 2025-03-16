import axios from "axios";
import { OddsApiResponse } from "../types/odds";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace this with your actual API key from The Odds API
const API_KEY = "fdf4ad2d50a6b6d2ca77e52734851aa4";
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

// Rate limiting constants
const RATE_LIMIT_STORAGE_KEY = 'odds_api_rate_limit';
const MAX_REQUESTS_PER_HOUR = 50; // Adjust based on your API plan
const HOUR_IN_MS = 60 * 60 * 1000;

// Cache constants
const CACHE_STORAGE_PREFIX = 'odds_api_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

interface RateLimitInfo {
  requestCount: number;
  resetTime: number;
}

/**
 * Get current rate limit information
 * @returns {Promise<RateLimitInfo>} Current rate limit info
 */
const getRateLimitInfo = async (): Promise<RateLimitInfo> => {
  try {
    const storedInfo = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (storedInfo) {
      const parsedInfo = JSON.parse(storedInfo) as RateLimitInfo;
      
      // If reset time has passed, reset the counter
      if (Date.now() > parsedInfo.resetTime) {
        const newInfo = {
          requestCount: 0,
          resetTime: Date.now() + HOUR_IN_MS
        };
        await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(newInfo));
        return newInfo;
      }
      
      return parsedInfo;
    }
  } catch (error) {
    console.error("Error getting rate limit info:", error);
  }
  
  // Default if no stored info or error
  const defaultInfo = {
    requestCount: 0,
    resetTime: Date.now() + HOUR_IN_MS
  };
  await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(defaultInfo));
  return defaultInfo;
};

/**
 * Update rate limit information after a request
 * @returns {Promise<void>}
 */
const updateRateLimitInfo = async (): Promise<void> => {
  try {
    const currentInfo = await getRateLimitInfo();
    const updatedInfo = {
      ...currentInfo,
      requestCount: currentInfo.requestCount + 1
    };
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updatedInfo));
  } catch (error) {
    console.error("Error updating rate limit info:", error);
  }
};

/**
 * Check if we've hit the rate limit
 * @returns {Promise<boolean>} True if rate limited
 */
const isRateLimited = async (): Promise<boolean> => {
  const info = await getRateLimitInfo();
  return info.requestCount >= MAX_REQUESTS_PER_HOUR;
};

/**
 * Get cached data for a request if available
 * @param {string} cacheKey - Key for the cached data
 * @returns {Promise<any>} Cached data or null
 */
const getCachedData = async (cacheKey: string): Promise<any> => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_STORAGE_PREFIX + cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch (error) {
    console.error("Error getting cached data:", error);
  }
  return null;
};

/**
 * Cache data from a request
 * @param {string} cacheKey - Key for the cached data
 * @param {any} data - Data to cache
 */
const cacheData = async (cacheKey: string, data: any): Promise<void> => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(CACHE_STORAGE_PREFIX + cacheKey, JSON.stringify(cacheObject));
  } catch (error) {
    console.error("Error caching data:", error);
  }
};

/**
 * Fetches betting odds for a given sport
 * @param {string} sport - Sport key (e.g., "americanfootball_nfl")
 * @param {string[]} markets - Markets to fetch (e.g., "h2h", "spreads")
 * @param {string} regions - Regions for odds (e.g., "us", "uk", "eu")
 * @param {boolean} useCache - Whether to use cached data if available
 * @returns {Promise<{data: OddsApiResponse | null, success: boolean, fromCache: boolean}>} - Object with data and metadata
 */
export const fetchOdds = async (
  sport = "americanfootball_nfl",
  markets = ["h2h", "spreads"],
  regions = "us",
  useCache = true
): Promise<{data: any, success: boolean, fromCache: boolean}> => {
  // Create a cache key based on request parameters
  const cacheKey = `${sport}_${markets.join(",")}_${regions}`;
  
  // Check cache first if enabled
  if (useCache) {
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData, success: true, fromCache: true };
    }
  }
  
  // Check if we're rate limited
  if (await isRateLimited()) {
    console.warn("API rate limit reached. Using cached data if available or returning error.");
    
    // Try to get cached data even if it's expired as a fallback
    const expiredCache = await AsyncStorage.getItem(CACHE_STORAGE_PREFIX + cacheKey);
    if (expiredCache) {
      const { data } = JSON.parse(expiredCache);
      return { data, success: true, fromCache: true };
    }
    
    return { data: null, success: false, fromCache: false };
  }
  
  try {
    // Update rate limit counter before making request
    await updateRateLimitInfo();
    
    const response = await axios.get<OddsApiResponse>(`${BASE_URL}/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: regions,
        markets: markets.join(","), // Join markets with comma
      },
      timeout: 10000, // 10 second timeout
    });
    
    // Cache the successful response
    await cacheData(cacheKey, response.data);
    
    return { data: response.data, success: true, fromCache: false };
  } catch (error) {
    console.error("Error fetching odds:", error);
    
    // If we get a 429 error, mark as rate limited
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      const info = await getRateLimitInfo();
      const updatedInfo = {
        ...info,
        requestCount: MAX_REQUESTS_PER_HOUR // Force rate limit
      };
      await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updatedInfo));
    }
    
    // Try to get cached data as fallback
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData, success: true, fromCache: true };
    }
    
    return { data: null, success: false, fromCache: false };
  }
};

export default fetchOdds;