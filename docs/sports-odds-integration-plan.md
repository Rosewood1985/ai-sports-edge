# Sports Odds Integration Implementation Plan

This document outlines the comprehensive plan for integrating WNBA, NCAA March Madness, and Formula 1 odds across web, iOS, and Android platforms, with FanDuel integration.

## Table of Contents
1. [API Integration Requirements](#api-integration-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Technical Requirements](#detailed-technical-requirements)
5. [Database Schema Updates](#database-schema-updates)
6. [Implementation Timeline](#implementation-timeline)
7. [Key Considerations](#key-considerations)
8. [Next Steps](#next-steps)

## API Integration Requirements

### Sports APIs to Integrate
- **WNBA**: Regular season and playoff odds
- **NCAA Basketball**: Men's and women's March Madness tournament odds
- **Formula 1**: Race and championship odds

### Potential API Sources
- **ESPN API**: For basic game data and schedules
- **The Odds API**: For betting odds across multiple providers
- **SportsData.io**: Comprehensive sports data including player stats
- **RapidAPI Sports offerings**: Various sports data providers
- **FanDuel Partner API**: For direct odds integration and affiliate linking

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Sports Data   │     │    FanDuel      │     │  User Account   │
│      APIs       │     │      API        │     │    Service      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend Service                           │
├─────────────────────────────────────────────────────────────────┤
│                    Data Processing Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                        Odds Database                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   API Gateway   │
                        └────┬──────┬─────┘
                             │      │
          ┌─────────────────┘      └─────────────────┐
          │                                          │
┌─────────┴─────────┐              ┌─────────────────┴─┐
│     Web App       │              │   Mobile Apps     │
│                   │              │  (iOS & Android)  │
└───────────────────┘              └───────────────────┘
```

## Implementation Phases

### Phase 1: Web App Implementation
1. **Create API integration services for each sport**
   - Develop service classes for WNBA, NCAA, and Formula 1
   - Implement data fetching and parsing logic
   - Create caching mechanisms for API responses

2. **Implement odds data models and database schema**
   - Design database tables for games, odds, and predictions
   - Create data models for frontend consumption
   - Implement data validation and normalization

3. **Build backend endpoints for odds retrieval**
   - Create RESTful API endpoints for each sport
   - Implement filtering and sorting capabilities
   - Add authentication for premium content

4. **Update news ticker to include new sports**
   - Modify sports-api.js to include WNBA, NCAA, and F1 data
   - Update UI components to display new sports
   - Implement responsive design for various screen sizes

5. **Create purchase flow for odds predictions**
   - Design premium content UI
   - Implement Stripe integration for purchases
   - Create user dashboard for purchased predictions

6. **Implement FanDuel deep linking**
   - Add affiliate tracking parameters
   - Create deep links to specific bets on FanDuel
   - Implement conversion tracking

### Phase 2: iOS App Implementation
1. **Update iOS data models to support new sports**
   - Create Swift models for WNBA, NCAA, and F1 data
   - Implement data parsing and validation
   - Design local storage solution

2. **Implement API client for new endpoints**
   - Create API service classes
   - Implement authentication and error handling
   - Add caching for offline access

3. **Create UI components for displaying odds**
   - Design sport-specific UI components
   - Implement SwiftUI views for odds display
   - Create animations and transitions

4. **Build purchase flow for premium predictions**
   - Implement StoreKit for in-app purchases
   - Create receipt validation
   - Design subscription management UI

5. **Implement FanDuel app linking**
   - Add deep linking to FanDuel iOS app
   - Implement universal links
   - Create fallback to web if app not installed

### Phase 3: Android App Implementation
1. **Mirror iOS implementation for Android**
   - Create Kotlin data models
   - Implement API client
   - Design UI components

2. **Ensure consistent experience across platforms**
   - Maintain design consistency
   - Implement feature parity
   - Create shared business logic

3. **Optimize for Android-specific considerations**
   - Adapt to different screen sizes
   - Implement Google Play billing
   - Handle Android lifecycle events

## Detailed Technical Requirements

### Backend Services
- **New API Endpoints**:
  - `/api/odds/wnba` - WNBA odds data
  - `/api/odds/ncaa/mens` - Men's NCAA basketball odds
  - `/api/odds/ncaa/womens` - Women's NCAA basketball odds
  - `/api/odds/formula1` - Formula 1 racing odds
  - `/api/predictions/premium` - Premium predictions

- **Caching Layer**:
  - Redis for high-speed caching
  - TTL-based cache invalidation
  - Staggered updates to prevent API rate limiting

- **Authentication**:
  - JWT-based authentication
  - Role-based access control
  - Premium content authorization

- **Scheduled Jobs**:
  - Hourly odds updates
  - Daily prediction generation
  - Weekly performance analysis

### Web App
- **sports-api.js Updates**:
  - Add WNBA, NCAA, and F1 data fetching
  - Implement error handling and fallbacks
  - Create data normalization functions

- **UI Components**:
  - Sport-specific odds cards
  - Interactive prediction visualizations
  - Purchase flow modals

- **Purchase Flow**:
  - Stripe Elements integration
  - Subscription management
  - One-time purchase options

- **FanDuel Integration**:
  - Affiliate link generation
  - Conversion tracking
  - Deep linking to specific bets

### Mobile Apps
- **Data Models**:
  - Sport-specific data structures
  - Local storage with SQLite or Realm
  - Data synchronization logic

- **UI Screens**:
  - Sport selection interface
  - Odds comparison views
  - Prediction detail screens

- **In-App Purchases**:
  - Subscription options
  - One-time prediction purchases
  - Receipt validation

- **Deep Linking**:
  - Universal/App Links
  - Deferred deep linking
  - Attribution tracking

## Database Schema Updates

### New Tables

**Sports**
```sql
CREATE TABLE sports (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Games**
```sql
CREATE TABLE games (
  id VARCHAR(36) PRIMARY KEY,
  sport_id VARCHAR(36) NOT NULL,
  external_id VARCHAR(100),
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_id) REFERENCES sports(id)
);
```

**Odds**
```sql
CREATE TABLE odds (
  id VARCHAR(36) PRIMARY KEY,
  game_id VARCHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  home_odds DECIMAL(10,2),
  away_odds DECIMAL(10,2),
  draw_odds DECIMAL(10,2),
  over_under DECIMAL(10,2),
  spread DECIMAL(10,2),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

**Predictions**
```sql
CREATE TABLE predictions (
  id VARCHAR(36) PRIMARY KEY,
  game_id VARCHAR(36) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  prediction_value VARCHAR(100) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);
```

**Purchases**
```sql
CREATE TABLE purchases (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  prediction_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);
```

## Implementation Timeline

### Week 1-2: API Integration & Backend Development
- Research and select APIs for each sport
- Create data models and database schema
- Implement initial API integration services
- Set up caching and scheduled updates

### Week 3-4: Web App Implementation
- Update sports-api.js to include new sports
- Create UI components for odds display
- Implement purchase flow for predictions
- Add FanDuel affiliate links

### Week 5-6: iOS App Implementation
- Update Swift data models
- Create API client for new endpoints
- Design UI components for odds display
- Implement StoreKit for in-app purchases

### Week 7-8: Android App Implementation
- Create Kotlin data models
- Implement API client
- Design UI components
- Implement Google Play billing

### Week 9-10: FanDuel Integration & Testing
- Implement deep linking to FanDuel
- Test conversion tracking
- Perform cross-platform testing
- Optimize performance

## Key Considerations

### Technical Challenges
- **Real-time Odds Updates**: Implementing efficient polling or websocket connections for live odds updates
- **API Rate Limits**: Managing multiple API calls while respecting rate limits
- **Data Normalization**: Handling different data formats across sports and providers
- **Purchase Security**: Ensuring secure and reliable payment processing

### Business Considerations
- **FanDuel Affiliate Requirements**: Meeting all requirements for the affiliate program
- **Pricing Strategy**: Determining optimal pricing for premium predictions
- **User Experience**: Balancing free content with premium offerings
- **Conversion Optimization**: Maximizing conversion from free to paid users

### Legal & Compliance
- **Sports Betting Regulations**: Ensuring compliance with regional betting laws
- **App Store Policies**: Adhering to Apple and Google guidelines for gambling-related content
- **Data Usage Rights**: Respecting terms of service for all API providers
- **User Privacy**: Implementing proper data protection measures

## Next Steps

1. **Immediate Actions**:
   - Research and select specific APIs for each sport
   - Create detailed technical specifications
   - Set up development environments

2. **Development Kickoff**:
   - Begin backend service implementation
   - Create database schema
   - Implement initial API integrations

3. **Web App Development**:
   - Update sports-api.js
   - Create new UI components
   - Implement purchase flow

4. **Mobile Development**:
   - Update iOS data models
   - Create API clients
   - Design UI components