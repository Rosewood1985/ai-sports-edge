/**
 * Configuration for the NCAA Basketball API
 */

// API base URL
export const NCAA_BASKETBALL_BASE_URL = 'https://api.sportradar.com';

// API endpoints
export const ENDPOINTS = {
  MENS: {
    GAME_SUMMARY: '/ncaamb/trial/v7/en/games/{game_id}/summary.json',
    PLAYER_PROFILE: '/ncaamb/trial/v7/en/players/{player_id}/profile.json',
    LEAGUE_SCHEDULE: '/ncaamb/trial/v7/en/games/{year}/{month}/{day}/schedule.json',
    TOURNAMENT_SUMMARY: '/ncaamb/trial/v7/en/tournaments/{tournament_id}/summary.json',
    TEAM_PROFILE: '/ncaamb/trial/v7/en/teams/{team_id}/profile.json',
    STANDINGS: '/ncaamb/trial/v7/en/seasons/{season_id}/standings.json',
    RANKINGS: '/ncaamb/trial/v7/en/polls/{poll_id}/rankings.json',
  },
  WOMENS: {
    GAME_SUMMARY: '/ncaawb/trial/v7/en/games/{game_id}/summary.json',
    PLAYER_PROFILE: '/ncaawb/trial/v7/en/players/{player_id}/profile.json',
    LEAGUE_SCHEDULE: '/ncaawb/trial/v7/en/games/{year}/{month}/{day}/schedule.json',
    TOURNAMENT_SUMMARY: '/ncaawb/trial/v7/en/tournaments/{tournament_id}/summary.json',
    TEAM_PROFILE: '/ncaawb/trial/v7/en/teams/{team_id}/profile.json',
    STANDINGS: '/ncaawb/trial/v7/en/seasons/{season_id}/standings.json',
    RANKINGS: '/ncaawb/trial/v7/en/polls/{poll_id}/rankings.json',
  },
};

// API key (should be stored in environment variables in production)
export const API_KEY = process.env.NCAA_BASKETBALL_API_KEY || 'YOUR_NCAA_API_KEY';

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Rate limiting settings
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 5,
  MAX_REQUESTS_PER_DAY: 1000,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred while fetching data from NCAA Basketball API',
  API_ERROR: 'NCAA Basketball API returned an error',
  TIMEOUT_ERROR: 'Request to NCAA Basketball API timed out',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for NCAA Basketball API',
  INVALID_GAME_ID: 'Invalid game ID provided',
  INVALID_PLAYER_ID: 'Invalid player ID provided',
  INVALID_TEAM_ID: 'Invalid team ID provided',
  INVALID_TOURNAMENT_ID: 'Invalid tournament ID provided',
  INVALID_RESPONSE_FORMAT: 'Invalid response format from NCAA Basketball API',
};

/**
 * Build a complete API URL with the API key
 * @param endpoint The API endpoint
 * @param params Parameters to replace in the endpoint
 * @returns The complete API URL
 */
export const buildApiUrl = (endpoint: string, params: Record<string, string>): string => {
  let url = `${NCAA_BASKETBALL_BASE_URL}${endpoint}?api_key=${API_KEY}`;

  // Replace parameters in the URL
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });

  return url;
};

export default {
  NCAA_BASKETBALL_BASE_URL,
  ENDPOINTS,
  API_KEY,
  REQUEST_TIMEOUT,
  RATE_LIMIT,
  ERROR_MESSAGES,
  buildApiUrl,
};
