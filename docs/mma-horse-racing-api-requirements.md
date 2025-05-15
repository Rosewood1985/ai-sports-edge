# MMA Round Betting and Horse Racing API Requirements

This document outlines the API requirements for implementing MMA round betting and horse racing features in the AI Sports Edge app.

## Table of Contents
1. [Overview](#overview)
2. [MMA/UFC API Requirements](#mmaufc-api-requirements)
3. [Horse Racing API Requirements](#horse-racing-api-requirements)
4. [API Fallback Strategy](#api-fallback-strategy)
5. [Data Caching Strategy](#data-caching-strategy)
6. [API Cost Considerations](#api-cost-considerations)

## Overview

The implementation of MMA round betting and horse racing features requires integration with specialized sports data APIs. This document outlines the requirements for these APIs, including endpoints, data formats, and fallback strategies.

## MMA/UFC API Requirements

### Current API Integration

The app currently uses a combination of:
- Sherdog API for fighter and event data
- Odds API for betting odds

### Additional API Requirements

To support round betting, we need the following additional data:

#### 1. Round Betting Odds

**Endpoint:** `/fights/{fightId}/round-betting`

**Required Data:**
- Round-by-round odds for each fighter
- Odds for different fight outcomes (KO, TKO, Submission, Decision)
- Method of victory for each round

**Example Response:**
```json
{
  "fight_id": "12345",
  "round_betting": [
    {
      "fighter_id": "fighter-001",
      "round": 1,
      "outcome": "KO",
      "odds": 6.5
    },
    {
      "fighter_id": "fighter-001",
      "round": 1,
      "outcome": "TKO",
      "odds": 5.0
    },
    {
      "fighter_id": "fighter-001",
      "round": 1,
      "outcome": "Submission",
      "odds": 7.0
    },
    // Additional rounds and outcomes...
  ]
}
```

#### 2. Fight Status Updates

**Endpoint:** `/fights/{fightId}/status`

**Required Data:**
- Current fight status (scheduled, in_progress, completed)
- Current round (if in progress)
- Winner and method of victory (if completed)

**Example Response:**
```json
{
  "fight_id": "12345",
  "status": "in_progress",
  "current_round": 2,
  "elapsed_time": "2:30",
  "fighter1_score": {
    "round1": 10,
    "round2": 9
  },
  "fighter2_score": {
    "round1": 9,
    "round2": 10
  }
}
```

### API Providers to Consider

1. **Sportradar UFC API**
   - Comprehensive UFC data
   - Includes round-by-round statistics
   - Higher cost but more reliable

2. **Odds API with UFC Extension**
   - Specialized in betting odds
   - May require custom integration for round betting

3. **Custom Sherdog Scraper Extension**
   - Extend current integration
   - May require additional development for round betting data

### Implementation Considerations

1. **API Rate Limits**
   - Most UFC APIs have strict rate limits
   - Implement caching to reduce API calls

2. **Data Freshness**
   - Round betting odds can change rapidly
   - Implement real-time updates for live fights

3. **Data Consistency**
   - Ensure fighter IDs are consistent across APIs
   - Map external IDs to internal IDs if necessary

## Horse Racing API Requirements

### Required API Endpoints

#### 1. Race Meetings

**Endpoint:** `/meetings`

**Required Data:**
- List of upcoming race meetings
- Track information
- Meeting dates and times

**Example Response:**
```json
{
  "meetings": [
    {
      "id": "meeting-001",
      "name": "Churchill Downs Race Day",
      "track_name": "Churchill Downs",
      "location": "Louisville, KY",
      "date": "2025-05-03",
      "races": [
        {
          "id": "race-001",
          "name": "Kentucky Derby",
          "time": "18:30",
          "distance": "1 1/4 miles",
          "surface": "dirt",
          "grade": "Grade 1",
          "purse": "$3,000,000"
        },
        // Additional races...
      ]
    },
    // Additional meetings...
  ]
}
```

#### 2. Race Details

**Endpoint:** `/races/{raceId}`

**Required Data:**
- Detailed race information
- List of horses
- Odds for each horse
- Race status

**Example Response:**
```json
{
  "id": "race-001",
  "name": "Kentucky Derby",
  "track_name": "Churchill Downs",
  "location": "Louisville, KY",
  "date": "2025-05-03",
  "time": "18:30",
  "distance": "1 1/4 miles",
  "surface": "dirt",
  "grade": "Grade 1",
  "purse": "$3,000,000",
  "status": "upcoming",
  "horses": [
    {
      "id": "horse-001",
      "name": "Swift Thunder",
      "jockey": "John Smith",
      "trainer": "Bob Baffert",
      "age": 3,
      "weight": 126,
      "silk_colors": "blue and white",
      "form": "1-2-1-3",
      "odds": 4.5,
      "image_url": "https://example.com/horses/swift-thunder.jpg"
    },
    // Additional horses...
  ]
}
```

#### 3. Horse Details

**Endpoint:** `/horses/{horseId}`

**Required Data:**
- Detailed horse information
- Past performance
- Jockey and trainer information

**Example Response:**
```json
{
  "id": "horse-001",
  "name": "Swift Thunder",
  "jockey": "John Smith",
  "trainer": "Bob Baffert",
  "age": 3,
  "weight": 126,
  "silk_colors": "blue and white",
  "form": "1-2-1-3",
  "odds": 4.5,
  "image_url": "https://example.com/horses/swift-thunder.jpg",
  "past_performances": [
    {
      "race_id": "race-123",
      "race_name": "Florida Derby",
      "date": "2025-03-29",
      "position": 1,
      "time": "1:49.73",
      "margin": "2 lengths"
    },
    // Additional past performances...
  ]
}
```

#### 4. Race Results

**Endpoint:** `/races/{raceId}/results`

**Required Data:**
- Final positions
- Finish times
- Margins of victory

**Example Response:**
```json
{
  "race_id": "race-001",
  "status": "completed",
  "results": [
    {
      "position": 1,
      "horse_id": "horse-001",
      "finish_time": "2:01.02",
      "margin_of_victory": "2 1/2 lengths"
    },
    {
      "position": 2,
      "horse_id": "horse-002",
      "finish_time": "2:01.45",
      "margin_of_victory": "1 length"
    },
    // Additional results...
  ]
}
```

### API Providers to Consider

1. **Racing Post API**
   - Comprehensive horse racing data
   - Covers international races
   - Good documentation and support

2. **Equibase API**
   - Focused on North American racing
   - Detailed horse and race information
   - Industry standard for US racing

3. **Timeform API**
   - Specialized in ratings and form
   - Excellent for betting insights
   - European focus

4. **Betfair Exchange API**
   - Real-time odds from betting exchange
   - Market movements and liquidity
   - Requires Betfair account

### Implementation Considerations

1. **Geographic Coverage**
   - Different APIs cover different regions
   - May need multiple APIs for global coverage

2. **Data Depth**
   - Some APIs provide basic data only
   - Premium tiers often required for detailed stats

3. **Update Frequency**
   - Race status and odds need frequent updates
   - Live race data may require websocket connections

## API Fallback Strategy

To ensure the app functions even when APIs are unavailable, we'll implement a robust fallback strategy:

### 1. Tiered API Approach

For each feature, implement a tiered approach to API calls:

```
Primary API → Secondary API → Local Mock Data
```

### 2. Mock Data Generation

Create realistic mock data generators for both MMA round betting and horse racing:

```typescript
// Example mock data generator for round betting
function generateMockRoundBettingOptions(fight: UFCFight): RoundBettingOption[] {
  const options: RoundBettingOption[] = [];
  const totalRounds = fight.rounds || 3;
  
  // Generate options for each fighter, round, and outcome
  [fight.fighter1.id, fight.fighter2.id].forEach(fighterId => {
    for (let round = 1; round <= totalRounds; round++) {
      // Generate options for different outcomes
      // with realistic odds distribution
    }
  });
  
  return options;
}
```

### 3. Caching with TTL (Time-to-Live)

Implement caching with appropriate TTL values:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Fighter/Horse Profiles | 24 hours | Static data that rarely changes |
| Event/Race Listings | 1 hour | May change but not frequently |
| Odds | 5 minutes | Changes frequently |
| Live Event Status | 30 seconds | Needs to be current |

## Data Caching Strategy

To optimize API usage and improve performance, we'll implement a comprehensive caching strategy:

### 1. Multi-Level Caching

```
Memory Cache → AsyncStorage → API
```

### 2. Cache Invalidation Rules

| Trigger | Action |
|---------|--------|
| App Launch | Refresh event/race listings if older than 1 hour |
| Pull-to-Refresh | Clear cache for current view and fetch fresh data |
| Background Refresh | Update odds and status data every 5 minutes |
| Event Start | Switch to more frequent updates for live events |

### 3. Offline Support

- Cache essential data for offline viewing
- Clearly indicate when data is stale
- Queue betting actions for when connectivity is restored

## API Cost Considerations

### MMA/UFC API Estimated Costs

| API Provider | Plan | Monthly Cost | Request Limit | Cost per 1000 MAU |
|--------------|------|--------------|---------------|-------------------|
| Sportradar UFC | Basic | $500 | 10,000 calls/day | $0.50 |
| Odds API | Standard | $99 | 10,000 calls/month | $0.10 |
| Custom Sherdog | N/A | Development cost only | Unlimited | $0.05 |

### Horse Racing API Estimated Costs

| API Provider | Plan | Monthly Cost | Request Limit | Cost per 1000 MAU |
|--------------|------|--------------|---------------|-------------------|
| Racing Post | Standard | $299 | 50,000 calls/month | $0.30 |
| Equibase | Basic | $199 | 30,000 calls/month | $0.20 |
| Timeform | Premium | $399 | 100,000 calls/month | $0.40 |
| Betfair | Free | $0 | 5,000 calls/hour | $0.00 |

### Cost Optimization Strategies

1. **Implement Aggressive Caching**
   - Reduce API calls by 60-80% with proper caching
   - Use background refresh for non-critical data

2. **Batch API Requests**
   - Combine multiple data requests where possible
   - Fetch full event data rather than individual fights

3. **Selective Data Loading**
   - Load basic data first, then details on demand
   - Implement pagination for large data sets

4. **Hybrid Approach**
   - Use premium API for critical data
   - Use free/cheaper APIs for supplementary data
   - Generate non-critical data locally

## Conclusion

The implementation of MMA round betting and horse racing features requires careful API integration planning. By selecting the right API providers, implementing robust caching and fallback strategies, and optimizing for cost, we can deliver a high-quality user experience while managing development and operational costs effectively.

The phased implementation approach allows for testing and refinement of the API integration strategy, ensuring that we can deliver a reliable and performant experience for users.