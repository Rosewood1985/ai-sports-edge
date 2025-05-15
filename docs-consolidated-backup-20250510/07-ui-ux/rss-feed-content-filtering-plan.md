# RSS Feed Content Filtering Implementation Plan

## Overview

This document outlines the implementation plan for adding content filtering and user preferences to the RSS feed integration in the AI Sports Edge app.

## Requirements

1. **Content filtering**: Implement keyword-based filtering to ensure only the most relevant sports odds appear for the user.
2. **User preferences**: Allow users to customize which sports news categories they want to see in the news ticker.

## Implementation Plan

### 1. Content Filtering Module

Create a new module `contentFiltering.js` in the `api/rssFeeds` directory to handle keyword-based filtering of RSS feed content.

```javascript
// api/rssFeeds/contentFiltering.js

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
  formula1: ['f1', 'formula 1', 'racing', 'driver', 'circuit', 'grand prix']
};

// Keywords for betting content
const BETTING_KEYWORDS = [
  'odds', 'betting', 'wager', 'bet', 'gamble', 'sportsbook', 'bookmaker',
  'spread', 'line', 'moneyline', 'parlay', 'prop', 'over/under',
  'underdog', 'favorite', 'prediction', 'pick', 'forecast', 'handicap', 'vegas'
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
  BETTING_KEYWORDS
};
```

### 2. User Preferences Component

Create a new component `UserSportsPreferences.js` in the `web/components` directory to allow users to customize their news feed preferences.

```javascript
// web/components/UserSportsPreferences.js

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../styles/user-preferences.css';

/**
 * Component for managing user sports news preferences
 * @returns {JSX.Element} The UserSportsPreferences component
 */
const UserSportsPreferences = ({ onClose, onSave }) => {
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
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        
        if (userId) {
          const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
          
          if (userPrefsDoc.exists()) {
            const userPrefs = userPrefsDoc.data();
            setPreferences({
              sports: userPrefs.sports || [],
              bettingContentOnly: userPrefs.bettingContentOnly || false,
              favoriteTeams: userPrefs.favoriteTeams || [],
              maxNewsItems: userPrefs.maxNewsItems || 20
            });
          }
        }
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
      
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        await setDoc(doc(db, 'userPreferences', userId), preferences);
        
        if (onSave) {
          onSave(preferences);
        }
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
  
  if (loading) {
    return (
      <div className="user-preferences-loading">
        <div className="spinner"></div>
        <p>Loading preferences...</p>
      </div>
    );
  }
  
  return (
    <div className="user-preferences-container">
      <h2>News Feed Preferences</h2>
      
      <div className="preferences-section">
        <h3>Sports Categories</h3>
        <p>Select the sports you're interested in:</p>
        
        <div className="sports-options">
          {sportOptions.map(sport => (
            <label key={sport.id} className="sport-option">
              <input
                type="checkbox"
                checked={preferences.sports.includes(sport.id)}
                onChange={() => handleSportToggle(sport.id)}
              />
              {sport.name}
            </label>
          ))}
        </div>
      </div>
      
      <div className="preferences-section">
        <h3>Content Type</h3>
        
        <label className="betting-option">
          <input
            type="checkbox"
            checked={preferences.bettingContentOnly}
            onChange={handleBettingToggle}
          />
          Show betting-related content only
        </label>
      </div>
      
      <div className="preferences-section">
        <h3>Favorite Teams</h3>
        <p>Add your favorite teams to prioritize related news:</p>
        
        <div className="teams-input">
          <input
            type="text"
            placeholder="Type team name and press Enter"
            onKeyDown={handleTeamInput}
          />
        </div>
        
        <div className="teams-list">
          {preferences.favoriteTeams.map(team => (
            <div key={team} className="team-tag">
              {team}
              <button onClick={() => removeTeam(team)}>×</button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="preferences-section">
        <h3>Display Settings</h3>
        
        <div className="max-items-setting">
          <label>
            Maximum news items to display:
            <select
              value={preferences.maxNewsItems}
              onChange={handleMaxItemsChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </label>
        </div>
      </div>
      
      <div className="preferences-actions">
        <button
          className="cancel-button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="save-button"
          onClick={savePreferences}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default UserSportsPreferences;
```

### 3. Update the RSS Feed Service

Modify the existing `fetchRssFeeds.js` to incorporate the content filtering module.

```javascript
// api/rssFeeds/fetchRssFeeds.js

// Import the content filtering module
const { filterByRelevance, isBettingContent } = require('./contentFiltering');

// In the fetchAndProcessFeeds function, add content filtering
async function fetchAndProcessFeeds(feedUrls, userPreferences = {}) {
  // ... existing code ...
  
  // Apply content filtering based on user preferences
  let processedItems = allItems.map(item => ({
    ...item,
    isBettingContent: isBettingContent(item)
  }));
  
  // Apply relevance filtering if user preferences are provided
  if (Object.keys(userPreferences).length > 0) {
    processedItems = filterByRelevance(processedItems, userPreferences);
  }
  
  // Limit the number of items based on user preferences
  const maxItems = userPreferences.maxNewsItems || 20;
  return processedItems.slice(0, maxItems);
}
```

### 4. Update the NewsTicker Component

Modify the `NewsTicker.js` component to use the user preferences for filtering content.

```javascript
// web/components/NewsTicker.js

// Add user preferences state and modal
const [showPreferences, setShowPreferences] = useState(false);
const [userPreferences, setUserPreferences] = useState({
  sports: [],
  bettingContentOnly: false,
  favoriteTeams: [],
  maxNewsItems: 20
});

// Load user preferences on mount
useEffect(() => {
  const loadUserPreferences = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
        
        if (userPrefsDoc.exists()) {
          setUserPreferences(userPrefsDoc.data());
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };
  
  loadUserPreferences();
}, []);

// Add preferences button to the ticker
<div className="news-ticker-container">
  <div className="news-ticker-header">
    <h3>Sports News</h3>
    <button
      className="preferences-button"
      onClick={() => setShowPreferences(true)}
    >
      <i className="fa fa-cog"></i>
    </button>
  </div>
  
  {/* ... existing ticker content ... */}
  
  {showPreferences && (
    <div className="preferences-modal">
      <UserSportsPreferences
        onClose={() => setShowPreferences(false)}
        onSave={(prefs) => {
          setUserPreferences(prefs);
          fetchNews(); // Refetch news with new preferences
        }}
      />
    </div>
  )}
</div>

// Update the fetchNews function to pass user preferences
const fetchNews = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/rss-feeds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userPreferences })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    const data = await response.json();
    setNewsItems(data.items);
  } catch (err) {
    console.error('Error fetching news:', err);
    setError('Failed to load news. Please try again later.');
  } finally {
    setLoading(false);
  }
};
```

### 5. Create CSS for User Preferences

Create a new CSS file for the user preferences component.

```css
/* web/styles/user-preferences.css */

.user-preferences-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  padding: 24px;
  width: 100%;
}

.user-preferences-container h2 {
  border-bottom: 1px solid #eee;
  color: #333;
  font-size: 1.5rem;
  margin: 0 0 20px;
  padding-bottom: 10px;
}

.preferences-section {
  margin-bottom: 24px;
}

.preferences-section h3 {
  color: #444;
  font-size: 1.2rem;
  margin: 0 0 12px;
}

.preferences-section p {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 12px;
}

.sports-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.sport-option, .betting-option {
  align-items: center;
  display: flex;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.sport-option input, .betting-option input {
  margin-right: 8px;
}

.teams-input input {
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  padding: 8px 12px;
  width: 100%;
}

.teams-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.team-tag {
  align-items: center;
  background-color: #f0f5ff;
  border-radius: 16px;
  display: flex;
  font-size: 0.85rem;
  padding: 4px 12px;
}

.team-tag button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.1rem;
  margin-left: 6px;
  padding: 0;
}

.max-items-setting {
  align-items: center;
  display: flex;
}

.max-items-setting select {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-left: 8px;
  padding: 6px;
}

.preferences-actions {
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
}

.preferences-actions button {
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 8px 16px;
}

.cancel-button {
  background-color: transparent;
  border: 1px solid #ddd;
  color: #666;
  margin-right: 12px;
}

.save-button {
  background-color: #4a80ff;
  border: none;
  color: white;
}

.user-preferences-loading {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #4a80ff;
  height: 30px;
  margin-bottom: 16px;
  width: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 6. Create API Endpoint for RSS Feeds

Create an API endpoint to handle the RSS feed requests with user preferences.

```javascript
// api/rssFeeds/index.js

const express = require('express');
const { fetchAndProcessFeeds } = require('./fetchRssFeeds');
const router = express.Router();

// Default RSS feed URLs
const DEFAULT_FEEDS = [
  'https://www.espn.com/espn/rss/news',
  'https://www.cbssports.com/rss/headlines',
  'https://bleacherreport.com/articles/feed',
  'https://sports.yahoo.com/rss/',
  'https://theathletic.com/news/feed'
];

// Sport-specific feeds
const SPORT_FEEDS = {
  football: [
    'https://www.espn.com/espn/rss/nfl/news',
    'https://www.cbssports.com/rss/headlines/nfl',
    'https://sports.yahoo.com/nfl/rss/'
  ],
  basketball: [
    'https://www.espn.com/espn/rss/nba/news',
    'https://www.cbssports.com/rss/headlines/nba',
    'https://sports.yahoo.com/nba/rss/'
  ],
  baseball: [
    'https://www.espn.com/espn/rss/mlb/news',
    'https://www.cbssports.com/rss/headlines/mlb',
    'https://sports.yahoo.com/mlb/rss/'
  ],
  hockey: [
    'https://www.espn.com/espn/rss/nhl/news',
    'https://www.cbssports.com/rss/headlines/nhl',
    'https://sports.yahoo.com/nhl/rss/'
  ],
  mma: [
    'https://www.espn.com/espn/rss/mma/news',
    'https://www.cbssports.com/rss/headlines/mma',
    'https://sports.yahoo.com/mma/rss/'
  ],
  formula1: [
    'https://www.espn.com/espn/rss/f1/news',
    'https://sports.yahoo.com/formula-1/rss/'
  ]
};

// GET endpoint for RSS feeds
router.get('/', async (req, res) => {
  try {
    const feeds = await fetchAndProcessFeeds(DEFAULT_FEEDS);
    res.json({ items: feeds });
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});

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

module.exports = router;
```

### 7. Update Server.js to Include the RSS Feed API

Update the main server.js file to include the RSS feed API endpoint.

```javascript
// server.js

// Add the RSS feed API endpoint
const rssFeedsRouter = require('./api/rssFeeds');
app.use('/api/rss-feeds', rssFeedsRouter);
```

## Testing Plan

1. Test content filtering with various keywords and user preferences
2. Test user preferences UI for saving and loading preferences
3. Test the integration with the news ticker component
4. Test the API endpoint with different user preferences
5. Test performance with multiple RSS feeds

## Deployment Steps

1. Deploy the updated code to the development environment
2. Test the content filtering and user preferences in the development environment
3. Fix any issues found during testing
4. Deploy to production

## Future Enhancements

1. Add machine learning for better content relevance scoring
2. Implement natural language processing for better keyword extraction
3. Add support for more RSS feed sources
4. Implement caching for better performance
5. Add analytics to track which news items users interact with