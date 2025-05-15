# RSS Feed Integration

This document provides instructions for setting up and using the RSS feed integration in the AI Sports Edge app.

## Overview

The RSS feed integration allows the app to display the latest sports news from various sources. The news is displayed in a scrolling ticker on the login page and can be filtered based on user preferences.

## Features

- Display sports news from multiple sources in a scrolling ticker
- Filter news based on user preferences
- Highlight betting-related content
- Track news item clicks for analytics
- Automatically refresh news every 15 minutes

## Installation

1. Make sure you have Node.js and npm installed on your system.

2. Install the required dependencies:

```bash
npm install
```

3. Run the setup script:

```bash
./scripts/setup-rss-feeds.sh
```

This script will install the dependencies, create the necessary directories, and start the server.

## Usage

### Viewing the News Ticker

The news ticker is displayed on the login page. It automatically scrolls horizontally and displays the latest sports news from various sources.

### Customizing User Preferences

Users can customize their news feed by clicking the settings icon in the news ticker. This opens a preferences modal where they can:

1. Select which sports categories they're interested in
2. Choose to show only betting-related content
3. Add favorite teams to prioritize related news
4. Set the maximum number of news items to display

### RSS Feed Sources

The following RSS sources are used:

1. **ESPN**: https://www.espn.com/espn/rss/news
2. **CBS Sports**: https://www.cbssports.com/rss/headlines
3. **Bleacher Report**: https://bleacherreport.com/articles/feed
4. **Yahoo Sports**: https://sports.yahoo.com/rss/
5. **The Athletic**: https://theathletic.com/news/feed

Sport-specific feeds are also available for:

- Football (NFL)
- Basketball (NBA)
- Baseball (MLB)
- Hockey (NHL)
- MMA/UFC
- Formula 1

## Architecture

The RSS feed integration consists of the following components:

### Backend

1. **contentFiltering.js**: Module for filtering RSS feed content based on keywords and relevance
2. **fetchRssFeeds.js**: Service for fetching and processing RSS feeds
3. **index.js**: API endpoints for retrieving RSS feeds and tracking clicks
4. **rssFeedCronJob.js**: Cron job for periodically fetching and caching RSS feeds

### Frontend

1. **NewsTicker.js**: Component for displaying scrolling news headlines
2. **UserPreferences.js**: Component for managing user preferences
3. **news-ticker.css**: Styles for the news ticker component
4. **user-preferences.css**: Styles for the user preferences component

## API Endpoints

The following API endpoints are available:

1. **GET /api/rss-feeds**: Get RSS feeds with default settings
2. **POST /api/rss-feeds**: Get RSS feeds with user preferences
3. **POST /api/rss-feeds/track-click**: Track news item clicks

## Customization

### Adding New RSS Sources

To add new RSS sources, modify the `DEFAULT_FEEDS` and `SPORT_FEEDS` arrays in the following files:

1. **api/rssFeeds/index.js**
2. **jobs/rssFeedCronJob.js**

### Modifying Content Filtering

To modify the content filtering logic, edit the `contentFiltering.js` file. You can:

1. Add or modify keywords for different sports categories
2. Adjust the relevance scoring algorithm
3. Change the betting content identification logic

### Styling the News Ticker

To modify the appearance of the news ticker, edit the `news-ticker.css` file.

## Troubleshooting

### News Ticker Not Displaying

If the news ticker is not displaying, check the following:

1. Make sure the server is running
2. Check the browser console for errors
3. Verify that the RSS feed API endpoints are working

### RSS Feeds Not Loading

If the RSS feeds are not loading, check the following:

1. Make sure the RSS feed sources are accessible
2. Check the server logs for errors
3. Verify that the cron job is running

## Contributing

To contribute to the RSS feed integration, please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.