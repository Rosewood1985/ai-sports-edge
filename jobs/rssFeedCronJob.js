const cron = require('node-cron');

const { fetchAndProcessFeeds } = require('../api/rssFeeds/fetchRssFeeds');

// Default RSS feed URLs
const DEFAULT_FEEDS = [
  'https://www.espn.com/espn/rss/news',
  'https://www.cbssports.com/rss/headlines',
  'https://bleacherreport.com/articles/feed',
  'https://sports.yahoo.com/rss/',
  'https://theathletic.com/news/feed',
];

// Sport-specific feeds
const SPORT_FEEDS = {
  football: [
    'https://www.espn.com/espn/rss/nfl/news',
    'https://www.cbssports.com/rss/headlines/nfl',
    'https://sports.yahoo.com/nfl/rss/',
  ],
  basketball: [
    'https://www.espn.com/espn/rss/nba/news',
    'https://www.cbssports.com/rss/headlines/nba',
    'https://sports.yahoo.com/nba/rss/',
  ],
  baseball: [
    'https://www.espn.com/espn/rss/mlb/news',
    'https://www.cbssports.com/rss/headlines/mlb',
    'https://sports.yahoo.com/mlb/rss/',
  ],
  hockey: [
    'https://www.espn.com/espn/rss/nhl/news',
    'https://www.cbssports.com/rss/headlines/nhl',
    'https://sports.yahoo.com/nhl/rss/',
  ],
  mma: [
    'https://www.espn.com/espn/rss/mma/news',
    'https://www.cbssports.com/rss/headlines/mma',
    'https://sports.yahoo.com/mma/rss/',
  ],
  formula1: ['https://www.espn.com/espn/rss/f1/news', 'https://sports.yahoo.com/formula-1/rss/'],
};

/**
 * Fetch all RSS feeds and cache them
 * @returns {Promise<void>}
 */
async function fetchAllFeeds() {
  console.log(`Fetching RSS feeds at ${new Date().toISOString()}`);

  try {
    // Get all feed URLs
    const allFeeds = [...DEFAULT_FEEDS];

    // Add sport-specific feeds
    Object.values(SPORT_FEEDS).forEach(feeds => {
      allFeeds.push(...feeds);
    });

    // Remove duplicates
    const uniqueFeeds = [...new Set(allFeeds)];

    // Fetch and process feeds
    await fetchAndProcessFeeds(uniqueFeeds);

    console.log(`RSS feeds updated successfully at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
  }
}

/**
 * Start the RSS feed cron job
 * @returns {void}
 */
function startRssFeedCronJob() {
  // Fetch feeds immediately on startup
  fetchAllFeeds();

  // Schedule cron job to run every 15 minutes
  cron.schedule('*/15 * * * *', fetchAllFeeds);

  console.log('RSS feed cron job scheduled to run every 15 minutes');
}

module.exports = {
  startRssFeedCronJob,
  fetchAllFeeds,
};
