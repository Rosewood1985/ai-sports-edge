# RSS Feed Betting Integration

This document outlines the integration of RSS feeds with betting information into the AI Sports Edge application, particularly focusing on the news ticker component displayed on the login/sign-in page.

## Overview

The RSS feed integration enhances the application by:

1. Providing real-time sports news and updates
2. Highlighting betting-related content
3. Offering direct betting opportunities through affiliate links
4. Improving user engagement through personalized content

## Implementation Details

### RSS Feed Sources

We've expanded our RSS feed sources to include:

- Major US sports (NBA, NFL, MLB, NHL)
- Combat sports (UFC, Boxing)
- Racing (Formula 1, NASCAR)
- Global sports (Soccer, Tennis, Golf)
- College sports (NCAAF, NCAAB)
- Betting-specific feeds (Betting news, Odds updates, Expert picks)
- Fantasy sports
- General sports news (ESPN, CBS Sports, Sports Illustrated)

### Feed Processing

The system processes RSS feeds through the following steps:

1. **Fetching**: Retrieves content from configured RSS feed URLs
2. **Parsing**: Extracts relevant information (titles, descriptions, dates, etc.)
3. **Enrichment**: Identifies betting-related content and opportunities
4. **Filtering**: Applies user preferences to show relevant content
5. **Prioritization**: Sorts content to highlight betting opportunities
6. **Display**: Presents the content in the news ticker component

### Betting Content Identification

Content is identified as betting-related if it:

- Has explicit betting opportunities (odds, lines, etc.)
- Comes from a betting-specific source
- Contains betting-related keywords in the title or description
- Has been manually tagged as betting-related

### User Preferences

Users can customize their RSS feed experience through preferences:

- Enable/disable specific sports sources
- Set refresh interval (default: 15 minutes)
- Configure maximum items to display
- Add keyword filters (include/exclude)
- Set news ticker display options (scroll speed, pause on hover)

### Visual Enhancements

Betting-related content is visually distinguished:

- Green left border and subtle background
- Betting indicator (💰) for betting-related items
- Formatted odds display
- "Bet Now" button for direct betting opportunities
- Hover effects for better user interaction

## Components

### 1. RSS Feed URLs Configuration

Located in `api/rssFeeds/rssFeedUrls.js`, this file defines all the RSS feed sources used by the application.

### 2. User Preferences Service

Located in `utils/userPreferencesService.js`, this service manages user preferences for RSS feeds, including:

- Enabled sources
- Refresh interval
- Maximum items
- Keyword filters

### 3. RSS Feed Fetching

Located in `api/rssFeeds/fetchRssFeeds.js`, this module handles:

- Fetching feeds from configured sources
- Caching results for performance
- Error handling and fallbacks
- Formatting items for display

### 4. News Ticker Component

Located in `web/components/NewsTicker.js`, this React component:

- Displays the processed RSS feed items
- Handles user interactions (hover, click)
- Tracks analytics events
- Manages scrolling behavior

### 5. Analytics Integration

Located in `services/rssAnalyticsService.js`, this service tracks:

- Feed views and impressions
- Item clicks and hovers
- Betting button clicks
- Scroll depth and engagement

## Betting Integration

### Affiliate Link Generation

The system generates affiliate links for betting opportunities using the `generateFanDuelAffiliateLink` function, which:

1. Takes information about the sports event (teams, sport, event ID)
2. Constructs a properly formatted affiliate link
3. Includes the user's affiliate ID for tracking

### Betting Opportunities

Betting opportunities are presented to users through:

1. Visual highlighting of betting-related content
2. Direct "Bet Now" buttons for immediate action
3. Formatted odds display for quick decision-making

## Performance Considerations

The implementation includes several performance optimizations:

1. **Caching**: RSS feed results are cached to reduce API calls
2. **Lazy Loading**: Images are lazy-loaded to improve initial load time
3. **Efficient Rendering**: React component optimizations to minimize re-renders
4. **Error Handling**: Robust error handling with fallbacks for reliability

## Accessibility

The implementation includes accessibility features:

1. **High Contrast Mode**: Special styling for high contrast preferences
2. **Reduced Motion**: Respects user preferences for reduced animation
3. **Keyboard Navigation**: Fully navigable with keyboard
4. **Screen Reader Support**: Proper semantic markup for screen readers

## Future Enhancements

Potential future enhancements include:

1. **Machine Learning Integration**: Using ML to better identify betting opportunities
2. **Personalization**: Further personalization based on user behavior
3. **Real-time Updates**: WebSocket integration for real-time feed updates
4. **Additional Sources**: Integration with more specialized betting sources
5. **Odds Comparison**: Comparing odds across different sportsbooks