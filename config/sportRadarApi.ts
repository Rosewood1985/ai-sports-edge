/**
 * Configuration for the Sportradar API
 */

// API base URL
export const SPORTRADAR_BASE_URL = "https://api.sportradar.com";

// API endpoints
export const ENDPOINTS = {
  NBA: {
    GAME_SUMMARY: "/nba/trial/v7/en/games/{game_id}/summary.json",
    PLAYER_PROFILE: "/nba/trial/v7/en/players/{player_id}/profile.json",
    LEAGUE_SCHEDULE: "/nba/trial/v7/en/games/{year}/{month}/{day}/schedule.json",
    PLAYER_GAME_STATS: "/nba/trial/v7/en/games/{game_id}/boxscore.json",
  },
  NFL: {
    GAME_STATISTICS: "/nfl/official/trial/v7/en/games/{game_id}/statistics.json",
    PLAYER_PROFILE: "/nfl/official/trial/v7/en/players/{player_id}/profile.json",
  },
  MLB: {
    GAME_SUMMARY: "/mlb/trial/v7/en/games/{game_id}/summary.json",
    PLAYER_PROFILE: "/mlb/trial/v7/en/players/{player_id}/profile.json",
  },
  NHL: {
    GAME_SUMMARY: "/nhl/trial/v7/en/games/{game_id}/summary.json",
    PLAYER_PROFILE: "/nhl/trial/v7/en/players/{player_id}/profile.json",
  },
  UFC: {
    EVENT_SUMMARY: "/ufc/trial/v7/en/events/{event_id}/summary.json",
    FIGHTER_PROFILE: "/ufc/trial/v7/en/competitors/{fighter_id}/profile.json",
  }
};

// API key (should be stored in environment variables in production)
export const API_KEY = process.env.SPORTRADAR_API_KEY || "YOUR_API_KEY";

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Rate limiting settings
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 5,
  MAX_REQUESTS_PER_DAY: 1000,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error occurred while fetching data from Sportradar API",
  API_ERROR: "Sportradar API returned an error",
  TIMEOUT_ERROR: "Request to Sportradar API timed out",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded for Sportradar API",
  INVALID_GAME_ID: "Invalid game ID provided",
  INVALID_PLAYER_ID: "Invalid player ID provided",
  INVALID_RESPONSE_FORMAT: "Invalid response format from Sportradar API",
};

/**
 * Build a complete API URL with the API key
 * @param endpoint The API endpoint
 * @param params Parameters to replace in the endpoint
 * @returns The complete API URL
 */
export const buildApiUrl = (endpoint: string, params: Record<string, string>): string => {
  let url = `${SPORTRADAR_BASE_URL}${endpoint}?api_key=${API_KEY}`;
  
  // Replace parameters in the URL
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  
  return url;
};

export default {
  SPORTRADAR_BASE_URL,
  ENDPOINTS,
  API_KEY,
  REQUEST_TIMEOUT,
  RATE_LIMIT,
  ERROR_MESSAGES,
  buildApiUrl,
};