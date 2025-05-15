# Analytics and A/B Testing Implementation

This document provides an overview of the analytics and A/B testing implementation in the AI Sports Edge app.

## Analytics Implementation

The analytics system is designed to track user behavior, feature usage, and conversion metrics throughout the app. It provides valuable insights into how users interact with the app and helps identify areas for improvement.

### Key Components

1. **Analytics Service**: A centralized service for tracking events, user properties, and conversion funnels.
2. **Event Tracking**: Tracks various events such as screen views, feature usage, and user actions.
3. **Conversion Funnels**: Tracks user progression through conversion funnels, such as odds viewing to bet placement.
4. **User Properties**: Tracks user-specific properties such as preferences, subscription status, and device information.

### Event Types

The analytics service supports the following event types:

- **Screen Views**: Tracks when users view specific screens.
- **Feature Usage**: Tracks when users use specific features.
- **Odds Comparison Events**: Tracks odds viewing, refreshing, and sport selection.
- **Betting Events**: Tracks sportsbook clicks, bet placement, and parlay creation.
- **Conversion Events**: Tracks conversion funnel progression.
- **Subscription Events**: Tracks subscription-related actions.
- **Error Events**: Tracks errors that occur in the app.
- **Performance Metrics**: Tracks app performance metrics.
- **A/B Testing Events**: Tracks experiment views and interactions.

### Implementation Details

The analytics service is implemented as a singleton that can be accessed from anywhere in the app. It uses AsyncStorage for local persistence and can be configured to send events to a server for analysis.

```typescript
// Example of tracking an event
await analyticsService.trackEvent(AnalyticsEventType.FEATURE_USED, {
  feature_name: 'odds_comparison',
  sport: 'basketball_nba'
});
```

### Conversion Funnels

Conversion funnels track user progression through a series of steps, such as viewing odds, clicking on a sportsbook, and placing a bet. This helps identify where users drop off in the conversion process.

```typescript
// Example of starting a conversion funnel
await analyticsService.startFunnel(
  'bet_placement_funnel',
  ConversionFunnelStep.ODDS_VIEW,
  { sport: 'basketball_nba' }
);

// Example of adding a step to a funnel
await analyticsService.addFunnelStep(
  'bet_placement_funnel',
  ConversionFunnelStep.SPORTSBOOK_CLICK,
  { sportsbook: 'draftkings' }
);

// Example of completing a funnel
await analyticsService.completeFunnel(
  'bet_placement_funnel',
  { conversion_value: 10 }
);
```

## A/B Testing Implementation

The A/B testing system allows for testing different variations of features to determine which performs better. It provides a framework for creating experiments, assigning users to variants, and tracking results.

### Key Components

1. **A/B Testing Service**: A centralized service for managing experiments and tracking results.
2. **Experiments**: Defines the experiment parameters, including variants and target audience.
3. **Variants**: Different variations of a feature to test.
4. **User Assignment**: Assigns users to specific variants based on defined weights.
5. **Results Tracking**: Tracks impressions, interactions, and conversions for each variant.

### Implementation Details

The A/B testing service is implemented as a singleton that can be accessed from anywhere in the app. It uses AsyncStorage for local persistence and can be configured to send results to a server for analysis.

```typescript
// Example of creating an experiment
await abTestingService.createExperiment({
  name: 'Odds Comparison Layout',
  description: 'Testing different layouts for the odds comparison component',
  variants: [
    {
      id: 'control',
      name: 'Control',
      description: 'Original layout',
      weight: 50,
      properties: {
        layout: 'default',
        showBetterOddsHighlight: true
      }
    },
    {
      id: 'variant_a',
      name: 'Variant A',
      description: 'Enhanced layout with stronger visual hierarchy',
      weight: 50,
      properties: {
        layout: 'enhanced',
        showBetterOddsHighlight: true,
        useStrongerContrast: true
      }
    }
  ],
  isActive: true,
  targetAudience: {
    isPremium: undefined, // Target all users
    platforms: ['ios', 'android', 'web'] // Target all platforms
  }
});

// Example of getting a variant for a user
const variant = await abTestingService.getVariantForUser('odds_comparison_layout_experiment');

// Example of tracking an interaction
await abTestingService.trackInteraction('odds_comparison_layout_experiment', {
  interaction_type: 'sportsbook_click',
  sportsbook: 'draftkings'
});

// Example of tracking a conversion
await abTestingService.trackConversion('odds_comparison_layout_experiment', 1, {
  conversion_type: 'sportsbook_click',
  sportsbook: 'draftkings'
});
```

## Integration with OddsComparisonComponent

The OddsComparisonComponent has been updated to integrate with the analytics and A/B testing services. It tracks the following events:

1. **Odds Refreshed**: When the user refreshes the odds.
2. **Odds Viewed**: When the user views odds for a specific sport.
3. **Sport Selected**: When the user selects a different sport.
4. **Sportsbook Clicked**: When the user clicks on a sportsbook.

It also participates in the following A/B test:

1. **Odds Comparison Layout**: Tests different layouts for the odds comparison component.

### Implementation Details

```typescript
// Example of tracking odds viewed
await analyticsService.trackEvent(AnalyticsEventType.ODDS_VIEWED, {
  sport: selectedSport,
  game_id: selectedGame.id,
  home_team: selectedGame.home_team,
  away_team: selectedGame.away_team,
  draftkings_odds: dkOdds,
  fanduel_odds: fdOdds,
  better_odds: dkOdds !== null && fdOdds !== null ? 
    (dkOdds < fdOdds ? 'draftkings' : 'fanduel') : 
    'unknown',
  experiment_id: experimentId,
  variant_id: experimentVariant?.id || 'none'
});

// Example of tracking sportsbook click and A/B testing conversion
await analyticsService.trackEvent(AnalyticsEventType.SPORTSBOOK_CLICKED, {
  sportsbook,
  sport: selectedSport,
  experiment_id: experimentId,
  variant_id: experimentVariant?.id || 'none',
  has_purchased_odds: hasPurchasedOdds
});

await abTestingService.trackInteraction(experimentId, {
  interaction_type: 'sportsbook_click',
  sportsbook,
  has_purchased_odds: hasPurchasedOdds
});

await abTestingService.trackConversion(experimentId, 1, {
  conversion_type: 'sportsbook_click',
  sportsbook,
  sport: selectedSport
});
```

## Best Practices

1. **Track Meaningful Events**: Only track events that provide valuable insights.
2. **Use Consistent Naming**: Use consistent naming conventions for events and properties.
3. **Include Context**: Include relevant context with each event, such as sport, sportsbook, and experiment information.
4. **Test Variants Fairly**: Ensure that variants are tested fairly by assigning users randomly and tracking results accurately.
5. **Analyze Results**: Regularly analyze results to identify winning variants and areas for improvement.
6. **Respect User Privacy**: Only track anonymous or aggregated data, and respect user privacy preferences.
7. **Optimize Performance**: Minimize the performance impact of analytics and A/B testing by batching events and using efficient storage mechanisms.