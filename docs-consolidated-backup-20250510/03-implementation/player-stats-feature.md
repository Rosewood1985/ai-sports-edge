# Player Plus-Minus Statistics Feature

This document outlines the implementation of the player plus-minus statistics feature in the AI Sports Edge app.

## Overview

The plus-minus statistic is a measure of the point differential when a player is on the court. It shows the impact a player has on the game beyond traditional box score statistics. This feature allows users to:

1. View real-time plus-minus statistics for players in active games
2. Track player impact throughout a game
3. Make more informed betting decisions based on player performance

## Premium Feature & Monetization

The player plus-minus statistics feature is implemented as a premium feature to drive subscription revenue and microtransactions:

### Access Tiers

| Plan | Access to Player +/- Tracking |
|------|-------------------------------|
| Basic Monthly ($4.99) | ❌ No access |
| Premium Monthly ($9.99) | ✅ Full access |
| Premium Annual ($99.99) | ✅ Full access |
| Weekend Pass ($4.99) | ✅ Access during pass duration |
| Game Day Pass ($2.99) | ✅ Access during pass duration |
| Single Game +/- Data ($1.99) | ✅ Access for specific game only |

### Monetization Strategy

1. **Subscription Upsell**: Basic users are prompted to upgrade to Premium to access player plus-minus data
2. **Microtransactions**: Users can purchase one-time access to player plus-minus data for a specific game for $1.99
3. **Conversion Funnel**: The feature serves as a conversion point for users who want deeper insights

## Implementation Details

### Data Flow

1. **Data Source**: Player plus-minus data is fetched from the Sportradar API
2. **Storage**: Data is stored in Firestore in the `playerPlusMinus` collection
3. **Real-time Updates**: The app uses Firestore listeners to provide real-time updates
4. **UI Components**: Dedicated components display the data in a user-friendly format
5. **Access Control**: Subscription checks determine if a user can view the data

### Components

- `PlayerPlusMinusCard`: Displays individual player plus-minus statistics
- `PlayerPlusMinusList`: Displays a list of players with their plus-minus statistics
- `PlayerStatsScreen`: Screen that shows detailed player statistics for a game, with premium access control

### Navigation

The player stats screen can be accessed from the game card by clicking the "View Player Stats" button, which is visible for active games or games that have already started.

### Access Control Flow

1. When a user navigates to the PlayerStatsScreen, the app checks if they have access to the feature
2. For users without access, a locked screen is displayed with options to:
   - Subscribe to a Premium plan
   - Purchase one-time access for the specific game
3. For users with access, the full player plus-minus data is displayed

## Technical Implementation

### Data Model

```typescript
// Player plus-minus data model
interface PlayerPlusMinus {
  playerId: string;
  playerName: string;
  team: string;
  plusMinus: number;
  timestamp: any; // Firebase timestamp
  gameId: string;
}

// Microtransaction for player plus-minus access
interface PlayerPlusMinusPurchase {
  id: string;
  productId: 'player-plus-minus';
  gameId: string;
  purchaseDate: number;
  used: boolean;
}
```

### API Integration

The feature integrates with the Sportradar API to fetch real-time player statistics. The API endpoint used is:

```
https://api.sportradar.com/nba/trial/v7/en/games/{game_id}/summary.json
```

### Firebase Integration

Player plus-minus data is stored in Firestore with the following structure:

- Collection: `playerPlusMinus`
- Document ID: `{gameId}_{playerId}`
- Fields: As defined in the `PlayerPlusMinus` interface

Microtransaction purchases are stored in AsyncStorage:

- Key: `microtransactions_{userId}`
- Value: Array of purchase objects including player plus-minus purchases

### Subscription & Access Control

The feature implements access control through the subscription service:

```typescript
// Check if user has access to player plus-minus data
const hasAccess = await subscriptionService.hasPlayerPlusMinusAccess(userId, gameId);

// Purchase one-time access to player plus-minus data
const success = await subscriptionService.purchasePlayerPlusMinusAccess(userId, gameId);
```

Access is granted if the user:
1. Has an active Premium Monthly or Premium Annual subscription
2. Has an active Weekend Pass or Game Day Pass
3. Has purchased one-time access for the specific game

### Real-time Updates

The app implements real-time updates using:

1. Scheduled API calls during live games (configurable interval)
2. Firestore listeners that update the UI when data changes

### Push Notifications

The app can send push notifications for significant plus-minus changes:

1. Firebase Cloud Functions monitor player plus-minus data
2. When a player's plus-minus changes by more than 5 points in either direction, a notification is triggered
3. Notifications are only sent to users who have access to the feature

## Usage

### For Developers

To integrate player plus-minus statistics in other parts of the app:

```typescript
import {
  getPlayerPlusMinus,
  getGamePlusMinus,
  listenToPlayerPlusMinus
} from '../services/playerStatsService';
import subscriptionService from '../services/subscriptionService';

// First check if user has access
const hasAccess = await subscriptionService.hasPlayerPlusMinusAccess(userId, gameId);

if (hasAccess) {
  // Get plus-minus for a specific player
  const playerStats = await getPlayerPlusMinus(gameId, playerId);

  // Get plus-minus for all players in a game
  const allPlayerStats = await getGamePlusMinus(gameId);

  // Listen for real-time updates
  const unsubscribe = listenToPlayerPlusMinus(gameId, (players) => {
    // Update UI with new player data
    console.log('Updated player stats:', players);
  });

  // Don't forget to unsubscribe when component unmounts
  unsubscribe();
} else {
  // Show premium feature prompt
  showPremiumFeaturePrompt(gameId);
}
```

### Implementing Premium Feature UI

To implement the premium feature UI in other components:

```typescript
// Check access
const [hasAccess, setHasAccess] = useState(false);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const checkAccess = async () => {
    const user = auth.currentUser;
    if (user) {
      const access = await subscriptionService.hasPlayerPlusMinusAccess(user.uid, gameId);
      setHasAccess(access);
    }
    setLoading(false);
  };
  
  checkAccess();
}, [gameId]);

// Render based on access
if (loading) {
  return <LoadingIndicator />;
}

if (!hasAccess) {
  return (
    <PremiumFeaturePrompt
      title="Player Plus/Minus"
      description="Unlock player impact tracking"
      onSubscribe={() => navigation.navigate('Subscription')}
      onPurchase={() => purchaseOneTimeAccess(gameId)}
    />
  );
}

// Render feature content for users with access
return <PlayerPlusMinusList gameId={gameId} />;
```

### Testing

A test script is provided in `scripts/test-player-stats.js` to demonstrate the functionality:

```bash
node scripts/test-player-stats.js
```

### Monetization Testing

To test the monetization features:

1. **Test Premium Access**:
   ```typescript
   // Simulate premium subscription
   await subscriptionService.subscribeToPlan(userId, 'premium-monthly');
   ```

2. **Test One-Time Purchase**:
   ```typescript
   // Purchase one-time access for a game
   await subscriptionService.purchasePlayerPlusMinusAccess(userId, gameId);
   ```

3. **Test Access Control**:
   ```typescript
   // Check if user has access
   const hasAccess = await subscriptionService.hasPlayerPlusMinusAccess(userId, gameId);
   console.log('Has access:', hasAccess);
   ```

## Future Enhancements

### Feature Enhancements

1. **Historical Tracking**: Store historical plus-minus data to show trends over time
2. **Advanced Metrics**: Add additional advanced statistics like RAPTOR, VORP, etc.
3. **Visualization**: Add charts and graphs to visualize player impact
4. **Betting Integration**: Integrate plus-minus data with betting recommendations
5. **Personalization**: Allow users to follow specific players and receive notifications

### Monetization Enhancements

1. **Player Alerts Package**: Sell packages of player plus-minus alerts (e.g., $4.99 for 10 alerts)
2. **Team Season Pass**: Offer team-specific season passes for plus-minus data ($14.99 per team)
3. **Tiered Access**: Implement tiered access where basic users see limited data (e.g., only top 3 players)
4. **Referral Rewards**: Offer free game access when users refer friends who subscribe
5. **Bundle Discounts**: Create bundles with other premium features for discounted prices

### Push Notification Enhancements

1. **Customizable Thresholds**: Allow users to set their own thresholds for plus-minus change notifications
2. **Player Watchlists**: Enable users to create watchlists for specific players
3. **Betting Opportunity Alerts**: Send notifications when plus-minus changes suggest betting opportunities
4. **Milestone Alerts**: Notify users when players reach significant plus-minus milestones

## Dependencies

- Firebase/Firestore: For data storage and real-time updates
- Sportradar API: For fetching player statistics
- React Navigation: For screen navigation
- Expo Vector Icons: For UI elements
- AsyncStorage: For storing purchase data
- Firebase Cloud Functions: For push notifications

## Conclusion

The player plus-minus statistics feature enhances the app's value proposition by providing users with deeper insights into player performance, helping them make more informed betting decisions. By implementing this as a premium feature with flexible purchase options, it also creates a new revenue stream while encouraging subscription upgrades.