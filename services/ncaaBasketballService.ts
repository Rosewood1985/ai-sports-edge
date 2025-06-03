import axios from 'axios';
import { Alert } from 'react-native';

import ncaaBasketballApi from '../config/ncaaBasketballApi';

// Types for NCAA Basketball data
export interface NcaaBasketballGame {
  id: string;
  status: string;
  scheduled: string;
  home: NcaaBasketballTeam;
  away: NcaaBasketballTeam;
  home_points: number;
  away_points: number;
  venue: {
    name: string;
    city: string;
    state: string;
  };
  tournament?: {
    id: string;
    name: string;
    round: string;
  };
}

export interface NcaaBasketballTeam {
  id: string;
  name: string;
  market: string;
  alias: string;
  rank?: number;
  points: number;
}

export interface NcaaBasketballPlayer {
  id: string;
  full_name: string;
  jersey_number: string;
  position: string;
  primary_position: string;
  statistics: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    field_goals_made: number;
    field_goals_att: number;
    three_points_made: number;
    three_points_att: number;
    free_throws_made: number;
    free_throws_att: number;
    turnovers: number;
    fouls: number;
    plus_minus: number;
  };
}

export interface NcaaBasketballStandings {
  conference: string;
  teams: {
    id: string;
    name: string;
    market: string;
    wins: number;
    losses: number;
    win_pct: number;
    conference_wins: number;
    conference_losses: number;
    conference_win_pct: number;
    streak: {
      kind: string;
      length: number;
    };
  }[];
}

export interface NcaaBasketballRankings {
  poll_name: string;
  date: string;
  teams: {
    rank: number;
    id: string;
    name: string;
    market: string;
    wins: number;
    losses: number;
    points: number;
    previous_rank?: number;
  }[];
}

// Gender type for NCAA Basketball
export type NcaaBasketballGender = 'mens' | 'womens';

/**
 * Fetch NCAA Basketball game summary
 * @param gameId The ID of the game
 * @param gender 'mens' or 'womens'
 * @returns Promise that resolves with the game summary
 */
export const fetchGameSummary = async (
  gameId: string,
  gender: NcaaBasketballGender
): Promise<NcaaBasketballGame> => {
  try {
    // Validate game ID
    if (!gameId) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_GAME_ID);
    }

    // Determine the endpoint based on gender
    const endpoint =
      gender === 'mens'
        ? ncaaBasketballApi.ENDPOINTS.MENS.GAME_SUMMARY
        : ncaaBasketballApi.ENDPOINTS.WOMENS.GAME_SUMMARY;

    // Build API URL
    const apiUrl = ncaaBasketballApi.buildApiUrl(endpoint, { game_id: gameId });

    // Configure request with timeout
    const requestConfig = {
      timeout: ncaaBasketballApi.REQUEST_TIMEOUT,
    };

    // Make API request
    const response = await axios.get(apiUrl, requestConfig);

    // Validate response data
    if (!response.data) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball game summary:`, error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.status === 429) {
          console.error(ncaaBasketballApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch game data. Please try again.');
        }
      } else if (error.request) {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }

    throw error;
  }
};

/**
 * Fetch NCAA Basketball player profile
 * @param playerId The ID of the player
 * @param gender 'mens' or 'womens'
 * @returns Promise that resolves with the player profile
 */
export const fetchPlayerProfile = async (
  playerId: string,
  gender: NcaaBasketballGender
): Promise<NcaaBasketballPlayer> => {
  try {
    // Validate player ID
    if (!playerId) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_PLAYER_ID);
    }

    // Determine the endpoint based on gender
    const endpoint =
      gender === 'mens'
        ? ncaaBasketballApi.ENDPOINTS.MENS.PLAYER_PROFILE
        : ncaaBasketballApi.ENDPOINTS.WOMENS.PLAYER_PROFILE;

    // Build API URL
    const apiUrl = ncaaBasketballApi.buildApiUrl(endpoint, { player_id: playerId });

    // Configure request with timeout
    const requestConfig = {
      timeout: ncaaBasketballApi.REQUEST_TIMEOUT,
    };

    // Make API request
    const response = await axios.get(apiUrl, requestConfig);

    // Validate response data
    if (!response.data) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball player profile:`, error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.status === 429) {
          console.error(ncaaBasketballApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch player data. Please try again.');
        }
      } else if (error.request) {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }

    throw error;
  }
};

/**
 * Fetch NCAA Basketball schedule for a specific date
 * @param year The year (YYYY)
 * @param month The month (MM)
 * @param day The day (DD)
 * @param gender 'mens' or 'womens'
 * @returns Promise that resolves with the schedule
 */
export const fetchSchedule = async (
  year: string,
  month: string,
  day: string,
  gender: NcaaBasketballGender
): Promise<NcaaBasketballGame[]> => {
  try {
    // Validate parameters
    if (!year || !month || !day) {
      throw new Error('Date parameters are required');
    }

    // Determine the endpoint based on gender
    const endpoint =
      gender === 'mens'
        ? ncaaBasketballApi.ENDPOINTS.MENS.LEAGUE_SCHEDULE
        : ncaaBasketballApi.ENDPOINTS.WOMENS.LEAGUE_SCHEDULE;

    // Build API URL
    const apiUrl = ncaaBasketballApi.buildApiUrl(endpoint, { year, month, day });

    // Configure request with timeout
    const requestConfig = {
      timeout: ncaaBasketballApi.REQUEST_TIMEOUT,
    };

    // Make API request
    const response = await axios.get(apiUrl, requestConfig);

    // Validate response data
    if (!response.data || !response.data.games) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }

    return response.data.games;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball schedule:`, error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.status === 429) {
          console.error(ncaaBasketballApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch schedule data. Please try again.');
        }
      } else if (error.request) {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }

    throw error;
  }
};

/**
 * Fetch NCAA Basketball tournament summary
 * @param tournamentId The ID of the tournament
 * @param gender 'mens' or 'womens'
 * @returns Promise that resolves with the tournament summary
 */
export const fetchTournamentSummary = async (
  tournamentId: string,
  gender: NcaaBasketballGender
): Promise<any> => {
  try {
    // Validate tournament ID
    if (!tournamentId) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_TOURNAMENT_ID);
    }

    // Determine the endpoint based on gender
    const endpoint =
      gender === 'mens'
        ? ncaaBasketballApi.ENDPOINTS.MENS.TOURNAMENT_SUMMARY
        : ncaaBasketballApi.ENDPOINTS.WOMENS.TOURNAMENT_SUMMARY;

    // Build API URL
    const apiUrl = ncaaBasketballApi.buildApiUrl(endpoint, { tournament_id: tournamentId });

    // Configure request with timeout
    const requestConfig = {
      timeout: ncaaBasketballApi.REQUEST_TIMEOUT,
    };

    // Make API request
    const response = await axios.get(apiUrl, requestConfig);

    // Validate response data
    if (!response.data) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball tournament summary:`, error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.status === 429) {
          console.error(ncaaBasketballApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch tournament data. Please try again.');
        }
      } else if (error.request) {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }

    throw error;
  }
};

/**
 * Fetch NCAA Basketball rankings
 * @param pollId The ID of the poll (e.g., 'AP', 'USA_TODAY')
 * @param gender 'mens' or 'womens'
 * @returns Promise that resolves with the rankings
 */
export const fetchRankings = async (
  pollId: string,
  gender: NcaaBasketballGender
): Promise<NcaaBasketballRankings> => {
  try {
    // Validate poll ID
    if (!pollId) {
      throw new Error('Poll ID is required');
    }

    // Determine the endpoint based on gender
    const endpoint =
      gender === 'mens'
        ? ncaaBasketballApi.ENDPOINTS.MENS.RANKINGS
        : ncaaBasketballApi.ENDPOINTS.WOMENS.RANKINGS;

    // Build API URL
    const apiUrl = ncaaBasketballApi.buildApiUrl(endpoint, { poll_id: pollId });

    // Configure request with timeout
    const requestConfig = {
      timeout: ncaaBasketballApi.REQUEST_TIMEOUT,
    };

    // Make API request
    const response = await axios.get(apiUrl, requestConfig);

    // Validate response data
    if (!response.data) {
      throw new Error(ncaaBasketballApi.ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball rankings:`, error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.TIMEOUT_ERROR);
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.status === 429) {
          console.error(ncaaBasketballApi.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          Alert.alert('Error', 'Rate limit exceeded. Please try again later.');
        } else {
          console.error(`API Error: ${error.response.status} - ${error.response.data}`);
          Alert.alert('Error', 'Failed to fetch rankings data. Please try again.');
        }
      } else if (error.request) {
        console.error(ncaaBasketballApi.ERROR_MESSAGES.NETWORK_ERROR);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } else {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }

    throw error;
  }
};

export default {
  fetchGameSummary,
  fetchPlayerProfile,
  fetchSchedule,
  fetchTournamentSummary,
  fetchRankings,
};
