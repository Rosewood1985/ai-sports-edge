# NCAA Basketball Integration

This document outlines the implementation of NCAA men's and women's basketball data integration into the AI Sports Edge application.

## Overview

The NCAA basketball integration provides users with access to college basketball data, including game schedules, player statistics, team rankings, and tournament information. The implementation supports both men's and women's basketball, allowing users to toggle between the two.

## Components

### API Configuration

- **ncaaBasketballApi.ts**: Configuration file for the NCAA Basketball API
  - Separate endpoints for men's and women's basketball
  - Support for game summaries, player profiles, schedules, tournament data, and rankings
  - Error handling and rate limiting settings

### Service Layer

- **ncaaBasketballService.ts**: Service for interacting with the NCAA Basketball API
  - Type definitions for NCAA basketball data
  - Methods for fetching game data, player profiles, schedules, tournament information, and rankings
  - Support for both men's and women's basketball through a gender parameter

### UI Components

- **NcaaBasketballScreen.tsx**: Main screen for displaying NCAA basketball data
  - Toggle between men's and women's basketball
  - Display of today's games with scores and status
  - Team rankings display
  - Navigation to player statistics screens

### Integration with Player Statistics

The NCAA basketball integration leverages the existing player statistics components:

- Uses the PlayerStatsScreen for basic player statistics
- Uses the AdvancedPlayerStatsScreen for enhanced player metrics
- Shares the same player statistics service infrastructure

## Data Model

### Game Data

```typescript
interface NcaaBasketballGame {
  id: string;
  status: string;
  scheduled: string;
  home: NcaaBasketballTeam;
  away: NcaaBasketballTeam;
  home_points: number;
  away_points: number;
  venue: {
    name: string;
    city: string;
    state: string;
  };
  tournament?: {
    id: string;
    name: string;
    round: string;
  };
}
```

### Player Data

```typescript
interface NcaaBasketballPlayer {
  id: string;
  full_name: string;
  jersey_number: string;
  position: string;
  primary_position: string;
  statistics: {
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    field_goals_made: number;
    field_goals_att: number;
    three_points_made: number;
    three_points_att: number;
    free_throws_made: number;
    free_throws_att: number;
    turnovers: number;
    fouls: number;
    plus_minus: number;
  };
}
```

### Rankings Data

```typescript
interface NcaaBasketballRankings {
  poll_name: string;
  date: string;
  teams: {
    rank: number;
    id: string;
    name: string;
    market: string;
    wins: number;
    losses: number;
    points: number;
    previous_rank?: number;
  }[];
}
```

## API Endpoints

The implementation uses the following Sportradar API endpoints:

### Men's Basketball

- Game Summary: `/ncaamb/trial/v7/en/games/{game_id}/summary.json`
- Player Profile: `/ncaamb/trial/v7/en/players/{player_id}/profile.json`
- League Schedule: `/ncaamb/trial/v7/en/games/{year}/{month}/{day}/schedule.json`
- Tournament Summary: `/ncaamb/trial/v7/en/tournaments/{tournament_id}/summary.json`
- Team Profile: `/ncaamb/trial/v7/en/teams/{team_id}/profile.json`
- Standings: `/ncaamb/trial/v7/en/seasons/{season_id}/standings.json`
- Rankings: `/ncaamb/trial/v7/en/polls/{poll_id}/rankings.json`

### Women's Basketball

- Game Summary: `/ncaawb/trial/v7/en/games/{game_id}/summary.json`
- Player Profile: `/ncaawb/trial/v7/en/players/{player_id}/profile.json`
- League Schedule: `/ncaawb/trial/v7/en/games/{year}/{month}/{day}/schedule.json`
- Tournament Summary: `/ncaawb/trial/v7/en/tournaments/{tournament_id}/summary.json`
- Team Profile: `/ncaawb/trial/v7/en/teams/{team_id}/profile.json`
- Standings: `/ncaawb/trial/v7/en/seasons/{season_id}/standings.json`
- Rankings: `/ncaawb/trial/v7/en/polls/{poll_id}/rankings.json`

## Features

The NCAA basketball integration provides the following features:

1. **Game Schedule**: View today's NCAA basketball games with scores and status
2. **Team Rankings**: View the latest AP poll rankings with position changes
3. **Player Statistics**: Access basic and advanced player statistics for each game
4. **Tournament Tracking**: Identify games that are part of tournaments
5. **Gender Toggle**: Switch between men's and women's basketball data

## Future Enhancements

Potential future enhancements include:

1. **Bracket Visualization**: Interactive tournament brackets, especially for March Madness
2. **Historical Data**: Access to historical game data and statistics
3. **Team Profiles**: Detailed team profiles with roster information and team statistics
4. **Conference Standings**: Conference standings and conference tournament tracking
5. **Player Comparison**: Compare college players side-by-side
6. **Draft Prospects**: Highlight potential NBA/WNBA draft prospects

## Implementation Notes

- The API key should be stored in environment variables in production
- Rate limiting is implemented to avoid exceeding API quotas
- Error handling is implemented to provide a good user experience
- The implementation follows the same design patterns as the rest of the application

## Testing

To test the NCAA basketball integration:

1. Navigate to the NCAA Basketball screen
2. Toggle between men's and women's basketball
3. View today's games and rankings
4. Select a game to view player statistics
5. Test the refresh functionality

## Conclusion

The NCAA basketball integration enhances the AI Sports Edge application by providing college basketball data alongside professional sports data. This implementation supports both men's and women's basketball, providing a comprehensive basketball experience for users.