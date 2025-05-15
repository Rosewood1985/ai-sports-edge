# Geolocation-Enhanced RSS Feed Integration Plan

## Overview

This document outlines the plan for enhancing the RSS feed integration with geolocation capabilities using the IPgeolocation.io API. This enhancement will improve the accuracy of local team recommendations and provide localized odds suggestions to users.

## Objectives

1. Integrate the IPgeolocation.io API to determine user location
2. Enhance content filtering to prioritize news about local teams
3. Provide localized odds suggestions based on user location
4. Respect user privacy and comply with relevant regulations

## Implementation Plan

### 1. Geolocation Service Integration

Create a new service to handle geolocation functionality:

```javascript
// services/geolocationService.js

import axios from 'axios';

const IPGEOLOCATION_API_KEY = process.env.IPGEOLOCATION_API_KEY;
const IPGEOLOCATION_API_URL = 'https://api.ipgeolocation.io/ipgeo';

/**
 * Service for handling geolocation functionality
 */
class GeolocationService {
  /**
   * Get user location based on IP address
   * @returns {Promise<Object>} User location data
   */
  async getUserLocation() {
    try {
      // Check if we have cached location data
      const cachedLocation = localStorage.getItem('userLocation');
      const cachedTimestamp = localStorage.getItem('userLocationTimestamp');
      
      // If we have cached data and it's less than 24 hours old, use it
      if (cachedLocation && cachedTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(cachedTimestamp, 10);
        
        if (now - timestamp < 24 * 60 * 60 * 1000) {
          return JSON.parse(cachedLocation);
        }
      }
      
      // Otherwise, fetch new location data
      const response = await axios.get(IPGEOLOCATION_API_URL, {
        params: {
          apiKey: IPGEOLOCATION_API_KEY
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Status code ${response.status}`);
      }
      
      const locationData = {
        city: response.data.city,
        state: response.data.state_prov,
        country: response.data.country_name,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.time_zone.name
      };
      
      // Cache the location data
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      localStorage.setItem('userLocationTimestamp', Date.now().toString());
      
      return locationData;
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }
  
  /**
   * Get local teams based on user location
   * @param {Object} location - User location data
   * @returns {Promise<Array>} Local teams
   */
  async getLocalTeams(location) {
    try {
      // This would typically involve a database lookup or API call
      // For now, we'll use a simplified mapping of locations to teams
      
      const { city, state } = location;
      
      // Example mapping of cities to local teams
      const cityTeamMap = {
        'New York': ['New York Yankees', 'New York Mets', 'New York Giants', 'New York Jets', 'New York Knicks', 'Brooklyn Nets'],
        'Los Angeles': ['Los Angeles Dodgers', 'Los Angeles Angels', 'Los Angeles Rams', 'Los Angeles Chargers', 'Los Angeles Lakers', 'Los Angeles Clippers'],
        'Chicago': ['Chicago Cubs', 'Chicago White Sox', 'Chicago Bears', 'Chicago Bulls'],
        'Boston': ['Boston Red Sox', 'New England Patriots', 'Boston Celtics', 'Boston Bruins'],
        'Philadelphia': ['Philadelphia Phillies', 'Philadelphia Eagles', 'Philadelphia 76ers', 'Philadelphia Flyers'],
        // Add more cities as needed
      };
      
      // Check if we have teams for the user's city
      if (cityTeamMap[city]) {
        return cityTeamMap[city];
      }
      
      // If not, check for teams in the user's state
      // This would involve a more complex lookup in a real implementation
      
      return [];
    } catch (error) {
      console.error('Error getting local teams:', error);
      return [];
    }
  }
  
  /**
   * Get localized odds suggestions
   * @param {Object} location - User location data
   * @returns {Promise<Array>} Localized odds suggestions
   */
  async getLocalizedOddsSuggestions(location) {
    try {
      // This would typically involve a database lookup or API call
      // For now, we'll return a simplified response
      
      const localTeams = await this.getLocalTeams(location);
      
      // Generate odds suggestions for local teams
      // In a real implementation, this would fetch actual odds data
      
      return localTeams.map(team => ({
        team,
        game: `${team} vs. Opponent`,
        odds: Math.random() * 3 + 1, // Random odds between 1 and 4
        suggestion: Math.random() > 0.5 ? 'bet' : 'avoid'
      }));
    } catch (error) {
      console.error('Error getting localized odds suggestions:', error);
      return [];
    }
  }
}

export default new GeolocationService();
```

### 2. Enhanced Content Filtering

Update the content filtering module to incorporate geolocation data:

```javascript
// api/rssFeeds/contentFiltering.js

// Add local team boosting to the relevance scoring algorithm
function calculateRelevanceScore(item, userPreferences) {
  let score = 0;
  const { title, description } = item;
  const content = `${title} ${description}`.toLowerCase();
  
  // ... existing scoring logic ...
  
  // Boost score for local teams if available
  if (userPreferences.localTeams && userPreferences.localTeams.length) {
    userPreferences.localTeams.forEach(team => {
      if (content.includes(team.toLowerCase())) {
        score += 30; // Higher boost for local teams
      }
    });
  }
  
  // ... rest of the scoring logic ...
  
  return Math.max(0, Math.min(100, score));
}
```

### 3. Update User Preferences Component

Enhance the user preferences component to include location-based settings:

```jsx
// web/components/UserPreferences.js

// Add location settings to the component
const [useLocation, setUseLocation] = useState(true);
const [localTeams, setLocalTeams] = useState([]);

// Load location data on mount
useEffect(() => {
  const loadLocationData = async () => {
    if (useLocation) {
      try {
        const location = await geolocationService.getUserLocation();
        
        if (location) {
          const teams = await geolocationService.getLocalTeams(location);
          setLocalTeams(teams);
          
          // Update preferences with local teams
          setPreferences(prev => ({
            ...prev,
            localTeams: teams
          }));
        }
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    }
  };
  
  loadLocationData();
}, [useLocation]);

// Add location settings UI
<div className="preferences-section">
  <h3>Location Settings</h3>
  
  <label className="location-option">
    <input
      type="checkbox"
      checked={useLocation}
      onChange={() => setUseLocation(!useLocation)}
    />
    Use my location to personalize content
  </label>
  
  {useLocation && localTeams.length > 0 && (
    <div className="local-teams">
      <p>We've identified these local teams:</p>
      <ul>
        {localTeams.map(team => (
          <li key={team}>{team}</li>
        ))}
      </ul>
    </div>
  )}
</div>
```

### 4. Update News Ticker Component

Enhance the news ticker component to display localized odds suggestions:

```jsx
// web/components/NewsTicker.js

// Add localized odds suggestions
const [oddsSuggestions, setOddsSuggestions] = useState([]);

// Load odds suggestions when preferences change
useEffect(() => {
  const loadOddsSuggestions = async () => {
    if (preferences?.useLocation) {
      try {
        const location = await geolocationService.getUserLocation();
        
        if (location) {
          const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);
          setOddsSuggestions(suggestions);
        }
      } catch (error) {
        console.error('Error loading odds suggestions:', error);
      }
    }
  };
  
  loadOddsSuggestions();
}, [preferences]);

// Add odds suggestions to the news ticker
{oddsSuggestions.length > 0 && (
  <div className="odds-suggestions">
    <h4>Local Betting Opportunities</h4>
    <div className="suggestions-list">
      {oddsSuggestions.map((suggestion, index) => (
        <div key={index} className="suggestion-item">
          <span className="suggestion-game">{suggestion.game}</span>
          <span className="suggestion-odds">{suggestion.odds.toFixed(2)}</span>
          <span className={`suggestion-action ${suggestion.suggestion}`}>
            {suggestion.suggestion === 'bet' ? 'Consider Betting' : 'Avoid'}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

### 5. API Configuration

Update the server configuration to include the IPgeolocation.io API key:

```javascript
// .env file
IPGEOLOCATION_API_KEY=your_api_key_here
```

```javascript
// server.js

// Load environment variables
require('dotenv').config();

// Make API key available to the client
app.get('/api/config', (req, res) => {
  res.json({
    ipgeolocationApiKey: process.env.IPGEOLOCATION_API_KEY
  });
});
```

### 6. Privacy Considerations

Implement privacy controls and compliance measures:

1. Add a privacy notice to inform users about location data collection
2. Provide an opt-out mechanism in the user preferences
3. Ensure location data is stored securely and not shared with third parties
4. Comply with relevant regulations such as GDPR and CCPA

## Technical Requirements

1. IPgeolocation.io API key
2. Axios for API requests
3. Local storage for caching location data
4. Database for storing team-location mappings (optional)

## Implementation Timeline

1. **Week 1**: Set up geolocation service and API integration
2. **Week 2**: Enhance content filtering with location data
3. **Week 3**: Update user preferences and news ticker components
4. **Week 4**: Testing and privacy compliance

## Success Metrics

1. Increased engagement with local team news
2. Higher click-through rates on localized odds suggestions
3. Improved user satisfaction with content relevance

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| API rate limits | Implement caching to reduce API calls |
| Inaccurate location data | Allow users to manually set their location |
| Privacy concerns | Provide clear opt-out options and privacy notices |
| Regulatory compliance | Consult with legal team on data handling requirements |

## Conclusion

Integrating the IPgeolocation.io API with our RSS feed system will significantly enhance the user experience by providing more relevant local team news and odds suggestions. This implementation plan outlines the necessary steps to achieve this integration while respecting user privacy and ensuring regulatory compliance.