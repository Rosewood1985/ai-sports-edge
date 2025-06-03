/**
 * RSS Analytics Service for AI Sports Edge
 * Tracks user engagement with RSS feeds and sports analytics content
 */

import { trackEvent, trackUserAction } from '../utils/analyticsService';

// Constants for analytics event types
export const RSS_ANALYTICS_EVENTS = {
  FEED_VIEWED: 'rss_feed_viewed',
  ITEM_CLICKED: 'rss_item_clicked',
  ITEM_SHARED: 'rss_item_shared',
  ITEM_BOOKMARKED: 'rss_item_bookmarked',
  ANALYTICS_BUTTON_CLICKED: 'rss_analytics_button_clicked',
  FILTER_APPLIED: 'rss_filter_applied',
  PREFERENCES_UPDATED: 'rss_preferences_updated',
  FEED_IMPRESSION: 'rss_feed_impression',
  FEED_SCROLL: 'rss_feed_scroll',
  FEED_HOVER: 'rss_feed_hover',
  PREFERENCES_OPENED: 'rss_preferences_opened',
  PREFERENCES_CLOSED: 'rss_preferences_closed',
  SOURCE_TOGGLED: 'rss_source_toggled',
  ANALYTICS_PREFERENCE_CHANGED: 'rss_analytics_preference_changed',
};

/**
 * Track when a feed is viewed
 * @param {string} source - Feed source (e.g., 'NBA', 'NFL')
 * @param {number} itemCount - Number of items in the feed
 * @param {Object} [metadata] - Additional metadata
 */
export function trackFeedViewed(source, itemCount, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.FEED_VIEWED, {
    source,
    item_count: itemCount,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when a news item is clicked
 * @param {Object} item - News item that was clicked
 * @param {string} source - Feed source
 * @param {string} position - Position in the feed (e.g., '1', '2')
 * @param {Object} [metadata] - Additional metadata
 */
export function trackItemClicked(item, source, position, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.ITEM_CLICKED, {
    item_id: item.id,
    item_title: item.teams || item.title,
    source,
    position,
    has_analytics: !!item.hasAnalytics,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when a news item is shared
 * @param {Object} item - News item that was shared
 * @param {string} platform - Platform where it was shared (e.g., 'twitter', 'facebook')
 * @param {Object} [metadata] - Additional metadata
 */
export function trackItemShared(item, platform, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.ITEM_SHARED, {
    item_id: item.id,
    item_title: item.teams || item.title,
    platform,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when a news item is bookmarked
 * @param {Object} item - News item that was bookmarked
 * @param {Object} [metadata] - Additional metadata
 */
export function trackItemBookmarked(item, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.ITEM_BOOKMARKED, {
    item_id: item.id,
    item_title: item.teams || item.title,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when an analytics button is clicked
 * @param {Object} item - News item associated with the analytics button
 * @param {string} analysisType - Type of analysis (e.g., 'player_stats', 'team_comparison')
 * @param {Object} [metadata] - Additional metadata
 */
export function trackAnalyticsButtonClicked(item, analysisType, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.ANALYTICS_BUTTON_CLICKED, {
    item_id: item.id,
    item_title: item.teams || item.title,
    analysis_type: analysisType,
    stats: item.stats ? JSON.stringify(item.stats) : null,
    sport: item.sport,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when a filter is applied
 * @param {string} filterType - Type of filter (e.g., 'keyword', 'source', 'favorite')
 * @param {string} filterValue - Value of the filter
 * @param {boolean} isAdded - Whether the filter was added or removed
 * @param {Object} [metadata] - Additional metadata
 */
export function trackFilterApplied(filterType, filterValue, isAdded, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.FILTER_APPLIED, {
    filter_type: filterType,
    filter_value: filterValue,
    action: isAdded ? 'added' : 'removed',
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when preferences are updated
 * @param {string} preferenceType - Type of preference (e.g., 'sources', 'keywords')
 * @param {Object} newValue - New value of the preference
 * @param {Object} [metadata] - Additional metadata
 */
export function trackPreferencesUpdated(preferenceType, newValue, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.PREFERENCES_UPDATED, {
    preference_type: preferenceType,
    new_value: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track feed impressions (when feeds are shown to the user)
 * @param {Array} sources - Array of feed sources shown
 * @param {number} totalItems - Total number of items shown
 * @param {Object} [metadata] - Additional metadata
 */
export function trackFeedImpression(sources, totalItems, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.FEED_IMPRESSION, {
    sources: sources.join(','),
    total_items: totalItems,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track feed scroll events
 * @param {number} scrollDepth - Scroll depth percentage (0-100)
 * @param {number} timeSpent - Time spent in seconds
 * @param {Object} [metadata] - Additional metadata
 */
export function trackFeedScroll(scrollDepth, timeSpent, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.FEED_SCROLL, {
    scroll_depth: scrollDepth,
    time_spent: timeSpent,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track feed hover events (when user hovers over items)
 * @param {Object} item - News item that was hovered
 * @param {number} hoverDuration - Hover duration in milliseconds
 * @param {Object} [metadata] - Additional metadata
 */
export function trackFeedHover(item, hoverDuration, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.FEED_HOVER, {
    item_id: item.id,
    item_title: item.teams || item.title,
    hover_duration: hoverDuration,
    has_analytics: !!item.hasAnalytics,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when RSS preferences modal is opened
 * @param {Object} [metadata] - Additional metadata
 */
export function trackPreferencesOpened(metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.PREFERENCES_OPENED, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when RSS preferences modal is closed
 * @param {number} timeSpent - Time spent in seconds
 * @param {Object} [metadata] - Additional metadata
 */
export function trackPreferencesClosed(timeSpent, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.PREFERENCES_CLOSED, {
    time_spent: timeSpent,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when a source is toggled in preferences
 * @param {string} source - Source that was toggled
 * @param {boolean} enabled - Whether the source was enabled or disabled
 * @param {Object} [metadata] - Additional metadata
 */
export function trackSourceToggled(source, enabled, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.SOURCE_TOGGLED, {
    source,
    action: enabled ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Track when an analytics preference is changed
 * @param {string} preference - Preference that was changed
 * @param {any} value - New value
 * @param {Object} [metadata] - Additional metadata
 */
export function trackAnalyticsPreferenceChanged(preference, value, metadata = {}) {
  trackEvent(RSS_ANALYTICS_EVENTS.ANALYTICS_PREFERENCE_CHANGED, {
    preference,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Get analytics data for a specific feed source
 * @param {string} source - Feed source (e.g., 'NBA', 'NFL')
 * @param {string} timeframe - Timeframe (e.g., 'day', 'week', 'month')
 * @returns {Promise<Object>} Analytics data
 */
export async function getFeedAnalytics(source, timeframe = 'week') {
  try {
    const response = await fetch(`/api/analytics/rss/${source}?timeframe=${timeframe}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching analytics for ${source}:`, error);
    return null;
  }
}

/**
 * Get popular news items based on analytics
 * @param {string} [timeframe] - Timeframe (e.g., 'day', 'week', 'month')
 * @param {number} [limit] - Maximum number of items to return
 * @returns {Promise<Array>} Popular news items
 */
export async function getPopularNewsItems(timeframe = 'day', limit = 10) {
  try {
    const response = await fetch(
      `/api/analytics/rss/popular?timeframe=${timeframe}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch popular items: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching popular news items:', error);
    return [];
  }
}

/**
 * Get user engagement metrics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User engagement metrics
 */
export async function getUserEngagementMetrics(userId) {
  try {
    const response = await fetch(`/api/analytics/rss/user/${userId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user metrics: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching user metrics for ${userId}:`, error);
    return null;
  }
}

/**
 * Get trending topics based on analytics
 * @param {string} [timeframe] - Timeframe (e.g., 'day', 'week', 'month')
 * @param {number} [limit] - Maximum number of topics to return
 * @returns {Promise<Array>} Trending topics
 */
export async function getTrendingTopics(timeframe = 'day', limit = 10) {
  try {
    const response = await fetch(
      `/api/analytics/rss/trending?timeframe=${timeframe}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending topics: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
}

/**
 * Get conversion metrics for analytics content
 * @param {string} [timeframe] - Timeframe (e.g., 'day', 'week', 'month')
 * @returns {Promise<Object>} Conversion metrics
 */
export async function getAnalyticsConversionMetrics(timeframe = 'week') {
  try {
    const response = await fetch(`/api/analytics/rss/analytics?timeframe=${timeframe}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch analytics metrics: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics conversion metrics:', error);
    return null;
  }
}
