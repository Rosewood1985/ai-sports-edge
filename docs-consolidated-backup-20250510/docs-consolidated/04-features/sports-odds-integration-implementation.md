# Sports Odds Integration Implementation

This document outlines the implementation details for integrating WNBA, NCAA March Madness, and Formula 1 odds across web, iOS, and Android platforms, with FanDuel integration.

## Table of Contents
1. [Overview](#overview)
2. [Implementation Details](#implementation-details)
3. [API Endpoints](#api-endpoints)
4. [Service Classes](#service-classes)
5. [FanDuel Integration](#fanduel-integration)
6. [Usage Examples](#usage-examples)
7. [Next Steps](#next-steps)

## Overview

The sports odds integration adds support for fetching and displaying odds data for WNBA, NCAA basketball (men's and women's), and Formula 1 racing. The implementation includes:

- Backend services for fetching odds data from third-party APIs
- API endpoints for accessing odds data
- FanDuel affiliate integration for deep linking to betting opportunities
- Client-side JavaScript for displaying odds data

## Implementation Details

### Architecture

The implementation follows a service-oriented architecture:

1. **Service Layer**: Responsible for fetching and processing odds data from third-party APIs
2. **API Layer**: Exposes endpoints for accessing odds data
3. **Client Layer**: Consumes the API and displays odds data to users

### Technologies Used

- **Backend**: Node.js, Express.js
- **API Integration**: Axios for HTTP requests
- **Caching**: In-memory caching with TTL
- **Frontend**: JavaScript, HTML, CSS

## API Endpoints

The following API endpoints have been implemented:

### WNBA Endpoints

- `GET /api/odds/wnba`: Get WNBA odds (moneyline, spread, totals)
- `GET /api/odds/wnba/best`: Get best WNBA odds across bookmakers
- `GET /api/odds/wnba/:gameId`: Get WNBA odds for a specific game

### NCAA Basketball Endpoints

- `GET /api/odds/ncaa/:gender`: Get NCAA basketball odds (moneyline, spread, totals)
- `GET /api/odds/ncaa/:gender/march-madness`: Get NCAA March Madness odds
- `GET /api/odds/ncaa/:gender/best`: Get best NCAA basketball odds across bookmakers
- `GET /api/odds/ncaa/:gender/:gameId`: Get NCAA basketball odds for a specific game

### Formula 1 Endpoints

- `GET /api/odds/formula1/race-winner`: Get Formula 1 race winner odds
- `GET /api/odds/formula1/driver-championship`: Get Formula 1 driver championship odds
- `GET /api/odds/formula1/constructor-championship`: Get Formula 1 constructor championship odds
- `GET /api/odds/formula1/best-driver`: Get best Formula 1 driver odds
- `GET /api/odds/formula1/:raceId`: Get Formula 1 odds for a specific race

### FanDuel Integration Endpoints

- `GET /api/odds/fanduel/link`: Generate a FanDuel affiliate link
- `GET /api/odds/fanduel/deep-link`: Generate a FanDuel deep link to a specific bet
- `GET /api/odds/fanduel/universal-link`: Generate a FanDuel universal link (web and mobile)
- `POST /api/odds/fanduel/track`: Track a FanDuel conversion

## Service Classes

The implementation includes the following service classes:

### OddsService

Base service for fetching odds data from third-party APIs. Features include:

- Configurable API endpoints
- Caching with TTL
- Error handling and retry mechanisms
- Data normalization

### WnbaOddsService

Service for fetching and processing WNBA odds data. Features include:

- Moneyline, spread, and totals odds
- Best odds across bookmakers
- Game-specific odds

### NcaaOddsService

Service for fetching and processing NCAA basketball odds data. Features include:

- Support for men's and women's basketball
- March Madness tournament odds
- Best odds across bookmakers
- Game-specific odds

### Formula1OddsService

Service for fetching and processing Formula 1 odds data. Features include:

- Race winner odds
- Driver championship odds
- Constructor championship odds
- Head-to-head driver comparison odds

### FanDuelService

Service for FanDuel integration and affiliate linking. Features include:

- Affiliate link generation
- Deep linking to specific bets
- Mobile app deep linking
- Conversion tracking

## FanDuel Integration

The FanDuel integration allows users to place bets directly with FanDuel through affiliate links. Features include:

### Affiliate Linking

- Generate affiliate links with tracking parameters
- Deep link to specific bets on FanDuel
- Universal links that work for both web and mobile app

### Conversion Tracking

- Track clicks, signups, and deposits
- Attribute conversions to specific campaigns
- Monitor affiliate performance

## Usage Examples

### Fetching WNBA Odds

```javascript
// Client-side JavaScript
async function getWnbaOdds() {
  try {
    const response = await fetch('/api/odds/wnba?market=moneyline');
    const data = await response.json();
    
    // Process and display the odds data
    displayOddsData(data);
  } catch (error) {
    console.error('Error fetching WNBA odds:', error);
  }
}
```

### Generating a FanDuel Affiliate Link

```javascript
// Client-side JavaScript
function generateFanDuelLink(sport, betType) {
  const link = generateFanDuelDeepLink({
    sport,
    betType,
    campaignId: 'sports_odds'
  });
  
  // Use the link for a button or link element
  document.getElementById('bet-now-button').href = link;
}
```

## Next Steps

The following steps are planned for future iterations:

1. **Mobile App Integration**:
   - Implement iOS Swift models and API clients
   - Implement Android Kotlin models and API clients
   - Create mobile-specific UI components

2. **Enhanced Betting Features**:
   - Implement bet tracking and history
   - Add personalized betting recommendations
   - Integrate with user preferences

3. **Additional Sports**:
   - Add support for more sports (NHL, MLB, etc.)
   - Implement sport-specific odds displays
   - Create specialized betting interfaces for each sport

4. **Performance Optimizations**:
   - Implement more sophisticated caching strategies
   - Add server-side rendering for odds data
   - Optimize API response sizes for mobile