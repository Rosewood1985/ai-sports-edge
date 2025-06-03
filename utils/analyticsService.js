/**
 * Analytics Service for AI Sports Edge
 * Tracks user interactions with RSS feeds and other app features
 */

// Analytics event types
export const ANALYTICS_EVENTS = {
  RSS_FEED: {
    VIEW: 'rss_feed_view',
    CLICK: 'rss_feed_click',
    LOAD: 'rss_feed_load',
    ERROR: 'rss_feed_error',
  },
  USER_PREFERENCE: {
    SET: 'user_preference_set',
    CLEAR: 'user_preference_clear',
  },
};

// Analytics categories
export const ANALYTICS_CATEGORIES = {
  NEWS: 'news',
  SPORTS: 'sports',
  USER: 'user',
  ERROR: 'error',
};

/**
 * Track an analytics event
 * @param {string} eventName - Name of the event
 * @param {string} category - Category of the event
 * @param {Object} properties - Additional properties to track
 */
export function trackEvent(eventName, category, properties = {}) {
  // In a production app, this would send data to an analytics service
  // like Google Analytics, Firebase Analytics, or a custom backend

  // For now, we'll just log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] ${eventName} (${category})`, properties);
  }

  // Example implementation for sending to a backend
  try {
    // Add timestamp
    const eventData = {
      event: eventName,
      category,
      timestamp: new Date().toISOString(),
      ...properties,
    };

    // In production, uncomment this to send to your analytics endpoint
    /*
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    */

    return true;
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return false;
  }
}

/**
 * Track RSS feed view
 * @param {string} feedSource - Source of the feed (e.g., 'NBA', 'NFL')
 * @param {number} itemCount - Number of items loaded
 */
export function trackRssFeedView(feedSource, itemCount) {
  return trackEvent(ANALYTICS_EVENTS.RSS_FEED.VIEW, ANALYTICS_CATEGORIES.NEWS, {
    feedSource,
    itemCount,
  });
}

/**
 * Track RSS feed item click
 * @param {string} feedSource - Source of the feed
 * @param {string} itemTitle - Title of the clicked item
 * @param {string} itemUrl - URL of the clicked item
 */
export function trackRssFeedClick(feedSource, itemTitle, itemUrl) {
  return trackEvent(ANALYTICS_EVENTS.RSS_FEED.CLICK, ANALYTICS_CATEGORIES.NEWS, {
    feedSource,
    itemTitle,
    itemUrl,
  });
}

/**
 * Track RSS feed load time
 * @param {string} feedSource - Source of the feed
 * @param {number} loadTimeMs - Load time in milliseconds
 * @param {boolean} success - Whether the load was successful
 */
export function trackRssFeedLoad(feedSource, loadTimeMs, success) {
  return trackEvent(ANALYTICS_EVENTS.RSS_FEED.LOAD, ANALYTICS_CATEGORIES.NEWS, {
    feedSource,
    loadTimeMs,
    success,
  });
}

/**
 * Track RSS feed error
 * @param {string} feedSource - Source of the feed
 * @param {string} errorMessage - Error message
 * @param {string} errorCode - Error code
 */
export function trackRssFeedError(feedSource, errorMessage, errorCode) {
  return trackEvent(ANALYTICS_EVENTS.RSS_FEED.ERROR, ANALYTICS_CATEGORIES.ERROR, {
    feedSource,
    errorMessage,
    errorCode,
  });
}

/**
 * Track user preference setting
 * @param {string} preferenceType - Type of preference
 * @param {any} preferenceValue - Value of the preference
 */
export function trackUserPreference(preferenceType, preferenceValue) {
  return trackEvent(ANALYTICS_EVENTS.USER_PREFERENCE.SET, ANALYTICS_CATEGORIES.USER, {
    preferenceType,
    preferenceValue,
  });
}
