# RSS Feed User Preferences Implementation Plan

## Overview

This document outlines the implementation plan for allowing users to customize which sports news categories they want to see in the news ticker on the login page of the AI Sports Edge app.

## Requirements

1. Allow users to customize which sports news categories they want to see in the news ticker
2. Provide a user-friendly interface for selecting preferences
3. Save user preferences to the database
4. Apply user preferences to filter the news ticker content
5. Ensure preferences persist across sessions

## Implementation Plan

### 1. User Preferences Data Model

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

### 2. User Preferences Service

Create a service for managing user preferences:

```javascript
// services/userPreferencesService.js

import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service for managing user preferences
 */
class UserPreferencesService {
  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
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
  
  /**
   * Save user preferences
   * @param {Object} preferences - User preferences to save
   * @returns {Promise<void>}
   */
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
  
  /**
   * Get default preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      sports: ['football', 'basketball', 'baseball', 'hockey'],
      bettingContentOnly: false,
      favoriteTeams: [],
      maxNewsItems: 20
    };
  }
}

export default new UserPreferencesService();
```

### 3. User Preferences Component

Create a component for managing user preferences:

```jsx
// components/UserPreferences.jsx

import React, { useState, useEffect } from 'react';
import userPreferencesService from '../services/userPreferencesService';
import '../styles/user-preferences.css';

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

export default UserPreferences;
```

### 4. Update the NewsTicker Component

Update the NewsTicker component to include a preferences button and modal:

```jsx
// components/NewsTicker.jsx

import React, { useState, useEffect, useRef } from 'react';
import UserPreferences from './UserPreferences';
import userPreferencesService from '../services/userPreferencesService';
import '../styles/news-ticker.css';

const NewsTicker = ({ maxItems = 10, showSource = true, autoScroll = true, scrollSpeed = 50, pauseOnHover = true }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const tickerRef = useRef(null);
  
  // Load user preferences and news on mount
  useEffect(() => {
    const loadPreferencesAndNews = async () => {
      try {
        const prefs = await userPreferencesService.getUserPreferences();
        setUserPreferences(prefs);
        fetchNews(prefs);
      } catch (error) {
        console.error('Error loading preferences:', error);
        fetchNews();
      }
    };
    
    loadPreferencesAndNews();
  }, []);
  
  // Fetch news from the API
  const fetchNews = async (prefs = userPreferences) => {
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
  
  // Handle auto-scrolling
  useEffect(() => {
    if (!autoScroll || loading || error || !newsItems.length) return;
    
    let scrollInterval;
    let isPaused = false;
    
    const startScrolling = () => {
      scrollInterval = setInterval(() => {
        if (tickerRef.current && !isPaused) {
          tickerRef.current.scrollLeft += 1;
          
          // Reset scroll position when reaching the end
          if (
            tickerRef.current.scrollLeft >=
            tickerRef.current.scrollWidth - tickerRef.current.clientWidth
          ) {
            tickerRef.current.scrollLeft = 0;
          }
        }
      }, scrollSpeed);
    };
    
    startScrolling();
    
    // Pause scrolling on hover if enabled
    if (pauseOnHover && tickerRef.current) {
      const ticker = tickerRef.current;
      
      const handleMouseEnter = () => {
        isPaused = true;
      };
      
      const handleMouseLeave = () => {
        isPaused = false;
      };
      
      ticker.addEventListener('mouseenter', handleMouseEnter);
      ticker.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        clearInterval(scrollInterval);
        ticker.removeEventListener('mouseenter', handleMouseEnter);
        ticker.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
    
    return () => clearInterval(scrollInterval);
  }, [autoScroll, loading, error, newsItems, scrollSpeed, pauseOnHover]);
  
  // Handle preference save
  const handlePreferenceSave = (newPreferences) => {
    setUserPreferences(newPreferences);
    fetchNews(newPreferences);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker-loading">
          <div className="spinner"></div>
          <p>Loading news...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!newsItems.length) {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker-empty">
          <p>No news items available.</p>
        </div>
      </div>
    );
  }
  
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
      
      <div className="news-ticker" ref={tickerRef}>
        <div className="news-ticker-items">
          {newsItems.map((item, index) => (
            <a
              key={`${item.guid || item.link}-${index}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`news-ticker-item ${item.isBettingContent ? 'betting-content' : ''}`}
              onClick={() => {
                // Track click for analytics
                try {
                  // Analytics tracking code here
                } catch (err) {
                  console.error('Error tracking news item click:', err);
                }
              }}
            >
              {showSource && item.source && (
                <span className="news-source">{item.source}</span>
              )}
              <span className="news-title">{item.title}</span>
            </a>
          ))}
        </div>
      </div>
      
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
};

export default NewsTicker;
```

### 5. Create CSS for User Preferences

Create a CSS file for the user preferences component:

```css
/* styles/user-preferences.css */

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

/* Modal styles */
.preferences-modal {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
}
```

### 6. Update the News Ticker CSS

Update the news ticker CSS to include styles for the preferences button:

```css
/* styles/news-ticker.css */

/* Add styles for the preferences button */
.news-ticker-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.news-ticker-header h3 {
  color: #333;
  font-size: 1.1rem;
  margin: 0;
}

.preferences-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
}

.preferences-button:hover {
  color: #4a80ff;
}
```

### 7. Update the API Endpoint

Update the API endpoint to handle user preferences:

```javascript
// api/rssFeeds/index.js

// Update the POST endpoint to handle user preferences
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

### 8. Update the LoginPage Component

Update the LoginPage component to pass user preferences to the NewsTicker:

```jsx
// pages/LoginPage.jsx

// Update the NewsTicker component usage
<div className="login-news-ticker">
  <NewsTicker
    maxItems={10}
    showSource={true}
    autoScroll={true}
    scrollSpeed={50}
    pauseOnHover={true}
  />
</div>
```

## Testing Plan

1. Test user preferences UI
   - Test saving and loading preferences
   - Test sport category selection
   - Test betting content toggle
   - Test favorite teams input
   - Test max items selection

2. Test integration with NewsTicker
   - Test that preferences are applied to the news ticker
   - Test that preferences persist across sessions
   - Test that preferences can be updated

3. Test API endpoint
   - Test that the API endpoint handles user preferences correctly
   - Test that the API returns filtered news items based on preferences

## Deployment Steps

1. Deploy the updated code to the development environment
2. Test the user preferences feature in the development environment
3. Fix any issues found during testing
4. Deploy to production

## Future Enhancements

1. Add more preference options (e.g., news sources, update frequency)
2. Implement machine learning for better content relevance scoring
3. Add support for more sports categories
4. Implement natural language processing for better keyword extraction
5. Add analytics to track which preferences users select