const express = require('express');
const { fetchAndProcessFeeds, trackNewsItemClick } = require('./fetchRssFeeds');
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

// POST endpoint for tracking news item clicks
router.post('/track-click', async (req, res) => {
  try {
    const { item, userId } = req.body;
    
    if (!item) {
      return res.status(400).json({ error: 'Item is required' });
    }
    
    await trackNewsItemClick(item, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking news item click:', error);
    res.status(500).json({ error: 'Failed to track news item click' });
  }
});

module.exports = router;