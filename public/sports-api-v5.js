/**
 * Sports API v5 for AI Sports Edge
 * Provides sports data, odds, and news from various sources including RSS feeds
 * Includes WNBA, NCAA, and Formula 1 odds integration with FanDuel
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the news ticker with RSS feed data
  initializeNewsTicker();
});

/**
 * Initialize the news ticker with RSS feed data
 */
async function initializeNewsTicker() {
  try {
    // Get the news ticker container
    const newsTickerContent = document.querySelector('.news-ticker-content');
    
    if (!newsTickerContent) {
      console.error('News ticker container not found');
      return;
    }
    
    // Clear any loading message
    newsTickerContent.innerHTML = '';
    
    // Fetch news from RSS feed API
    const newsItems = await fetchNewsTickerItems();
    
    if (!newsItems || newsItems.length === 0) {
      // If no news items, use fallback data
      const fallbackItems = getFallbackNewsItems();
      renderNewsItems(fallbackItems, newsTickerContent);
      return;
    }
    
    // Render news items
    renderNewsItems(newsItems, newsTickerContent);
  } catch (error) {
    console.error('Error initializing news ticker:', error);
    
    // Use fallback data if there's an error
    const fallbackItems = getFallbackNewsItems();
    const newsTickerContent = document.querySelector('.news-ticker-content');
    if (newsTickerContent) {
      renderNewsItems(fallbackItems, newsTickerContent);
    }
  }
}

/**
 * Fetch news ticker items from the RSS feed API
 * @returns {Promise<Array>} Array of news items
 */
async function fetchNewsTickerItems() {
  try {
    // Track start time for performance monitoring
    const startTime = performance.now();
    
    // Add a cache-busting parameter to prevent browser caching
    const cacheBuster = new Date().getTime();
    const response = await fetch(`/api/rss/news-ticker?_=${cacheBuster}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log performance
    const fetchTime = performance.now() - startTime;
    console.log(`Fetched ${data.length} news items in ${fetchTime.toFixed(2)}ms`);
    
    return data;
  } catch (error) {
    console.error('Error fetching news ticker items:', error);
    
    // Show error in console but don't break the UI
    // We'll return fallback data instead
    return [];
  }
}

/**
 * Get user preferences for RSS feeds
 * @returns {Promise<Object>} User preferences
 */
async function getUserRssPreferences() {
  try {
    const response = await fetch('/api/rss/preferences');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching RSS preferences:', error);
    return null;
  }
}

/**
 * Save user preferences for RSS feeds
 * @param {Object} preferences - User preferences to save
 * @returns {Promise<boolean>} Success status
 */
async function saveUserRssPreferences(preferences) {
  try {
    const response = await fetch('/api/rss/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving RSS preferences:', error);
    return false;
  }
}

/**
 * Render news items in the news ticker
 * @param {Array} items - Array of news items
 * @param {HTMLElement} container - Container element
 */
function renderNewsItems(items, container) {
  // Clear container
  container.innerHTML = '';
  
  // Create HTML for each news item
  items.forEach(item => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    
    // Add click handler if there's a link
    if (item.link) {
      newsItem.style.cursor = 'pointer';
      newsItem.addEventListener('click', () => {
        window.open(item.link, '_blank', 'noopener,noreferrer');
      });
    }
    
    // Create news item content
    newsItem.innerHTML = `
      <span class="news-date">${item.date}</span>
      <span class="news-teams">${item.teams}</span>
      <span class="news-time">${item.time}</span>
      <span class="news-sport"> | ${item.sport}</span>
    `;
    
    container.appendChild(newsItem);
  });
  
  // Duplicate items for continuous scrolling
  items.forEach((item, index) => {
    const newsItem = document.createElement('div');
    newsItem.className = 'news-item';
    
    // Add click handler if there's a link
    if (item.link) {
      newsItem.style.cursor = 'pointer';
      newsItem.addEventListener('click', () => {
        window.open(item.link, '_blank', 'noopener,noreferrer');
      });
    }
    
    // Create news item content
    newsItem.innerHTML = `
      <span class="news-date">${item.date}</span>
      <span class="news-teams">${item.teams}</span>
      <span class="news-time">${item.time}</span>
      <span class="news-sport"> | ${item.sport}</span>
    `;
    
    container.appendChild(newsItem);
  });
}

/**
 * Get fallback news items in case the API fails
 * @returns {Array} Array of fallback news items
 */
function getFallbackNewsItems() {
  const currentDate = new Date();
  const month = currentDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = currentDate.getDate();
  const formattedDate = `${month} ${day}`;
  
  return [
    { 
      id: 'news-1', 
      date: formattedDate, 
      teams: 'Lakers defeat Nuggets in overtime thriller', 
      time: '10:30 PM', 
      sport: 'NBA',
      link: null
    },
    { 
      id: 'news-2', 
      date: formattedDate, 
      teams: 'Yankees sign star pitcher to 5-year deal', 
      time: '2:15 PM', 
      sport: 'MLB',
      link: null
    },
    { 
      id: 'news-3', 
      date: formattedDate, 
      teams: 'Formula 1 announces new race in Las Vegas', 
      time: '9:00 AM', 
      sport: 'F1',
      link: null
    },
    { 
      id: 'news-4', 
      date: formattedDate, 
      teams: 'NCAA Tournament Sweet 16 matchups set', 
      time: '11:45 PM', 
      sport: 'NCAA',
      link: null
    },
    { 
      id: 'news-5', 
      date: formattedDate, 
      teams: 'NHL trade deadline: Winners and losers', 
      time: '3:30 PM', 
      sport: 'NHL',
      link: null
    }
  ];
}

/**
 * ===== WNBA ODDS API =====
 */

/**
 * Fetch WNBA odds data
 * @param {string} market - Market type (e.g., 'moneyline', 'spread', 'total')
 * @returns {Promise<Array>} Array of WNBA games with odds
 */
async function fetchWnbaOdds(market = 'moneyline') {
  try {
    const marketMap = {
      'moneyline': 'h2h',
      'spread': 'spreads',
      'total': 'totals'
    };
    
    const apiMarket = marketMap[market.toLowerCase()] || 'h2h';
    
    const response = await fetch(`/api/odds/wnba?market=${apiMarket}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching WNBA odds:', error);
    return [];
  }
}

/**
 * Get best WNBA odds
 * @returns {Promise<Array>} Array of WNBA games with best odds
 */
async function getWnbaBestOdds() {
  try {
    const response = await fetch('/api/odds/wnba/best');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching best WNBA odds:', error);
    return [];
  }
}

/**
 * ===== NCAA ODDS API =====
 */

/**
 * Fetch NCAA basketball odds data
 * @param {string} gender - 'mens' or 'womens'
 * @param {string} market - Market type (e.g., 'moneyline', 'spread', 'total')
 * @returns {Promise<Array>} Array of NCAA basketball games with odds
 */
async function fetchNcaaOdds(gender = 'mens', market = 'moneyline') {
  try {
    const marketMap = {
      'moneyline': 'h2h',
      'spread': 'spreads',
      'total': 'totals'
    };
    
    const apiMarket = marketMap[market.toLowerCase()] || 'h2h';
    
    const response = await fetch(`/api/odds/ncaa/${gender}?market=${apiMarket}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching NCAA ${gender} basketball odds:`, error);
    return [];
  }
}

/**
 * Get March Madness tournament odds
 * @param {string} gender - 'mens' or 'womens'
 * @returns {Promise<Array>} Array of March Madness games with odds
 */
async function getMarchMadnessOdds(gender = 'mens') {
  try {
    const response = await fetch(`/api/odds/ncaa/${gender}/march-madness`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching March Madness ${gender} odds:`, error);
    return [];
  }
}

/**
 * ===== FORMULA 1 ODDS API =====
 */

/**
 * Fetch Formula 1 race winner odds
 * @returns {Promise<Array>} Array of Formula 1 races with winner odds
 */
async function fetchF1RaceWinnerOdds() {
  try {
    const response = await fetch('/api/odds/formula1/race-winner');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Formula 1 race winner odds:', error);
    return [];
  }
}

/**
 * Fetch Formula 1 driver championship odds
 * @returns {Promise<Array>} Array of Formula 1 driver championship odds
 */
async function fetchF1DriverChampionshipOdds() {
  try {
    const response = await fetch('/api/odds/formula1/driver-championship');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Formula 1 driver championship odds:', error);
    return [];
  }
}

/**
 * Fetch Formula 1 constructor championship odds
 * @returns {Promise<Array>} Array of Formula 1 constructor championship odds
 */
async function fetchF1ConstructorChampionshipOdds() {
  try {
    const response = await fetch('/api/odds/formula1/constructor-championship');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Formula 1 constructor championship odds:', error);
    return [];
  }
}

/**
 * ===== FANDUEL INTEGRATION =====
 */

/**
 * Generate a FanDuel affiliate link
 * @param {Object} options - Options for the affiliate link
 * @returns {string} FanDuel affiliate link
 */
function generateFanDuelLink(options = {}) {
  try {
    const { sport, betType, campaignId } = options;
    
    // Base URL
    const baseUrl = 'https://account.sportsbook.fanduel.com/join';
    
    // Affiliate ID
    const affiliateId = 'ai_sports_edge';
    
    // Tracking parameters
    const trackingParams = {
      utm_source: 'ai_sports_edge',
      utm_medium: 'affiliate',
      utm_campaign: campaignId || 'sports_odds',
      ...(sport && { utm_content: sport }),
      ...(betType && { utm_term: betType }),
    };
    
    // Convert tracking parameters to URL query string
    const queryParams = Object.entries(trackingParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Build the affiliate link
    return `${baseUrl}?${queryParams}&pid=${affiliateId}`;
  } catch (error) {
    console.error('Error generating FanDuel link:', error);
    return 'https://www.fanduel.com/';
  }
}

/**
 * Generate a deep link to a specific bet on FanDuel
 * @param {Object} options - Options for the deep link
 * @returns {string} FanDuel deep link
 */
function generateFanDuelDeepLink(options = {}) {
  try {
    const { sport, eventId, betType, team, campaignId } = options;
    
    // Base URL
    const baseUrl = 'https://sportsbook.fanduel.com/navigation';
    
    // Map our sport keys to FanDuel sport paths
    const sportPathMap = {
      'nba': 'basketball/nba',
      'wnba': 'basketball/wnba',
      'ncaab': 'basketball/college-basketball',
      'ncaaw': 'basketball/college-basketball',
      'f1': 'motor-racing/formula-1',
    };
    
    // Map our bet types to FanDuel bet type paths
    const betTypePathMap = {
      'moneyline': 'moneyline',
      'spread': 'spread',
      'total': 'total',
      'player-prop': 'player-props',
      'race-winner': 'race-winner',
    };
    
    // Build the path for the deep link
    let path = sportPathMap[sport.toLowerCase()] || sport.toLowerCase();
    
    if (eventId) {
      path += `/${eventId}`;
    }
    
    if (betType && betTypePathMap[betType.toLowerCase()]) {
      path += `/${betTypePathMap[betType.toLowerCase()]}`;
    }
    
    // Affiliate ID
    const affiliateId = 'ai_sports_edge';
    
    // Tracking parameters
    const trackingParams = {
      utm_source: 'ai_sports_edge',
      utm_medium: 'affiliate',
      utm_campaign: campaignId || 'sports_odds',
      ...(sport && { utm_content: sport }),
      ...(betType && { utm_term: betType }),
      ...(team && { team: team }),
    };
    
    // Convert tracking parameters to URL query string
    const queryParams = Object.entries(trackingParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Build the deep link
    return `${baseUrl}/${path}?${queryParams}&pid=${affiliateId}`;
  } catch (error) {
    console.error('Error generating FanDuel deep link:', error);
    return 'https://www.fanduel.com/';
  }
}