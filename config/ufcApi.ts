import axios from 'axios';

// Get the API key from oddsApi.ts
const ODDS_API_KEY = "fdf4ad2d50a6b6d2ca77e52734851aa4";

// Odds API configuration for UFC
export const ODDS_API_CONFIG = {
  baseUrl: 'https://api.the-odds-api.com/v4/sports',
  apiKey: ODDS_API_KEY,
  sportKey: 'mma_mixed_martial_arts', // The sport key for MMA in the Odds API
  markets: ['h2h', 'spreads'], // Markets to fetch
  regions: 'us' // Regions for odds
};

// Sherdog API configuration (unofficial)
export const SHERDOG_API_CONFIG = {
  baseUrl: 'https://sherdog-api.vercel.app/api',
  endpoints: {
    fighters: '/fighters',
    events: '/events',
    search: '/search'
  }
};

// UFC data scraper configuration
export const UFC_SCRAPER_CONFIG = {
  baseUrl: 'https://www.ufc.com',
  endpoints: {
    events: '/events',
    fighters: '/athletes',
    rankings: '/rankings'
  }
};

// Helper function to fetch data from Sherdog API
export const fetchFromSherdogApi = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  try {
    const response = await axios.get<T>(`${SHERDOG_API_CONFIG.baseUrl}${endpoint}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from Sherdog API (${endpoint}):`, error);
    throw error;
  }
};

// Helper function to fetch UFC odds from Odds API
export const fetchUFCOdds = async () => {
  try {
    const response = await axios.get(`${ODDS_API_CONFIG.baseUrl}/${ODDS_API_CONFIG.sportKey}/odds`, {
      params: {
        apiKey: ODDS_API_CONFIG.apiKey,
        regions: ODDS_API_CONFIG.regions,
        markets: ODDS_API_CONFIG.markets.join(',')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching UFC odds:', error);
    throw error;
  }
};

// Helper function to scrape UFC data
// This is a simplified version - in a real implementation, you would use a more robust scraping solution
export const scrapeUFCData = async (endpoint: string, params: Record<string, string> = {}) => {
  try {
    // In a real implementation, this would use a scraping library or a headless browser
    // For now, we'll just make a request to the UFC website
    const response = await axios.get(`${UFC_SCRAPER_CONFIG.baseUrl}${endpoint}`, { params });
    
    // In a real implementation, you would parse the HTML response
    // For now, we'll just return the raw HTML
    return response.data;
  } catch (error) {
    console.error(`Error scraping UFC data (${endpoint}):`, error);
    throw error;
  }
};