import axios from 'axios';
import { FightOutcome, RoundBettingOption } from '../types/ufc';

// Get the API key from oddsApi.ts
const ODDS_API_KEY = "fdf4ad2d50a6b6d2ca77e52734851aa4";

// Odds API configuration for UFC
export const ODDS_API_CONFIG = {
  baseUrl: 'https://api.the-odds-api.com/v4/sports',
  apiKey: ODDS_API_KEY,
  sportKey: 'mma_mixed_martial_arts', // The sport key for MMA in the Odds API
  markets: ['h2h', 'spreads', 'totals'], // Markets to fetch (added totals for round betting)
  regions: 'us' // Regions for odds
};

// Sherdog API configuration (unofficial)
export const SHERDOG_API_CONFIG = {
  baseUrl: 'https://sherdog-api.vercel.app/api',
  endpoints: {
    fighters: '/fighters',
    events: '/events',
    search: '/search',
    roundBetting: '/fights/:fightId/round-betting' // New endpoint for round betting
  }
};

// UFC data scraper configuration
export const UFC_SCRAPER_CONFIG = {
  baseUrl: 'https://www.ufc.com',
  endpoints: {
    events: '/events',
    fighters: '/athletes',
    rankings: '/rankings',
    fightDetails: '/event/:eventId/fight/:fightId' // New endpoint for fight details
  }
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_FIGHT_ID: 'Invalid fight ID',
  INVALID_RESPONSE_FORMAT: 'Invalid response format',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timed out',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded',
  API_ERROR: 'API error occurred'
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Helper function to fetch data from Sherdog API
export const fetchFromSherdogApi = async <T>(endpoint: string, params: Record<string, any> = {}): Promise<T> => {
  try {
    const url = `${SHERDOG_API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.get<T>(url, {
      params,
      timeout: REQUEST_TIMEOUT
    });
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
      },
      timeout: REQUEST_TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching UFC odds:', error);
    throw error;
  }
};

// Helper function to fetch round betting data
export const fetchRoundBettingData = async (fightId: string): Promise<RoundBettingOption[]> => {
  try {
    // Replace :fightId placeholder with actual fightId
    const endpoint = SHERDOG_API_CONFIG.endpoints.roundBetting.replace(':fightId', fightId);
    const response = await axios.get(`${SHERDOG_API_CONFIG.baseUrl}${endpoint}`, {
      timeout: REQUEST_TIMEOUT
    });
    
    // Map API response to our RoundBettingOption format
    return response.data.map((option: any) => ({
      id: `option-${option.id || Math.random().toString(36).substring(2, 9)}`,
      fightId: fightId,
      fighterId: `fighter-${option.fighter_id}`,
      round: option.round,
      outcome: option.outcome as FightOutcome,
      odds: option.odds
    }));
  } catch (error) {
    console.error(`Error fetching round betting data for fight ${fightId}:`, error);
    throw error;
  }
};

// Helper function to generate mock round betting data
export const generateMockRoundBettingData = (
  fightId: string,
  fighter1Id: string,
  fighter2Id: string,
  totalRounds: number
): RoundBettingOption[] => {
  const options: RoundBettingOption[] = [];
  const outcomes = [
    FightOutcome.KO,
    FightOutcome.TKO,
    FightOutcome.SUBMISSION,
    FightOutcome.DECISION
  ];
  
  // Generate options for each fighter, round, and outcome
  [fighter1Id, fighter2Id].forEach(fighterId => {
    // For each round
    for (let round = 1; round <= totalRounds; round++) {
      // For each outcome (except decision for non-final rounds)
      outcomes.forEach(outcome => {
        // Decision only possible in final round
        if (outcome === FightOutcome.DECISION && round !== totalRounds) {
          return;
        }
        
        // Generate realistic odds
        let baseOdds = 3.0 + Math.random() * 7.0;
        
        // Adjust odds based on round and outcome
        if (outcome === FightOutcome.DECISION) {
          baseOdds *= 0.7; // Decisions are more common
        } else if (round > 2) {
          baseOdds *= 1.2; // Later round finishes less common
        }
        
        // Round to 2 decimal places
        const odds = Math.round(baseOdds * 100) / 100;
        
        options.push({
          id: `option-${fighterId}-${round}-${outcome}-${Math.random().toString(36).substring(2, 9)}`,
          fightId,
          fighterId,
          round,
          outcome,
          odds
        });
      });
    }
  });
  
  return options;
};

// Helper function to scrape UFC data
// This is a simplified version - in a real implementation, you would use a more robust scraping solution
export const scrapeUFCData = async (endpoint: string, params: Record<string, string> = {}) => {
  try {
    // In a real implementation, this would use a scraping library or a headless browser
    // For now, we'll just make a request to the UFC website
    const response = await axios.get(`${UFC_SCRAPER_CONFIG.baseUrl}${endpoint}`, {
      params,
      timeout: REQUEST_TIMEOUT
    });
    
    // In a real implementation, you would parse the HTML response
    // For now, we'll just return the raw HTML
    return response.data;
  } catch (error) {
    console.error(`Error scraping UFC data (${endpoint}):`, error);
    throw error;
  }
};

// Helper function to build API URL with parameters
export const buildApiUrl = (endpoint: string, params: Record<string, any> = {}): string => {
  // Replace placeholders in endpoint with parameter values
  let url = endpoint;
  Object.keys(params).forEach(key => {
    if (url.includes(`:${key}`)) {
      url = url.replace(`:${key}`, params[key]);
      delete params[key]; // Remove used parameters
    }
  });
  
  // Add remaining parameters as query string
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    queryParams.append(key, params[key]);
  });
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};