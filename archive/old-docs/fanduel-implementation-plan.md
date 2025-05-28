# FanDuel Affiliate Link Implementation Plan

## Overview

This plan outlines the implementation of the FanDuel affiliate link for AI Sports Edge, focusing on using the direct URL provided.

## 1. Environment Variables Setup

### 1.1 Update .env.example

Add the FanDuel affiliate URL to the .env.example file:

```
# Affiliate Links
FANDUEL_AFFILIATE_URL=https://fndl.co/your-affiliate-code
```

### 1.2 Update .env

Add the actual FanDuel affiliate URL to the .env file:

```
# Affiliate Links
FANDUEL_AFFILIATE_URL=https://fndl.co/lr9jbkg
```

### 1.3 Update Environment Variable Validation

Update the scripts/check-env.js file to validate the new environment variable:

```javascript
const REQUIRED_VARIABLES = [
  // Firebase
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  
  // Affiliate Links
  'FANDUEL_AFFILIATE_URL',
];
```

## 2. Affiliate Configuration

### 2.1 Update affiliateConfig.ts

Update the config/affiliateConfig.ts file to use the direct URL:

```typescript
import { FANDUEL_AFFILIATE_URL } from '@env';

// FanDuel Affiliate Configuration
export const FANDUEL_CONFIG = {
  // Affiliate ID loaded from environment variables
  AFFILIATE_ID: 'ai-sports-edge-001',
  
  // Base URL for FanDuel
  BASE_URL: 'https://sportsbook.fanduel.com/',
  
  // Affiliate link (direct URL)
  AFFILIATE_URL: FANDUEL_AFFILIATE_URL || 'https://fndl.co/lr9jbkg',
};
```

## 3. Update Components

### 3.1 Update BetNowPopup.js

Update the BetNowPopup.js component to use the direct URL:

```javascript
// Use the direct affiliate link
const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;
```

### 3.2 Update OddsButton.js

Update the OddsButton.js component to use the direct URL:

```javascript
// Use the direct affiliate link
const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;
```

### 3.3 Update BetNowButton.js

Update the BetNowButton.js component to use the direct URL:

```javascript
// Import the FANDUEL_CONFIG to get the affiliate link
const { FANDUEL_CONFIG } = await import('../../config/affiliateConfig');

// Use the direct affiliate link
const affiliateUrl = FANDUEL_CONFIG.AFFILIATE_URL;
```

## 4. Analytics Tracking

### 4.1 Add Analytics Tracking

Add analytics tracking for affiliate link clicks:

```javascript
// Track the click event
analytics().logEvent('affiliate_click', {
  sportsbook: 'FanDuel',
  screen: 'screen_name',
  timestamp: Date.now(),
});
```

## 5. Documentation

### 5.1 Update docs/affiliate-links.md

Create or update the affiliate links documentation:

```markdown
# Affiliate Links Documentation

This document explains how to use and configure the FanDuel affiliate link in the AI Sports Edge application.

## Overview

AI Sports Edge uses the FanDuel affiliate link to monetize the application through a partnership with FanDuel.

## Configuration

The FanDuel affiliate link is configured through an environment variable:

```
FANDUEL_AFFILIATE_URL=https://fndl.co/lr9jbkg
```

## Usage

The FanDuel affiliate link is used in the following components:

- BetNowPopup.js
- OddsButton.js
- BetNowButton.js

## Analytics

Affiliate clicks are tracked using Firebase Analytics. The following event is logged:

```
affiliate_click
```

With the following parameters:

- `sportsbook`: The name of the sportsbook (e.g., "FanDuel")
- `screen`: The screen where the click occurred
- `timestamp`: The timestamp of the click
```

## Implementation Steps

1. Update environment variables (.env.example, .env)
2. Update environment variable validation (scripts/check-env.js)
3. Update affiliate configuration (config/affiliateConfig.ts)
4. Update components (BetNowPopup.js, OddsButton.js, BetNowButton.js)
5. Add analytics tracking
6. Update documentation

## Future Expansion

This implementation is designed to be easily expanded in the future when more affiliate links are available. The architecture is intentionally structured to minimize refactoring when adding new sportsbooks.

### Adding More Sportsbooks

When additional sportsbook affiliate links become available (e.g., BetMGM, Caesars, DraftKings, PointsBet), the following steps would be taken:

1. **Environment Variables**: Add new environment variables for each sportsbook
   ```
   BETMGM_AFFILIATE_URL=https://your-betmgm-affiliate-link.com
   CAESARS_AFFILIATE_URL=https://your-caesars-affiliate-link.com
   DRAFTKINGS_AFFILIATE_URL=https://your-draftkings-affiliate-link.com
   POINTSBET_AFFILIATE_URL=https://your-pointsbet-affiliate-link.com
   ```

2. **Affiliate Configuration**: Expand the configuration to include all sportsbooks
   ```typescript
   export const AFFILIATE_CONFIG = {
     FANDUEL: {
       NAME: 'FanDuel',
       LABEL: 'Place Bet on FanDuel',
       URL: FANDUEL_AFFILIATE_URL,
     },
     BETMGM: {
       NAME: 'BetMGM',
       LABEL: 'Bet Now with BetMGM',
       URL: BETMGM_AFFILIATE_URL,
     },
     // Additional sportsbooks...
   };
   ```

3. **Geo-Targeting**: Implement geo-targeting to show the most relevant sportsbook based on user location
   ```typescript
   export const getAffiliateLinkByState = (state: string): AffiliateData => {
     switch (state.toUpperCase()) {
       case 'NJ':
       case 'NY':
         return AFFILIATE_CONFIG.FANDUEL;
       case 'NV':
       case 'MI':
         return AFFILIATE_CONFIG.BETMGM;
       // Additional states...
       default:
         return AFFILIATE_CONFIG.FANDUEL;
     }
   };
   ```

4. **Universal Component**: Create a universal affiliate button component that works with any sportsbook
   ```tsx
   <AffiliateButton
     name={affiliateData.name}
     label={affiliateData.label}
     url={affiliateData.url}
     screen="screen_name"
   />
   ```

5. **Analytics**: Expand analytics tracking to include the specific sportsbook
   ```javascript
   analytics().logEvent('affiliate_click', {
     sportsbook: affiliateData.name,
     screen: 'screen_name',
     state: userState,
     timestamp: Date.now(),
   });
   ```

### Benefits of This Approach

1. **Minimal Refactoring**: The current implementation requires minimal changes to support multiple sportsbooks
2. **Centralized Configuration**: All sportsbook data is managed in a single configuration file
3. **Consistent User Experience**: The affiliate button UI remains consistent across sportsbooks
4. **Detailed Analytics**: Analytics tracking is designed to work with multiple sportsbooks
5. **Geo-Targeting**: The architecture supports showing different sportsbooks based on user location

### Implementation Timeline for Future Expansion

When additional affiliate links become available, the expansion can be implemented in approximately 1-2 days, following the comprehensive plan in `affiliate-implementation-plan.md`.

## Conclusion

This implementation plan provides a focused approach to integrating the FanDuel affiliate link using the direct URL. The design allows for easy expansion in the future when more affiliate links are available.