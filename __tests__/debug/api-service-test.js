/**
 * API Service Test Script
 * 
 * This script tests the API service with enhanced logging and error handling.
 * It validates the improvements made to the API service.
 */

import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '../../services/apiService';
import { info, error as logError, LogCategory } from '../../services/loggingService';
import { safeErrorCapture } from '../../services/errorUtils';
// Replaced with firebaseService
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock the logging service
jest.mock('../../services/loggingService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  LogCategory: {
    API: 'api',
    AUTH: 'auth',
    APP: 'app',
    USER: 'user',
  },
}));

// Mock the error tracking service
jest.mock('../../services/errorUtils', () => ({
  safeErrorCapture: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock successful auth
    getAuth.mockReturnValue({
      currentUser: {
        uid: 'test-user-id',
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      },
    });
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
    AsyncStorage.getAllKeys.mockResolvedValue([]);
    
    // Mock successful fetch
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: 'test-data' }),
    });
  });

  test('logs successful API request', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ games: [{ id: 'game1' }] }),
    });
    
    // Call the API
    await getGames();
    
    // Verify that the request was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Making GET request',
      expect.objectContaining({ endpoint: '/games?type=all', method: 'GET' })
    );
    
    // Verify that the response was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Response received',
      expect.objectContaining({ 
        endpoint: '/games?type=all', 
        status: 200 
      })
    );
  });

  test('logs and handles API error', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: 'Game not found' }),
    });
    
    // Call the API and expect it to throw
    await expect(getGameDetails('nonexistent-game')).rejects.toThrow();
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.API,
      'HTTP error 404 (not_found)',
      expect.any(ApiError)
    );
    
    // Verify that the error was captured
    expect(safeErrorCapture).toHaveBeenCalled();
  });

  test('logs and handles network error with retry', async () => {
    // Mock network error then success
    const networkError = new TypeError('Network request failed');
    global.fetch.mockRejectedValueOnce(networkError);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ trending: [{ id: 'trend1' }] }),
    });
    
    // Call the API
    await getTrendingTopics();
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.API,
      'Network or server error',
      networkError
    );
    
    // Verify that the retry was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Retrying request after error',
      expect.objectContaining({ 
        endpoint: '/trending',
        retriesLeft: 2
      })
    );
    
    // Verify that the error was captured
    expect(safeErrorCapture).toHaveBeenCalled();
  });

  test('logs authentication status for requests', async () => {
    // Call the API
    await getUserStats('test-user-id');
    
    // Verify that the authentication was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Added authentication token to headers',
      expect.objectContaining({ userId: 'test-user-id' })
    );
  });

  test('logs and handles authentication error', async () => {
    // Mock auth error
    getAuth.mockReturnValueOnce({
      currentUser: {
        uid: 'test-user-id',
        getIdToken: jest.fn().mockRejectedValue(new Error('Auth token error')),
      },
    });
    
    // Call the API
    await getUserStats('test-user-id');
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.API,
      'Failed to get authentication token',
      expect.any(Error)
    );
    
    // Verify that the error was captured
    expect(safeErrorCapture).toHaveBeenCalled();
  });

  test('logs and handles JSON parsing error', async () => {
    // Mock invalid JSON response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    });
    
    // Call the API and expect it to throw
    await expect(getGames()).rejects.toThrow();
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.API,
      'Error parsing JSON response',
      expect.any(SyntaxError)
    );
    
    // Verify that the error was captured
    expect(safeErrorCapture).toHaveBeenCalled();
  });

  test('logs purchase flow with authentication check', async () => {
    // Mock successful purchase
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ purchase: { id: 'purchase1' } }),
    });
    
    // Call the API
    await purchaseMicrotransaction('product1', 'payment1');
    
    // Verify that the purchase initiation was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Initiating microtransaction purchase',
      expect.objectContaining({ productId: 'product1' })
    );
    
    // Verify that the authentication was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'User authenticated for purchase',
      expect.objectContaining({ userId: 'test-user-id' })
    );
    
    // Verify that the purchase success was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.API,
      'Microtransaction purchase successful',
      expect.objectContaining({ 
        productId: 'product1',
        purchaseId: 'purchase1'
      })
    );
  });

  test('logs and handles unauthenticated purchase attempt', async () => {
    // Mock no authenticated user
    getAuth.mockReturnValueOnce({
      currentUser: null,
    });
    
    // Call the API and expect it to throw
    await expect(purchaseMicrotransaction('product1', 'payment1')).rejects.toThrow();
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.API,
      'User not authenticated for purchase',
      expect.any(ApiError)
    );
    
    // Verify that the error was captured
    expect(safeErrorCapture).toHaveBeenCalled();
  });

  test('logs cache operations', async () => {
    // Mock cache hit
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
      data: [{ id: 'game1' }],
      timestamp: Date.now(),
    }));
    
    // Call the API with cache enabled
    await getGames('all', true);
    
    // Verify that no fetch was made (cache hit)
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('logs cache clearing', async () => {
    // Mock cache keys
    AsyncStorage.getAllKeys.mockResolvedValueOnce(['api_cache_games_all', 'api_cache_trending']);
    
    // Clear cache
    await clearCache();
    
    // Verify that the cache keys were retrieved
    expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
    
    // Verify that the cache was cleared
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['api_cache_games_all', 'api_cache_trending']);
  });
});