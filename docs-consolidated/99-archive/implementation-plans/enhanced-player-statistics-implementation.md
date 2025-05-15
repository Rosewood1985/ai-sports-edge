# Enhanced Player Statistics Implementation

This document outlines the implementation of the Enhanced Player Statistics feature for AI Sports Edge. The feature provides users with advanced metrics, historical trends, and weather-based performance insights for players.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Services](#services)
4. [User Flow](#user-flow)
5. [Freemium Model](#freemium-model)
6. [Testing](#testing)
7. [Future Enhancements](#future-enhancements)

## Overview

The Enhanced Player Statistics feature provides premium statistical analysis for sports players, including:

- Advanced metrics (true shooting percentage, usage rate, etc.)
- Historical performance trends with visualizations
- Weather-based performance insights
- View limiting for free users with upgrade prompts

The feature follows a freemium model where basic statistics are available to all users, while advanced metrics, historical trends, and weather insights are available only to premium subscribers or through microtransactions.

## Components

### EnhancedPlayerStatistics

The main component that displays player statistics. It includes three tabs:

1. **Basic Stats**: Available to all users
2. **Advanced Stats**: Premium feature with advanced metrics and weather insights
3. **Historical Stats**: Premium feature with historical performance data and trend visualizations

```tsx
// Usage example
<EnhancedPlayerStatistics
  player={playerData}
  gameId="game-123"
  userId="user-456"
/>
```

### ViewLimitIndicator

Displays the user's remaining free views and prompts for upgrade when approaching the limit.

```tsx
// Usage example
<ViewLimitIndicator
  onUpgradePress={handleUpgradePress}
  compact={false}
/>
```

### WeatherInsights

Displays weather data for a game venue and correlates it with player performance.

```tsx
// Usage example
<WeatherInsights
  gameId="game-123"
  playerId="player-456"
  playerName="John Doe"
/>
```

### HistoricalTrendsChart

Visualizes player performance trends over time with interactive charts.

```tsx
// Usage example
<HistoricalTrendsChart
  playerId="player-456"
  playerName="John Doe"
  gameId="game-123"
  onError={(error) => console.error('Error:', error)}
/>
```

### UpgradePrompt

Displays subscription options and microtransactions for premium features.

```tsx
// Usage example
<UpgradePrompt
  onClose={() => setShowUpgradePrompt(false)}
  gameId="game-123"
  featureType="advanced-metrics"
/>
```

## Services

### viewCounterService

Manages the view counter for free users, tracking how many times they've viewed player statistics.

```typescript
// Key functions
getUserViewCount(userId?: string): Promise<ViewCountData>
incrementUserViewCount(userId?: string, featureType?: string): Promise<ViewCountData>
shouldShowUpgradePrompt(userId?: string): Promise<{show: boolean; reason: string}>
```

### weatherService

Fetches and caches weather data for game venues and provides weather-performance correlations.

```typescript
// Key functions
getVenueWeather(venueId: string, forceRefresh?: boolean): Promise<WeatherData>
getGameWeather(gameId: string, forceRefresh?: boolean): Promise<WeatherData>
getWeatherPerformanceInsights(playerId: string, weatherCondition: string): Promise<WeatherPerformanceCorrelation[]>
```

### advancedPlayerStatsService

Manages access to premium features and handles microtransactions.

```typescript
// Key functions
hasAdvancedPlayerMetricsAccess(userId: string, gameId: string): Promise<boolean>
hasHistoricalTrendsAccess(userId: string, gameId: string): Promise<boolean>
purchaseAdvancedPlayerMetrics(userId: string, gameId: string): Promise<boolean>
purchaseHistoricalTrends(userId: string, gameId: string): Promise<boolean>
```

## User Flow

1. User navigates to a player's statistics screen
2. The view counter is incremented
3. Basic statistics are displayed by default
4. If the user tries to access advanced metrics or historical trends:
   - If they have access, the premium content is displayed
   - If they don't have access, they see a locked screen with upgrade options
5. As the user approaches their free view limit, the ViewLimitIndicator is displayed
6. When the limit is reached, the UpgradePrompt is shown automatically

## Freemium Model

The feature implements a freemium model with the following characteristics:

- **Free Tier**:
  - Basic player statistics
  - Limited number of views per month (default: 4)
  - View counter resets at the beginning of each month

- **Premium Tier**:
  - All basic statistics
  - Advanced metrics (true shooting %, usage rate, etc.)
  - Historical trends with visualizations
  - Weather-based performance insights
  - Unlimited views

- **Microtransactions**:
  - Advanced Player Metrics: $1.99 per game
  - Historical Trends Package: $2.99 per game
  - Player Comparison Tool: $1.99 per game
  - Premium Bundle: $4.99 per game (all features)

## Testing

A test script is provided to verify the functionality of the Enhanced Player Statistics feature:

```bash
node scripts/test-enhanced-player-stats.js
```

The script tests:
1. Weather Service - Fetching weather data for venues and games
2. View Counter Service - Tracking and limiting free views
3. Historical Trends - Generating mock historical data

## Future Enhancements

Planned enhancements for future releases:

1. **Machine Learning Integration**:
   - Predictive performance models based on weather, opponent, and historical data
   - Anomaly detection for unusual performances

2. **Enhanced Visualizations**:
   - Shot charts with heat maps
   - Performance radar charts
   - Head-to-head player comparisons

3. **Social Features**:
   - Share insights and visualizations
   - Community discussions on player performance

4. **Personalization**:
   - Favorite players and teams
   - Custom statistical dashboards
   - Notification alerts for significant performance trends

5. **API Integrations**:
   - Additional data sources for more comprehensive statistics
   - Real-time updates during games