/**
 * User Preferences Service
 * Manages user preferences for the application
 */

// Default preferences
const DEFAULT_PREFERENCES = {
  rssFeeds: {
    enabledSources: ['nba', 'nfl', 'mlb', 'analytics'],
    refreshIntervalMinutes: 15,
    keywordFilters: {
      include: [],
      exclude: []
    }
  },
  analytics: {
    showAnalytics: true,
    statsFormat: 'standard',
    enabledProviders: ['advanced_stats', 'team_analysis', 'historical_data'],
    detailLevel: 'medium'
  },
  ui: {
    newsTicker: {
      scrollSpeed: 'medium',
      pauseOnHover: true
    },
    theme: 'light'
  }
};

// Storage key for preferences
const PREFERENCES_STORAGE_KEY = 'ai_sports_edge_user_preferences';

/**
 * Get user preferences from local storage or return defaults
 * @returns {Object} User preferences
 */
export function getUserPreferences() {
  try {
    // Try to get preferences from local storage
    const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    
    if (storedPreferences) {
      // Parse stored preferences
      const parsedPreferences = JSON.parse(storedPreferences);
      
      // Merge with defaults to ensure all properties exist
      return mergeWithDefaults(parsedPreferences);
    }
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
  }
  
  // Return default preferences if none found or error occurred
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Update user preferences in local storage
 * @param {Object} preferences - New preferences to save
 * @returns {boolean} Success status
 */
export function updateUserPreferences(preferences) {
  try {
    // Merge with defaults to ensure all properties exist
    const mergedPreferences = mergeWithDefaults(preferences);
    
    // Save to local storage
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(mergedPreferences));
    
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

/**
 * Update a specific preference value
 * @param {string} path - Dot-notation path to the preference (e.g., 'rssFeeds.enabledSources')
 * @param {any} value - New value for the preference
 * @returns {boolean} Success status
 */
export function updatePreference(path, value) {
  try {
    // Get current preferences
    const preferences = getUserPreferences();
    
    // Update the specific preference
    const parts = path.split('.');
    let current = preferences;
    
    // Navigate to the nested property
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value
    current[parts[parts.length - 1]] = value;
    
    // Save updated preferences
    return updateUserPreferences(preferences);
  } catch (error) {
    console.error(`Error updating preference ${path}:`, error);
    return false;
  }
}

/**
 * Reset user preferences to defaults
 * @returns {boolean} Success status
 */
export function resetUserPreferences() {
  try {
    // Save default preferences
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    
    return true;
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return false;
  }
}

/**
 * Add a keyword filter
 * @param {string} keyword - Keyword to add
 * @param {string} type - Filter type ('include' or 'exclude')
 * @returns {boolean} Success status
 */
export function addKeywordFilter(keyword, type = 'include') {
  try {
    // Get current preferences
    const preferences = getUserPreferences();
    
    // Ensure the filter type is valid
    if (type !== 'include' && type !== 'exclude') {
      throw new Error(`Invalid filter type: ${type}`);
    }
    
    // Add the keyword if it doesn't already exist
    const filters = preferences.rssFeeds.keywordFilters[type];
    if (!filters.includes(keyword)) {
      filters.push(keyword);
      
      // Save updated preferences
      return updateUserPreferences(preferences);
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding keyword filter ${keyword}:`, error);
    return false;
  }
}

/**
 * Remove a keyword filter
 * @param {string} keyword - Keyword to remove
 * @param {string} type - Filter type ('include' or 'exclude')
 * @returns {boolean} Success status
 */
export function removeKeywordFilter(keyword, type = 'include') {
  try {
    // Get current preferences
    const preferences = getUserPreferences();
    
    // Ensure the filter type is valid
    if (type !== 'include' && type !== 'exclude') {
      throw new Error(`Invalid filter type: ${type}`);
    }
    
    // Remove the keyword if it exists
    const filters = preferences.rssFeeds.keywordFilters[type];
    const index = filters.indexOf(keyword);
    
    if (index !== -1) {
      filters.splice(index, 1);
      
      // Save updated preferences
      return updateUserPreferences(preferences);
    }
    
    return true;
  } catch (error) {
    console.error(`Error removing keyword filter ${keyword}:`, error);
    return false;
  }
}

/**
 * Set enabled sports sources
 * @param {Array<string>} sources - Array of source IDs to enable
 * @returns {boolean} Success status
 */
export function setEnabledSportsSources(sources) {
  return updatePreference('rssFeeds.enabledSources', sources);
}

/**
 * Update news ticker settings
 * @param {Object} settings - News ticker settings
 * @returns {boolean} Success status
 */
export function updateNewsTickerSettings(settings) {
  try {
    // Get current preferences
    const preferences = getUserPreferences();
    
    // Update news ticker settings
    preferences.ui.newsTicker = {
      ...preferences.ui.newsTicker,
      ...settings
    };
    
    // Save updated preferences
    return updateUserPreferences(preferences);
  } catch (error) {
    console.error('Error updating news ticker settings:', error);
    return false;
  }
}

/**
 * Update analytics settings
 * @param {Object} settings - Analytics settings
 * @returns {boolean} Success status
 */
export function updateAnalyticsSettings(settings) {
  try {
    // Get current preferences
    const preferences = getUserPreferences();
    
    // Update analytics settings
    preferences.analytics = {
      ...preferences.analytics,
      ...settings
    };
    
    // Save updated preferences
    return updateUserPreferences(preferences);
  } catch (error) {
    console.error('Error updating analytics settings:', error);
    return false;
  }
}

/**
 * Merge user preferences with defaults to ensure all properties exist
 * @param {Object} preferences - User preferences
 * @returns {Object} Merged preferences
 * @private
 */
function mergeWithDefaults(preferences) {
  // Deep merge function for objects
  const deepMerge = (target, source) => {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  };
  
  // Helper to check if value is an object
  const isObject = (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
  };
  
  // Merge preferences with defaults
  return deepMerge(DEFAULT_PREFERENCES, preferences);
}