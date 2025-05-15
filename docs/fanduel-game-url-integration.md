# FanDuel Game URL Integration Guide

This document explains how to use the GameUrlService to automatically pull game-specific URLs from sports APIs and integrate them with FanDuel affiliate links.

## Overview

The GameUrlService fetches direct URLs to FanDuel's event pages from sports APIs (The Odds API, Sports Radar, ESPN API) and stores them in Firebase Firestore. These URLs are then used to create more specific affiliate links that take users directly to the betting page for a particular game.

## Benefits

1. **Higher Conversion Rates**: Users are taken directly to the specific game they're interested in, reducing friction in the betting process.
2. **Better User Experience**: No need for users to search for the game they want to bet on.
3. **Improved Tracking**: Game IDs are included in the affiliate links, allowing for better attribution and analytics.
4. **Automatic Updates**: URLs are automatically refreshed to ensure they're always current.

## Implementation Details

### Data Structure

Each game URL is stored with the following information:

```typescript
interface GameUrl {
  gameId: string;         // Unique identifier for the game
  sportType: string;      // Type of sport (basketball, football, etc.)
  leagueId: string;       // League identifier (nba, ncaab, nfl, etc.)
  homeTeamId: string;     // ID of the home team
  awayTeamId: string;     // ID of the away team
  startTime: Date;        // When the game starts
  fanduelUrl: string;     // Direct URL to the FanDuel betting page
  lastUpdated: Date;      // When this URL was last updated
  isActive: boolean;      // Whether the game is still active
}
```

### API Integration

The service integrates with the following sports APIs:

1. **The Odds API**: Primary source for odds data and game information
2. **Sports Radar API**: Additional source for detailed game data
3. **ESPN API**: Used for supplementary information and as a fallback

### Storage

Game URLs are stored in two places:

1. **Local Cache**: For quick access and offline functionality
2. **Firebase Firestore**: For persistence and sharing across devices

## Usage

### Initialization

The GameUrlService is automatically initialized when the app starts. It loads cached URLs from AsyncStorage and then fetches the latest URLs from Firestore.

```typescript
// This happens automatically, but you can force a refresh if needed
await gameUrlService.initialize();
```

### Getting a Game URL

To get a URL for a specific game:

```typescript
// Get a URL for a specific game
const gameUrl = await gameUrlService.getGameUrl('game-123', BettingSite.FANDUEL);

// Use the URL to create an affiliate link
const affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
  gameUrl || 'https://fanduel.com/',
  affiliateCode,
  teamId,
  userId,
  gameId
);
```

### Finding Games for a League

To get all games for a specific league:

```typescript
// Get all active NBA games
const nbaGames = gameUrlService.getGameUrlsForLeague('basketball', 'nba', true);

// Display these games to the user
nbaGames.forEach(game => {
  console.log(`${game.homeTeamId} vs ${game.awayTeamId} - ${game.startTime}`);
});
```

### Finding Games for a Team

To get all games for a specific team:

```typescript
// Get all active games for the Lakers
const lakersGames = gameUrlService.getGameUrlsForTeam('lakers', true);

// Display these games to the user
lakersGames.forEach(game => {
  const opponent = game.homeTeamId === 'lakers' ? game.awayTeamId : game.homeTeamId;
  console.log(`Lakers vs ${opponent} - ${game.startTime}`);
});
```

## Integration with BetNowButton

The BetNowButton component automatically uses the GameUrlService when a gameId is provided:

```jsx
// This button will link directly to the Lakers vs Warriors game on FanDuel
<BetNowButton
  size="medium"
  position="inline"
  contentType="game"
  teamId="lakers"
  gameId="nba-20250317-lakers-warriors"
  userId={currentUser.id}
/>
```

## Firebase Configuration

### Firestore Collections

The service uses the following Firestore collections:

1. **gameUrls**: Stores the game URL data
2. **apiKeys**: Stores API keys for the sports data providers

### Security Rules

Recommended Firestore security rules:

```
service cloud.firestore {
  match /databases/{database}/documents {
    // API keys are only readable by authenticated users
    match /apiKeys/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only writable via admin
    }
    
    // Game URLs are readable by anyone but only writable by authenticated users
    match /gameUrls/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## API Key Setup

To use the sports APIs, you'll need to obtain API keys and add them to Firestore:

1. Create an account with [The Odds API](https://the-odds-api.com/)
2. Create an account with [Sports Radar](https://sportradar.com/)
3. Create an account with [ESPN Developer Portal](https://developer.espn.com/)
4. Add the API keys to the Firestore collection `apiKeys` in a document called `sports`:

```json
{
  "odds_api": "your-odds-api-key",
  "sports_radar": "your-sports-radar-key",
  "espn_api": "your-espn-api-key"
}
```

## Maintenance and Monitoring

### Refresh Schedule

Game URLs are automatically refreshed in these situations:

1. When the app starts
2. When the cache is older than 6 hours
3. When `forceRefresh()` is called

### Error Handling

Errors are logged to the console and tracked in analytics. If an API fails, the service will fall back to other APIs or cached data.

### Analytics

The following events are tracked:

1. `game_urls_fetched`: When URLs are successfully fetched
2. `game_url_used`: When a URL is used to create an affiliate link

## Troubleshooting

### Common Issues

1. **URLs not updating**: Check that the API keys are valid and that the Firestore security rules allow writing to the `gameUrls` collection.
2. **Missing games**: Some APIs may not have data for all leagues or games. Try using a different API or check that the game exists in the API's data.
3. **Incorrect URLs**: Verify that the URL format is correct for FanDuel. The format may change over time.

### Debugging

To debug issues with the GameUrlService:

```typescript
// Force a refresh of the game URLs
await gameUrlService.forceRefresh();

// Check the cache for a specific game
const gameUrl = await gameUrlService.getGameUrl('game-123');
console.log('Game URL:', gameUrl);

// Check all cached games
const allGames = Object.values(gameUrlService.cache);
console.log('All games:', allGames);
```

## Future Enhancements

1. **Additional Betting Sites**: Add support for more betting sites like DraftKings, BetMGM, etc.
2. **Odds Comparison**: Fetch odds from multiple betting sites to show the best value.
3. **Live Game Status**: Include live game status in the URLs to show in-play betting opportunities.
4. **Personalized Recommendations**: Use user preferences to recommend games to bet on.