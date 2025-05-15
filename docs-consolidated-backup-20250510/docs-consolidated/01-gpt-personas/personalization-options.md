# Personalization Options

This document provides an overview of the personalization options implemented in the AI Sports Edge app.

## Overview

The personalization options feature allows users to customize their experience by setting default preferences for sports, sportsbooks, and other app settings. This enhances user experience by tailoring the app to individual preferences and reducing the need for repetitive selections.

## Key Features

1. **Default Sport Selection**: Users can set their preferred sport to be automatically selected when opening the odds comparison screen.
2. **Default Sportsbook Selection**: Users can set their preferred sportsbook for betting, which will be prioritized in the UI.
3. **Notification Preferences**: Users can customize which types of notifications they receive.
4. **Favorite Teams and Leagues**: Users can mark teams and leagues as favorites for quick access.
5. **Display Preferences**: Users can customize the app's appearance and behavior.

## Implementation Details

### Personalization Service

The personalization system is built around a central service that manages user preferences:

```typescript
// Example of setting a default sport
await personalizationService.setDefaultSport('basketball_nba');

// Example of setting a default sportsbook
await personalizationService.setDefaultSportsbook('draftkings');
```

### Personalization Context

A React context provides access to personalization features throughout the app:

```typescript
// Example of using the personalization context
const { preferences, setDefaultSport } = usePersonalization();

// Access user preferences
const defaultSport = preferences.defaultSport || 'basketball_nba';
```

### Personalization Settings UI

A dedicated settings screen allows users to view and modify their preferences:

```typescript
// Example of rendering the personalization settings component
<PersonalizationSettings onClose={() => setShowPersonalizationModal(false)} />
```

### Integration with OddsComparisonComponent

The OddsComparisonComponent uses personalization preferences to enhance the user experience:

1. **Default Sport**: Automatically selects the user's preferred sport when loading the component.
2. **Default Sportsbook**: Highlights the user's preferred sportsbook in the UI.
3. **Personalization Button**: Provides easy access to personalization settings.

## User Flow

1. **First-Time Experience**:
   - User opens the app and views odds for the default sport (NBA Basketball).
   - User clicks on a sportsbook and is prompted to set it as their default.
   - User can access personalization settings via the settings button.

2. **Personalized Experience**:
   - User opens the app and sees odds for their preferred sport.
   - User's preferred sportsbook is highlighted or prioritized.
   - User can quickly access their favorite teams and leagues.

## Technical Implementation

### Data Storage

User preferences are stored using AsyncStorage with the following structure:

```typescript
interface UserPreferences {
  defaultSport?: string;
  defaultSportsbook?: 'draftkings' | 'fanduel' | null;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  hiddenSportsbooks?: ('draftkings' | 'fanduel')[];
  defaultOddsFormat?: 'american' | 'decimal' | 'fractional';
  defaultView?: 'odds' | 'props' | 'parlays';
  notificationPreferences?: {
    oddsMovements: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    specialOffers: boolean;
  };
  displayPreferences?: {
    darkMode?: boolean;
    compactView?: boolean;
    showBetterOddsHighlight?: boolean;
  };
  lastUpdated?: number;
}
```

### User Identification

Preferences are tied to the user's account when logged in, or to the device when using the app anonymously:

```typescript
// Get storage key based on user ID
const userId = auth.currentUser?.uid;
const storageKey = userId ? `user_preferences_${userId}` : 'user_preferences';
```

### Analytics Integration

User preference changes are tracked to improve the app:

```typescript
// Track preference changes
await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
  event_name: 'default_sport_set',
  sport
});
```

## Best Practices

1. **Default Values**: Provide sensible defaults for all preferences.
2. **Progressive Disclosure**: Introduce personalization options gradually as users engage with the app.
3. **Respect User Choices**: Always prioritize explicit user preferences over system defaults.
4. **Persistence**: Ensure preferences persist across app sessions and device changes.
5. **Performance**: Minimize the performance impact of loading and applying preferences.

## Future Enhancements

1. **Cloud Sync**: Synchronize preferences across devices for logged-in users.
2. **Machine Learning**: Use machine learning to suggest personalization options based on user behavior.
3. **Expanded Options**: Add more personalization options for advanced users.
4. **Personalization Profiles**: Allow users to create and switch between different personalization profiles.
5. **Import/Export**: Allow users to export and import their personalization settings.