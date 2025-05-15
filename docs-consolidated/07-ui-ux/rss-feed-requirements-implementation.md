# RSS Feed Requirements Implementation

## Overview

This document outlines the implementation plan for the two key requirements of the RSS feed integration:

1. **Content filtering**: Implementing keyword-based filtering to ensure only the most relevant sports odds appear for the user.
2. **User preferences**: Allow users to customize which sports news categories they want to see in the news ticker.

## 1. Content Filtering Implementation

### Objective

Implement a keyword-based filtering system that ensures users see the most relevant sports odds and news content based on their interests.

### Implementation Details

#### 1.1 Keyword Database

Create a comprehensive database of keywords for different sports categories and betting-related content:

```javascript
// Sports-specific keywords
const SPORTS_KEYWORDS = {
  football: ['nfl', 'football', 'quarterback', 'touchdown', 'field goal', 'super bowl'],
  basketball: ['nba', 'basketball', 'dunk', 'three-pointer', 'court', 'finals'],
  baseball: ['mlb', 'baseball', 'home run', 'pitcher', 'inning', 'world series'],
  hockey: ['nhl', 'hockey', 'goal', 'puck', 'ice', 'stanley cup'],
  soccer: ['soccer', 'football', 'goal', 'pitch', 'fifa', 'world cup'],
  mma: ['ufc', 'mma', 'fighter', 'knockout', 'submission', 'octagon'],
  formula1: ['f1', 'formula 1', 'racing', 'driver', 'circuit', 'grand prix']
};

// Betting-related keywords
const BETTING_KEYWORDS = [
  'odds', 'betting', 'wager', 'bet', 'gamble', 'sportsbook', 'bookmaker',
  'spread', 'line', 'moneyline', 'parlay', 'prop', 'over/under',
  'underdog', 'favorite', 'prediction', 'pick', 'forecast', 'handicap', 'vegas'
];
```

#### 1.2 Relevance Scoring Algorithm

Develop an algorithm that calculates a relevance score for each news item based on multiple factors:

1. **Sport relevance**: Match keywords from the user's preferred sports
2. **Betting content**: Identify betting-related content
3. **Team relevance**: Match the user's favorite teams
4. **Recency**: Prioritize more recent content

```javascript
function calculateRelevanceScore(item, userPreferences) {
  let score = 0;
  const { title, description } = item;
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
  
  // Check for recency
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
```

#### 1.3 Filtering Implementation

Implement the filtering logic that applies the relevance scoring and returns filtered items:

```javascript
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
```

#### 1.4 Betting Content Identification

Create a function to identify betting-related content:

```javascript
function isBettingContent(item) {
  const { title, description } = item;
  const content = `${title} ${description}`.toLowerCase();
  
  return BETTING_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}
```

#### 1.5 Integration with RSS Feed Service

Integrate the content filtering with the RSS feed service:

```javascript
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
```

## 2. User Preferences Implementation

### Objective

Allow users to customize which sports news categories they want to see in the news ticker, providing a personalized news experience.

### Implementation Details

#### 2.1 User Preferences Data Model

Create a data model for storing user preferences in Firestore:

```javascript
// User Preferences Schema
{
  userId: string,           // Firebase Auth user ID
  sports: string[],         // Array of sport categories (e.g., "football", "basketball")
  bettingContentOnly: boolean, // Whether to show only betting-related content
  favoriteTeams: string[],  // Array of favorite team names
  maxNewsItems: number,     // Maximum number of news items to display
  createdAt: timestamp,     // When the preferences were first created
  updatedAt: timestamp      // When the preferences were last updated
}
```

#### 2.2 User Preferences Service

Create a service for managing user preferences:

```javascript
class UserPreferencesService {
  // Get user preferences
  async getUserPreferences() {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        return this.getDefaultPreferences();
      }
      
      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      
      if (userPrefsDoc.exists()) {
        return userPrefsDoc.data();
      } else {
        // Create default preferences if none exist
        const defaultPrefs = this.getDefaultPreferences();
        await this.saveUserPreferences(defaultPrefs);
        return defaultPrefs;
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  // Save user preferences
  async saveUserPreferences(preferences) {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsDoc = await getDoc(userPrefsRef);
      
      if (userPrefsDoc.exists()) {
        // Update existing preferences
        await updateDoc(userPrefsRef, {
          ...preferences,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new preferences
        await setDoc(userPrefsRef, {
          ...preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }
  
  // Get default preferences
  getDefaultPreferences() {
    return {
      sports: ['football', 'basketball', 'baseball', 'hockey'],
      bettingContentOnly: false,
      favoriteTeams: [],
      maxNewsItems: 20
    };
  }
}
```

#### 2.3 User Preferences UI Component

Create a user interface for managing preferences:

```jsx
const UserPreferences = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    sports: [],
    bettingContentOnly: false,
    favoriteTeams: [],
    maxNewsItems: 20
  });
  
  const sportOptions = [
    { id: 'football', name: 'Football (NFL)' },
    { id: 'basketball', name: 'Basketball (NBA)' },
    { id: 'baseball', name: 'Baseball (MLB)' },
    { id: 'hockey', name: 'Hockey (NHL)' },
    { id: 'soccer', name: 'Soccer' },
    { id: 'mma', name: 'MMA/UFC' },
    { id: 'formula1', name: 'Formula 1' }
  ];
  
  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userPrefs = await userPreferencesService.getUserPreferences();
        setPreferences(userPrefs);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Handle sport selection
  const handleSportToggle = (sportId) => {
    setPreferences(prev => {
      const sports = [...prev.sports];
      
      if (sports.includes(sportId)) {
        return { ...prev, sports: sports.filter(id => id !== sportId) };
      } else {
        return { ...prev, sports: [...sports, sportId] };
      }
    });
  };
  
  // Handle betting content toggle
  const handleBettingToggle = () => {
    setPreferences(prev => ({
      ...prev,
      bettingContentOnly: !prev.bettingContentOnly
    }));
  };
  
  // Handle max items change
  const handleMaxItemsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPreferences(prev => ({
      ...prev,
      maxNewsItems: value
    }));
  };
  
  // Handle favorite team input
  const handleTeamInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const team = e.target.value.trim();
      
      if (!preferences.favoriteTeams.includes(team)) {
        setPreferences(prev => ({
          ...prev,
          favoriteTeams: [...prev.favoriteTeams, team]
        }));
      }
      
      e.target.value = '';
    }
  };
  
  // Remove a favorite team
  const removeTeam = (team) => {
    setPreferences(prev => ({
      ...prev,
      favoriteTeams: prev.favoriteTeams.filter(t => t !== team)
    }));
  };
  
  // Save preferences
  const savePreferences = async () => {
    try {
      setLoading(true);
      await userPreferencesService.saveUserPreferences(preferences);
      
      if (onSave) {
        onSave(preferences);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render UI
  // ...
}
```

#### 2.4 News Ticker Integration

Update the news ticker component to use user preferences:

```jsx
const NewsTicker = ({ maxItems = 10, showSource = true, autoScroll = true, scrollSpeed = 50, pauseOnHover = true, userPreferences = null }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(userPreferences);
  
  // Load user preferences and news on mount
  useEffect(() => {
    const loadPreferencesAndNews = async () => {
      try {
        // If userPreferences prop is provided, use it
        if (userPreferences) {
          setPreferences(userPreferences);
          fetchNews(userPreferences);
        } else {
          // Otherwise, load from service
          const prefs = await userPreferencesService.getUserPreferences();
          setPreferences(prefs);
          fetchNews(prefs);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        fetchNews();
      }
    };
    
    loadPreferencesAndNews();
  }, [userPreferences]);
  
  // Fetch news from the API
  const fetchNews = async (prefs = preferences) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rss-feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userPreferences: prefs })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      setNewsItems(data.items.slice(0, maxItems));
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle preference save
  const handlePreferenceSave = (newPreferences) => {
    setPreferences(newPreferences);
    fetchNews(newPreferences);
  };
  
  // Render UI with preferences button
  return (
    <div className="news-ticker-container">
      <div className="news-ticker-header">
        <h3>Sports News</h3>
        <button
          className="preferences-button"
          onClick={() => setShowPreferences(true)}
          aria-label="News preferences"
        >
          <i className="fa fa-cog"></i>
        </button>
      </div>
      
      {/* News ticker content */}
      
      {showPreferences && (
        <div className="preferences-modal">
          <UserPreferences
            onClose={() => setShowPreferences(false)}
            onSave={handlePreferenceSave}
          />
        </div>
      )}
    </div>
  );
}
```

#### 2.5 API Endpoint for User Preferences

Create an API endpoint that handles user preferences:

```javascript
// POST endpoint for RSS feeds with user preferences
router.post('/', async (req, res) => {
  try {
    const { userPreferences } = req.body;
    let feedUrls = [...DEFAULT_FEEDS];
    
    // Add sport-specific feeds based on user preferences
    if (userPreferences && userPreferences.sports && userPreferences.sports.length > 0) {
      userPreferences.sports.forEach(sport => {
        if (SPORT_FEEDS[sport]) {
          feedUrls = [...feedUrls, ...SPORT_FEEDS[sport]];
        }
      });
    }
    
    // Remove duplicates
    feedUrls = [...new Set(feedUrls)];
    
    const feeds = await fetchAndProcessFeeds(feedUrls, userPreferences);
    res.json({ items: feeds });
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});
```

## Implementation Timeline

1. **Week 1**: Implement content filtering module
   - Create keyword database
   - Implement relevance scoring algorithm
   - Create betting content identification

2. **Week 2**: Implement user preferences
   - Create data model
   - Implement preferences service
   - Create preferences UI component

3. **Week 3**: Integration and testing
   - Integrate content filtering with RSS feed service
   - Integrate user preferences with news ticker
   - Test functionality

## Testing Plan

1. **Content Filtering Tests**
   - Test relevance scoring with different content
   - Test betting content identification
   - Test filtering based on user preferences

2. **User Preferences Tests**
   - Test saving and loading preferences
   - Test UI component functionality
   - Test integration with news ticker

## Conclusion

This implementation plan addresses the two key requirements for the RSS feed integration:

1. **Content filtering** is implemented through a comprehensive keyword database, relevance scoring algorithm, and betting content identification.

2. **User preferences** are implemented through a data model, service, and UI component that allows users to customize their news feed.

The integration of these features will provide users with a personalized news experience that shows the most relevant sports content based on their interests.