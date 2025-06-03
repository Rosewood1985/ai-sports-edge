/**
 * Process Wrappers for Monitoring
 *
 * This module provides wrapper functions for the activated background processes
 * to integrate them with the monitoring system. These wrappers will track
 * execution times, success rates, and resource usage.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

const monitor = require('./process-monitor');

// Initialize Firebase Admin if not already initialized
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized
}

/**
 * Wrap a Firebase Cloud Function to add monitoring
 * @param {Function} originalFunction - The original function to wrap
 * @param {string} processName - Name of the process for monitoring
 * @returns {Function} Wrapped function with monitoring
 */
function wrapCloudFunction(originalFunction, processName) {
  return async (data, context) => {
    const executionId = await monitor.logProcessStart(processName, {
      functionType: 'cloudFunction',
      data: JSON.stringify(data),
      context: context ? JSON.stringify(context) : null,
    });

    try {
      const result = await originalFunction(data, context);

      await monitor.logProcessCompletion(executionId, processName, 'success', {
        result: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      await monitor.logProcessCompletion(executionId, processName, 'error', null, error);
      throw error;
    }
  };
}

/**
 * Wrap a scheduled Cloud Function to add monitoring
 * @param {Function} originalFunction - The original function to wrap
 * @param {string} processName - Name of the process for monitoring
 * @returns {Function} Wrapped function with monitoring
 */
function wrapScheduledFunction(originalFunction, processName) {
  return async context => {
    const executionId = await monitor.logProcessStart(processName, {
      functionType: 'scheduledFunction',
      context: context ? JSON.stringify(context) : null,
    });

    try {
      const result = await originalFunction(context);

      await monitor.logProcessCompletion(executionId, processName, 'success', {
        result: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      await monitor.logProcessCompletion(executionId, processName, 'error', null, error);
      throw error;
    }
  };
}

/**
 * Wrap a Firestore trigger function to add monitoring
 * @param {Function} originalFunction - The original function to wrap
 * @param {string} processName - Name of the process for monitoring
 * @returns {Function} Wrapped function with monitoring
 */
function wrapFirestoreFunction(originalFunction, processName) {
  return async (snapshot, context) => {
    const executionId = await monitor.logProcessStart(processName, {
      functionType: 'firestoreFunction',
      documentPath: context.resource.name,
      context: context ? JSON.stringify(context) : null,
    });

    try {
      const result = await originalFunction(snapshot, context);

      await monitor.logProcessCompletion(executionId, processName, 'success', {
        result: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      await monitor.logProcessCompletion(executionId, processName, 'error', null, error);
      throw error;
    }
  };
}

/**
 * Wrap an Auth trigger function to add monitoring
 * @param {Function} originalFunction - The original function to wrap
 * @param {string} processName - Name of the process for monitoring
 * @returns {Function} Wrapped function with monitoring
 */
function wrapAuthFunction(originalFunction, processName) {
  return async (user, context) => {
    const executionId = await monitor.logProcessStart(processName, {
      functionType: 'authFunction',
      userId: user.uid,
      context: context ? JSON.stringify(context) : null,
    });

    try {
      const result = await originalFunction(user, context);

      await monitor.logProcessCompletion(executionId, processName, 'success', {
        result: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      await monitor.logProcessCompletion(executionId, processName, 'error', null, error);
      throw error;
    }
  };
}

// Export the wrapper functions
module.exports = {
  wrapCloudFunction,
  wrapScheduledFunction,
  wrapFirestoreFunction,
  wrapAuthFunction,
};
