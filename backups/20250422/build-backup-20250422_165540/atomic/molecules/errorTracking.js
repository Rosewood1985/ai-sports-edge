/**
 * Error Tracking Molecule
 *
 * Provides error tracking functionality using Sentry.
 * Combines error utility atoms with Sentry integration.
 */

import * as Sentry from '@sentry/browser';
import { CaptureContext } from '@sentry/types';

import { isDevelopment } from '../atoms/envConfig';
import { safeErrorCapture, formatError, parseError } from '../atoms/errorUtils';
import { sentryConfig } from '../atoms/serviceConfig';

// Get the current user (placeholder function)
const getCurrentUser = () => {
  // In a real implementation, this would get the current user from the auth service
  return { id: 'anonymous', email: 'anonymous@example.com' };
};

/**
 * Initialize error tracking service
 * @param {Object} [options] - Initialization options
 * @param {string} [options.dsn] - Sentry DSN
 * @param {string} [options.environment] - Environment
 * @param {string} [options.release] - Release version
 * @param {number} [options.tracesSampleRate] - Traces sample rate
 * @param {boolean} [options.debug] - Whether to enable debug mode
 * @returns {boolean} Whether initialization was successful
 */
export const initErrorTracking = (options = {}) => {
  console.log('initErrorTracking: Starting initialization');

  // Wrap the entire function in a try/catch to catch any unexpected errors
  try {
    // Check if Sentry is defined
    console.log('initErrorTracking: Checking if Sentry is defined');
    if (typeof Sentry === 'undefined') {
      console.error('initErrorTracking: Sentry is undefined');
      return false;
    }

    // Get configuration
    const config = {
      dsn: options.dsn || sentryConfig.dsn,
      environment: options.environment || sentryConfig.environment,
      release: options.release || sentryConfig.release,
      tracesSampleRate: options.tracesSampleRate || sentryConfig.tracesSampleRate,
      debug: options.debug || false,
    };

    console.log(
      `initErrorTracking: Using DSN: ${config.dsn.substring(0, 15)}... and environment: ${config.environment}`
    );

    // Initialize Sentry with detailed error handling
    console.log('initErrorTracking: About to call Sentry.init');
    try {
      const initOptions = {
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        maxBreadcrumbs: 50,
        debug: config.debug,
        beforeSend: event => {
          try {
            console.log('initErrorTracking: beforeSend called for event');
            if (isDevelopment) {
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
        tracesSampleRate: config.tracesSampleRate,
      };

      console.log('initErrorTracking: Calling Sentry.init with options');
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

  try {
    // Parse error if it's not an Error instance
    const parsedError = parseError(error);

    // Capture in Sentry
    Sentry.captureException(parsedError, context);
  } catch (sentryError) {
    console.error('Sentry captureException failed:', sentryError);
  }
};

/**
 * Capture a message
 * @param {string} message - Message to capture
 * @param {Object} [options] - Capture options
 * @param {string} [options.level] - Message level
 */
export const captureMessage = (message, options = {}) => {
  if (isDevelopment) {
    console.log(`Message captured (${options.level || 'info'})`, message);
  }

  try {
    Sentry.captureMessage(message, options.level);
  } catch (sentryError) {
    console.error('Sentry captureMessage failed:', sentryError);
  }
};

/**
 * Add breadcrumb
 * @param {import('../atoms/errorUtils').BreadcrumbData} breadcrumb - Breadcrumb to add
 */
export const addBreadcrumb = breadcrumb => {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (sentryError) {
    console.error('Sentry addBreadcrumb failed:', sentryError);
  }
};

/**
 * Set user information
 * @param {Object|null} user - User information
 * @param {string} [user.id] - User ID
 * @param {string} [user.email] - User email
 * @param {string} [user.username] - User username
 */
export const setUser = user => {
  try {
    Sentry.setUser(user);
  } catch (sentryError) {
    console.error('Sentry setUser failed:', sentryError);
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
    console.error('Sentry setTag failed:', sentryError);
  }
};

/**
 * Set tags
 * @param {Object} tags - Tags to set
 */
export const setTags = tags => {
  try {
    Sentry.setTags(tags);
  } catch (sentryError) {
    console.error('Sentry setTags failed:', sentryError);
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
    console.error('Sentry setExtra failed:', sentryError);
  }
};

/**
 * Set extras
 * @param {Object} extras - Extras to set
 */
export const setExtras = extras => {
  try {
    Sentry.setExtras(extras);
  } catch (sentryError) {
    console.error('Sentry setExtras failed:', sentryError);
  }
};

/**
 * Start a transaction
 * @param {string} name - Transaction name
 * @param {string} op - Transaction operation
 * @returns {Object} Transaction
 */
export const startTransaction = (name, op) => {
  try {
    return Sentry.startTransaction({ name, op });
  } catch (sentryError) {
    console.error('Sentry startTransaction failed:', sentryError);
    return {
      finish: () => {},
      setTag: () => {},
      setData: () => {},
    };
  }
};

/**
 * Flush events
 * @param {number} [timeout] - Timeout in ms
 * @returns {Promise} Promise that resolves when events are flushed
 */
export const flush = timeout => {
  return Sentry.close(timeout); // Sentry.close handles flushing
};

/**
 * Close Sentry
 * @returns {Promise} Promise that resolves when Sentry is closed
 */
export const close = () => {
  return Sentry.close();
};
