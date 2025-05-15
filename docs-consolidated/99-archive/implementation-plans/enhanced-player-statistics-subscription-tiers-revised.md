# Enhanced Player Statistics: Subscription Tiers & Microtransactions (Revised)

This document outlines how enhanced player statistics features are integrated into the existing subscription tier structure and details the microtransaction options for users who prefer à la carte purchases.

## Existing Subscription Tier Structure

Based on the current implementation in `subscriptionService.ts`, the app has the following subscription tiers:

### Free Tier
- Limited access to basic features
- No access to premium content

### Basic Subscription ($4.99/month)
- **Features**:
  - AI-powered betting predictions
  - Real-time odds updates
  - Basic analytics

### Premium Subscription ($9.99/month)
- **Features**:
  - All Basic features
  - Advanced analytics and insights
  - Personalized betting recommendations
  - Historical performance tracking
  - Email and push notifications

### Premium Annual ($99.99/year)
- **Features**:
  - All Premium features
  - 2 months free compared to monthly
  - Early access to new features
  - Priority support

## Existing Microtransaction Options

The app already has several microtransaction options, including:

- Single AI Prediction ($2.99)
- AI Parlay Suggestion ($4.99)
- Parlay Package (3) ($9.99)
- Alert Package (5) ($4.99)
- Alert Package (15) ($9.99)
- Single Game +/- Data ($1.99)
- Advanced Player Metrics ($0.99)
- Player Comparison Tool ($0.99)

## Enhanced Player Statistics Integration

### Free Tier Limitations
- **Basic Player Statistics**: Access to fundamental player statistics (points, rebounds, assists)
- **Plus/Minus Data**: Basic plus/minus data for players
- **Usage Limit**: 4 player statistics screen views before seeing upgrade prompt
- **Preview Access**: Blurred or partial previews of premium features

### Basic Subscription ($4.99/month)
- **Enhanced Player Statistics Features**:
  - Basic player plus/minus data with unlimited views
  - Limited access to player performance charts
  - No access to advanced metrics, historical trends, or player comparison tools

### Premium Subscription ($9.99/month)
- **Enhanced Player Statistics Features**:
  - Full access to all advanced player metrics
  - Complete historical trend analysis
  - Player comparison tools
  - Performance projections
  - Unlimited usage of all player statistics features

### Premium Annual ($99.99/year)
- **Enhanced Player Statistics Features**:
  - All Premium features
  - Early access to new statistical models and metrics
  - Downloadable player performance reports

## Microtransaction Implementation

The app already has microtransactions for player statistics features. We'll maintain these and ensure they work properly with the enhanced features:

### 1. Advanced Player Metrics ($0.99)
- **Current Implementation**: Already exists in the codebase (ID: 'advanced-player-metrics')
- **Description**: "Unlock advanced player statistics and historical trends for a specific game"
- **Integration**: Will now provide access to the enhanced advanced metrics for a single game

### 2. Player Comparison Tool ($0.99)
- **Current Implementation**: Already exists in the codebase (ID: 'player-comparison-tool')
- **Description**: "Side-by-side comparison of any two players with advanced metrics"
- **Integration**: Will now provide access to the enhanced player comparison features for a single comparison

### 3. Historical Trends Package ($1.99) - NEW
- **Implementation**: Add to the existing MICROTRANSACTIONS array
- **ID**: 'historical-trends-package'
- **Description**: "Access to detailed historical trend analysis for all players in a specific game"
- **Integration**: Provides 48-hour access to historical trend analysis for a specific game

### 4. Premium Bundle ($2.99) - NEW
- **Implementation**: Add to the existing MICROTRANSACTIONS array
- **ID**: 'player-stats-premium-bundle'
- **Description**: "Complete access to all premium player statistics features for a specific game"
- **Integration**: Provides 72-hour access to all enhanced player statistics features for a specific game

## Implementation Tasks

### 1. Update Subscription Service
```typescript
// Add new microtransactions to the existing array in subscriptionService.ts
export const MICROTRANSACTIONS: Microtransaction[] = [
  // ... existing microtransactions ...
  
  {
    id: 'historical-trends-package',
    name: 'Historical Trends Package',
    description: 'Access to detailed historical trend analysis for all players in a specific game',
    price: 1.99,
    amount: 199,
    productType: 'microtransaction'
  },
  {
    id: 'player-stats-premium-bundle',
    name: 'Player Stats Premium Bundle',
    description: 'Complete access to all premium player statistics features for a specific game',
    price: 2.99,
    amount: 299,
    productType: 'microtransaction'
  }
];
```

### 2. Add Access Control Functions
```typescript
/**
 * Check if user has access to historical trends for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasHistoricalTrendsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // First check if user has premium access (Premium Monthly or Premium Annual)
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      // Get the subscription to check if it's a premium plan
      const subscription = await getUserSubscription(userId);
      if (subscription && (
        subscription.planId === 'premium-monthly' ||
        subscription.planId === 'premium-yearly'
      )) {
        return true;
      }
    }
    
    // Check if user has purchased historical trends for this game
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused historical trends purchase for this game
    const hasUnusedHistoricalTrendsAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      (purchase.productId === 'historical-trends-package' || purchase.productId === 'player-stats-premium-bundle') &&
      purchase.gameId === gameId
    );
    
    return hasUnusedHistoricalTrendsAccess;
  } catch (error) {
    console.error('Error checking historical trends access:', error);
    return false;
  }
};

/**
 * Purchase historical trends access for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Success status
 */
export const purchaseHistoricalTrends = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = MICROTRANSACTIONS.find(p => p.id === 'historical-trends-package');
    if (!product) {
      throw new Error('Historical trends package product not found');
    }
    
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'historical-trends-package',
      gameId: gameId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing historical trends:', error);
    return false;
  }
};

/**
 * Purchase premium bundle for a specific game
 * @param userId User ID
 * @param gameId Game ID
 * @returns Success status
 */
export const purchasePremiumBundle = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // Find the product
    const product = MICROTRANSACTIONS.find(p => p.id === 'player-stats-premium-bundle');
    if (!product) {
      throw new Error('Premium bundle product not found');
    }
    
    // Store the purchase
    const purchaseData = {
      id: `purchase_${Date.now()}`,
      productId: 'player-stats-premium-bundle',
      gameId: gameId,
      purchaseDate: Date.now(),
      used: false
    };
    
    // Save to AsyncStorage
    const purchasesKey = `microtransactions_${userId}`;
    const existingPurchasesData = await AsyncStorage.getItem(purchasesKey);
    const existingPurchases = existingPurchasesData ? JSON.parse(existingPurchasesData) : [];
    
    existingPurchases.push(purchaseData);
    
    await AsyncStorage.setItem(purchasesKey, JSON.stringify(existingPurchases));
    
    return true;
  } catch (error) {
    console.error('Error purchasing premium bundle:', error);
    return false;
  }
};
```

### 3. Implement View Counter
```typescript
// In a new file: services/viewCounterService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEW_COUNTER_KEY = 'player_stats_view_counter';
const MAX_FREE_VIEWS = 4;

export const incrementViewCounter = async (): Promise<number> => {
  try {
    const currentCount = await getViewCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(VIEW_COUNTER_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing view counter:', error);
    return 0;
  }
};

export const getViewCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(VIEW_COUNTER_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting view count:', error);
    return 0;
  }
};

export const shouldShowUpgradePrompt = async (): Promise<boolean> => {
  const count = await getViewCount();
  return count >= MAX_FREE_VIEWS;
};

export const resetViewCounter = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(VIEW_COUNTER_KEY, '0');
  } catch (error) {
    console.error('Error resetting view counter:', error);
  }
};
```

## Integration with Existing Components

### 1. AdvancedPlayerMetricsCard.tsx
- Add subscription check before displaying advanced metrics
- Show upgrade prompt after 4 views for free users
- Add microtransaction options for non-subscribers

### 2. PlayerHistoricalTrendsScreen.tsx
- Add subscription check before displaying historical trends
- Show upgrade prompt for non-subscribers
- Add microtransaction options for one-time access

### 3. EnhancedPlayerComparison.tsx
- Add subscription check before displaying comparison tools
- Show upgrade prompt for non-subscribers
- Add microtransaction options for one-time access

## Upgrade Prompt Implementation

The upgrade prompt will be displayed after 4 views for free users and will include:

1. Subscription options (Basic, Premium, Premium Annual)
2. Microtransaction options for the current game/feature
3. Clear value proposition for each option
4. Seamless purchase flow

## Testing Strategy

1. **Subscription Access Testing**: Verify proper access control for premium features
2. **View Counter Testing**: Confirm the upgrade prompt appears after 4 views
3. **Microtransaction Testing**: Ensure one-time purchases provide access as expected
4. **Cross-Platform Testing**: Verify consistent behavior across web, iOS, and Android

## Implementation Timeline

1. **Week 1**: Update subscription service with new microtransactions
2. **Week 2**: Implement view counter and access control functions
3. **Week 3**: Integrate with existing components
4. **Week 4**: Testing and refinement