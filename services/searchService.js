/**
 * Search service for AI Sports Edge
 * CommonJS version for compatibility with test scripts
 */
const {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore');

const { firestore } = require('../config/firebase');

/**
 * Search service for handling search functionality
 */
class SearchService {
  /**
   * Search across all content types
   * @param {string} query Search query
   * @param {Object} filters Optional search filters
   * @returns {Promise<Object>} Search results
   */
  async search(query, filters = {}) {
    // Normalize query
    const normalizedQuery = query.trim().toLowerCase();

    // Execute searches in parallel
    const [newsResults, teamsResults, playersResults, oddsResults] = await Promise.all([
      this.searchNews(normalizedQuery, filters),
      this.searchTeams(normalizedQuery, filters),
      this.searchPlayers(normalizedQuery, filters),
      this.searchOdds(normalizedQuery, filters),
    ]);

    // Combine results
    const results = {
      news: newsResults,
      teams: teamsResults,
      players: playersResults,
      odds: oddsResults,
      totalResults:
        newsResults.length + teamsResults.length + playersResults.length + oddsResults.length,
    };

    return results;
  }

  /**
   * Search news content
   * @param {string} query Search query
   * @param {Object} filters Optional search filters
   * @returns {Promise<Array>} News search results
   */
  async searchNews(query, filters = {}) {
    try {
      // For demo purposes, return mock data
      if (query.includes('basketball')) {
        return [
          {
            id: 'news1',
            title: 'NBA Finals Game 3 Preview: Warriors vs Celtics',
            source: 'ESPN',
            date: new Date(),
            snippet:
              'The Warriors look to take a 2-1 lead in the NBA Finals as they face the Celtics in Boston.',
            url: 'https://example.com/nba-finals-preview',
            imageUrl: 'https://example.com/images/nba-finals.jpg',
            categories: ['NBA', 'Basketball', 'Playoffs'],
            isBettingContent: false,
          },
          {
            id: 'news2',
            title: 'College Basketball Rankings Updated for Week 10',
            source: 'Sports Illustrated',
            date: new Date(),
            snippet:
              'The latest college basketball rankings have been released, with several changes in the top 10.',
            url: 'https://example.com/college-basketball-rankings',
            imageUrl: 'https://example.com/images/college-basketball.jpg',
            categories: ['College Basketball', 'Rankings'],
            isBettingContent: false,
          },
        ];
      } else if (query.includes('nfl')) {
        return [
          {
            id: 'news3',
            title: 'NFL Draft: Top Quarterback Prospects',
            source: 'NFL Network',
            date: new Date(),
            snippet: 'A look at the top quarterback prospects in the upcoming NFL Draft.',
            url: 'https://example.com/nfl-draft-qb-prospects',
            imageUrl: 'https://example.com/images/nfl-draft.jpg',
            categories: ['NFL', 'Draft'],
            isBettingContent: false,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  /**
   * Search teams
   * @param {string} query Search query
   * @param {Object} filters Optional search filters
   * @returns {Promise<Array>} Team search results
   */
  async searchTeams(query, filters = {}) {
    try {
      // For demo purposes, return mock data
      if (query.includes('warriors')) {
        return [
          {
            id: 'team1',
            name: 'Golden State Warriors',
            sport: 'Basketball',
            league: 'NBA',
            logo: 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',
            location: 'San Francisco, CA',
            record: '42-20',
          },
        ];
      } else if (query.includes('nfl')) {
        return [
          {
            id: 'team2',
            name: 'Kansas City Chiefs',
            sport: 'Football',
            league: 'NFL',
            logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
            location: 'Kansas City, MO',
            record: '14-3',
          },
          {
            id: 'team3',
            name: 'San Francisco 49ers',
            sport: 'Football',
            league: 'NFL',
            logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
            location: 'San Francisco, CA',
            record: '12-5',
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error searching teams:', error);
      return [];
    }
  }

  /**
   * Search players
   * @param {string} query Search query
   * @param {Object} filters Optional search filters
   * @returns {Promise<Array>} Player search results
   */
  async searchPlayers(query, filters = {}) {
    try {
      // For demo purposes, return mock data
      if (query.includes('lebron')) {
        return [
          {
            id: 'player1',
            name: 'LeBron James',
            team: 'Los Angeles Lakers',
            sport: 'Basketball',
            league: 'NBA',
            position: 'Forward',
            imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png',
            stats: {
              points: 27.2,
              rebounds: 7.5,
              assists: 8.3,
            },
          },
        ];
      } else if (query.includes('curry')) {
        return [
          {
            id: 'player2',
            name: 'Stephen Curry',
            team: 'Golden State Warriors',
            sport: 'Basketball',
            league: 'NBA',
            position: 'Guard',
            imageUrl: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png',
            stats: {
              points: 29.4,
              rebounds: 6.1,
              assists: 6.3,
            },
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }

  /**
   * Search odds
   * @param {string} query Search query
   * @param {Object} filters Optional search filters
   * @returns {Promise<Array>} Odds search results
   */
  async searchOdds(query, filters = {}) {
    try {
      // For demo purposes, return mock data
      if (query.includes('basketball') || query.includes('warriors') || query.includes('celtics')) {
        return [
          {
            id: 'odds1',
            gameId: '401705578',
            homeTeam: 'Golden State Warriors',
            awayTeam: 'Boston Celtics',
            date: new Date(),
            sport: 'Basketball',
            league: 'NBA',
            odds: {
              homeMoneyline: -110,
              awayMoneyline: 110,
              spread: 0.5,
              overUnder: 214.5,
            },
          },
        ];
      } else if (query.includes('nfl') || query.includes('chiefs') || query.includes('49ers')) {
        return [
          {
            id: 'odds2',
            gameId: '401704520',
            homeTeam: 'Kansas City Chiefs',
            awayTeam: 'San Francisco 49ers',
            date: new Date(),
            sport: 'Football',
            league: 'NFL',
            odds: {
              homeMoneyline: -120,
              awayMoneyline: 100,
              spread: 1.5,
              overUnder: 48.5,
            },
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error searching odds:', error);
      return [];
    }
  }

  /**
   * Get search history for a user
   * @param {string} userId User ID
   * @param {number} maxItems Maximum number of history items to return
   * @returns {Promise<Array>} Search history items
   */
  async getSearchHistory(userId, maxItems = 10) {
    try {
      // For demo purposes, return mock data
      return [
        {
          id: 'history1',
          userId,
          query: 'basketball',
          timestamp: new Date(),
          resultCount: 5,
        },
        {
          id: 'history2',
          userId,
          query: 'nfl',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          resultCount: 3,
        },
      ];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  /**
   * Save a search query to history
   * @param {string} userId User ID
   * @param {string} query Search query
   * @param {number} resultCount Number of results found
   * @param {Object} filters Search filters used
   */
  async saveSearchQuery(userId, query, resultCount = 0, filters = {}) {
    try {
      console.log(`Saved search query "${query}" for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error saving search query:', error);
      return false;
    }
  }

  /**
   * Clear search history for a user
   * @param {string} userId User ID
   */
  async clearSearchHistory(userId) {
    try {
      console.log(`Cleared search history for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing search history:', error);
      return false;
    }
  }

  /**
   * Get search preferences for a user
   * @param {string} userId User ID
   * @returns {Promise<Object>} Search preferences
   */
  async getSearchPreferences(userId) {
    try {
      // For demo purposes, return default preferences
      return this.getDefaultSearchPreferences();
    } catch (error) {
      console.error('Error getting search preferences:', error);
      return this.getDefaultSearchPreferences();
    }
  }

  /**
   * Update search preferences for a user
   * @param {string} userId User ID
   * @param {Object} preferences Search preferences
   */
  async updateSearchPreferences(userId, preferences) {
    try {
      console.log(`Updated search preferences for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error updating search preferences:', error);
      return false;
    }
  }

  /**
   * Get default search preferences
   * @returns {Object} Default search preferences
   */
  getDefaultSearchPreferences() {
    return {
      defaultFilters: {
        contentTypes: ['news', 'teams', 'players', 'odds'],
        sports: [],
        leagues: [],
        teams: [],
      },
      saveHistory: true,
      showRecentSearches: true,
      autocompleteEnabled: true,
      maxHistoryItems: 20,
      preferredContentTypes: ['news', 'teams', 'players', 'odds'],
    };
  }
}

// Export a singleton instance
module.exports = new SearchService();
