/**
 * Content filtering module for RSS feeds
 * This module provides functions for filtering RSS feed items based on keywords and relevance
 */

// Keywords for different sports categories
const SPORTS_KEYWORDS = {
  football: ['nfl', 'football', 'quarterback', 'touchdown', 'field goal', 'super bowl'],
  basketball: ['nba', 'basketball', 'dunk', 'three-pointer', 'court', 'finals'],
  baseball: ['mlb', 'baseball', 'home run', 'pitcher', 'inning', 'world series'],
  hockey: ['nhl', 'hockey', 'goal', 'puck', 'ice', 'stanley cup'],
  soccer: ['soccer', 'football', 'goal', 'pitch', 'fifa', 'world cup'],
  mma: ['ufc', 'mma', 'fighter', 'knockout', 'submission', 'octagon'],
  formula1: ['f1', 'formula 1', 'racing', 'driver', 'circuit', 'grand prix'],
};

// Keywords for betting content
const BETTING_KEYWORDS = [
  'odds',
  'betting',
  'wager',
  'bet',
  'gamble',
  'sportsbook',
  'bookmaker',
  'spread',
  'line',
  'moneyline',
  'parlay',
  'prop',
  'over/under',
  'underdog',
  'favorite',
  'prediction',
  'pick',
  'forecast',
  'handicap',
  'vegas',
];

/**
 * Filter feed items based on relevance score
 * @param {Array} items - Array of RSS feed items
 * @param {Object} userPreferences - User preferences for filtering
 * @param {Number} threshold - Minimum relevance score (0-100)
 * @returns {Array} Filtered and sorted feed items
 */
function filterByRelevance(items, userPreferences, threshold = 30) {
  if (!items || !items.length) return [];

  // Calculate relevance score for each item
  const scoredItems = items.map(item => {
    const score = calculateRelevanceScore(item, userPreferences);
    return { ...item, relevanceScore: score };
  });

  // Filter items by threshold
  const filteredItems = scoredItems.filter(item => item.relevanceScore >= threshold);

  // Sort by relevance score (descending)
  return filteredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calculate relevance score for an item based on user preferences
 * @param {Object} item - RSS feed item
 * @param {Object} userPreferences - User preferences
 * @returns {Number} Relevance score (0-100)
 */
function calculateRelevanceScore(item, userPreferences) {
  let score = 0;
  const { title, description, categories } = item;
  const content = `${title} ${description}`.toLowerCase();

  // Check for preferred sports
  if (userPreferences.sports && userPreferences.sports.length) {
    userPreferences.sports.forEach(sport => {
      if (SPORTS_KEYWORDS[sport]) {
        SPORTS_KEYWORDS[sport].forEach(keyword => {
          if (content.includes(keyword.toLowerCase())) {
            score += 15;
          }
        });
      }
    });
  }

  // Check for betting content if user prefers it
  if (userPreferences.bettingContentOnly) {
    let hasBettingKeyword = false;
    BETTING_KEYWORDS.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        hasBettingKeyword = true;
        score += 20;
      }
    });

    // If betting content is required but none found, significantly reduce score
    if (!hasBettingKeyword) {
      score -= 50;
    }
  }

  // Check for favorite teams
  if (userPreferences.favoriteTeams && userPreferences.favoriteTeams.length) {
    userPreferences.favoriteTeams.forEach(team => {
      if (content.includes(team.toLowerCase())) {
        score += 25;
      }
    });
  }

  // Boost score for local teams if available
  if (userPreferences.localTeams && userPreferences.localTeams.length) {
    userPreferences.localTeams.forEach(team => {
      if (content.includes(team.toLowerCase())) {
        score += 30; // Higher boost for local teams
      }
    });
  }

  // Check for recency (if available)
  if (item.pubDate) {
    const now = new Date();
    const pubDate = new Date(item.pubDate);
    const hoursDiff = (now - pubDate) / (1000 * 60 * 60);

    // Newer content gets higher score
    if (hoursDiff < 6) {
      score += 15;
    } else if (hoursDiff < 24) {
      score += 10;
    } else if (hoursDiff < 48) {
      score += 5;
    }
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Check if an item contains betting-related content
 * @param {Object} item - RSS feed item
 * @returns {Boolean} True if item contains betting content
 */
function isBettingContent(item) {
  const { title, description } = item;
  const content = `${title} ${description}`.toLowerCase();

  return BETTING_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

module.exports = {
  filterByRelevance,
  calculateRelevanceScore,
  isBettingContent,
  SPORTS_KEYWORDS,
  BETTING_KEYWORDS,
};
