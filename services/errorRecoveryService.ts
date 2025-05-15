/**
 * Error Recovery Service
 * Provides robust error recovery mechanisms for API calls
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';

// Error types
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  AUTH = 'auth',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CACHE = 'cache',
  NOTIFY = 'notify',
  ABORT = 'abort',
}

// Error details interface
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: number;
  timestamp: number;
  endpoint?: string;
  retryCount?: number;
  recoveryStrategy?: RecoveryStrategy;
}

// Storage keys
const STORAGE_KEYS = {
  ERROR_LOG: 'error_recovery_log',
  RETRY_COUNTS: 'error_recovery_retry_counts',
};

// Default retry options
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

class ErrorRecoveryService {
  /**
   * Determine error type from error object
   * @param error Error object
   * @param endpoint API endpoint
   * @returns Error type
   */
  determineErrorType(error: any, endpoint?: string): ErrorType {
    // Check for network connectivity issues
    if (error.message && (
      error.message.includes('Network Error') ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ETIMEDOUT')
    )) {
      return ErrorType.NETWORK;
    }
    
    // Check for timeout
    if (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('TIMEOUT')
    )) {
      return ErrorType.TIMEOUT;
    }
    
    // Check for rate limiting
    if (error.response && (
      error.response.status === 429 ||
      (error.response.data && error.response.data.message && 
        error.response.data.message.includes('rate limit'))
    )) {
      return ErrorType.RATE_LIMIT;
    }
    
    // Check for authentication issues
    if (error.response && (
      error.response.status === 401 ||
      error.response.status === 403
    )) {
      return ErrorType.AUTH;
    }
    
    // Check for server errors
    if (error.response && error.response.status >= 500) {
      return ErrorType.SERVER;
    }
    
    // Check for API errors
    if (error.response && error.response.status >= 400) {
      return ErrorType.API;
    }
    
    // Default to unknown
    return ErrorType.UNKNOWN;
  }
  
  /**
   * Log error for analytics and debugging
   * @param error Error details
   */
  async logError(error: ErrorDetails): Promise<void> {
    try {
      // Get existing error log
      const errorLogString = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOG);
      const errorLog: ErrorDetails[] = errorLogString ? JSON.parse(errorLogString) : [];
      
      // Add new error to log
      errorLog.push(error);
      
      // Keep only the last 50 errors
      const trimmedLog = errorLog.slice(-50);
      
      // Save updated log
      await AsyncStorage.setItem(STORAGE_KEYS.ERROR_LOG, JSON.stringify(trimmedLog));
      
      // Log error to console (in a real app, you would use a proper analytics service)
      console.error('API Error:', {
        errorType: error.type,
        endpoint: error.endpoint,
        code: error.code,
        message: error.message,
        recoveryStrategy: error.recoveryStrategy,
      });
    } catch (logError) {
      console.error('Error logging error:', logError);
    }
  }
  
  /**
   * Get retry delay using exponential backoff
   * @param retryCount Current retry count
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  getRetryDelay(retryCount: number, options = DEFAULT_RETRY_OPTIONS): number {
    const { baseDelay, maxDelay } = options;
    
    // Calculate delay with jitter (exponential backoff with randomization)
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.5 + 0.5; // Random value between 0.5 and 1
    const delay = exponentialDelay * jitter;
    
    // Ensure delay is not greater than max delay
    return Math.min(delay, maxDelay);
  }
  
  /**
   * Determine recovery strategy based on error type
   * @param errorType Error type
   * @param retryCount Current retry count
   * @param options Retry options
   * @returns Recovery strategy
   */
  determineRecoveryStrategy(
    errorType: ErrorType,
    retryCount: number,
    options = DEFAULT_RETRY_OPTIONS
  ): RecoveryStrategy {
    const { maxRetries } = options;
    
    // If we've exceeded max retries, use fallback or abort
    if (retryCount >= maxRetries) {
      return RecoveryStrategy.FALLBACK;
    }
    
    // Determine strategy based on error type
    switch (errorType) {
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return RecoveryStrategy.CACHE;
      
      case ErrorType.RATE_LIMIT:
        return RecoveryStrategy.RETRY;
      
      case ErrorType.API:
      case ErrorType.SERVER:
        return retryCount < 1 ? RecoveryStrategy.RETRY : RecoveryStrategy.FALLBACK;
      
      case ErrorType.AUTH:
        return RecoveryStrategy.NOTIFY;
      
      default:
        return RecoveryStrategy.FALLBACK;
    }
  }
  
  /**
   * Handle API error with appropriate recovery strategy
   * @param error Error object
   * @param endpoint API endpoint
   * @param retryFunction Function to retry the API call
   * @param fallbackFunction Function to get fallback data
   * @returns Result of recovery strategy
   */
  async handleApiError<T>(
    error: any,
    endpoint: string,
    retryFunction: () => Promise<T>,
    fallbackFunction: () => Promise<T>
  ): Promise<{ data: T | null; error: ErrorDetails | null; source: 'api' | 'cache' | 'fallback' | 'error' }> {
    try {
      // Get current retry count
      const retryCountsString = await AsyncStorage.getItem(STORAGE_KEYS.RETRY_COUNTS);
      const retryCounts: Record<string, number> = retryCountsString ? JSON.parse(retryCountsString) : {};
      const retryCount = retryCounts[endpoint] || 0;
      
      // Determine error type
      const errorType = this.determineErrorType(error, endpoint);
      
      // Create error details
      const errorDetails: ErrorDetails = {
        type: errorType,
        message: error.message || 'Unknown error',
        code: error.response?.status,
        timestamp: Date.now(),
        endpoint,
        retryCount,
      };
      
      // Determine recovery strategy
      const recoveryStrategy = this.determineRecoveryStrategy(errorType, retryCount);
      errorDetails.recoveryStrategy = recoveryStrategy;
      
      // Log error
      await this.logError(errorDetails);
      
      // Execute recovery strategy
      switch (recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          // Increment retry count
          retryCounts[endpoint] = retryCount + 1;
          await AsyncStorage.setItem(STORAGE_KEYS.RETRY_COUNTS, JSON.stringify(retryCounts));
          
          // Wait for retry delay
          const delay = this.getRetryDelay(retryCount);
          await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
          
          // Retry the API call
          try {
            const data = await retryFunction();
            
            // Reset retry count on success
            retryCounts[endpoint] = 0;
            await AsyncStorage.setItem(STORAGE_KEYS.RETRY_COUNTS, JSON.stringify(retryCounts));
            
            return { data, error: null, source: 'api' };
          } catch (retryError) {
            // If retry fails, use fallback
            return this.handleApiError(retryError, endpoint, retryFunction, fallbackFunction);
          }
        
        case RecoveryStrategy.FALLBACK:
        case RecoveryStrategy.CACHE:
          // Use fallback data
          try {
            const data = await fallbackFunction();
            return { data, error: errorDetails, source: 'fallback' };
          } catch (fallbackError) {
            return { data: null, error: errorDetails, source: 'error' };
          }
        
        case RecoveryStrategy.NOTIFY:
          // Just return the error for UI notification
          return { data: null, error: errorDetails, source: 'error' };
        
        case RecoveryStrategy.ABORT:
        default:
          // Reset retry count
          retryCounts[endpoint] = 0;
          await AsyncStorage.setItem(STORAGE_KEYS.RETRY_COUNTS, JSON.stringify(retryCounts));
          
          // Return error
          return { data: null, error: errorDetails, source: 'error' };
      }
    } catch (handlingError) {
      console.error('Error handling API error:', handlingError);
      
      // Create generic error details
      const errorDetails: ErrorDetails = {
        type: ErrorType.UNKNOWN,
        message: 'Error recovery failed',
        timestamp: Date.now(),
        endpoint,
      };
      
      return { data: null, error: errorDetails, source: 'error' };
    }
  }
  
  /**
   * Check network status
   * @returns Network status
   */
  async checkNetworkStatus(): Promise<{ isConnected: boolean; connectionType: string | null }> {
    try {
      const netInfo = await NetInfo.fetch();
      return {
        isConnected: netInfo.isConnected || false,
        connectionType: netInfo.type,
      };
    } catch (error) {
      console.error('Error checking network status:', error);
      return {
        isConnected: false,
        connectionType: null,
      };
    }
  }
  
  /**
   * Clear error log and retry counts
   */
  async clearErrorLog(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.ERROR_LOG, STORAGE_KEYS.RETRY_COUNTS]);
    } catch (error) {
      console.error('Error clearing error log:', error);
    }
  }
  
  /**
   * Get error log
   * @returns Error log
   */
  async getErrorLog(): Promise<ErrorDetails[]> {
    try {
      const errorLogString = await AsyncStorage.getItem(STORAGE_KEYS.ERROR_LOG);
      return errorLogString ? JSON.parse(errorLogString) : [];
    } catch (error) {
      console.error('Error getting error log:', error);
      return [];
    }
  }
}

export const errorRecoveryService = new ErrorRecoveryService();