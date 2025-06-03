/**
 * User Preferences Service for AI Sports Edge
 * This module provides functions for managing user preferences
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../config/firebase';

// Default user preferences
export const DEFAULT_PREFERENCES = {
  sports: {
    football: true,
    basketball: true,
    baseball: true,
    hockey: true,
    soccer: false,
    mma: false,
    formula1: false,
  },
  betting: {
    oddsFormat: 'american', // 'american', 'decimal', 'fractional'
    stakingMethod: 'flat', // 'flat', 'kelly', 'percentage'
    defaultStake: 100,
    showParlays: true,
    showProps: true,
  },
  notifications: {
    // Notification types
    predictions: true,
    valueBets: true,
    gameReminders: true,
    modelPerformance: true,
    news: true,

    // Frequency controls
    frequency: 'normal', // 'low', 'normal', 'high'
    quietHours: {
      enabled: false,
      start: '22:00', // 10 PM
      end: '08:00', // 8 AM
    },
    maxPerDay: 10,
    priorityOnly: false, // Only send high-priority notifications

    // Content preferences
    includeOdds: true,
    includeStats: true,
    includeNews: true,

    // Channel preferences
    channels: {
      push: true,
      email: true,
      inApp: true,
    },

    // RSS feed specific notifications
    rssAlerts: {
      enabled: true,
      favoriteTeamsOnly: false,
      favoritePlayersOnly: false,
      keywordAlerts: [],
    },

    // Location-based notifications
    locationBased: {
      enabled: true,
      localTeams: true,
      localGames: true,
      localOdds: true,
      radius: 50, // in kilometers
    },
  },
  display: {
    theme: 'auto', // 'light', 'dark', 'auto'
    compactView: false,
    showTrends: true,
    showStats: true,
    defaultTab: 'odds', // 'odds', 'news', 'predictions', 'profile'
  },
  favorites: {
    teams: [],
    players: [],
    leagues: [],
  },
};

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
export const getUserPreferences = async userId => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      // User doesn't exist, create with default preferences
      return DEFAULT_PREFERENCES;
    }

    const userData = userDoc.data();

    // If user exists but doesn't have preferences, use defaults
    if (!userData.preferences) {
      return DEFAULT_PREFERENCES;
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_PREFERENCES,
      ...userData.preferences,
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - New preferences
 * @returns {Promise<void>}
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      // User doesn't exist, create with provided preferences
      await setDoc(doc(db, 'users', userId), {
        preferences,
        createdAt: new Date(),
      });
    } else {
      // User exists, update preferences
      await updateDoc(doc(db, 'users', userId), {
        preferences,
      });
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Update a specific preference
 * @param {string} userId - User ID
 * @param {string} path - Preference path (e.g., 'notifications.predictions')
 * @param {any} value - New value
 * @returns {Promise<void>}
 */
export const updatePreference = async (userId, path, value) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      // User doesn't exist, create with default preferences and update the specific path
      const preferences = { ...DEFAULT_PREFERENCES };
      setNestedValue(preferences, path, value);

      await setDoc(doc(db, 'users', userId), {
        preferences,
        createdAt: new Date(),
      });
    } else {
      // User exists, update the specific preference
      const updateData = {};
      updateData[`preferences.${path}`] = value;

      await updateDoc(doc(db, 'users', userId), updateData);
    }
  } catch (error) {
    console.error('Error updating preference:', error);
    throw error;
  }
};

/**
 * Set a nested value in an object
 * @param {Object} obj - Object to modify
 * @param {string} path - Path to the value (e.g., 'notifications.predictions')
 * @param {any} value - New value
 */
const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
};

export default {
  DEFAULT_PREFERENCES,
  getUserPreferences,
  updateUserPreferences,
  updatePreference,
};
