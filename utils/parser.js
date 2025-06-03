import Parser from 'rss-parser';

import { ERROR_TYPES } from './errorHandlingUtils.js';

// Create a custom parser with extended fields
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'AI Sports Edge RSS Reader/1.0',
  },
});

/**
 * Parse an RSS feed URL
 * @param {string} url - The URL of the RSS feed to parse
 * @returns {Promise<Array>} Array of feed items
 * @throws {Error} If parsing fails
 */
export async function parseRSS(url) {
  try {
    const feed = await parser.parseURL(url);

    // Process items to extract and normalize images
    const processedItems = feed.items.map(item => {
      const processedItem = { ...item };

      // Extract image from various possible sources
      processedItem.image = extractItemImage(item);

      return processedItem;
    });

    return processedItems;
  } catch (error) {
    // Enhance error with more context
    const enhancedError = new Error(`Error parsing RSS feed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.url = url;

    // Add specific error types based on the error message
    if (error.message.includes('timeout')) {
      enhancedError.type = ERROR_TYPES.TIMEOUT;
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      enhancedError.type = ERROR_TYPES.NETWORK;
    } else if (error.message.includes('status code 404')) {
      enhancedError.type = ERROR_TYPES.FEED_UNAVAILABLE;
    } else if (error.message.includes('status code 429')) {
      enhancedError.type = ERROR_TYPES.RATE_LIMIT;
    } else if (error.message.includes('Invalid XML') || error.message.includes('Not a feed')) {
      enhancedError.type = ERROR_TYPES.PARSING;
    }

    // Log the error
    console.error(`RSS parsing error for ${url}:`, enhancedError);

    // Rethrow the enhanced error
    throw enhancedError;
  }
}

/**
 * Extract image URL from various possible sources in an RSS item
 * @param {Object} item - RSS feed item
 * @returns {Object|null} Image object with url, width, height, and type if available
 */
function extractItemImage(item) {
  // Check for media:content
  if (item.media && item.media.$ && item.media.$.url) {
    return {
      url: item.media.$.url,
      width: item.media.$.width || null,
      height: item.media.$.height || null,
      type: item.media.$.type || 'image/jpeg',
    };
  }

  // Check for media:thumbnail
  if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
    return {
      url: item.thumbnail.$.url,
      width: item.thumbnail.$.width || null,
      height: item.thumbnail.$.height || null,
      type: 'image/jpeg',
    };
  }

  // Check for enclosure
  if (
    item.enclosure &&
    item.enclosure.url &&
    item.enclosure.type &&
    item.enclosure.type.startsWith('image/')
  ) {
    return {
      url: item.enclosure.url,
      width: null,
      height: null,
      type: item.enclosure.type,
    };
  }

  // Try to extract image from content:encoded or content
  const content = item.contentEncoded || item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch && imgMatch[1]) {
    return {
      url: imgMatch[1],
      width: null,
      height: null,
      type: 'image/jpeg',
    };
  }

  // No image found
  return null;
}

/**
 * Generate optimized image URL for a given image
 * @param {Object} image - Image object with url, width, height, and type
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(image, options = {}) {
  if (!image || !image.url) return null;

  const { width = 300, height = 200, quality = 80, format = 'webp' } = options;

  // Check if the URL is already from an image service
  if (image.url.includes('imgix.net') || image.url.includes('cloudinary.com')) {
    // These services already support optimization parameters
    return image.url;
  }

  // For demonstration, we'll use a hypothetical image proxy service
  // In a real app, you would use a service like Imgix, Cloudinary, or your own proxy
  try {
    const imageUrl = encodeURIComponent(image.url);
    return `https://image-proxy.aisportsedge.app/resize?url=${imageUrl}&width=${width}&height=${height}&quality=${quality}&format=${format}`;
  } catch (error) {
    console.error('Error generating optimized image URL:', error);
    return image.url; // Fallback to original URL
  }
}

/**
 * Parse multiple RSS feeds in parallel
 * @param {Array} urls - Array of RSS feed URLs to parse
 * @param {Object} options - Options for parsing
 * @returns {Promise<Object>} Object with feed URLs as keys and items as values
 */
export async function parseMultipleRSS(urls, options = {}) {
  const { concurrency = 3 } = options;
  const results = {};

  // Process feeds in batches to limit concurrency
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    // Process batch in parallel
    const batchPromises = batch.map(async url => {
      try {
        const items = await parseRSS(url);
        return { url, items };
      } catch (error) {
        console.error(`Error parsing feed ${url}:`, error);
        return { url, items: [] };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);

    // Add results to output
    batchResults.forEach(({ url, items }) => {
      results[url] = items;
    });
  }

  return results;
}
