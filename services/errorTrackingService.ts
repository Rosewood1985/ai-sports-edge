import * as Sentry from '@sentry/browser';
import { CaptureContext } from '@sentry/types';
import { BreadcrumbData } from './errorUtils';
import { firebaseService } from '../src/atomic/organisms/firebaseService';

/**
 * Error Tracking Service
 *
 * This service provides error tracking functionality using Sentry.
 * It captures errors, exceptions, and custom events to help diagnose issues in production.
 * Migrated to use atomic architecture
 */

// Get the current user from Firebase Auth
const getCurrentUser = () => {
  const currentUser = firebaseService.auth.instance?.currentUser;
  if (currentUser) {
    return {
      id: currentUser.uid,
      email: currentUser.email || 'anonymous@example.com'
    };
  }
  return { id: 'anonymous', email: 'anonymous@example.com' };
};

// Initialize Sentry with the appropriate DSN
export const initErrorTracking = () => {
  console.log('initErrorTracking: Starting initialization');
  
  // Wrap the entire function in a try/catch to catch any unexpected errors
  try {
    // Check if Sentry is defined
    console.log('initErrorTracking: Checking if Sentry is defined');
    if (typeof Sentry === 'undefined') {
      console.error('initErrorTracking: Sentry is undefined');
      return false;
    }
    
    // Log environment variables
    console.log('initErrorTracking: Checking environment variables');
    let dsn, environment;
    
    try {
      dsn = process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0';
      environment = process.env.NODE_ENV || 'development';
      console.log(`initErrorTracking: Using DSN: ${dsn.substring(0, 15)}... and environment: ${environment}`);
    } catch (envError) {
      console.error('initErrorTracking: Error accessing environment variables:', envError);
      dsn = 'https://examplePublicKey@o0.ingest.sentry.io/0';
      environment = 'development';
    }

    // Initialize Sentry with detailed error handling
    console.log('initErrorTracking: About to call Sentry.init');
    try {
      const initOptions = {
        dsn: dsn,
        environment: environment,
        release: 'ai-sports-edge@1.0.0',
        maxBreadcrumbs: 50,
        beforeSend: (event: any) => {
          try {
            console.log('initErrorTracking: beforeSend called for event');
            if (environment === 'development') {
              console.log('initErrorTracking: In development, not sending event to Sentry');
              return null;
            }
            if (event && event.user) {
              console.log('initErrorTracking: Removing IP address from user data');
              delete event.user.ip_address;
            }
            return event;
          } catch (beforeSendError) {
            console.error('initErrorTracking: Error in beforeSend:', beforeSendError);
            return null;
          }
        },
        tracesSampleRate: 0.2,
      };
      
      console.log('initErrorTracking: Calling Sentry.init with options:', JSON.stringify(initOptions, null, 2));
      Sentry.init(initOptions);
      console.log('initErrorTracking: Sentry.init completed successfully');
    } catch (initError) {
      console.error('initErrorTracking: Error during Sentry.init:', initError);
      return false;
    }

    // Set user information if available
    console.log('initErrorTracking: Setting user information');
    try {
      const user = getCurrentUser();
      if (user) {
        console.log(`initErrorTracking: Setting user with ID: ${user.id}`);
        Sentry.setUser({
          id: user.id,
          email: user.email || undefined,
        });
      } else {
        console.log('initErrorTracking: No current user found to set in Sentry');
      }
    } catch (userError) {
      console.error('initErrorTracking: Error setting user information:', userError);
      // Continue even if setting user fails
    }

    console.log('initErrorTracking: Initialization completed successfully');
    return true;
  } catch (error) {
    console.error('initErrorTracking: Unexpected error during initialization:', error);
    // Don't rethrow, return false to indicate failure
    return false;
  }
};


/**
 * Capture an exception
 * @param error Error to capture
 * @param context Additional context
 */
export const captureException = (error: Error, context?: CaptureContext) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error captured:', error, context);
  }
  // Still capture in Sentry regardless of logging service state
  try {
    Sentry.captureException(error, context);
  } catch (sentryError) {
    console.error("Sentry captureException failed:", sentryError);
  }
};

/**
 * Capture a message
 * @param message Message to capture
 */
export const captureMessage = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Message captured (info)`, message);
  }
  try {
    Sentry.captureMessage(message);
  } catch (sentryError) {
    console.error("Sentry captureMessage failed:", sentryError);
  }
};

/**
 * Add breadcrumb
 * @param breadcrumb Breadcrumb to add
 */
export const addBreadcrumb = (breadcrumb: BreadcrumbData) => {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (sentryError) {
    console.error("Sentry addBreadcrumb failed:", sentryError);
  }
};

/**
 * Set user information
 * @param user User information
 */
export const setUser = (user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
} | null) => {
  try {
    Sentry.setUser(user);
  } catch (sentryError) {
    console.error("Sentry setUser failed:", sentryError);
  }
};

/**
 * Set a tag
 * @param key Tag key
 * @param value Tag value
 */
export const setTag = (key: string, value: string) => {
  try {
    Sentry.setTag(key, value);
  } catch (sentryError) {
    console.error("Sentry setTag failed:", sentryError);
  }
};

/**
 * Set tags
 * @param tags Tags to set
 */
export const setTags = (tags: { [key: string]: string }) => {
  try {
    Sentry.setTags(tags);
  } catch (sentryError) {
    console.error("Sentry setTags failed:", sentryError);
  }
};

/**
 * Set extra context
 * @param key Context key
 * @param value Context value
 */
export const setExtra = (key: string, value: any) => {
  try {
    Sentry.setExtra(key, value);
  } catch (sentryError) {
    console.error("Sentry setExtra failed:", sentryError);
  }
};

/**
 * Set extras
 * @param extras Extras to set
 */
export const setExtras = (extras: { [key: string]: any }) => {
  try {
    Sentry.setExtras(extras);
  } catch (sentryError) {
    console.error("Sentry setExtras failed:", sentryError);
  }
};

/**
 * Flush events
 * @param timeout Timeout in ms
 * @returns Promise that resolves when events are flushed
 */
export const flush = (timeout?: number) => {
  return Sentry.close(timeout); // Sentry.close handles flushing
};

/**
 * Close Sentry
 */
export const close = () => {
  return Sentry.close();
};