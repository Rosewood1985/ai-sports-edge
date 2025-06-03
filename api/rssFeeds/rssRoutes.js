import express from 'express';
import fs from 'fs';
import path from 'path';

import {
  fetchAllSportsFeeds,
  fetchSportFeed,
  formatNewsItems,
  fetchNewsTickerItems,
} from './fetchRssFeeds.js';
import { trackRssFeedView } from '../../utils/analyticsService.js';
import { handleError } from '../../utils/errorHandlingUtils.js';
import { getUserPreferences } from '../../utils/userPreferencesService.js';

const router = express.Router();
const CACHE_PATH = path.join(process.cwd(), 'data', 'rss', 'rssCache.json');

// Ensure cache directory exists
try {
  fs.mkdirSync(path.join(process.cwd(), 'data', 'rss'), { recursive: true });
} catch (err) {
  if (err.code !== 'EEXIST') {
    console.error('Error creating cache directory:', err);
  }
}

// Initialize cache if it doesn't exist
if (!fs.existsSync(CACHE_PATH)) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify({}));
}

/**
 * Get all sports feeds
 */
router.get('/feeds', async (req, res) => {
  try {
    // Get user preferences
    const preferences = getUserPreferences();
    const cacheTimeout = preferences.rssFeeds.refreshIntervalMinutes * 60 * 1000;

    // Check if cache exists and is recent
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      const cacheAge = Date.now() - stats.mtimeMs;

      // If cache is fresh based on user preferences, use it
      if (cacheAge < cacheTimeout) {
        const rssCache = JSON.parse(fs.readFileSync(CACHE_PATH));

        // Track cache hit
        trackRssFeedView('all_cached', Object.keys(rssCache).length);

        return res.status(200).json(rssCache);
      }
    }

    // Cache is too old or doesn't exist, fetch fresh data
    const startTime = Date.now();
    const feeds = await fetchAllSportsFeeds();
    const fetchTime = Date.now() - startTime;

    // Save to cache
    fs.writeFileSync(CACHE_PATH, JSON.stringify(feeds, null, 2));

    // Track performance and view
    console.log(`Fetched all feeds in ${fetchTime}ms`);
    trackRssFeedView('all_fresh', Object.keys(feeds).length);

    res.status(200).json(feeds);
  } catch (error) {
    // Handle error with our utility
    const errorInfo = handleError(error, { source: 'all_feeds' });
    console.error('Error fetching all feeds:', errorInfo.message);

    res.status(500).json({
      error: 'Failed to fetch RSS feeds',
      message: errorInfo.message,
      retry: errorInfo.retry,
    });
  }
});

/**
 * Get feed for a specific sport
 */
router.get('/feeds/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const sportUpper = sport.toUpperCase();

    // Get user preferences
    const preferences = getUserPreferences();
    const cacheTimeout = preferences.rssFeeds.refreshIntervalMinutes * 60 * 1000;

    // Check if this sport is enabled in user preferences
    if (!preferences.rssFeeds.enabledSources.includes(sportUpper)) {
      return res.status(404).json({
        error: 'Sport feed disabled',
        message: 'This sport feed is disabled in user preferences',
      });
    }

    // Check if cache exists and is recent
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      const cacheAge = Date.now() - stats.mtimeMs;

      // If cache is fresh based on user preferences, use it
      if (cacheAge < cacheTimeout) {
        const rssCache = JSON.parse(fs.readFileSync(CACHE_PATH));

        if (rssCache[sportUpper]) {
          // Track cache hit
          trackRssFeedView(`${sportUpper}_cached`, rssCache[sportUpper].length);
          return res.status(200).json(rssCache[sportUpper]);
        }
      }
    }

    // Cache is too old, doesn't exist, or doesn't have this sport
    const startTime = Date.now();
    const feedItems = await fetchSportFeed(sportUpper);
    const fetchTime = Date.now() - startTime;

    if (feedItems.length === 0) {
      return res.status(404).json({
        error: 'Sport not found',
        message: 'Sport not found or no data available.',
      });
    }

    // Update cache with this sport's data
    try {
      let rssCache = {};
      if (fs.existsSync(CACHE_PATH)) {
        rssCache = JSON.parse(fs.readFileSync(CACHE_PATH));
      }
      rssCache[sportUpper] = feedItems;
      fs.writeFileSync(CACHE_PATH, JSON.stringify(rssCache, null, 2));
    } catch (cacheError) {
      console.error('Error updating cache:', cacheError);
      // Continue even if cache update fails
    }

    // Track performance and view
    console.log(`Fetched ${sportUpper} feed in ${fetchTime}ms`);
    trackRssFeedView(`${sportUpper}_fresh`, feedItems.length);

    res.status(200).json(feedItems);
  } catch (error) {
    // Handle error with our utility
    const errorInfo = handleError(error, { source: req.params.sport });
    console.error(`Error fetching feed for sport ${req.params.sport}:`, errorInfo.message);

    res.status(500).json({
      error: 'Failed to fetch RSS feed',
      message: errorInfo.message,
      retry: errorInfo.retry,
    });
  }
});

/**
 * Get formatted news items for the ticker
 */
router.get('/news-ticker', async (req, res) => {
  try {
    const { limit } = req.query;
    const maxItems = limit ? parseInt(limit) : 20;

    // Get user preferences
    const preferences = getUserPreferences();
    const cacheTimeout = preferences.rssFeeds.refreshIntervalMinutes * 60 * 1000;

    // Check if cache exists and is recent
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      const cacheAge = Date.now() - stats.mtimeMs;

      // If cache is fresh based on user preferences, use it
      if (cacheAge < cacheTimeout) {
        const rssCache = JSON.parse(fs.readFileSync(CACHE_PATH));

        // Use our enhanced function that applies user preferences and filters
        const startTime = Date.now();

        // Combine all feeds
        const allItems = [];
        Object.entries(rssCache).forEach(([sport, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            // Add sport to categories if not present
            const itemsWithSport = items.map(item => ({
              ...item,
              categories: item.categories || [sport],
            }));
            allItems.push(...itemsWithSport);
          }
        });

        // Format and filter based on user preferences
        const newsItems = formatNewsItems(allItems, maxItems);
        const processTime = Date.now() - startTime;

        // Track cache hit and performance
        console.log(`Processed news ticker items from cache in ${processTime}ms`);
        trackRssFeedView('news_ticker_cached', newsItems.length);

        return res.status(200).json(newsItems);
      }
    }

    // Cache is too old or doesn't exist, use our dedicated function
    const startTime = Date.now();
    const newsItems = await fetchNewsTickerItems(maxItems);
    const fetchTime = Date.now() - startTime;

    // Track performance and view
    console.log(`Fetched news ticker items in ${fetchTime}ms`);
    trackRssFeedView('news_ticker_fresh', newsItems.length);

    res.status(200).json(newsItems);
  } catch (error) {
    // Handle error with our utility
    const errorInfo = handleError(error, { source: 'news_ticker' });
    console.error('Error fetching news ticker items:', errorInfo.message);

    res.status(500).json({
      error: 'Failed to fetch news ticker items',
      message: errorInfo.message,
      retry: errorInfo.retry,
    });
  }
});

/**
 * Get user preferences for RSS feeds
 */
router.get('/preferences', (req, res) => {
  try {
    const preferences = getUserPreferences();
    res.status(200).json(preferences.rssFeeds);
  } catch (error) {
    const errorInfo = handleError(error, { source: 'preferences' });
    console.error('Error fetching preferences:', errorInfo.message);
    res.status(500).json({
      error: 'Failed to fetch preferences',
      message: errorInfo.message,
    });
  }
});

/**
 * Update user preferences for RSS feeds
 */
router.post('/preferences', (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: 'Missing preferences',
        message: 'Preferences object is required',
      });
    }

    // Get current preferences
    const currentPrefs = getUserPreferences();

    // Update only the RSS feeds section
    const updatedPrefs = {
      ...currentPrefs,
      rssFeeds: {
        ...currentPrefs.rssFeeds,
        ...preferences,
      },
    };

    // Save preferences
    const { saveUserPreferences } = require('../../utils/userPreferencesService.js');
    const success = saveUserPreferences(updatedPrefs);

    if (success) {
      // Track preference update
      trackRssFeedView('preferences_updated', Object.keys(preferences).length);
      res.status(200).json({ success: true, preferences: updatedPrefs.rssFeeds });
    } else {
      res.status(500).json({
        error: 'Failed to save preferences',
        message: 'An error occurred while saving preferences',
      });
    }
  } catch (error) {
    const errorInfo = handleError(error, { source: 'update_preferences' });
    console.error('Error updating preferences:', errorInfo.message);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: errorInfo.message,
    });
  }
});

export default router;
