/**
 * Memory Management Utilities
 * Provides tools to optimize memory usage, especially for long-running sessions
 */

import { Platform } from 'react-native';

// Cache for memoized values
const memoizationCache: Record<string, {
  value: any;
  timestamp: number;
  ttl: number;
}> = {};

// Resource cleanup registry
const cleanupRegistry: Record<string, () => void> = {};

/**
 * Memoize a function result with automatic TTL-based cleanup
 * @param fn Function to memoize
 * @param keyFn Function to generate cache key from arguments
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns Memoized function
 */
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args),
  ttl: number = 5 * 60 * 1000
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    const now = Date.now();
    
    // Check if cached value exists and is still valid
    if (memoizationCache[key] && now - memoizationCache[key].timestamp < memoizationCache[key].ttl) {
      return memoizationCache[key].value;
    }
    
    // Calculate new value
    const result = fn(...args);
    
    // Cache the result
    memoizationCache[key] = {
      value: result,
      timestamp: now,
      ttl
    };
    
    return result;
  }) as T;
}

/**
 * Clear expired items from the memoization cache
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  
  Object.keys(memoizationCache).forEach(key => {
    if (now - memoizationCache[key].timestamp > memoizationCache[key].ttl) {
      delete memoizationCache[key];
    }
  });
}

/**
 * Register a cleanup function to be called when needed
 * @param id Unique identifier for the cleanup function
 * @param cleanupFn Function to call for cleanup
 */
export function registerCleanup(id: string, cleanupFn: () => void): void {
  cleanupRegistry[id] = cleanupFn;
}

/**
 * Unregister a cleanup function
 * @param id Unique identifier for the cleanup function
 */
export function unregisterCleanup(id: string): void {
  delete cleanupRegistry[id];
}

/**
 * Run all registered cleanup functions
 */
export function runAllCleanups(): void {
  Object.values(cleanupRegistry).forEach(cleanupFn => {
    try {
      cleanupFn();
    } catch (error) {
      console.error('Error running cleanup function:', error);
    }
  });
}

/**
 * Clear all memoization cache
 */
export function clearAllCache(): void {
  Object.keys(memoizationCache).forEach(key => {
    delete memoizationCache[key];
  });
}

/**
 * Get memory usage statistics
 * @returns Memory usage statistics
 */
export function getMemoryStats(): { cacheSize: number; cleanupFunctions: number } {
  return {
    cacheSize: Object.keys(memoizationCache).length,
    cleanupFunctions: Object.keys(cleanupRegistry).length
  };
}

/**
 * Create a disposable object that will be automatically cleaned up
 * @param createFn Function to create the object
 * @param disposeFn Function to dispose the object
 * @param id Optional unique identifier
 * @returns The created object with a dispose method
 */
export function createDisposable<T>(
  createFn: () => T,
  disposeFn: (obj: T) => void,
  id?: string
): T & { dispose: () => void } {
  const obj = createFn();
  const uniqueId = id || `disposable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const dispose = () => {
    disposeFn(obj);
    unregisterCleanup(uniqueId);
  };
  
  // Register cleanup
  registerCleanup(uniqueId, dispose);
  
  // Add dispose method to object
  return { ...obj as object, dispose } as T & { dispose: () => void };
}

// Set up automatic cache cleanup interval
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start automatic memory management
 * @param interval Interval in milliseconds (default: 2 minutes)
 */
export function startMemoryManagement(interval: number = 2 * 60 * 1000): void {
  // Clear any existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  // Set up new interval
  cleanupInterval = setInterval(() => {
    clearExpiredCache();
  }, interval);
}

/**
 * Stop automatic memory management
 */
export function stopMemoryManagement(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Automatically start memory management
startMemoryManagement();

// Add event listeners for app state changes
if (Platform.OS !== 'web') {
  // For React Native, we would typically use AppState here
  // This is a simplified version that would need to be expanded in a real app
  const { AppState } = require('react-native');
  
  AppState.addEventListener('memoryWarning', () => {
    console.log('Memory warning received, clearing caches');
    clearAllCache();
    runAllCleanups();
  });
  
  AppState.addEventListener('background', () => {
    console.log('App going to background, running cleanup');
    clearExpiredCache();
  });
}