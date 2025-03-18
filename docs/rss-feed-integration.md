# RSS Feed Integration

This document outlines the implementation of the RSS feed integration in the AI Sports Edge app.

## Overview

The RSS feed integration allows the app to display the latest sports news from various sources. The news is displayed in a scrolling ticker on the login page and can be filtered based on user preferences.

## Components

### Backend

1. **fetchRssFeeds.js**: Service for fetching and processing RSS feeds
   - Fetches RSS feeds from multiple sports news sources
   - Parses XML to JSON
   - Filters and formats news items
   - Caches results to reduce API calls
   - Tracks news item clicks for analytics

### Frontend

1. **NewsTicker.js**: Component for displaying scrolling news headlines
   - Displays latest sports news in a scrolling ticker
   - Supports auto-scrolling with configurable speed
   - Allows pausing on hover
   - Highlights betting-related news items
   - Tracks clicks for analytics

2. **NewsTicker.css**: Styles for the news ticker component
   - Responsive design for different screen sizes
   - Smooth scrolling animation
   - Visual distinction for betting-related items
   - Loading, error, and empty states

## RSS Sources

The following RSS sources are used:

1. **ESPN**: https://www.espn.com/espn/rss/news
2. **CBS Sports**: https://www.cbssports.com/rss/headlines
3. **Bleacher Report**: https://bleacherreport.com/articles/feed
4. **Yahoo Sports**: https://sports.yahoo.com/rss/
5. **The Athletic**: https://theathletic.com/news/feed

## Sport-Specific Feeds

Sport-specific feeds are also available for:

1. **NFL**
   - ESPN: https://www.espn.com/espn/rss/nfl/news
   - CBS: https://www.cbssports.com/rss/headlines/nfl
   - Yahoo: https://sports.yahoo.com/nfl/rss/

2. **NBA**
   - ESPN: https://www.espn.com/espn/rss/nba/news
   - CBS: https://www.cbssports.com/rss/headlines/nba
   - Yahoo: https://sports.yahoo.com/nba/rss/

3. **MLB**
   - ESPN: https://www.espn.com/espn/rss/mlb/news
   - CBS: https://www.cbssports.com/rss/headlines/mlb
   - Yahoo: https://sports.yahoo.com/mlb/rss/

4. **NHL**
   - ESPN: https://www.espn.com/espn/rss/nhl/news
   - CBS: https://www.cbssports.com/rss/headlines/nhl
   - Yahoo: https://sports.yahoo.com/nhl/rss/

5. **UFC**
   - ESPN: https://www.espn.com/espn/rss/mma/news
   - CBS: https://www.cbssports.com/rss/headlines/mma
   - Yahoo: https://sports.yahoo.com/mma/rss/

6. **Formula 1**
   - ESPN: https://www.espn.com/espn/rss/f1/news
   - Yahoo: https://sports.yahoo.com/formula-1/rss/

## User Preferences

Users can customize their news feed with the following preferences:

1. **Enabled Sources**: Select which news sources to include
2. **Maximum Items**: Set the maximum number of news items to display
3. **Betting Content Only**: Filter for betting-related content only
4. **Favorite Teams**: Prioritize news about favorite teams

## Betting Content Identification

Betting-related content is identified using keywords such as:

- odds, betting, wager, bet, gamble, sportsbook, bookmaker
- spread, line, moneyline, parlay, prop, over/under
- underdog, favorite, prediction, pick, forecast, handicap, vegas

## Caching

News items are cached to reduce API calls:

- Cache duration: 15 minutes
- Cache is stored in memory
- Separate cache for each feed URL
- Cache for the news ticker

## Analytics

The following analytics are tracked:

1. **News Item Clicks**: Track which news items users click on
   - Item title
   - Source
   - Link
   - Whether it's betting-related
   - User ID (if logged in)
   - Timestamp

2. **News Item Impressions**: Track which news items are displayed
   - Stored in Firestore for analysis

## Implementation Notes

- XML parsing is done using the xml2js library
- Axios is used for HTTP requests
- The news ticker auto-scrolls horizontally
- Scrolling can be paused on hover
- News items are refreshed every 15 minutes
- Betting-related items are highlighted with a different style
- The component is responsive and works on all screen sizes

## Future Enhancements

- Add more RSS sources
- Implement personalized news based on user behavior
- Add ability to save/bookmark news items
- Implement natural language processing for better content categorization
- Add sentiment analysis for news items
- Implement push notifications for breaking news
- Add social sharing functionality