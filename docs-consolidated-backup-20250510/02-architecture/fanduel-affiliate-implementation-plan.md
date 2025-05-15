# FanDuel Affiliate Integration Implementation Plan

## Overview

This document outlines the implementation plan for adding "Bet Now" buttons throughout the AI Sports Edge platform (web, iOS, and Android) to drive affiliate traffic to FanDuel. The buttons will be styled with a neon effect to match the site's aesthetic and will appear in strategic locations to maximize conversion.

## Components to Create

### 1. BettingAffiliateContext and Service

#### BettingAffiliateContext.tsx
- Create a React Context to manage the affiliate integration
- Store affiliate code/URL parameters
- Manage when and where to show the "Bet Now" buttons
- Track user interactions with the buttons

#### BettingAffiliateService.ts
- Generate affiliate links
- Track conversions
- Determine when to show buttons based on user preferences and content

### 2. BetNowButton Component

#### Web Implementation (BetNowButton.js)
- Create a React component that extends the existing NeonButton styling
- Include animation effects (pulsating, flickering)
- Support different sizes and positions
- Track clicks for analytics

#### Mobile Implementation (BetNowButton.tsx)
- Create a React Native component using the existing NeonButton component
- Implement similar animations adapted for mobile
- Support different sizes and positions
- Track clicks for analytics

### 3. Team Colors Database

#### teamColors.ts
- Create a comprehensive database of team colors for all major sports leagues:
  - NBA
  - NFL
  - MLB
  - NHL
  - WNBA
  - NCAA Basketball
- Include primary and secondary colors
- Include neon variants of each color for the UI

### 4. Enhanced Personalization

#### Web Implementation
- Update PersonalizationPanel.js to include favorite team selection
- Add team color preview
- Implement team color theming for premium users

#### Mobile Implementation
- Update PersonalizationScreen.tsx to include favorite team selection
- Add team color preview
- Implement team color theming for premium users

## Implementation Phases

### Phase 1: Core Components

1. Create BettingAffiliateContext and Provider
   - Implement for both web and mobile
   - Share core logic between platforms

2. Create BetNowButton component
   - Implement for web (React)
   - Implement for mobile (React Native)
   - Ensure consistent styling and behavior

3. Create team colors database
   - Implement as a shared TypeScript module
   - Include all major leagues

4. Implement fixed button placements
   - Add to web header and footer
   - Add to mobile header and tab bar

### Phase 2: Team Colors and Personalization

1. Enhance PersonalizationPanel with favorite team selection
   - Update web PersonalizationPanel.js
   - Update mobile PersonalizationScreen.tsx

2. Implement team color theming for premium users
   - Create color theme generator based on team colors
   - Apply themes to UI components

3. Create neon variants of team colors
   - Implement algorithm to generate neon variants
   - Test across different color schemes

### Phase 3: Dynamic Placement and Animation

1. Implement logic for showing buttons based on content
   - Show when viewing favorite team content
   - Show when viewing favorable odds

2. Add buttons to game cards and odds displays
   - Update GameCard components
   - Update OddsScreen components

3. Implement post-interaction button displays
   - Show after viewing predictions
   - Show after certain user actions

4. Add advanced neon animations
   - Implement pulsating effect
   - Implement flicker effect
   - Implement attention-grabbing animations

## Button Placement Strategy

### Fixed Placements (All Platforms)

- **Header**: Add a persistent "Bet Now" button in the navigation
- **Footer/Tab Bar**: Add a "Bet Now" button in the footer (web) or tab bar (mobile)
- **Pricing Page**: Add buttons after each subscription plan
- **Home Page**: Add buttons in strategic sections

### Dynamic Placements (All Platforms)

- Show buttons when viewing favorable odds
- Show buttons when viewing content related to user's favorite teams
- Show buttons after user interactions (e.g., viewing predictions)

### Excluded Placements

- No dynamic "Bet Now" buttons on the FAQ page (only the fixed header/footer buttons)

## Team Colors Implementation

### Database Structure

```typescript
interface TeamColor {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  neonPrimaryColor: string;
  neonSecondaryColor: string;
}

interface TeamColorsDatabase {
  nba: Record<string, TeamColor>;
  nfl: Record<string, TeamColor>;
  mlb: Record<string, TeamColor>;
  nhl: Record<string, TeamColor>;
  wnba: Record<string, TeamColor>;
  ncaab: Record<string, TeamColor>;
}
```

### Example Team Entry

```javascript
{
  "lakers": {
    "name": "Los Angeles Lakers",
    "primaryColor": "#552583",
    "secondaryColor": "#FDB927",
    "neonPrimaryColor": "#7747A3",
    "neonSecondaryColor": "#FFDB8C"
  }
}
```

## Favorite Team Selection UI

The favorite team selection UI will:
- Group teams by league
- Show team logos with their colors
- Allow selection of multiple favorite teams
- Highlight the primary team (for color theming)
- Preview the neon color effect

## Button Animation System

We'll implement several animation options for the "Bet Now" buttons:

1. **Pulsating Glow Effect**
   - Animate the shadow/glow intensity
   - Cycle between normal and high intensity

2. **Neon Flicker Effect**
   - Occasionally reduce opacity briefly
   - Randomize timing for realistic effect

3. **Power Surge Animation**
   - Occasionally increase glow intensity dramatically
   - Use to draw attention at key moments

## Analytics Implementation

We'll implement analytics tracking to measure the effectiveness of the "Bet Now" buttons:

- Track button impressions
- Track button clicks
- Analyze which placements generate the most engagement
- A/B test different button styles and animations

## Technical Considerations

### Performance
- Ensure animations don't impact page/app performance
- Lazy-load team color data
- Optimize button rendering to prevent layout shifts

### Accessibility
- Ensure buttons have proper ARIA labels (web) and accessibility traits (mobile)
- Provide options to reduce animations
- Maintain proper contrast ratios for text

### Mobile Responsiveness
- Adapt button sizes and positions for different screen sizes
- Ensure touch targets are appropriately sized
- Consider different animation approaches for mobile

## NCAA Basketball Integration

We'll leverage the existing NCAA Basketball API integration to:

1. Display NCAA basketball games and odds
2. Show "Bet Now" buttons alongside NCAA basketball content
3. Use the API data to determine favorable betting opportunities
4. Include NCAA basketball teams in the team colors database