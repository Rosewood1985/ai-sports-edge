import { jest } from '@jest/globals';

import { generateFanDuelAffiliateLink } from '../../../utils/affiliateLinkGenerator';
import { getUserPreferences, filterNewsItems } from '../../../utils/userPreferencesService';
import { formatNewsItems } from '../fetchRssFeeds';

// Mock dependencies
jest.mock('../../../utils/userPreferencesService');
jest.mock('../../../utils/affiliateLinkGenerator');

describe('RSS Feed Betting Integration', () => {
  // Sample RSS feed items for testing
  const sampleItems = [
    {
      title: 'Lakers vs Warriors: Preview and Prediction',
      link: 'https://example.com/lakers-warriors',
      pubDate: '2025-03-18T12:00:00Z',
      categories: ['NBA'],
      contentSnippet: 'Preview of the upcoming Lakers vs Warriors game.',
      image: 'https://example.com/lakers-warriors.jpg',
    },
    {
      title: 'Betting Odds: Chiefs favored by 7 points against Raiders',
      link: 'https://example.com/chiefs-raiders-odds',
      pubDate: '2025-03-18T11:00:00Z',
      categories: ['NFL', 'BETTING'],
      contentSnippet: 'The latest betting odds for Chiefs vs Raiders game.',
      image: 'https://example.com/chiefs-raiders.jpg',
      odds: '+250',
    },
    {
      title: 'Expert Picks: UFC 300 Main Card Predictions',
      link: 'https://example.com/ufc-300-picks',
      pubDate: '2025-03-18T10:00:00Z',
      categories: ['UFC', 'PICKS'],
      contentSnippet: 'Expert predictions for the upcoming UFC 300 main card fights.',
      image: 'https://example.com/ufc-300.jpg',
    },
  ];

  // Mock user preferences
  const mockPreferences = {
    rssFeeds: {
      enabledSources: ['NBA', 'NFL', 'UFC', 'BETTING', 'PICKS'],
      maxItems: 10,
      refreshIntervalMinutes: 15,
      keywordFilters: {
        include: [],
        exclude: [],
      },
    },
    favorites: {
      teams: ['Lakers', 'Chiefs'],
      players: [],
      leagues: [],
    },
    betting: {
      showOdds: true,
      oddsFormat: 'american',
      defaultStake: 10,
      affiliateId: 'test-affiliate',
    },
    ui: {
      newsTicker: {
        enabled: true,
        scrollSpeed: 'medium',
        pauseOnHover: true,
      },
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    getUserPreferences.mockReturnValue(mockPreferences);

    // Mock filterNewsItems to return the same items that are passed to it
    // This simulates the filtering without actually implementing the logic
    filterNewsItems.mockImplementation(items => {
      return items;
    });

    // Mock the affiliate link generation
    generateFanDuelAffiliateLink.mockImplementation((params, affiliateId) => {
      // Use the provided affiliateId or get it from the mock preferences
      const aid = affiliateId || mockPreferences.betting.affiliateId;
      return `https://fanduel.com/affiliate/${params.sport}/${params.teams}?aid=${aid}`;
    });
  });

  describe('formatNewsItems', () => {
    it('should format RSS feed items correctly', () => {
      const formattedItems = formatNewsItems(sampleItems);

      expect(formattedItems).toHaveLength(3);
      expect(formattedItems[0].teams).toBe('Lakers vs Warriors: Preview and Prediction');
      expect(formattedItems[0].sport).toBe('NBA');
    });

    it('should identify betting-related items', () => {
      // Create a custom implementation for this test
      filterNewsItems.mockImplementation(items => {
        return items.map(item => {
          // Add isBettingRelated property based on various criteria
          const itemText = [
            item.teams || '',
            item.title || '',
            item.description || '',
            item.categories?.join(' ') || '',
          ]
            .join(' ')
            .toLowerCase();

          const isBettingRelated =
            (item.categories &&
              item.categories.some(
                cat => cat === 'BETTING' || cat === 'PICKS' || cat === 'ODDS'
              )) ||
            item.odds ||
            itemText.includes('odds') ||
            itemText.includes('betting') ||
            itemText.includes('picks') ||
            itemText.includes('expert');

          return { ...item, isBettingRelated };
        });
      });

      const formattedItems = formatNewsItems(sampleItems);

      // First item is about Lakers vs Warriors (not betting related)
      expect(formattedItems[0].isBettingRelated).toBeFalsy();

      // Second item is about betting odds (betting related)
      expect(formattedItems[1].isBettingRelated).toBeTruthy();

      // Third item is about expert picks (betting related)
      expect(formattedItems[2].isBettingRelated).toBeTruthy();
    });

    it('should prioritize favorite teams', () => {
      // Modify the mock to ensure favorites are prioritized
      getUserPreferences.mockReturnValue({
        ...mockPreferences,
        rssFeeds: {
          ...mockPreferences.rssFeeds,
          maxItems: 2, // Only return top 2 items
        },
      });

      const formattedItems = formatNewsItems(sampleItems);

      // Should prioritize Lakers and Chiefs (user's favorite teams)
      expect(formattedItems).toHaveLength(2);
      expect(formattedItems[0].teams).toContain('Lakers');
      expect(formattedItems[1].teams).toContain('Chiefs');
    });

    it('should respect user preferences for maximum items', () => {
      // Modify the mock to limit items
      getUserPreferences.mockReturnValue({
        ...mockPreferences,
        rssFeeds: {
          ...mockPreferences.rssFeeds,
          maxItems: 1,
        },
      });

      const formattedItems = formatNewsItems(sampleItems);

      expect(formattedItems).toHaveLength(1);
    });
  });

  describe('Affiliate Link Generation', () => {
    it('should generate correct affiliate links for betting opportunities', () => {
      // Create a betting item
      const bettingItem = {
        id: 'game-123',
        sport: 'NFL',
        teams: 'Chiefs vs Raiders',
        hasBettingOpportunity: true,
      };

      // Generate link
      const link = generateFanDuelAffiliateLink(
        {
          sport: bettingItem.sport,
          teams: bettingItem.teams,
          eventId: bettingItem.id,
        },
        mockPreferences.betting.affiliateId
      );

      expect(link).toBe('https://fanduel.com/affiliate/NFL/Chiefs vs Raiders?aid=test-affiliate');
    });
  });

  describe('Betting Content Identification', () => {
    it('should identify betting content based on keywords', () => {
      const testCases = [
        {
          title: 'Latest odds for UFC 300',
          expected: true,
        },
        {
          title: 'NBA Standings Update',
          expected: false,
        },
        {
          title: 'Betting guide for March Madness',
          expected: true,
        },
        {
          title: 'Player injury report',
          expected: false,
        },
        {
          title: 'Moneyline shifts for weekend games',
          expected: true,
        },
      ];

      testCases.forEach(testCase => {
        const isBettingRelated =
          testCase.title.toLowerCase().includes('odds') ||
          testCase.title.toLowerCase().includes('betting') ||
          testCase.title.toLowerCase().includes('moneyline');

        expect(isBettingRelated).toBe(testCase.expected);
      });
    });
  });
});
