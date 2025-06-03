import {
  fetchAllSportsFeeds,
  fetchSportFeed,
  formatNewsItems,
  fetchNewsTickerItems,
} from '../fetchRssFeeds';
import {
  mockFeedItems,
  mockUserPreferences,
  mockRssFeedUrls,
  mockFormattedItems,
} from './mockData';
import { trackRssFeedLoad, trackRssFeedError } from '../../../utils/analyticsService';
import { parseRSS, parseMultipleRSS } from '../../../utils/parser';
import { getUserPreferences, filterNewsItems } from '../../../utils/userPreferencesService';
import * as cacheService from '../cacheService';

// Mock dependencies
jest.mock('../../../utils/analyticsService');
jest.mock('../../../utils/userPreferencesService');
jest.mock('../../../utils/parser');
jest.mock('../cacheService');
jest.mock('../rssFeedUrls', () => ({
  RSS_FEED_URLS: {
    NBA: 'https://example.com/nba/feed',
    NFL: 'https://example.com/nfl/feed',
    MLB: 'https://example.com/mlb/feed',
    NHL: 'https://example.com/nhl/feed',
    F1: 'https://example.com/f1/feed',
  },
}));

describe('RSS Feed Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    getUserPreferences.mockReturnValue(mockUserPreferences);
    parseRSS.mockResolvedValue(mockFeedItems);
    parseMultipleRSS.mockImplementation(async urls => {
      const result = {};
      urls.forEach(url => {
        result[url] = mockFeedItems;
      });
      return result;
    });
    filterNewsItems.mockImplementation(items => items);

    // Mock cache service
    cacheService.hasCacheItem.mockReturnValue(false);
    cacheService.getCacheItem.mockReturnValue([]);
    cacheService.setCacheItem.mockReturnValue(true);
  });

  describe('fetchAllSportsFeeds', () => {
    it('should fetch feeds for all enabled sources', async () => {
      // Execute
      const result = await fetchAllSportsFeeds();

      // Verify
      expect(result).toBeDefined();
      expect(Object.keys(result)).toContain('NBA');
      expect(Object.keys(result)).toContain('NFL');
      expect(Object.keys(result)).toContain('MLB');

      // Should track load time for each feed
      expect(trackRssFeedLoad).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Setup
      parseMultipleRSS.mockRejectedValue(new Error('Test error'));

      // Execute
      const result = await fetchAllSportsFeeds();

      // Verify
      expect(result).toBeDefined();

      // Should track the error
      expect(trackRssFeedError).toHaveBeenCalled();
    });

    it('should respect user preferences for enabled sources', async () => {
      // Setup
      getUserPreferences.mockReturnValue({
        ...mockUserPreferences,
        rssFeeds: {
          ...mockUserPreferences.rssFeeds,
          enabledSources: ['NBA', 'NFL'], // Only NBA and NFL enabled
        },
      });

      // Execute
      const result = await fetchAllSportsFeeds();

      // Verify
      expect(result).toBeDefined();

      // Should only track load time for enabled feeds
      expect(trackRssFeedLoad).toHaveBeenCalled();
    });
  });

  describe('fetchSportFeed', () => {
    it('should fetch feed for a specific sport', async () => {
      // Setup
      parseRSS.mockResolvedValue(mockFeedItems.slice(0, 2));

      // Execute
      const result = await fetchSportFeed('NBA');

      // Verify
      expect(result).toHaveLength(2);

      // Should track load time
      expect(trackRssFeedLoad).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Setup
      parseRSS.mockRejectedValue(new Error('Test error'));

      // Execute
      const result = await fetchSportFeed('NBA');

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Should track the error
      expect(trackRssFeedError).toHaveBeenCalled();
    });

    it('should respect user preferences for enabled sources', async () => {
      // Setup
      getUserPreferences.mockReturnValue({
        ...mockUserPreferences,
        rssFeeds: {
          ...mockUserPreferences.rssFeeds,
          enabledSources: ['NFL'], // NBA not enabled
        },
      });

      // Execute
      const result = await fetchSportFeed('NBA');

      // Verify
      expect(result).toHaveLength(0);
      expect(parseRSS).not.toHaveBeenCalled();
    });
  });

  describe('formatNewsItems', () => {
    it('should format feed items for display', () => {
      // Execute
      const result = formatNewsItems(mockFeedItems);

      // Verify
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('teams');
      expect(result[0]).toHaveProperty('time');
      expect(result[0]).toHaveProperty('sport');
    });

    it('should respect the limit parameter', () => {
      // Execute
      const result = formatNewsItems(mockFeedItems, { limit: 5 });

      // Should only return 5 items
      expect(result).toHaveLength(5);
    });

    it('should respect user preferences for max items', () => {
      // Setup
      getUserPreferences.mockReturnValue({
        ...mockUserPreferences,
        rssFeeds: {
          ...mockUserPreferences.rssFeeds,
          maxItems: 3,
        },
      });

      // Execute
      const result = formatNewsItems(mockFeedItems);

      // Should respect user preference for max items
      expect(result).toHaveLength(3);
    });
  });

  describe('fetchNewsTickerItems', () => {
    it('should fetch and format news items for the ticker', async () => {
      // Setup
      parseRSS.mockResolvedValue(mockFeedItems);

      // Execute
      const result = await fetchNewsTickerItems({ lazyLoad: false });

      // Verify
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Setup
      parseMultipleRSS.mockRejectedValue(new Error('Test error'));

      // Execute
      const result = await fetchNewsTickerItems({ lazyLoad: false });

      // Should return empty array on error
      expect(result).toEqual([]);
    });
  });
});
