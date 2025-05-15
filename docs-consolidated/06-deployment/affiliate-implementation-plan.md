# Affiliate Link Implementation Plan

## Overview

This plan outlines the implementation of a comprehensive affiliate link system for AI Sports Edge, including multiple sportsbooks, geo-targeting, and analytics tracking.

## 1. Environment Variables Setup

### 1.1 Update .env.example

Add all required affiliate URLs to the .env.example file:

```
# Affiliate Links
FANDUEL_AFFILIATE_URL=https://fndl.co/your-affiliate-code
BETMGM_AFFILIATE_URL=https://your-incomeaccess-link.com/track/betmgm
CAESARS_AFFILIATE_URL=https://your-incomeaccess-link.com/track/caesars
```

### 1.2 Update .env

Add the actual affiliate URLs to the .env file:

```
# Affiliate Links
FANDUEL_AFFILIATE_URL=https://fndl.co/lr9jbkg
BETMGM_AFFILIATE_URL=https://your-incomeaccess-link.com/track/betmgm
CAESARS_AFFILIATE_URL=https://your-incomeaccess-link.com/track/caesars
```

### 1.3 Update Environment Variable Validation

Update the scripts/check-env.js file to validate the new environment variables:

```javascript
const REQUIRED_VARIABLES = [
  // Firebase
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  
  // Affiliate Links
  'FANDUEL_AFFILIATE_URL',
  'BETMGM_AFFILIATE_URL',
  'CAESARS_AFFILIATE_URL',
];
```

## 2. Affiliate Configuration

### 2.1 Update affiliateConfig.ts

Update the config/affiliateConfig.ts file to include all sportsbooks:

```typescript
import {
  FANDUEL_AFFILIATE_URL,
  BETMGM_AFFILIATE_URL,
  CAESARS_AFFILIATE_URL
} from '@env';

// Sportsbook Affiliate Configuration
export const AFFILIATE_CONFIG = {
  FANDUEL: {
    NAME: 'FanDuel',
    LABEL: 'Place Bet on FanDuel',
    URL: FANDUEL_AFFILIATE_URL || 'https://fndl.co/lr9jbkg',
  },
  BETMGM: {
    NAME: 'BetMGM',
    LABEL: 'Bet Now with BetMGM',
    URL: BETMGM_AFFILIATE_URL || 'https://your-incomeaccess-link.com/track/betmgm',
  },
  CAESARS: {
    NAME: 'Caesars',
    LABEL: 'See Odds on Caesars',
    URL: CAESARS_AFFILIATE_URL || 'https://your-incomeaccess-link.com/track/caesars',
  },
};
```

## 3. Geo-Targeting Utility

### 3.1 Create getAffiliateLinkByState.ts

Create a new utility function in utils/getAffiliateLinkByState.ts:

```typescript
import { AFFILIATE_CONFIG } from '../config/affiliateConfig';

export interface AffiliateData {
  name: string;
  label: string;
  url: string;
}

export const getAffiliateLinkByState = (state: string): AffiliateData => {
  switch (state.toUpperCase()) {
    case 'NJ':
    case 'NY':
    case 'PA':
    case 'MI':
    case 'IL':
    case 'CO':
    case 'IN':
    case 'IA':
    case 'WV':
    case 'TN':
    case 'VA':
    case 'AZ':
    case 'LA':
    case 'CT':
      return {
        name: AFFILIATE_CONFIG.FANDUEL.NAME,
        label: AFFILIATE_CONFIG.FANDUEL.LABEL,
        url: AFFILIATE_CONFIG.FANDUEL.URL,
      };
    case 'NV':
    case 'WY':
    case 'KS':
      return {
        name: AFFILIATE_CONFIG.BETMGM.NAME,
        label: AFFILIATE_CONFIG.BETMGM.LABEL,
        url: AFFILIATE_CONFIG.BETMGM.URL,
      };
    default:
      return {
        name: AFFILIATE_CONFIG.CAESARS.NAME,
        label: AFFILIATE_CONFIG.CAESARS.LABEL,
        url: AFFILIATE_CONFIG.CAESARS.URL,
      };
  }
};
```

## 4. Universal Affiliate Button Component

### 4.1 Create AffiliateButton.tsx

Create a new component in components/AffiliateButton.tsx:

```tsx
import React from 'react';
import { TouchableOpacity, Text, Linking, StyleSheet } from 'react-native';
import analytics from '@react-native-firebase/analytics';

interface AffiliateButtonProps {
  name: string;
  label: string;
  url: string;
  screen?: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export default function AffiliateButton({
  name,
  label,
  url,
  screen = 'unknown',
  variant = 'primary',
  size = 'medium',
}: AffiliateButtonProps) {
  const handlePress = async () => {
    // Track the click event
    await analytics().logEvent('affiliate_click', {
      sportsbook: name,
      screen,
      variant,
      size,
    });
    
    // Add UTM parameters
    const urlWithUTM = `${url}?utm_source=AISE&utm_medium=app&utm_campaign=${screen}`;
    
    // Open the URL
    Linking.openURL(urlWithUTM);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        styles[variant], 
        styles[size]
      ]} 
      onPress={handlePress}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#1E3A8A',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  small: {
    padding: 8,
    paddingHorizontal: 16,
  },
  medium: {
    padding: 12,
    paddingHorizontal: 24,
  },
  large: {
    padding: 16,
    paddingHorizontal: 32,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#1E3A8A',
  },
});
```

## 5. Location Service

### 5.1 Create locationService.ts

Create a new service in services/locationService.ts:

```typescript
import * as Location from 'expo-location';

interface LocationResult {
  state: string;
  error?: string;
}

export const getUserState = async (): Promise<LocationResult> => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return {
        state: 'DEFAULT',
        error: 'Location permission not granted',
      };
    }
    
    // Get current position
    const location = await Location.getCurrentPositionAsync({});
    
    // Reverse geocode to get address
    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    
    // Extract state code
    const stateCode = geocode[0]?.region || 'DEFAULT';
    
    return {
      state: stateCode,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      state: 'DEFAULT',
      error: error.message,
    };
  }
};
```

## 6. Implementation in Screens

### 6.1 Update AIRecommendationCard.tsx

Update the AIRecommendationCard component:

```tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AffiliateButton from '../components/AffiliateButton';
import { getAffiliateLinkByState, AffiliateData } from '../utils/getAffiliateLinkByState';
import { getUserState } from '../services/locationService';

export default function AIRecommendationCard() {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);

  useEffect(() => {
    const fetchUserState = async () => {
      const { state } = await getUserState();
      const data = getAffiliateLinkByState(state);
      setAffiliateData(data);
    };

    fetchUserState();
  }, []);

  return (
    <View>
      {/* ...other card UI like AI picks... */}
      
      {affiliateData && (
        <AffiliateButton
          name={affiliateData.name}
          label={affiliateData.label}
          url={affiliateData.url}
          screen="AI_Pick_Card"
          variant="primary"
          size="medium"
        />
      )}
    </View>
  );
}
```

### 6.2 Update OddsPage.tsx

Update the OddsPage component:

```tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AffiliateButton from '../components/AffiliateButton';
import { getAffiliateLinkByState, AffiliateData } from '../utils/getAffiliateLinkByState';
import { getUserState } from '../services/locationService';

export default function OddsPage() {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);

  useEffect(() => {
    const fetchUserState = async () => {
      const { state } = await getUserState();
      const data = getAffiliateLinkByState(state);
      setAffiliateData(data);
    };

    fetchUserState();
  }, []);

  return (
    <View>
      {/* ...odds page content... */}
      
      {affiliateData && (
        <AffiliateButton
          name={affiliateData.name}
          label={affiliateData.label}
          url={affiliateData.url}
          screen="Odds_Page"
          variant="primary"
          size="large"
        />
      )}
    </View>
  );
}
```

## 7. Analytics Tracking

### 7.1 Update analyticsService.ts

Update the analytics service to include affiliate tracking:

```typescript
import analytics from '@react-native-firebase/analytics';

export const trackAffiliateClick = async (
  sportsbook: string,
  screen: string,
  variant: string = 'primary',
  size: string = 'medium'
) => {
  await analytics().logEvent('affiliate_click', {
    sportsbook,
    screen,
    variant,
    size,
    timestamp: Date.now(),
  });
};
```

## 8. Documentation

### 8.1 Update docs/affiliate-links.md

Create or update the affiliate links documentation:

```markdown
# Affiliate Links Documentation

This document explains how to use and configure affiliate links in the AI Sports Edge application.

## Overview

AI Sports Edge uses affiliate links to monetize the application through partnerships with sportsbooks. The application supports multiple sportsbooks and uses geo-targeting to show the most relevant sportsbook to the user based on their location.

## Configuration

Affiliate links are configured through environment variables:

```
FANDUEL_AFFILIATE_URL=https://fndl.co/your-affiliate-code
BETMGM_AFFILIATE_URL=https://your-incomeaccess-link.com/track/betmgm
CAESARS_AFFILIATE_URL=https://your-incomeaccess-link.com/track/caesars
```

## Geo-Targeting

The application uses the user's location to determine which sportsbook to show. The mapping of states to sportsbooks is defined in the `getAffiliateLinkByState` utility function.

## Usage

To use the affiliate button in a component:

```tsx
import AffiliateButton from '../components/AffiliateButton';
import { getAffiliateLinkByState } from '../utils/getAffiliateLinkByState';
import { getUserState } from '../services/locationService';

// Get the user's state
const { state } = await getUserState();

// Get the affiliate data for the state
const affiliateData = getAffiliateLinkByState(state);

// Render the affiliate button
<AffiliateButton
  name={affiliateData.name}
  label={affiliateData.label}
  url={affiliateData.url}
  screen="Your_Screen_Name"
  variant="primary"
  size="medium"
/>
```

## Analytics

Affiliate clicks are tracked using Firebase Analytics. The following event is logged:

```
affiliate_click
```

With the following parameters:

- `sportsbook`: The name of the sportsbook (e.g., "FanDuel")
- `screen`: The screen where the click occurred
- `variant`: The button variant (e.g., "primary")
- `size`: The button size (e.g., "medium")
- `timestamp`: The timestamp of the click
```

## Implementation Timeline

1. **Day 1**: Environment variable setup and configuration
2. **Day 2**: Geo-targeting utility and location service
3. **Day 3**: Universal affiliate button component
4. **Day 4**: Implementation in screens
5. **Day 5**: Analytics tracking and documentation

## Conclusion

This implementation plan provides a comprehensive approach to integrating multiple sportsbook affiliate links with geo-targeting and analytics tracking. The modular design allows for easy addition of new sportsbooks and customization of the affiliate button appearance.