import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

/**
 * Custom error class for subscription-related errors
 */
export class SubscriptionError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'unknown') {
    super(message);
    this.name = 'SubscriptionError';
    this.code = code;
  }
}

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Handle Firebase errors and convert them to application-specific errors
 * @param error - The error to handle
 * @returns A standardized error object
 */
export function handleFirebaseError(error: unknown): SubscriptionError {
  if (error instanceof FirestoreError) {
    return new SubscriptionError(
      `Firestore error: ${error.message}`,
      error.code
    );
  }
  
  if (error instanceof FirebaseError) {
    return new SubscriptionError(
      `Firebase error: ${error.message}`,
      error.code
    );
  }
  
  if (error instanceof Error) {
    return new SubscriptionError(error.message);
  }
  
  return new SubscriptionError('An unknown error occurred');
}

/**
 * Retry a function with exponential backoff
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns The result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 300
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, don't wait
      if (attempt === maxRetries - 1) break;
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Handle API errors and return a standardized error response
 * @param message - Error message prefix
 * @param error - The error that occurred
 * @returns An empty array or throws an ApiError
 */
export function handleApiError<T>(message: string, error: unknown): T[] {
  console.error(`${message}:`, error);
  
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new ApiError(`${message}: ${error.message}`);
  }
  
  throw new ApiError(`${message}: ${String(error)}`);
}