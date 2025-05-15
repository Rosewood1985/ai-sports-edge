# MMA Round Betting and Horse Racing Implementation Plan

This document outlines the implementation plan for adding MMA round betting and horse racing features to the AI Sports Edge app.

## Table of Contents
1. [Overview](#overview)
2. [MMA Round Betting Implementation](#mma-round-betting-implementation)
3. [Horse Racing Implementation](#horse-racing-implementation)
4. [API Integration](#api-integration)
5. [UI/UX Design](#uiux-design)
6. [Subscription & Monetization](#subscription--monetization)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Timeline](#implementation-timeline)

## Overview

The AI Sports Edge app will be enhanced with two new betting features:

1. **MMA Round Betting**: An extension of the existing UFC functionality that allows users to bet on specific rounds and outcomes in MMA fights.
2. **Horse Racing**: A completely new feature that enables users to view horse racing events, track horses, and place bets on race outcomes.

Both features will be integrated with the app's existing subscription model and will include premium features to drive monetization.

## MMA Round Betting Implementation

### Data Model Extensions

We'll extend the existing UFC data models in `types/ufc.ts`:

```typescript
// New enums and interfaces
export enum FightOutcome {
  KO = 'KO',
  TKO = 'TKO',
  SUBMISSION = 'Submission',
  DECISION = 'Decision',
  DQ = 'Disqualification',
  DRAW = 'Draw',
  NO_CONTEST = 'No Contest'
}

export interface RoundBettingOption {
  fighterId: string;
  round: number;
  outcome: FightOutcome;
  odds: number;
}

// Extended UFCFight interface
export interface UFCFight {
  // Existing properties
  id: string;
  fighter1: UFCFighter;
  fighter2: UFCFighter;
  weightClass: string;
  isTitleFight: boolean;
  rounds: number;
  
  // New properties
  roundBettingOptions?: RoundBettingOption[];
  startTime?: string;
  status?: 'scheduled' | 'in_progress' | 'completed';
  winner?: string; // Fighter ID of the winner
  winMethod?: FightOutcome;
  winRound?: number;
}
```

### Service Layer Updates

1. **Update UFCService**:
   - Add `fetchRoundBettingOptions(fightId: string)` method
   - Add `generateMockRoundBettingOptions(fight: UFCFight)` helper method
   - Update caching mechanism to include round betting options

2. **Update Subscription Service**:
   - Add `hasRoundBettingAccess(userId: string, fightId: string)` method
   - Add `purchaseRoundBettingAccess(userId: string, fightId: string)` method
   - Add 'round-betting' to MICROTRANSACTIONS array

### UI Components

1. **RoundBettingCard Component**:
   - Display round-by-round betting options for a fighter
   - Show odds for each outcome (KO, TKO, Submission, Decision)
   - Allow selection of betting options

2. **FightDetailScreen**:
   - Display fight details and fighter information
   - Show round betting options if user has access
   - Include premium feature prompt for non-subscribers
   - Provide option to purchase one-time access

### Navigation Updates

Add a new route to the navigation stack:
```typescript
<Stack.Screen name="FightDetail" component={FightDetailScreen} />
```

Update the UFCScreen to navigate to the FightDetailScreen when a fight is selected.

## Horse Racing Implementation

### Data Model

Create new types in `types/horseRacing.ts`:

```typescript
export interface Horse {
  id: string;
  name: string;
  jockey: string;
  trainer: string;
  age: number;
  weight: number;
  silkColors: string;
  form: string; // Recent performance, e.g. "1-3-2-4"
  odds: number;
  imageUrl?: string;
}

export interface Race {
  id: string;
  name: string;
  trackName: string;
  location: string;
  date: string;
  time: string;
  distance: string; // e.g. "1 mile 2 furlongs"
  surface: 'turf' | 'dirt' | 'synthetic';
  grade?: string; // Race grade, e.g. "Grade 1"
  purse: string; // Prize money
  status: 'upcoming' | 'in_progress' | 'completed';
  horses: Horse[];
  results?: RaceResult[];
}

export interface RaceResult {
  position: number;
  horseId: string;
  finishTime: string;
  marginOfVictory?: string;
}

export interface RaceMeeting {
  id: string;
  name: string;
  trackName: string;
  location: string;
  date: string;
  races: Race[];
}

export interface HorseBet {
  id: string;
  raceId: string;
  horseId: string;
  betType: 'win' | 'place' | 'show' | 'exacta' | 'trifecta' | 'superfecta';
  odds: number;
  stake?: number;
  potentialPayout?: number;
}
```

### API Configuration

Create a new configuration file `config/horseRacingApi.ts`:
- Define API endpoints and configuration
- Include error handling utilities
- Add mock data generation for testing

### Service Layer

Create a new service `services/horseRacingService.ts`:
- Implement `fetchRaceMeetings()` method
- Implement `fetchRace(raceId: string)` method
- Implement `fetchHorse(horseId: string)` method
- Implement `searchRaces(query: string)` method
- Add caching mechanism for performance

### UI Components

1. **RaceCard Component**:
   - Display race information (name, track, date, time)
   - Show race details (distance, surface, grade, purse)
   - Include status indicator (upcoming, live, completed)

2. **HorseCard Component**:
   - Display horse information (name, jockey, trainer)
   - Show odds and form
   - Include silk colors and position (if applicable)

3. **RaceDetailScreen**:
   - Display race details and list of horses
   - Show betting options for each horse
   - Include race results if completed

4. **HorseDetailScreen**:
   - Display detailed horse information
   - Show past performance and statistics
   - Include betting options

5. **HorseRacingScreen**:
   - Display list of upcoming race meetings
   - Allow filtering by date, track, or race type
   - Include search functionality

### Navigation Updates

Add new routes to the navigation stack:
```typescript
<Stack.Screen name="HorseRacing" component={HorseRacingScreen} />
<Stack.Screen name="RaceDetail" component={RaceDetailScreen} />
<Stack.Screen name="HorseDetail" component={HorseDetailScreen} />
```

Add a tab for Horse Racing in the main tab navigator.

## API Integration

### MMA Round Betting API

1. **Sherdog API Extension**:
   - Add endpoint for round betting options
   - Include odds data for different outcomes
   - Implement caching for performance

2. **Fallback Mechanism**:
   - Generate realistic mock data when API is unavailable
   - Ensure consistent data structure between real and mock data

### Horse Racing API

1. **API Selection**:
   - Research available horse racing APIs (Racing Post API, Equibase, etc.)
   - Evaluate pricing, data quality, and coverage
   - Select API with best balance of features and cost

2. **API Integration**:
   - Implement authentication and error handling
   - Create data transformation layer
   - Add caching for performance
   - Implement fallback to mock data when API is unavailable

## UI/UX Design

### MMA Round Betting

1. **Round Betting UI**:
   - Clear display of round-by-round options
   - Visual indicators for different outcomes (KO, TKO, Submission, Decision)
   - Interactive selection of betting options
   - Odds displayed prominently

2. **Premium Feature Prompt**:
   - Clean, non-intrusive design
   - Clear value proposition
   - Easy access to subscription or one-time purchase

### Horse Racing

1. **Race List UI**:
   - Card-based design for races
   - Clear display of key information (track, time, distance)
   - Status indicators (upcoming, live, completed)
   - Sorting and filtering options

2. **Horse List UI**:
   - Visual representation of horses
   - Silk colors and form indicators
   - Odds displayed prominently
   - Selection mechanism for betting

3. **Betting Slip UI**:
   - Clear display of selected bets
   - Easy input for stake amount
   - Calculation of potential payout
   - Confirmation process for placing bets

## Subscription & Monetization

### MMA Round Betting

1. **Access Tiers**:
   - Premium subscribers: Full access to all round betting
   - Basic subscribers: No access (upsell opportunity)
   - One-time purchase: $1.99 for access to round betting for a specific fight

2. **Implementation**:
   - Add 'round-betting' to MICROTRANSACTIONS array
   - Implement access control in FightDetailScreen
   - Add purchase flow for one-time access

### Horse Racing

1. **Access Tiers**:
   - Premium subscribers: Full access to all races and betting options
   - Basic subscribers: Limited access (view races but not detailed odds)
   - One-time purchase: $2.99 for access to a specific race meeting

2. **Implementation**:
   - Add 'race-meeting-access' to MICROTRANSACTIONS array
   - Implement tiered access control in HorseRacingScreen and RaceDetailScreen
   - Add purchase flow for one-time access

## Testing Strategy

1. **Unit Testing**:
   - Test data models and transformations
   - Test service layer methods
   - Test subscription and access control logic

2. **Integration Testing**:
   - Test API integration with mock servers
   - Test caching mechanisms
   - Test fallback to mock data

3. **UI Testing**:
   - Test component rendering and interaction
   - Test responsive design across devices
   - Test accessibility features

4. **User Acceptance Testing**:
   - Test with real users familiar with MMA and horse racing
   - Gather feedback on usability and feature completeness
   - Iterate based on feedback

## Implementation Timeline

### Phase 1: MMA Round Betting (4 weeks)

1. **Week 1**: Data model extensions and service layer updates
2. **Week 2**: UI components and screens
3. **Week 3**: Integration with subscription service and access control
4. **Week 4**: Testing and refinement

### Phase 2: Horse Racing (6 weeks)

1. **Week 1-2**: Data models and API integration
2. **Week 3-4**: Service layer and basic UI components
3. **Week 5**: Screens and navigation
4. **Week 6**: Integration with subscription service, testing, and refinement

### Phase 3: Launch and Optimization (2 weeks)

1. **Week 1**: Final testing and bug fixes
2. **Week 2**: Launch preparation and monitoring

## Conclusion

This implementation plan provides a comprehensive roadmap for adding MMA round betting and horse racing features to the AI Sports Edge app. By following this plan, we can deliver high-quality features that enhance the user experience and drive monetization through both subscriptions and microtransactions.

The phased approach allows for focused development and testing of each feature, ensuring that we can deliver value incrementally and gather feedback along the way.
