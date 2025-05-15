# User Preferences Enhancement Implementation Plan

This document provides a detailed implementation plan for enhancing the user preferences model to support betting features, focusing on favorite teams, players, and odds display preferences.

## 1. Current User Preferences Structure

The current user preferences structure in `utils/userPreferencesService.js` includes:

```javascript
const DEFAULT_PREFERENCES = {
  rssFeeds: {
    enabledSources: ['NBA', 'NFL', 'MLB', 'NHL', 'F1', 'UFC', 'SOCCER', 'TENNIS'],
    maxItems: 10,
    refreshIntervalMinutes: 30,
    keywordFilters: {
      include: [],
      exclude: []
    }
  },
  ui: {
    newsTicker: {
      enabled: true,
      scrollSpeed: 'medium',
      pauseOnHover: true
    }
  }
};
```

## 2. Enhanced User Preferences Structure

We will extend this structure to include:

```javascript
const ENHANCED_DEFAULT_PREFERENCES = {
  rssFeeds: {
    // Existing RSS feed preferences
    enabledSources: ['NBA', 'NFL', 'MLB', 'NHL', 'F1', 'UFC', 'SOCCER', 'TENNIS'],
    maxItems: 10,
    refreshIntervalMinutes: 30,
    keywordFilters: {
      include: [],
      exclude: []
    }
  },
  favorites: {
    teams: [], // Array of favorite team IDs
    players: [], // Array of favorite player IDs
    leagues: [], // Array of favorite league IDs
    matchups: [] // Array of favorite matchup combinations (e.g., "Lakers-Celtics")
  },
  betting: {
    showOdds: true,
    oddsFormat: 'american', // american, decimal, fractional
    defaultStake: 10,
    affiliateId: 'default' // FanDuel affiliate ID
  },
  ui: {
    // Existing UI preferences
    newsTicker: {
      enabled: true,
      scrollSpeed: 'medium',
      pauseOnHover: true
    }
  }
};
```

## 3. Implementation Steps

### 3.1 Update User Preferences Service

1. Modify `utils/userPreferencesService.js` to include the new preferences structure:

```javascript
// Update DEFAULT_PREFERENCES with new fields
const DEFAULT_PREFERENCES = {
  // Existing fields...
  favorites: {
    teams: [],
    players: [],
    leagues: [],
    matchups: []
  },
  betting: {
    showOdds: true,
    oddsFormat: 'american',
    defaultStake: 10,
    affiliateId: 'default'
  },
  // Existing UI fields...
};

// Add new getter/setter methods for favorites
export function getFavoriteTeams() {
  const preferences = getUserPreferences();
  return preferences.favorites?.teams || [];
}

export function setFavoriteTeams(teams) {
  if (!Array.isArray(teams)) {
    return false;
  }
  
  const preferences = getUserPreferences();
  if (!preferences.favorites) {
    preferences.favorites = {};
  }
  preferences.favorites.teams = teams;
  return saveUserPreferences(preferences);
}

// Similar methods for players, leagues, and matchups...

// Add new getter/setter methods for betting preferences
export function getBettingPreferences() {
  const preferences = getUserPreferences();
  return preferences.betting || DEFAULT_PREFERENCES.betting;
}

export function updateBettingPreferences(bettingPrefs) {
  if (!bettingPrefs || typeof bettingPrefs !== 'object') {
    return false;
  }
  
  const preferences = getUserPreferences();
  if (!preferences.betting) {
    preferences.betting = { ...DEFAULT_PREFERENCES.betting };
  }
  
  preferences.betting = {
    ...preferences.betting,
    ...bettingPrefs
  };
  
  return saveUserPreferences(preferences);
}

// Add method to check if an item is a favorite
export function isFavoriteTeam(teamId) {
  const teams = getFavoriteTeams();
  return teams.includes(teamId);
}

// Similar methods for players, leagues, and matchups...
```

### 3.2 Update getUserPreferences Method

Ensure the `getUserPreferences` method properly merges the new fields:

```javascript
export function getUserPreferences() {
  try {
    // Try to get preferences from localStorage
    const storedPrefs = localStorage.getItem(STORAGE_KEY);

    if (storedPrefs) {
      // Parse and merge with default preferences to ensure all fields exist
      const parsedPrefs = JSON.parse(storedPrefs);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsedPrefs,
        // Ensure nested objects are properly merged
        rssFeeds: {
          ...DEFAULT_PREFERENCES.rssFeeds,
          ...(parsedPrefs.rssFeeds || {}),
          keywordFilters: {
            ...DEFAULT_PREFERENCES.rssFeeds.keywordFilters,
            ...(parsedPrefs.rssFeeds?.keywordFilters || {})
          }
        },
        favorites: {
          ...DEFAULT_PREFERENCES.favorites,
          ...(parsedPrefs.favorites || {})
        },
        betting: {
          ...DEFAULT_PREFERENCES.betting,
          ...(parsedPrefs.betting || {})
        },
        ui: {
          ...DEFAULT_PREFERENCES.ui,
          ...(parsedPrefs.ui || {}),
          newsTicker: {
            ...DEFAULT_PREFERENCES.ui.newsTicker,
            ...(parsedPrefs.ui?.newsTicker || {})
          }
        }
      };
    }

    // If no stored preferences, return defaults
    return { ...DEFAULT_PREFERENCES };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
}
```

### 3.3 Update saveUserPreferences Method

Similarly, update the `saveUserPreferences` method to handle the new fields:

```javascript
export function saveUserPreferences(preferences) {
  try {
    // Merge with existing preferences
    const currentPrefs = getUserPreferences();
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      // Ensure nested objects are properly merged
      rssFeeds: {
        ...currentPrefs.rssFeeds,
        ...(preferences.rssFeeds || {}),
        keywordFilters: {
          ...currentPrefs.rssFeeds.keywordFilters,
          ...(preferences.rssFeeds?.keywordFilters || {})
        }
      },
      favorites: {
        ...currentPrefs.favorites,
        ...(preferences.favorites || {})
      },
      betting: {
        ...currentPrefs.betting,
        ...(preferences.betting || {})
      },
      ui: {
        ...currentPrefs.ui,
        ...(preferences.ui || {}),
        newsTicker: {
          ...currentPrefs.ui.newsTicker,
          ...(preferences.ui?.newsTicker || {})
        }
      }
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs));

    // Track preference changes for analytics
    trackUserPreference('user_preferences_updated', {
      rssPreferences: !!preferences.rssFeeds,
      favoritesUpdated: !!preferences.favorites,
      bettingUpdated: !!preferences.betting,
      uiUpdated: !!preferences.ui
    });

    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}
```

## 4. Data Models for Teams, Players, and Leagues

Create data models to support the favorites selection:

### 4.1 Team Model

```javascript
// models/Team.js
export default class Team {
  constructor(id, name, league, abbreviation, logo) {
    this.id = id;
    this.name = name;
    this.league = league;
    this.abbreviation = abbreviation;
    this.logo = logo;
  }
  
  static fromAPI(apiTeam) {
    return new Team(
      apiTeam.id,
      apiTeam.name,
      apiTeam.league,
      apiTeam.abbreviation,
      apiTeam.logo
    );
  }
}
```

### 4.2 Player Model

```javascript
// models/Player.js
export default class Player {
  constructor(id, name, team, position, image) {
    this.id = id;
    this.name = name;
    this.team = team;
    this.position = position;
    this.image = image;
  }
  
  static fromAPI(apiPlayer) {
    return new Player(
      apiPlayer.id,
      apiPlayer.name,
      apiPlayer.team,
      apiPlayer.position,
      apiPlayer.image
    );
  }
}
```

### 4.3 League Model

```javascript
// models/League.js
export default class League {
  constructor(id, name, sport, logo) {
    this.id = id;
    this.name = name;
    this.sport = sport;
    this.logo = logo;
  }
  
  static fromAPI(apiLeague) {
    return new League(
      apiLeague.id,
      apiLeague.name,
      apiLeague.sport,
      apiLeague.logo
    );
  }
}
```

## 5. Services for Fetching Teams, Players, and Leagues

Create services to fetch data for favorites selection:

### 5.1 Teams Service

```javascript
// services/teamsService.js
import Team from '../models/Team';

// Cache for teams data
let teamsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all teams
 * @returns {Promise<Array<Team>>} Array of Team objects
 */
export async function fetchAllTeams() {
  // Check cache first
  if (teamsCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return teamsCache;
  }
  
  try {
    // Fetch teams from API
    const response = await fetch('/api/teams');
    const data = await response.json();
    
    // Convert to Team objects
    const teams = data.map(team => Team.fromAPI(team));
    
    // Update cache
    teamsCache = teams;
    lastFetchTime = Date.now();
    
    return teams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return teamsCache || [];
  }
}

/**
 * Search teams by name
 * @param {string} query - Search query
 * @returns {Promise<Array<Team>>} Array of matching Team objects
 */
export async function searchTeams(query) {
  const teams = await fetchAllTeams();
  
  if (!query) {
    return teams;
  }
  
  const normalizedQuery = query.toLowerCase();
  
  return teams.filter(team => 
    team.name.toLowerCase().includes(normalizedQuery) ||
    team.abbreviation.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get team by ID
 * @param {string} id - Team ID
 * @returns {Promise<Team|null>} Team object or null if not found
 */
export async function getTeamById(id) {
  const teams = await fetchAllTeams();
  return teams.find(team => team.id === id) || null;
}
```

### 5.2 Similar services for Players and Leagues

Create similar services for players and leagues with appropriate caching and search functionality.

## 6. Next Steps

After implementing the enhanced user preferences model:

1. Create the UI components for selecting favorites
2. Implement the odds data enrichment service
3. Update the news ticker to display odds and betting buttons
4. Connect betting buttons to FanDuel affiliate links

## 7. Testing Plan

1. **Unit Tests**:
   - Test the new user preferences methods
   - Test the data models
   - Test the services for fetching teams, players, and leagues

2. **Integration Tests**:
   - Test the integration between user preferences and the news ticker
   - Test the odds data enrichment with the news ticker

3. **End-to-End Tests**:
   - Test the complete flow from user selecting favorites to seeing personalized odds in the news ticker
   - Test the betting buttons and affiliate links