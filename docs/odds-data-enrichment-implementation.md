# Odds Data Enrichment Service Implementation Plan

This document provides a detailed implementation plan for the odds data enrichment service, which will fetch odds data from FanDuel and enrich RSS feed items with relevant betting information.

## 1. Overview

The odds data enrichment service will:
1. Fetch odds data from FanDuel API
2. Cache the data for efficient access
3. Match odds data with news items based on teams, players, and events
4. Prioritize items with odds data for user's favorites
5. Format odds data for display in the news ticker

## 2. Data Models

### 2.1 Odds Model

```javascript
// models/Odds.js
export default class Odds {
  constructor(id, eventId, sportKey, homeTeam, awayTeam, startTime, markets, lastUpdated) {
    this.id = id;
    this.eventId = eventId;
    this.sportKey = sportKey;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.startTime = startTime;
    this.markets = markets; // Array of betting markets (moneyline, spread, etc.)
    this.lastUpdated = lastUpdated;
  }
  
  static fromAPI(apiOdds) {
    return new Odds(
      apiOdds.id,
      apiOdds.event_id,
      apiOdds.sport_key,
      apiOdds.home_team,
      apiOdds.away_team,
      new Date(apiOdds.commence_time),
      apiOdds.markets.map(market => Market.fromAPI(market)),
      new Date(apiOdds.last_update)
    );
  }
  
  // Get moneyline odds
  getMoneylineOdds() {
    return this.markets.find(market => market.key === 'h2h');
  }
  
  // Get spread odds
  getSpreadOdds() {
    return this.markets.find(market => market.key === 'spreads');
  }
  
  // Get total odds
  getTotalOdds() {
    return this.markets.find(market => market.key === 'totals');
  }
  
  // Check if event is live
  isLive() {
    return new Date() >= this.startTime;
  }
  
  // Check if event is upcoming (within next 24 hours)
  isUpcoming() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.startTime >= now && this.startTime <= tomorrow;
  }
}
```

### 2.2 Market Model

```javascript
// models/Market.js
export default class Market {
  constructor(key, lastUpdate, outcomes) {
    this.key = key; // e.g., 'h2h', 'spreads', 'totals'
    this.lastUpdate = lastUpdate;
    this.outcomes = outcomes; // Array of betting outcomes
  }
  
  static fromAPI(apiMarket) {
    return new Market(
      apiMarket.key,
      new Date(apiMarket.last_update),
      apiMarket.outcomes.map(outcome => Outcome.fromAPI(outcome))
    );
  }
  
  // Get outcome for a specific team
  getOutcomeForTeam(teamName) {
    return this.outcomes.find(outcome => 
      outcome.name.toLowerCase() === teamName.toLowerCase()
    );
  }
  
  // Get the favorite outcome (lowest odds for American format)
  getFavoriteOutcome() {
    if (!this.outcomes.length) return null;
    
    return this.outcomes.reduce((favorite, current) => {
      // For American odds, lower number is the favorite
      if (current.price < favorite.price) {
        return current;
      }
      return favorite;
    }, this.outcomes[0]);
  }
}
```

### 2.3 Outcome Model

```javascript
// models/Outcome.js
export default class Outcome {
  constructor(name, price, point) {
    this.name = name; // Team name or outcome description
    this.price = price; // Odds price (American format)
    this.point = point; // Point value for spreads and totals
  }
  
  static fromAPI(apiOutcome) {
    return new Outcome(
      apiOutcome.name,
      apiOutcome.price,
      apiOutcome.point || null
    );
  }
  
  // Format odds based on format preference
  formatOdds(format = 'american') {
    switch (format) {
      case 'decimal':
        return this.toDecimalOdds();
      case 'fractional':
        return this.toFractionalOdds();
      case 'american':
      default:
        return this.toAmericanOdds();
    }
  }
  
  // Convert to American odds format (already in this format)
  toAmericanOdds() {
    return this.price > 0 ? `+${this.price}` : `${this.price}`;
  }
  
  // Convert to decimal odds format
  toDecimalOdds() {
    if (this.price > 0) {
      return ((this.price / 100) + 1).toFixed(2);
    } else {
      return (1 - (100 / this.price)).toFixed(2);
    }
  }
  
  // Convert to fractional odds format
  toFractionalOdds() {
    if (this.price > 0) {
      const numerator = this.price;
      const denominator = 100;
      const gcd = this.greatestCommonDivisor(numerator, denominator);
      return `${numerator/gcd}/${denominator/gcd}`;
    } else {
      const numerator = 100;
      const denominator = -this.price;
      const gcd = this.greatestCommonDivisor(numerator, denominator);
      return `${numerator/gcd}/${denominator/gcd}`;
    }
  }
  
  // Helper method for calculating greatest common divisor
  greatestCommonDivisor(a, b) {
    return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
  }
}
```

## 3. Odds Data Service

### 3.1 FanDuel API Service

```javascript
// services/fanDuelApiService.js
import Odds from '../models/Odds';
import { getBettingPreferences } from '../utils/userPreferencesService';

// API configuration
const API_BASE_URL = 'https://api.fanduel.com/v1';
const API_KEY = process.env.FANDUEL_API_KEY;

// Cache configuration
let oddsCache = {};
let lastFetchTime = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch odds for a specific sport
 * @param {string} sport - Sport key (e.g., 'nba', 'nfl')
 * @returns {Promise<Array<Odds>>} Array of Odds objects
 */
export async function fetchOddsForSport(sport) {
  // Check cache first
  if (oddsCache[sport] && (Date.now() - lastFetchTime[sport] < CACHE_TTL)) {
    return oddsCache[sport];
  }
  
  try {
    // Get affiliate ID from user preferences
    const bettingPrefs = getBettingPreferences();
    const affiliateId = bettingPrefs.affiliateId || 'default';
    
    // Fetch odds from FanDuel API
    const response = await fetch(`${API_BASE_URL}/odds/${sport}`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Affiliate-ID': affiliateId
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch odds: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert to Odds objects
    const odds = data.map(oddsData => Odds.fromAPI(oddsData));
    
    // Update cache
    oddsCache[sport] = odds;
    lastFetchTime[sport] = Date.now();
    
    return odds;
  } catch (error) {
    console.error(`Error fetching odds for ${sport}:`, error);
    return oddsCache[sport] || [];
  }
}

/**
 * Fetch odds for all supported sports
 * @returns {Promise<Object>} Object with sport keys and their odds
 */
export async function fetchAllOdds() {
  const supportedSports = ['nba', 'nfl', 'mlb', 'nhl', 'ufc', 'soccer'];
  const allOdds = {};
  
  // Fetch odds for each sport in parallel
  const promises = supportedSports.map(async sport => {
    const odds = await fetchOddsForSport(sport);
    allOdds[sport] = odds;
  });
  
  await Promise.all(promises);
  
  return allOdds;
}

/**
 * Clear odds cache
 * @param {string} sport - Optional sport to clear cache for (or all if not specified)
 */
export function clearOddsCache(sport = null) {
  if (sport) {
    delete oddsCache[sport];
    delete lastFetchTime[sport];
  } else {
    oddsCache = {};
    lastFetchTime = {};
  }
}
```

### 3.2 Odds Enrichment Service

```javascript
// services/oddsEnrichmentService.js
import { fetchAllOdds, fetchOddsForSport } from './fanDuelApiService';
import { getFavoriteTeams, getFavoritePlayers, getBettingPreferences } from '../utils/userPreferencesService';
import { generateFanDuelAffiliateLink } from '../utils/affiliateLinkGenerator';

/**
 * Enrich news items with odds data
 * @param {Array} newsItems - Array of news items
 * @returns {Promise<Array>} Array of enriched news items
 */
export async function enrichNewsItemsWithOdds(newsItems) {
  // Get user preferences
  const favoriteTeams = getFavoriteTeams();
  const favoritePlayers = getFavoritePlayers();
  const bettingPrefs = getBettingPreferences();
  
  // Fetch all odds
  const allOdds = await fetchAllOdds();
  
  // Enrich each news item
  const enrichedItems = newsItems.map(item => {
    // Find matching odds for this news item
    const matchingOdds = findMatchingOdds(item, allOdds);
    
    if (matchingOdds) {
      // Get appropriate market based on item type
      const market = matchingOdds.getMoneylineOdds();
      
      if (market) {
        // Generate affiliate link
        const affiliateLink = generateFanDuelAffiliateLink({
          sport: item.sport,
          eventId: matchingOdds.eventId,
          teams: item.teams
        }, bettingPrefs.affiliateId);
        
        // Enrich item with odds data
        return {
          ...item,
          odds: {
            homeTeam: matchingOdds.homeTeam,
            awayTeam: matchingOdds.awayTeam,
            startTime: matchingOdds.startTime,
            market: market.key,
            outcomes: market.outcomes.map(outcome => ({
              name: outcome.name,
              odds: outcome.formatOdds(bettingPrefs.oddsFormat)
            }))
          },
          hasBettingOpportunity: true,
          affiliateLink
        };
      }
    }
    
    // No matching odds found, return item unchanged
    return item;
  });
  
  // Sort items to prioritize user favorites and items with odds
  return sortNewsItems(enrichedItems, favoriteTeams, favoritePlayers);
}

/**
 * Find matching odds for a news item
 * @param {Object} item - News item
 * @param {Object} allOdds - Object with sport keys and their odds
 * @returns {Odds|null} Matching Odds object or null if not found
 */
function findMatchingOdds(item, allOdds) {
  // Convert sport to lowercase for matching
  const sportKey = getSportKey(item.sport);
  
  if (!sportKey || !allOdds[sportKey]) {
    return null;
  }
  
  const oddsForSport = allOdds[sportKey];
  
  // Extract team names from news item
  const teamNames = extractTeamNames(item);
  
  if (!teamNames.length) {
    return null;
  }
  
  // Find matching odds based on team names
  return oddsForSport.find(odds => {
    const homeTeamLower = odds.homeTeam.toLowerCase();
    const awayTeamLower = odds.awayTeam.toLowerCase();
    
    return teamNames.some(team => 
      homeTeamLower.includes(team.toLowerCase()) || 
      awayTeamLower.includes(team.toLowerCase())
    );
  }) || null;
}

/**
 * Extract team names from news item
 * @param {Object} item - News item
 * @returns {Array<string>} Array of team names
 */
function extractTeamNames(item) {
  // If item already has structured team data
  if (item.homeTeam && item.awayTeam) {
    return [item.homeTeam, item.awayTeam];
  }
  
  // Try to extract from teams field (e.g., "Lakers vs. Celtics")
  if (item.teams) {
    // Common separators in team matchups
    const separators = [' vs ', ' vs. ', ' at ', ' @ ', '-'];
    
    for (const separator of separators) {
      if (item.teams.includes(separator)) {
        return item.teams.split(separator).map(team => team.trim());
      }
    }
    
    // If no separator found, return the whole string
    return [item.teams];
  }
  
  // Try to extract from title as a fallback
  if (item.title) {
    // Look for common patterns in titles
    const vsMatch = item.title.match(/(.+?)\s+(?:vs\.?|at|@)\s+(.+?)(?:\s+in|\s+on|\s+\(|$)/i);
    if (vsMatch) {
      return [vsMatch[1].trim(), vsMatch[2].trim()];
    }
  }
  
  return [];
}

/**
 * Convert sport name to API sport key
 * @param {string} sport - Sport name
 * @returns {string|null} Sport key for API or null if not supported
 */
function getSportKey(sport) {
  const sportMap = {
    'NBA': 'nba',
    'NFL': 'nfl',
    'MLB': 'mlb',
    'NHL': 'nhl',
    'UFC': 'ufc',
    'SOCCER': 'soccer',
    'F1': null, // Not supported by FanDuel API
    'TENNIS': 'tennis'
  };
  
  return sportMap[sport] || null;
}

/**
 * Sort news items to prioritize user favorites and items with odds
 * @param {Array} items - News items
 * @param {Array} favoriteTeams - User's favorite teams
 * @param {Array} favoritePlayers - User's favorite players
 * @returns {Array} Sorted news items
 */
function sortNewsItems(items, favoriteTeams, favoritePlayers) {
  return items.sort((a, b) => {
    // First priority: items with betting opportunities
    if (a.hasBettingOpportunity && !b.hasBettingOpportunity) return -1;
    if (!a.hasBettingOpportunity && b.hasBettingOpportunity) return 1;
    
    // Second priority: items related to favorite teams
    const aHasFavoriteTeam = hasUserFavorite(a, favoriteTeams);
    const bHasFavoriteTeam = hasUserFavorite(b, favoriteTeams);
    
    if (aHasFavoriteTeam && !bHasFavoriteTeam) return -1;
    if (!aHasFavoriteTeam && bHasFavoriteTeam) return 1;
    
    // Third priority: items related to favorite players
    const aHasFavoritePlayer = hasUserFavorite(a, favoritePlayers);
    const bHasFavoritePlayer = hasUserFavorite(b, favoritePlayers);
    
    if (aHasFavoritePlayer && !bHasFavoritePlayer) return -1;
    if (!aHasFavoritePlayer && bHasFavoritePlayer) return 1;
    
    // Fourth priority: recency (newer items first)
    return new Date(b.pubDate) - new Date(a.pubDate);
  });
}

/**
 * Check if news item contains a user favorite
 * @param {Object} item - News item
 * @param {Array} favorites - User favorites
 * @returns {boolean} Whether item contains a user favorite
 */
function hasUserFavorite(item, favorites) {
  if (!favorites.length) return false;
  
  // Check in various item fields
  const itemText = [
    item.teams || '',
    item.title || '',
    item.description || ''
  ].join(' ').toLowerCase();
  
  return favorites.some(favorite => 
    itemText.includes(favorite.toLowerCase())
  );
}
```

### 3.3 Affiliate Link Generator

```javascript
// utils/affiliateLinkGenerator.js
/**
 * Generate FanDuel affiliate link for a news item
 * @param {Object} event - News event with teams, sport, and odds info
 * @param {string} affiliateId - User's FanDuel affiliate ID
 * @returns {string} FanDuel affiliate link
 */
export function generateFanDuelAffiliateLink(event, affiliateId) {
  // Base FanDuel URL
  const baseUrl = 'https://www.fanduel.com/';
  
  // Construct path based on sport
  let path = '';
  switch (event.sport) {
    case 'NBA':
      path = 'nba/games';
      break;
    case 'NFL':
      path = 'nfl/games';
      break;
    case 'MLB':
      path = 'mlb/games';
      break;
    case 'NHL':
      path = 'nhl/games';
      break;
    case 'UFC':
      path = 'ufc/events';
      break;
    case 'SOCCER':
      path = 'soccer/games';
      break;
    default:
      path = 'sports';
  }
  
  // Add event-specific parameters if available
  const params = new URLSearchParams();
  if (event.eventId) {
    params.append('eventId', event.eventId);
  }
  
  // Always add affiliate ID
  params.append('aid', affiliateId || 'default');
  
  // Track the source
  params.append('src', 'newsticker');
  
  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * Generate generic FanDuel affiliate link
 * @param {string} sport - Sport key
 * @param {string} affiliateId - User's FanDuel affiliate ID
 * @returns {string} FanDuel affiliate link
 */
export function generateGenericAffiliateLink(sport, affiliateId) {
  // Base FanDuel URL
  const baseUrl = 'https://www.fanduel.com/';
  
  // Construct path based on sport
  let path = '';
  switch (sport) {
    case 'NBA':
      path = 'nba';
      break;
    case 'NFL':
      path = 'nfl';
      break;
    case 'MLB':
      path = 'mlb';
      break;
    case 'NHL':
      path = 'nhl';
      break;
    case 'UFC':
      path = 'ufc';
      break;
    case 'SOCCER':
      path = 'soccer';
      break;
    default:
      path = 'sports';
  }
  
  // Add affiliate ID
  const params = new URLSearchParams();
  params.append('aid', affiliateId || 'default');
  params.append('src', 'newsticker');
  
  return `${baseUrl}${path}?${params.toString()}`;
}
```

## 4. Integration with RSS Feed Service

### 4.1 Update fetchNewsTickerItems Function

```javascript
// api/rssFeeds/fetchRssFeeds.js
import { enrichNewsItemsWithOdds } from '../../services/oddsEnrichmentService';

/**
 * Fetches and formats news items for the ticker
 * @param {Object} options - Options for fetching and formatting
 * @returns {Promise<Array>} Formatted news items for the ticker
 */
export async function fetchNewsTickerItems(options = {}) {
  const { limit = 20, lazyLoad = true, includeOdds = true } = options;
  
  try {
    // If lazy loading is enabled, return a function that will fetch the data
    if (lazyLoad) {
      return {
        initialItems: [], // Empty initial set
        loadItems: async () => {
          const allFeeds = await fetchAllSportsFeeds();
          const formattedItems = formatCombinedNewsItems(allFeeds, limit);
          
          // Enrich with odds data if requested
          if (includeOdds) {
            return await enrichNewsItemsWithOdds(formattedItems);
          }
          
          return formattedItems;
        }
      };
    }
    
    // Otherwise, fetch all feeds immediately
    const allFeeds = await fetchAllSportsFeeds();
    const formattedItems = formatCombinedNewsItems(allFeeds, limit);
    
    // Enrich with odds data if requested
    if (includeOdds) {
      return await enrichNewsItemsWithOdds(formattedItems);
    }
    
    return formattedItems;
  } catch (error) {
    console.error('Error fetching news ticker items:', error);
    return []; // Return empty array on error for backward compatibility
  }
}
```

## 5. Testing Plan

### 5.1 Unit Tests

1. **Odds Model Tests**:
   - Test conversion from API format
   - Test methods for getting different market types
   - Test isLive and isUpcoming methods

2. **Market and Outcome Model Tests**:
   - Test odds format conversion methods
   - Test methods for finding outcomes by team

3. **FanDuel API Service Tests**:
   - Test fetching odds for specific sports
   - Test caching mechanism
   - Test error handling

4. **Odds Enrichment Service Tests**:
   - Test finding matching odds for news items
   - Test extracting team names from different formats
   - Test sorting algorithm for prioritizing favorites

5. **Affiliate Link Generator Tests**:
   - Test generating links for different sports
   - Test including event IDs and affiliate IDs

### 5.2 Integration Tests

1. Test the complete flow from fetching RSS feeds to enriching with odds data
2. Test the integration with user preferences for favorites
3. Test the display of odds and betting buttons in the news ticker

## 6. Implementation Timeline

1. **Day 1**: Implement data models (Odds, Market, Outcome)
2. **Day 2**: Implement FanDuel API service and caching
3. **Day 3**: Implement odds enrichment service and team name extraction
4. **Day 4**: Implement affiliate link generator and integration with RSS feed service
5. **Day 5**: Testing and debugging

## 7. Technical Considerations

1. **API Rate Limits**: Implement aggressive caching to avoid hitting FanDuel API rate limits
2. **Error Handling**: Ensure robust error handling for API failures
3. **Performance**: Optimize matching algorithm for large datasets
4. **Fallbacks**: Provide fallback mechanisms when odds data is unavailable
5. **Compliance**: Ensure all betting-related features comply with relevant regulations