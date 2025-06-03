/**
 * Mock data for RSS feed tests
 */

// Mock feed items
export const mockFeedItems = Array.from({ length: 10 }, (_, i) => ({
  title: `Test Article ${i}`,
  link: `https://example.com/article${i}`,
  pubDate: new Date().toISOString(),
  categories: ['NBA'],
  contentSnippet: `This is test article ${i}`,
}));

// Mock user preferences
export const mockUserPreferences = {
  rssFeeds: {
    enabledSources: ['NBA', 'NFL', 'MLB'],
    maxItems: 3,
    refreshIntervalMinutes: 30,
    keywordFilters: {
      include: [],
      exclude: [],
    },
  },
  ui: {
    newsTicker: {
      enabled: true,
      scrollSpeed: 'medium',
      pauseOnHover: true,
    },
  },
};

// Mock RSS feed URLs
export const mockRssFeedUrls = {
  NBA: 'https://example.com/nba/feed',
  NFL: 'https://example.com/nfl/feed',
  MLB: 'https://example.com/mlb/feed',
  NHL: 'https://example.com/nhl/feed',
  F1: 'https://example.com/f1/feed',
};

// Mock formatted news items
export const mockFormattedItems = mockFeedItems.map((item, index) => ({
  id: `news-${index}`,
  date: 'MAR 18',
  teams: item.title,
  time: '03:00 PM',
  sport: 'NBA',
  link: item.link,
  pubDate: item.pubDate,
  image: null,
  description: '',
}));
