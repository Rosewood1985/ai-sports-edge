/**
 * Error Tracking Service
 *
 * Provides error tracking functionality using Sentry.
 * Captures errors, exceptions, and custom events to help diagnose issues in production.
 */

import * as Sentry from '@sentry/browser';
import { CaptureContext } from '@sentry/types';
import { safeErrorCapture, formatError } from './errorUtils';
import { isDevelopment } from '../environment';

// Get the current user (placeholder function)
const getCurrentUser = () => {
  // In a real implementation, this would get the current user from the auth service
  return { id: 'anonymous', email: 'anonymous@example.com' };
};

/**
 * Initialize error tracking service
 * @returns {boolean} Whether initialization was successful
 */
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
        beforeSend: (event) => {
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
 * @param {Error} error - Error to capture
 * @param {CaptureContext} [context] - Additional context
 */
export const captureException = (error, context) => {
  if (isDevelopment) {
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
 * @param {string} message - Message to capture
 */
export const captureMessage = (message) => {
  if (isDevelopment) {
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
 * @param {import('./errorUtils').BreadcrumbData} breadcrumb - Breadcrumb to add
 */
export const addBreadcrumb = (breadcrumb) => {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (sentryError) {
    console.error("Sentry addBreadcrumb failed:", sentryError);
  }
};

/**
 * Set user information
 * @param {Object|null} user - User information
 * @param {string} [user.id] - User ID
 * @param {string} [user.email] - User email
 * @param {string} [user.username] - User username
 */
export const setUser = (user) => {
  try {
    Sentry.setUser(user);
  } catch (sentryError) {
    console.error("Sentry setUser failed:", sentryError);
  }
};

/**
 * Set a tag
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export const setTag = (key, value) => {
  try {
    Sentry.setTag(key, value);
  } catch (sentryError) {
    console.error("Sentry setTag failed:", sentryError);
  }
};

/**
 * Set tags
 * @param {Object} tags - Tags to set
 */
export const setTags = (tags) => {
  try {
    Sentry.setTags(tags);
  } catch (sentryError) {
    console.error("Sentry setTags failed:", sentryError);
  }
};

/**
 * Set extra context
 * @param {string} key - Context key
 * @param {any} value - Context value
 */
export const setExtra = (key, value) => {
  try {
    Sentry.setExtra(key, value);
  } catch (sentryError) {
    console.error("Sentry setExtra failed:", sentryError);
  }
};

/**
 * Set extras
 * @param {Object} extras - Extras to set
 */
export const setExtras = (extras) => {
  try {
    Sentry.setExtras(extras);
  } catch (sentryError) {
    console.error("Sentry setExtras failed:", sentryError);
  }
};

/**
 * Flush events
 * @param {number} [timeout] - Timeout in ms
 * @returns {Promise} Promise that resolves when events are flushed
 */
export const flush = (timeout) => {
  return Sentry.close(timeout); // Sentry.close handles flushing
};

/**
 * Close Sentry
 * @returns {Promise} Promise that resolves when Sentry is closed
 */
export const close = () => {
  return Sentry.close();
};