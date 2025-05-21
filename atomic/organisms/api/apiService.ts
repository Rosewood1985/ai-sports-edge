/**
 * API Service Organism
 *
 * This service handles all API requests to the backend.
 * It includes error handling, caching, and retry logic.
 * This is an enhanced version that uses the apiCache module for consistent caching.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';
import { info, error as logError, LogCategory } from '../../../services/loggingService';
import { safeErrorCapture } from '../../../services/errorUtils';
import { apiCache, ApiCacheOptions } from '../../molecules/cache/apiCache';

// API base URL
const API_BASE_URL = 'https://api.aisportsedge.com/v1';

// Default cache options
const DEFAULT_CACHE_OPTIONS: ApiCacheOptions = {
  useCache: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  prefix: 'api:',
  useMemory: true,
};

// Custom cache options for different endpoints
const CACHE_OPTIONS: Record<string, ApiCacheOptions> = {
  '/games': {
    ...DEFAULT_CACHE_OPTIONS,
    ttl: 2 * 60 * 1000, // 2 minutes for games (more frequent updates)
  },
  '/trending': {
    ...DEFAULT_CACHE_OPTIONS,
    ttl: 10 * 60 * 1000, // 10 minutes for trending (less frequent updates)
  },
};

// Error types
export enum ApiErrorType {
  NETWORK = 'network_error',
  AUTH = 'authentication_error',
  SERVER = 'server_error',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation_error',
  UNKNOWN = 'unknown_error',
}

// API error class
export class ApiError extends Error {
  type: ApiErrorType;
  statusCode?: number;

  constructor(message: string, type: ApiErrorType, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Get CSRF token
 * @returns CSRF token
 */
const getCsrfToken = async (): Promise<string> => {
  try {
    // Try to get from storage first
    const storedToken = await AsyncStorage.getItem('csrf_token');
    if (storedToken) {
      return storedToken;
    }

    // Generate a new token if not found
    const newToken = Array(32)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');

    // Store the token
    await AsyncStorage.setItem('csrf_token', newToken);
    return newToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    // Fallback to a random token if storage fails
    return Math.random().toString(36).substring(2);
  }
};

/**
 * Get authentication headers
 * @param method HTTP method
 * @returns Headers object with authentication token and CSRF token for non-GET requests
 */
const getAuthHeaders = async (method: string = 'GET'): Promise<Record<string, string>> => {
  console.log(`apiService: Getting auth headers for ${method} request`);
  info(LogCategory.API, 'Getting authentication headers', { method });

  const auth = getAuth();
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authentication token if user is logged in
  if (user) {
    try {
      console.log(`apiService: Getting ID token for user ${user.uid}`);
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      console.log('apiService: Successfully added auth token to headers');
      info(LogCategory.API, 'Added authentication token to headers', { userId: user.uid });
    } catch (error) {
      console.error('apiService: Error getting ID token:', error);
      logError(LogCategory.API, 'Failed to get authentication token', error as Error);
      safeErrorCapture(error as Error);
      // Continue without auth token
    }
  } else {
    console.log('apiService: No authenticated user found');
    info(LogCategory.API, 'No authenticated user for request');
  }

  // Add CSRF token for non-GET requests
  if (method !== 'GET') {
    try {
      console.log('apiService: Getting CSRF token for non-GET request');
      const csrfToken = await getCsrfToken();
      headers['X-CSRF-Token'] = csrfToken;
      console.log('apiService: Successfully added CSRF token to headers');
      info(LogCategory.API, 'Added CSRF token to headers');
    } catch (error) {
      console.error('apiService: Error getting CSRF token:', error);
      logError(LogCategory.API, 'Failed to get CSRF token', error as Error);
      safeErrorCapture(error as Error);
      // Continue without CSRF token
    }
  }

  return headers;
};

/**
 * Clear API cache
 * @param endpoint Optional endpoint to clear specific cache
 */
export const clearCache = async (endpoint?: string): Promise<void> => {
  try {
    if (endpoint) {
      // Generate cache key for the endpoint
      const key = apiCache.generateCacheKey(endpoint);
      await apiCache.invalidateCache(key);
    } else {
      // Clear all API cache
      await apiCache.invalidateAllCache();
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Make API request with error handling and retries
 * @param endpoint API endpoint
 * @param options Fetch options
 * @param params Optional query parameters
 * @param cacheOptions Cache options
 * @param retries Number of retries
 * @returns Response data
 */
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>,
  cacheOptions?: ApiCacheOptions,
  retries = 3
): Promise<T> => {
  const method = options.method || 'GET';
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(`apiService: Making ${method} request to ${endpoint}`);
  info(LogCategory.API, `Making ${method} request`, { endpoint, method });

  // Determine cache options based on endpoint
  const baseEndpoint = endpoint.split('?')[0];
  const mergedCacheOptions = {
    ...DEFAULT_CACHE_OPTIONS,
    ...(CACHE_OPTIONS[baseEndpoint] || {}),
    ...cacheOptions,
  };

  // Only use cache for GET requests
  if (method !== 'GET') {
    mergedCacheOptions.useCache = false;
  }

  // Use cached request for GET requests
  if (method === 'GET' && mergedCacheOptions.useCache) {
    return apiCache.cachedRequest<T>(
      endpoint,
      async () => {
        // This function will be called if the data is not in the cache
        return makeRequestWithRetries<T>(url, endpoint, options, params, retries);
      },
      params,
      mergedCacheOptions
    );
  }

  // For non-GET requests, bypass cache
  return makeRequestWithRetries<T>(url, endpoint, options, params, retries);
};

/**
 * Make API request with retries
 * @param url Full URL
 * @param endpoint API endpoint (for logging)
 * @param options Fetch options
 * @param params Optional query parameters
 * @param retries Number of retries
 * @returns Response data
 */
const makeRequestWithRetries = async <T>(
  url: string,
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>,
  retries = 3
): Promise<T> => {
  const method = options.method || 'GET';
  const startTime = Date.now();

  try {
    // Get authentication headers
    const headers = await getAuthHeaders(method);

    // Make the request
    console.log(`apiService: Fetching ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(
      `apiService: Response received in ${responseTime}ms with status ${response.status}`
    );
    info(LogCategory.API, 'Response received', {
      endpoint,
      status: response.status,
      responseTime,
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorType = ApiErrorType.UNKNOWN;
      let errorMessage = 'Unknown error occurred';

      switch (response.status) {
        case 401:
          errorType = ApiErrorType.AUTH;
          errorMessage = 'Authentication required';
          break;
        case 403:
          errorType = ApiErrorType.AUTH;
          errorMessage = 'Permission denied';
          break;
        case 404:
          errorType = ApiErrorType.NOT_FOUND;
          errorMessage = 'Resource not found';
          break;
        case 422:
          errorType = ApiErrorType.VALIDATION;
          errorMessage = 'Validation error';
          break;
        case 500:
        case 502:
        case 503:
          errorType = ApiErrorType.SERVER;
          errorMessage = 'Server error';
          break;
      }

      console.error(`apiService: HTTP error ${response.status} (${errorType}): ${errorMessage}`);

      // Try to get error message from response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
          console.error(`apiService: Error message from server: ${errorMessage}`);
        }
      } catch (e) {
        console.error('apiService: Could not parse error response as JSON');
        // Ignore JSON parsing errors
      }

      const apiError = new ApiError(errorMessage, errorType, response.status);
      logError(LogCategory.API, `HTTP error ${response.status} (${errorType})`, apiError);
      safeErrorCapture(apiError);
      throw apiError;
    }

    // Parse JSON response
    console.log('apiService: Parsing JSON response');
    try {
      const data = await response.json();
      console.log(`apiService: Successfully parsed response for ${endpoint}`);
      return data as T;
    } catch (parseError) {
      console.error(`apiService: Error parsing JSON response: ${parseError}`);
      logError(LogCategory.API, 'Error parsing JSON response', parseError as Error);
      safeErrorCapture(parseError as Error);
      throw new ApiError('Invalid JSON response from server', ApiErrorType.SERVER);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Handle network errors with retry
    if (
      (error instanceof TypeError && error.message.includes('Network request failed')) ||
      (error instanceof ApiError && error.type === ApiErrorType.SERVER)
    ) {
      console.error(`apiService: Network or server error: ${error.message}`);
      logError(LogCategory.API, 'Network or server error', error as Error);

      if (retries > 0) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, 3 - retries);
        console.log(`apiService: Retrying request in ${delay}ms (${retries} retries left)`);
        info(LogCategory.API, 'Retrying request after error', {
          endpoint,
          retriesLeft: retries,
          delay,
        });

        await new Promise<void>(resolve => setTimeout(resolve, delay));

        // Retry the request
        return makeRequestWithRetries<T>(url, endpoint, options, params, retries - 1);
      }

      console.error(`apiService: Request failed after multiple retries: ${endpoint}`);
      const maxRetriesError = new ApiError(
        'Network request failed after multiple retries',
        ApiErrorType.NETWORK
      );
      logError(LogCategory.API, 'Request failed after maximum retries', maxRetriesError);
      safeErrorCapture(maxRetriesError);
      throw maxRetriesError;
    }

    // Re-throw API errors
    if (error instanceof ApiError) {
      console.error(`apiService: API error (${error.type}): ${error.message}`);
      throw error;
    }

    // Handle other errors
    console.error(`apiService: Unexpected error: ${error}`);
    const unexpectedError = new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      ApiErrorType.UNKNOWN
    );
    logError(LogCategory.API, 'Unexpected error during API request', error as Error);
    safeErrorCapture(error as Error);
    throw unexpectedError;
  }
};

/**
 * Get games list
 * @param type Game type (all, live, upcoming, completed)
 * @param useCache Whether to use cache
 * @returns Games list
 */
export const getGames = async (
  type: 'all' | 'live' | 'upcoming' | 'completed' = 'all',
  useCache = true
): Promise<any[]> => {
  // Make API request
  const data = await makeRequest<{ games: any[] }>(
    `/games?type=${type}`,
    { method: 'GET' },
    { type },
    { useCache }
  );

  return data.games;
};

/**
 * Get game details
 * @param gameId Game ID
 * @param useCache Whether to use cache
 * @returns Game details
 */
export const getGameDetails = async (gameId: string, useCache = true): Promise<any> => {
  // Make API request
  const data = await makeRequest<{ game: any }>(
    `/games/${gameId}`,
    { method: 'GET' },
    { gameId },
    { useCache }
  );

  return data.game;
};

/**
 * Get trending topics
 * @param useCache Whether to use cache
 * @returns Trending topics
 */
export const getTrendingTopics = async (useCache = true): Promise<any[]> => {
  // Make API request
  const data = await makeRequest<{ trending: any[] }>('/trending', { method: 'GET' }, undefined, {
    useCache,
  });

  return data.trending;
};

/**
 * Get user statistics
 * @param userId User ID
 * @param useCache Whether to use cache
 * @returns User statistics
 */
export const getUserStats = async (userId: string, useCache = true): Promise<any> => {
  // Make API request
  const data = await makeRequest<{ stats: any }>(
    `/users/${userId}/stats`,
    { method: 'GET' },
    { userId },
    { useCache }
  );

  return data.stats;
};

/**
 * Purchase microtransaction
 * @param productId Product ID
 * @param paymentMethodId Payment method ID
 * @returns Purchase result
 */
export const purchaseMicrotransaction = async (
  productId: string,
  paymentMethodId: string
): Promise<any> => {
  console.log(`apiService: Initiating purchase for product ${productId}`);
  info(LogCategory.API, 'Initiating microtransaction purchase', { productId });

  try {
    // Check network connectivity first
    const networkState = await Platform.select({
      web: Promise.resolve({ isConnected: true }),
      default: Promise.resolve({ isConnected: true }), // In a real app, use NetInfo.fetch()
    });

    if (!networkState.isConnected) {
      console.error('apiService: Network unavailable for purchase');
      const error = new ApiError('Network unavailable', ApiErrorType.NETWORK);
      logError(LogCategory.API, 'Network unavailable for purchase', error);
      safeErrorCapture(error);
      throw error;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('apiService: User not authenticated for purchase');
      const error = new ApiError('User not authenticated', ApiErrorType.AUTH);
      logError(LogCategory.API, 'User not authenticated for purchase', error);
      safeErrorCapture(error);
      throw error;
    }

    console.log(`apiService: User ${user.uid} authenticated for purchase`);
    info(LogCategory.API, 'User authenticated for purchase', { userId: user.uid });

    // Generate idempotency key to prevent duplicate charges
    const idempotencyKey = `${user.uid}_${productId}_${Date.now()}`;
    console.log(`apiService: Generated idempotency key: ${idempotencyKey}`);

    // Make API request
    console.log('apiService: Sending purchase request to API');
    const data = await makeRequest<{ purchase: any }>(
      '/purchases',
      {
        method: 'POST',
        body: JSON.stringify({
          productId,
          paymentMethodId,
          idempotencyKey,
        }),
      },
      { productId, paymentMethodId },
      { useCache: false } // Never cache purchase requests
    );

    console.log(`apiService: Purchase successful for product ${productId}`);
    info(LogCategory.API, 'Microtransaction purchase successful', {
      productId,
      purchaseId: data.purchase.id,
    });

    return data.purchase;
  } catch (error) {
    console.error(`apiService: Purchase failed for product ${productId}:`, error);

    if (error instanceof ApiError) {
      logError(LogCategory.API, `Purchase failed with API error (${error.type})`, error);
    } else {
      logError(LogCategory.API, 'Purchase failed with unknown error', error as Error);
    }

    safeErrorCapture(error as Error);
    throw error;
  }
};

/**
 * API Service
 */
export const apiService = {
  getGames,
  getGameDetails,
  getTrendingTopics,
  getUserStats,
  purchaseMicrotransaction,
  clearCache,
  makeRequest,
};

export default apiService;
