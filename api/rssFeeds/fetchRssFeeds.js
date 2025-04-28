const axios = require('axios');
const xml2js = require('xml2js');
const { db } = require('../../config/firebase');
const { doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const { filterByRelevance, isBettingContent } = require('./contentFiltering');

// Cache for RSS feeds
const feedCache = {
  items: {},
  timestamp: null
};

/**
 * Fetch and process RSS feeds
 * @param {Array} feedUrls - Array of RSS feed URLs
 * @param {Object} userPreferences - User preferences for filtering
 * @returns {Promise<Array>} Processed feed items
 */
async function fetchAndProcessFeeds(feedUrls, userPreferences = {}) {
  // Check cache first (15 minute cache)
  const now = Date.now();
  if (
    feedCache.timestamp &&
    now - feedCache.timestamp < 15 * 60 * 1000 &&
    Object.keys(feedCache.items).length > 0
  ) {
    console.log('Using cached RSS feeds');
    return filterFeedItems(feedCache.items, userPreferences);
  }
  
  console.log(`Fetching RSS feeds at ${new Date().toISOString()}`);
  
  // Fetch all feeds in parallel
  const feedPromises = feedUrls.map(url => fetchFeed(url));
  const feedResults = await Promise.allSettled(feedPromises);
  
  // Process successful feeds
  const allItems = [];
  const newCache = {};
  
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const url = feedUrls[index];
      const items = result.value;
      
      // Add to cache
      newCache[url] = items;
      
      // Add to all items
      allItems.push(...items);
    }
  });
  
  // Update cache
  feedCache.items = newCache;
  feedCache.timestamp = now;
  
  // Filter and return items
  return filterFeedItems(allItems, userPreferences);
}

/**
 * Fetch a single RSS feed
 * @param {string} url - RSS feed URL
 * @returns {Promise<Array>} Feed items
 */
async function fetchFeed(url) {
  try {
    const response = await axios.get(url, {
      timeout: 60000, // 60 second timeout
      headers: {
        'User-Agent': 'AI Sports Edge RSS Reader'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Status code ${response.status}`);
    }
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      trim: true
    });
    
    const result = await parser.parseStringPromise(response.data);
    
    // Extract feed items
    let items = [];
    let source = '';
    
    if (result.rss && result.rss.channel) {
      source = result.rss.channel.title || url;
      items = result.rss.channel.item || [];
    } else if (result.feed) {
      source = result.feed.title || url;
      items = result.feed.entry || [];
    }
    
    // Normalize items
    return normalizeItems(items, source, url);
  } catch (error) {
    console.error(`Error parsing RSS feed: ${error}`);
    return [];
  }
}

/**
 * Normalize feed items to a consistent format
 * @param {Array} items - Feed items
 * @param {string} source - Feed source name
 * @param {string} feedUrl - Feed URL
 * @returns {Array} Normalized items
 */
function normalizeItems(items, source, feedUrl) {
  if (!Array.isArray(items)) {
    items = [items];
  }
  
  return items.map(item => {
    // Handle different RSS formats
    const title = item.title || '';
    const description = item.description || item.summary || '';
    const link = item.link?.href || item.link || '';
    const pubDate = item.pubDate || item.published || item.updated || '';
    const guid = item.guid || item.id || link;
    
    return {
      title,
      description,
      link,
      pubDate,
      guid,
      source,
      feedUrl
    };
  }).filter(item => item.title && item.link);
}

/**
 * Filter feed items based on user preferences
 * @param {Array} items - Feed items
 * @param {Object} userPreferences - User preferences
 * @returns {Array} Filtered items
 */
function filterFeedItems(items, userPreferences) {
  // If no items or empty array, return empty array
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return [];
  }
  
  // If items is an object (cache), convert to array
  if (!Array.isArray(items)) {
    items = Object.values(items).flat();
  }
  
  // Mark betting content
  let processedItems = items.map(item => ({
    ...item,
    isBettingContent: isBettingContent(item)
  }));
  
  // Apply relevance filtering if user preferences are provided
  if (userPreferences && Object.keys(userPreferences).length > 0) {
    processedItems = filterByRelevance(processedItems, userPreferences);
  }
  
  // Limit the number of items
  const maxItems = userPreferences?.maxNewsItems || 20;
  return processedItems.slice(0, maxItems);
}

/**
 * Track news item click
 * @param {Object} item - News item
 * @param {string} userId - User ID (optional)
 * @returns {Promise<void>}
 */
async function trackNewsItemClick(item, userId = null) {
  try {
    const clickData = {
      itemTitle: item.title,
      itemLink: item.link,
      itemSource: item.source,
      isBettingContent: item.isBettingContent || false,
      userId: userId,
      timestamp: serverTimestamp()
    };
    
    // Generate a unique ID for the click
    const clickId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to Firestore
    await setDoc(doc(db, 'newsItemClicks', clickId), clickData);
  } catch (error) {
    console.error('Error tracking news item click:', error);
  }
}

module.exports = {
  fetchAndProcessFeeds,
  trackNewsItemClick
};