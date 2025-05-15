# Odds Comparison Feature Implementation Plan

## Overview

This document outlines the implementation plan for adding an Odds Comparison feature to the AI Sports Edge iOS and web app. The feature will allow users to compare odds between DraftKings and FanDuel for NBA basketball games, with visual highlighting of the better odds.

## Requirements

- Premium feature (available only to subscribers)
- Dedicated OddsComparisonScreen
- Support for DraftKings and FanDuel sportsbooks
- Visual highlighting of better odds
- Robust error handling and loading states

## Implementation Steps

### 1. Create OddsComparisonComponent

Create a new component in `components/OddsComparisonComponent.tsx` with:

- State management for odds data, loading, and errors
- API integration with The Odds API
- Visual comparison of DraftKings and FanDuel odds
- Animation for highlighting better odds
- External links to sportsbooks
- Comprehensive error handling
- Loading states

### 2. Create OddsComparisonScreen

Create a new screen in `screens/OddsComparisonScreen.tsx` that:

- Hosts the OddsComparisonComponent
- Wraps it in a PremiumFeature component
- Includes pull-to-refresh functionality
- Handles navigation

### 3. Update Navigation

Update `navigation/AppNavigator.tsx` to:

- Add OddsComparisonScreen to the HomeStack
- Configure screen options

### 4. Update HomeScreen

Update `screens/HomeScreen.tsx` to:

- Add a navigation button/card to access the OddsComparisonScreen

## Technical Details

### State Management

```typescript
const [draftKingsOdds, setDraftKingsOdds] = useState<number | null>(null);
const [fanDuelOdds, setFanDuelOdds] = useState<number | null>(null);
const [glowAnimationDK, setGlowAnimationDK] = useState(new Animated.Value(0));
const [glowAnimationFD, setGlowAnimationFD] = useState(new Animated.Value(0));
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [noData, setNoData] = useState<boolean>(false);
```

### Error Handling Strategy

1. **API Errors**:
   - Network connectivity issues
   - API rate limiting
   - Invalid API responses
   - Authentication failures

2. **Data Processing Errors**:
   - Missing bookmaker data
   - Malformed odds data
   - Empty response handling

3. **User Feedback**:
   - Clear error messages
   - Retry options
   - Fallback to cached data when appropriate

### Loading States Strategy

1. **Initial Loading**:
   - Full-screen loading indicator
   - Descriptive loading message

2. **Refresh Loading**:
   - Pull-to-refresh indicator
   - Non-blocking UI during refresh

3. **Partial Loading**:
   - Skeleton UI for sections still loading
   - Keep already loaded content visible

## UI Components

### Loading State
```typescript
const renderLoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#1E90FF" />
    <Text style={styles.loadingText}>Loading odds comparison...</Text>
  </View>
);
```

### Error State
```typescript
const renderErrorState = () => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle" size={48} color="#FF6347" />
    <Text style={styles.errorTitle}>Error Loading Odds</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={handleRefresh}
    >
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);
```

### No Data State
```typescript
const renderNoDataState = () => (
  <View style={styles.noDataContainer}>
    <Ionicons name="information-circle" size={48} color="#FFA500" />
    <Text style={styles.noDataTitle}>No Odds Available</Text>
    <Text style={styles.noDataMessage}>
      We couldn't find odds for DraftKings or FanDuel at this time.
    </Text>
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={handleRefresh}
    >
      <Text style={styles.retryButtonText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);
```

## Testing Strategy

1. **Happy Path Testing**:
   - Verify odds display correctly
   - Verify animation works
   - Verify links open correctly

2. **Error Path Testing**:
   - Test network disconnection
   - Test API rate limiting
   - Test malformed API responses
   - Test empty data scenarios

3. **Loading State Testing**:
   - Verify initial loading state
   - Verify refresh loading state
   - Test transitions between states