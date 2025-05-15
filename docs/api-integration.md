# The Odds API Integration Documentation

This document provides comprehensive information about the integration between AI Sports Edge and The Odds API.

## Table of Contents

1. [Overview](#overview)
2. [API Configuration](#api-configuration)
3. [Data Flow](#data-flow)
4. [Caching Strategy](#caching-strategy)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Transformation](#data-transformation)
8. [Fallback Mechanisms](#fallback-mechanisms)
9. [API Endpoints](#api-endpoints)
10. [Response Format](#response-format)
11. [Implementation Examples](#implementation-examples)

## Overview

AI Sports Edge integrates with The Odds API to provide real-time sports betting odds from multiple bookmakers. The integration focuses on retrieving odds data for various sports, with a particular emphasis on comparing odds between DraftKings and FanDuel.

The integration is designed with the following principles:
- Efficient caching to minimize API calls
- Robust error handling with fallback mechanisms
- Optimized data transformation for app-specific needs
- Support for offline and degraded connectivity scenarios

## API Configuration

The API is configured in `config/apiKeys.ts` and `config/oddsApi.ts`. The main configuration parameters include:

```typescript
// From config/apiKeys.ts
export const API_KEYS = {
  ODDS_API_KEY: process.env.REACT_APP_ODDS_API_KEY || "your_api_key_here"
};

export const API_BASE_URLS = {
  ODDS_API: "https://api.the-odds-api.com/v4"
};

// Function to check if API key is configured
export const isApiKeyConfigured = (keyName: string): boolean => {
  return !!API_KEYS[keyName] && API_KEYS[keyName] !== "your_api_key_here";
};
```

## Data Flow

The data flow between AI Sports Edge and The Odds API follows this pattern:

1. User requests odds comparison data
2. App checks local cache for valid data
3. If cache is valid, use cached data
4. If cache is stale or missing, fetch from API
5. Transform API response for app-specific needs
6. Cache the transformed data
7. Display to user

This flow is implemented in the `OddsComparisonComponent.tsx` file, specifically in the `fetchOdds` and `fetchFreshData` methods.

## Caching Strategy

The app implements a multi-level caching strategy to minimize API calls:

1. **Memory Cache**: For fast access during the current session
2. **Persistent Cache**: For data availability between sessions
3. **TTL (Time-To-Live)**: Different expiration times based on data type
4. **Stale-While-Revalidate**: Use stale data while fetching fresh data in background

Implementation in `services/oddsCacheService.ts`:

```typescript
export const oddsCacheService = {
  // Get cached data with source information
  async getCachedData<T>(key: string): Promise<CachedData<T> | null> {
    try {
      // Try memory cache first (fastest)
      const memoryCache = await getMemoryCache<T>(key);
      if (memoryCache && !isCacheExpired(memoryCache.timestamp, CACHE_TTL)) {
        return { ...memoryCache, source: 'cache' };
      }
      
      // Try persistent cache next
      const persistentCache = await getPersistentCache<T>(key);
      if (persistentCache) {
        // If cache is stale but not too old, mark as stale but still use it
        if (isCacheExpired(persistentCache.timestamp, CACHE_TTL) && 
            !isCacheExpired(persistentCache.timestamp, STALE_CACHE_TTL)) {
          return { ...persistentCache, source: 'stale' };
        }
        
        // If cache is not expired, use it
        if (!isCacheExpired(persistentCache.timestamp, CACHE_TTL)) {
          // Update memory cache for faster access next time
          setMemoryCache(key, persistentCache.data, persistentCache.timestamp);
          return { ...persistentCache, source: 'cache' };
        }
      }
      
      // No valid cache found
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  },
  
  // Set cached data in both memory and persistent storage
  async setCachedData<T>(key: string, data: T): Promise<void> {
    try {
      const timestamp = Date.now();
      await setMemoryCache(key, data, timestamp);
      await setPersistentCache(key, data, timestamp);
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }
};
```

## Error Handling

The integration implements comprehensive error handling with the `errorRecoveryService.ts`:

1. **Network Errors**: Handled with retries and exponential backoff
2. **API Errors**: Parsed and handled based on error type
3. **Rate Limiting**: Special handling for rate limit errors
4. **Recovery Strategies**: Different strategies based on error type

Example implementation:

```typescript
export const errorRecoveryService = {
  async handleApiError<T>(
    error: Error,
    endpoint: string,
    fetchFunction: () => Promise<T>,
    fallbackFunction: () => Promise<T>
  ): Promise<ApiResult<T>> {
    // Determine error type
    const errorType = determineErrorType(error);
    
    // Select recovery strategy
    const strategy = selectRecoveryStrategy(errorType, endpoint);
    
    // Apply recovery strategy
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return await retryWithBackoff(fetchFunction, 3);
      
      case RecoveryStrategy.FALLBACK:
        try {
          const fallbackData = await fallbackFunction();
          return { data: fallbackData, source: 'fallback' };
        } catch (fallbackError) {
          return { error: fallbackError as Error, source: 'error' };
        }
      
      case RecoveryStrategy.CACHE_ONLY:
        // Implementation omitted for brevity
        
      default:
        return { error, source: 'error' };
    }
  }
};
```

## Rate Limiting

The Odds API has rate limits that must be respected. The integration handles this by:

1. Implementing caching to reduce API calls
2. Detecting rate limit errors and backing off
3. Using a fallback mechanism when rate limited

Rate limit detection:

```typescript
if (error.message.includes('rate limit')) {
  setError('Rate limit exceeded. Please try again in a few minutes.');
  // Use fallback data
  return await fallbackFunction();
}
```

## Data Transformation

The raw API data is transformed to meet the specific needs of the app:

1. Filtering for specific bookmakers (DraftKings, FanDuel)
2. Extracting only the needed fields
3. Formatting odds for display
4. Adding app-specific metadata

Example transformation:

```typescript
// Extract DraftKings odds
let dkOdds: number | null = null;
const dkBookmaker = selectedGame.bookmakers.find((book: Bookmaker) => book.key === 'draftkings');
if (dkBookmaker && dkBookmaker.markets[0] && dkBookmaker.markets[0].outcomes[0]) {
  dkOdds = dkBookmaker.markets[0].outcomes[0].price;
  setDraftKingsOdds(dkOdds);
}

// Extract FanDuel odds
let fdOdds: number | null = null;
const fdBookmaker = selectedGame.bookmakers.find((book: Bookmaker) => book.key === 'fanduel');
if (fdBookmaker && fdBookmaker.markets[0] && fdBookmaker.markets[0].outcomes[0]) {
  fdOdds = fdBookmaker.markets[0].outcomes[0].price;
  setFanDuelOdds(fdOdds);
}
```

## Fallback Mechanisms

When the API is unavailable, the app uses several fallback mechanisms:

1. **Stale Cache**: Using slightly outdated data with a visual indicator
2. **Mock Data**: Generating realistic mock data when no cache is available
3. **Degraded Experience**: Showing limited functionality with clear user messaging

Mock data generation:

```typescript
const generateMockData = (): Game[] => {
  // Get sport info based on selected sport
  const sportInfo = AVAILABLE_SPORTS.find(sport => sport.key === selectedSport) || AVAILABLE_SPORTS[0];
  
  // Generate appropriate teams based on sport
  let homeTeam = 'Home Team';
  let awayTeam = 'Away Team';
  
  switch (selectedSport) {
    case 'basketball_nba':
      homeTeam = 'Los Angeles Lakers';
      awayTeam = 'Boston Celtics';
      break;
    // Other sports omitted for brevity
  }
  
  return [{
    id: 'mock-game-1',
    sport_key: sportInfo.key,
    sport_title: sportInfo.name,
    commence_time: new Date().toISOString(),
    home_team: homeTeam,
    away_team: awayTeam,
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [{
          key: 'h2h',
          outcomes: [{
            name: 'Los Angeles Lakers',
            price: -110
          }]
        }]
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        markets: [{
          key: 'h2h',
          outcomes: [{
            name: 'Los Angeles Lakers',
            price: -105
          }]
        }]
      }
    ]
  }];
};
```

## API Endpoints

The integration primarily uses the following endpoints from The Odds API:

1. **Sports List**: `GET /sports`
   - Returns a list of available sports
   - Used to populate the sport selector

2. **Odds**: `GET /sports/{sport}/odds`
   - Returns odds for a specific sport
   - Parameters:
     - `apiKey`: Your API key
     - `regions`: Regions to include (e.g., 'us')
     - `markets`: Markets to include (e.g., 'h2h')
     - `oddsFormat`: Format of odds (e.g., 'american')

## Response Format

The Odds API returns data in the following format:

```json
[
  {
    "id": "29d9f2dc5c941c15a15afd3412f246a8",
    "sport_key": "basketball_nba",
    "sport_title": "NBA",
    "commence_time": "2025-03-22T23:00:00Z",
    "home_team": "Los Angeles Lakers",
    "away_team": "Boston Celtics",
    "bookmakers": [
      {
        "key": "draftkings",
        "title": "DraftKings",
        "markets": [
          {
            "key": "h2h",
            "outcomes": [
              {
                "name": "Los Angeles Lakers",
                "price": -110
              },
              {
                "name": "Boston Celtics",
                "price": -110
              }
            ]
          }
        ]
      },
      {
        "key": "fanduel",
        "title": "FanDuel",
        "markets": [
          {
            "key": "h2h",
            "outcomes": [
              {
                "name": "Los Angeles Lakers",
                "price": -105
              },
              {
                "name": "Boston Celtics",
                "price": -115
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## Implementation Examples

### Basic API Call

```typescript
const fetchOdds = async (sport: string) => {
  const apiKey = API_KEYS.ODDS_API_KEY;
  const endpoint = `${API_BASE_URLS.ODDS_API}/sports/${sport}/odds`;
  
  const response = await axios.get(endpoint, {
    params: {
      apiKey,
      regions: 'us',
      markets: 'h2h',
      oddsFormat: 'american'
    }
  });
  
  return response.data;
};
```

### With Caching and Error Handling

```typescript
const fetchOddsWithCaching = async (sport: string) => {
  const cacheKey = `odds_${sport}`;
  
  // Check cache first
  const cachedData = await oddsCacheService.getCachedData<Game[]>(cacheKey);
  if (cachedData) {
    return cachedData.data;
  }
  
  // Fetch fresh data with error handling
  try {
    const data = await errorRecoveryService.handleApiError(
      { message: 'Initial fetch attempt' },
      `sports/${sport}/odds`,
      () => fetchOdds(sport),
      () => generateMockData(sport)
    );
    
    // Cache the data if it's from the API
    if (data.source === 'api') {
      await oddsCacheService.setCachedData(cacheKey, data.data);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
};
```

This documentation provides a comprehensive overview of the integration between AI Sports Edge and The Odds API, covering all aspects from configuration to implementation details.