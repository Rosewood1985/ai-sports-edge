import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserPreferences from './UserPreferences';
import geolocationService from '../../services/geolocationService';
import '../styles/news-ticker.css';
import espnApiWrapper from '../../api/ml-sports-edge/data/espnApiWrapper';

/**
 * News ticker component for displaying scrolling news headlines
 * @returns {JSX.Element} News ticker component
 */
const NewsTicker = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [oddsSuggestions, setOddsSuggestions] = useState([]);
  const [espnOdds, setEspnOdds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    // Load preferences from localStorage if available
    const savedPreferences = localStorage.getItem('newsTickerPreferences');
    return savedPreferences ? JSON.parse(savedPreferences) : {
      sports: [],
      bettingContentOnly: false,
      favoriteTeams: [],
      maxItems: 10,
      useLocation: true,
      localTeams: [],
      useESPN: true
    };
  });
  
  const tickerRef = useRef(null);
  const scrollInterval = useRef(null);
  
  // Fetch news items on mount and when preferences change
  useEffect(() => {
    fetchNewsItems();
    
    // Start auto-scrolling
    startScrolling();
    
    return () => {
      // Clean up scroll interval on unmount
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [preferences]);
  
  // Load location data and odds suggestions when preferences change
  useEffect(() => {
    const loadLocationData = async () => {
      if (preferences.useLocation) {
        try {
          const location = await geolocationService.getUserLocation();
          
          if (location) {
            // Get local teams
            const teams = await geolocationService.getLocalTeams(location);
            
            // Update preferences with local teams
            setPreferences(prev => ({
              ...prev,
              localTeams: teams
            }));
            
            // Save updated preferences to localStorage
            localStorage.setItem('newsTickerPreferences', JSON.stringify({
              ...preferences,
              localTeams: teams
            }));
            
            // Get localized odds suggestions
            const suggestions = await geolocationService.getLocalizedOddsSuggestions(location);
            setOddsSuggestions(suggestions);
          }
        } catch (error) {
          console.error('Error loading location data:', error);
        }
      }
    };
    
    loadLocationData();
  }, [preferences.useLocation]);
  
  // Load ESPN data when preferences change
  useEffect(() => {
    const loadESPNData = async () => {
      if (preferences.useESPN) {
        try {
          // Determine which sport to fetch based on preferences
          let sport = 'basketball';
          let league = 'nba';
          
          if (preferences.sports && preferences.sports.length > 0) {
            const sportMapping = {
              'NBA': { sport: 'basketball', league: 'nba' },
              'NFL': { sport: 'football', league: 'nfl' },
              'MLB': { sport: 'baseball', league: 'mlb' },
              'NHL': { sport: 'hockey', league: 'nhl' }
            };
            
            // Use the first preferred sport
            const preferredSport = preferences.sports[0];
            if (sportMapping[preferredSport]) {
              sport = sportMapping[preferredSport].sport;
              league = sportMapping[preferredSport].league;
            }
          }
          
          // Calculate odds based on ESPN data
          const calculatedOdds = await espnApiWrapper.calculateOdds(sport, league);
          setEspnOdds(calculatedOdds);
        } catch (error) {
          console.error('Error loading ESPN data:', error);
        }
      }
    };
    
    loadESPNData();
  }, [preferences.useESPN, preferences.sports]);
  
  /**
   * Fetch news items from the API
   */
  const fetchNewsItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/rss-feeds', { preferences });
      
      if (response.status !== 200) {
        throw new Error(`Status code ${response.status}`);
      }
      
      setNewsItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching news items:', error);
      setError('Failed to load news. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Start auto-scrolling the ticker
   */
  const startScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    
    scrollInterval.current = setInterval(() => {
      if (tickerRef.current) {
        tickerRef.current.scrollLeft += 1;
        
        // Reset scroll position when reaching the end
        if (
          tickerRef.current.scrollLeft >=
          tickerRef.current.scrollWidth - tickerRef.current.clientWidth
        ) {
          tickerRef.current.scrollLeft = 0;
        }
      }
    }, 20);
  };
  
  /**
   * Pause auto-scrolling
   */
  const pauseScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };
  
  /**
   * Resume auto-scrolling
   */
  const resumeScrolling = () => {
    if (!scrollInterval.current) {
      startScrolling();
    }
  };
  
  /**
   * Handle click on a news item
   * @param {Object} item - News item
   * @param {Event} e - Click event
   */
  const handleNewsItemClick = async (item, e) => {
    // Track click for analytics
    try {
      await axios.post('/api/rss-feeds/track-click', {
        itemId: item.guid || item.link,
        title: item.title,
        source: item.source,
        categories: item.categories,
        isBettingContent: item.isBettingContent
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };
  
  /**
   * Toggle preferences modal
   */
  const togglePreferences = () => {
    setShowPreferences(!showPreferences);
  };
  
  /**
   * Save user preferences
   * @param {Object} newPreferences - New preferences
   */
  const savePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('newsTickerPreferences', JSON.stringify(newPreferences));
    setShowPreferences(false);
  };
  
  /**
   * Determine if an item is betting content
   * @param {Object} item - News item
   * @returns {boolean} True if item is betting content
   */
  const isBettingContent = (item) => {
    return item.isBettingContent || false;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker-header">
          <h3>Sports News</h3>
          <button className="preferences-button" onClick={togglePreferences}>
            ⚙️
          </button>
        </div>
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
        <div className="news-ticker-header">
          <h3>Sports News</h3>
          <button className="preferences-button" onClick={togglePreferences}>
            ⚙️
          </button>
        </div>
        <div className="news-ticker-error">{error}</div>
      </div>
    );
  }
  
  // Render empty state
  if (newsItems.length === 0) {
    return (
      <div className="news-ticker-container">
        <div className="news-ticker-header">
          <h3>Sports News</h3>
          <button className="preferences-button" onClick={togglePreferences}>
            ⚙️
          </button>
        </div>
        <div className="news-ticker-empty">No news items found. Try adjusting your preferences.</div>
        {showPreferences && (
          <UserPreferences
            preferences={preferences}
            onSave={savePreferences}
            onClose={() => setShowPreferences(false)}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="news-ticker-container">
      <div className="news-ticker-header">
        <h3>Sports News</h3>
        <button className="preferences-button" onClick={togglePreferences}>
          ⚙️
        </button>
      </div>
      
      <div
        className="news-ticker"
        ref={tickerRef}
        onMouseEnter={pauseScrolling}
        onMouseLeave={resumeScrolling}
      >
        <div className="news-ticker-items">
          {newsItems.map((item, index) => (
            <a
              key={item.guid || item.link || index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`news-ticker-item ${isBettingContent(item) ? 'betting-content' : ''}`}
              onClick={(e) => handleNewsItemClick(item, e)}
            >
              <span className="news-source">{item.source}</span>
              <span className="news-title">{item.title}</span>
            </a>
          ))}
        </div>
      </div>
      
      {/* Localized odds suggestions */}
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
      
      {/* ESPN calculated odds */}
      {espnOdds.length > 0 && (
        <div className="espn-odds">
          <h4>ESPN Calculated Odds</h4>
          <div className="espn-odds-list">
            {espnOdds.map((odds, index) => (
              <div key={index} className="espn-odds-item">
                <div className="espn-odds-game">
                  <img src={odds.homeTeam.logo} alt={odds.homeTeam.name} className="team-logo" />
                  <span className="vs">vs</span>
                  <img src={odds.awayTeam.logo} alt={odds.awayTeam.name} className="team-logo" />
                </div>
                <div className="espn-odds-details">
                  <div className="espn-odds-teams">
                    {odds.homeTeam.name} vs {odds.awayTeam.name}
                  </div>
                  <div className="espn-odds-values">
                    <span className="espn-odds-moneyline">
                      ML: {odds.odds.homeMoneyline > 0 ? '+' : ''}{odds.odds.homeMoneyline} / {odds.odds.awayMoneyline > 0 ? '+' : ''}{odds.odds.awayMoneyline}
                    </span>
                    <span className="espn-odds-spread">
                      Spread: {odds.odds.spread > 0 ? '+' : ''}{odds.odds.spread}
                    </span>
                    <span className="espn-odds-overunder">
                      O/U: {odds.odds.overUnder}
                    </span>
                  </div>
                  <a
                    href={odds.espnGameLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="espn-game-link"
                  >
                    View on ESPN
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showPreferences && (
        <UserPreferences
          preferences={preferences}
          onSave={savePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
};

export default NewsTicker;