/**
 * Sports API for AI Sports Edge
 * Provides sports data, odds, and news from various sources including RSS feeds
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