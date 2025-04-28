# OddsComparisonComponent Developer Guide

This technical guide provides detailed information for developers working with the OddsComparisonComponent in the AI Sports Edge application.

## Table of Contents

1. [Component Overview](#component-overview)
2. [Architecture](#architecture)
3. [Props and Interfaces](#props-and-interfaces)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Caching Strategy](#caching-strategy)
7. [Error Handling](#error-handling)
8. [Performance Optimizations](#performance-optimizations)
9. [Animations](#animations)
10. [Accessibility](#accessibility)
11. [Internationalization](#internationalization)
12. [Testing](#testing)
13. [Extending the Component](#extending-the-component)
14. [Common Issues and Solutions](#common-issues-and-solutions)

## Component Overview

The `OddsComparisonComponent` is a complex React Native component that fetches, displays, and compares betting odds from multiple sportsbooks. It's designed to be responsive, performant, and accessible across different platforms (iOS, Android, and Web).

**Key Features:**
- Fetches odds data from The Odds API
- Implements multi-level caching
- Provides sorting and filtering options
- Highlights better odds with animations
- Supports premium vs. free user features
- Integrates with analytics and A/B testing
- Supports internationalization
- Implements comprehensive error handling

**File Location:** `components/OddsComparisonComponent.tsx`

## Architecture

The component follows a forward ref pattern to expose methods to parent components and uses several custom hooks and services:

```
OddsComparisonComponent
├── Services
│   ├── oddsCacheService
│   ├── errorRecoveryService
│   ├── oddsHistoryService
│   ├── analyticsService
│   ├── abTestingService
│   └── bettingAffiliateService
├── Contexts
│   ├── ThemeContext
│   ├── I18nContext
│   └── PersonalizationContext
├── Child Components
│   ├── ResponsiveBookmakerCard
│   ├── LazySportSelector
│   ├── LazyOddsMovementAlerts
│   └── LazyParlayIntegration
└── Utilities
    ├── memoryManagement
    └── animationOptimizer
```

The component uses React's `forwardRef` and `useImperativeHandle` to expose a `handleRefresh` method to parent components.

## Props and Interfaces

### Component Props

```typescript
interface OddsComparisonComponentProps {
    isPremium?: boolean;
}
```

- `isPremium`: Boolean indicating if the user has premium access. Defaults to `false`.

### Exposed Methods (Ref)

```typescript
interface OddsComparisonComponentRef {
    handleRefresh: () => Promise<void>;
}
```

- `handleRefresh`: Method to manually trigger a refresh of the odds data.

### Internal Interfaces

```typescript
// From types/odds.ts
interface Game {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Bookmaker[];
}

interface Bookmaker {
    key: string;
    title: string;
    markets: Market[];
}

interface Market {
    key: string;
    outcomes: Outcome[];
}

interface Outcome {
    name: string;
    price: number;
}
```

## State Management

The component uses React's `useState` hook for local state management:

```typescript
// Core data states
const [draftKingsOdds, setDraftKingsOdds] = useState<number | null>(null);
const [fanDuelOdds, setFanDuelOdds] = useState<number | null>(null);
const [selectedGame, setSelectedGame] = useState<Game | null>(null);

// UI states
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [noData, setNoData] = useState<boolean>(false);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [dataSource, setDataSource] = useState<'api' | 'cache' | 'stale' | 'fallback' | 'error'>('api');
const [retryCount, setRetryCount] = useState<number>(0);
const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);
const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);

// Animation states
const [glowAnimationDK, setGlowAnimationDK] = useState(new Animated.Value(0));
const [glowAnimationFD, setGlowAnimationFD] = useState(new Animated.Value(0));

// User preference states
const [selectedSport, setSelectedSport] = useState<string>(preferences.defaultSport || 'basketball_nba');
const [sortOption, setSortOption] = useState<SortOption>('best');
const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showDraftKings: true,
    showFanDuel: true,
    minOdds: null,
    maxOdds: null
});
const [showFilters, setShowFilters] = useState<boolean>(false);

// A/B testing states
const [experimentVariant, setExperimentVariant] = useState<any>(null);
```

## API Integration

The component integrates with The Odds API to fetch betting odds data:

```typescript
const fetchFreshData = async (apiKey: string, cacheKey: string) => {
    const endpoint = `${API_BASE_URLS.ODDS_API}/sports/${selectedSport}/odds`;
    
    // Define the API call function
    const fetchFromApi = async () => {
        const response = await axios.get(endpoint, {
            params: {
                apiKey,
                regions: 'us',
                markets: 'h2h',
                oddsFormat: 'american'
            }
        });
        return response.data;
    };
    
    // Define fallback function
    const getFallbackData = async () => {
        // Try to get data from cache even if expired
        const cachedData = await oddsCacheService.getCachedData<Game[]>(cacheKey);
        if (cachedData) {
            return cachedData.data;
        }
        
        // If no cache, return mock data
        return generateMockData();
    };
    
    // Use error recovery service to handle API errors
    try {
        const result = await errorRecoveryService.handleApiError<Game[]>(
            { message: 'Initial fetch attempt' }, // Dummy error to start the process
            endpoint,
            fetchFromApi,
            getFallbackData
        );
        
        // Process the result
        // ...
    } catch (error) {
        // Handle unexpected errors
        // ...
    }
};
```

See [API Integration Documentation](./api-integration.md) for more details.

## Caching Strategy

The component implements a sophisticated caching strategy using the `oddsCacheService`:

```typescript
// Check cache first
try {
    const cachedData = await oddsCacheService.getCachedData<Game[]>(cacheKey);
    
    if (cachedData) {
        // Use cached data
        setDataSource(cachedData.source);
        await processOddsData(cachedData.data);
        setLastUpdated(new Date(cachedData.timestamp));
        
        // Track analytics event for using cached data
        await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
            event_name: 'odds_loaded_from_cache',
            sport: selectedSport,
            cache_age_ms: Date.now() - cachedData.timestamp,
            cache_source: cachedData.source
        });
        
        // If cache is stale, fetch fresh data in the background
        if (cachedData.source === 'stale') {
            fetchFreshData(apiKey, cacheKey);
        }
        
        setLoading(false);
        return;
    }
} catch (cacheError) {
    console.error('Cache error:', cacheError);
    // Continue to fetch fresh data if cache fails
}
```

The caching system uses both memory and persistent storage with different TTLs (Time-To-Live) for optimal performance.

## Error Handling

The component implements comprehensive error handling:

```typescript
try {
    // API call or other operation
} catch (error) {
    console.error('Error fetching odds:', error);
    
    // Track unexpected error
    analyticsService.trackEvent(AnalyticsEventType.ERROR_OCCURRED, {
        error_type: 'odds_fetch_unexpected_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sport: selectedSport,
        retry_count: retryCount
    });
    
    // Provide more user-friendly error message
    if (error instanceof Error) {
        if (error.message.includes('timeout')) {
            setError('Request timed out. Please try again.');
        } else if (error.message.includes('network')) {
            setError('Network error. Please check your connection and try again.');
        } else {
            setError('Failed to fetch odds data. Please try again later.');
        }
    } else {
        setError('Failed to fetch odds data. Please try again later.');
    }
    setNoData(true);
} finally {
    setLoading(false);
}
```

Different error states are rendered to the user with appropriate messages and retry options.

## Performance Optimizations

The component implements several performance optimizations:

### Memoization

```typescript
// Helper function to process odds data - memoized for performance
const processOddsData = memoizeWithTTL(async (data: Game[]) => {
    // Processing logic
},
// Key function for memoization - based on the first game ID if available
(data: Game[]) => {
    if (!data || data.length === 0) return 'empty';
    return `${selectedSport}_${data[0]?.id || 'unknown'}`;
},
// Use a longer TTL for iOS to reduce processing overhead
Platform.OS === 'ios' ? 5 * 60 * 1000 : 2 * 60 * 1000);
```

### Lazy Loading

```typescript
import { LazySportSelector, LazyOddsMovementAlerts, LazyParlayIntegration } from './LazyComponents';
```

These components are loaded only when needed, reducing the initial bundle size.

### Memory Management

```typescript
// Component cleanup
useEffect(() => {
    // Register main component cleanup
    registerCleanup(componentId, () => {
        // Clear any cached data specific to this component instance
        clearExpiredCache();
        
        // Reset animations
        glowAnimationDK.setValue(0);
        glowAnimationFD.setValue(0);
        
        console.log('OddsComparisonComponent cleanup executed');
    });
    
    // Return cleanup function for component unmount
    return () => {
        unregisterCleanup(componentId);
        unregisterCleanup(`${componentId}_animation`);
        
        // Force cleanup of any resources
        clearExpiredCache();
    };
}, [componentId, glowAnimationDK, glowAnimationFD]);
```

The component registers cleanup functions to ensure proper resource management.

## Animations

The component uses React Native's Animated API for smooth animations:

```typescript
// Start glow animation when odds change
useEffect(() => {
    if (draftKingsOdds === null || fanDuelOdds === null) return;

    // Determine which odds are better (lower number is better for negative odds)
    const betterOdds = draftKingsOdds < fanDuelOdds ? 'DK' : 'FD';

    // Reset animations
    glowAnimationDK.setValue(0);
    glowAnimationFD.setValue(0);

    // Animation references for cleanup
    let dkAnimation: any = null;
    let fdAnimation: any = null;

    // Create optimized glow animation
    const startOptimizedGlow = (animation: Animated.Value, isBetter: boolean) => {
        // Use optimized animation parameters based on device capabilities
        const duration = isBetter ? 1000 : 800;
        const intensity = isBetter ? 1 : 0.7;
        
        const loopAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: intensity,
                    duration: duration,
                    useNativeDriver: true
                }),
                Animated.timing(animation, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true
                })
            ])
        );
        
        loopAnimation.start();
        return loopAnimation;
    };

    if (betterOdds === 'DK') {
        dkAnimation = startOptimizedGlow(glowAnimationDK, true);
        // Add subtle animation to non-best odds
        fdAnimation = startOptimizedGlow(glowAnimationFD, false);
    } else {
        fdAnimation = startOptimizedGlow(glowAnimationFD, true);
        // Add subtle animation to non-best odds
        dkAnimation = startOptimizedGlow(glowAnimationDK, false);
    }

    // Register cleanup function
    const animationCleanupId = `${componentId}_animation`;
    registerCleanup(animationCleanupId, () => {
        if (dkAnimation) dkAnimation.stop();
        if (fdAnimation) fdAnimation.stop();
    });

    // Return cleanup function
    return () => {
        if (dkAnimation) dkAnimation.stop();
        if (fdAnimation) fdAnimation.stop();
        unregisterCleanup(animationCleanupId);
    };
}, [draftKingsOdds, fanDuelOdds, glowAnimationDK, glowAnimationFD, componentId]);
```

The animations are optimized based on device capabilities using the `shouldEnableComplexAnimations` utility.

## Accessibility

The component implements comprehensive accessibility features:

```typescript
<TouchableOpacity
    style={styles.headerButton}
    onPress={() => setShowPersonalizationModal(true)}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel="Personalization settings"
    accessibilityHint="Opens personalization options to set default sports and sportsbooks"
>
    <Ionicons name="settings-outline" size={24} color={colors.primary} />
</TouchableOpacity>
```

All interactive elements have appropriate accessibility attributes, and the component supports screen readers and keyboard navigation.

## Internationalization

The component uses the `I18nContext` for internationalization:

```typescript
const { t } = useI18n();

// Usage
<Text style={[styles.loadingText, { color: colors.text }]}>
    {t('oddsComparison.loading')}
</Text>
```

All user-facing strings are internationalized, supporting multiple languages including English and Spanish.

## Testing

The component has comprehensive test coverage:

```typescript
// Unit tests
// __tests__/components/OddsComparisonComponent.test.tsx

// Cross-platform tests
// __tests__/components/OddsComparisonComponent.cross-platform.test.tsx

// Offline tests
// __tests__/components/OddsComparisonComponent.offline.test.tsx
```

The tests cover various scenarios including:
- Basic rendering
- API integration
- Error handling
- Premium vs. free features
- Cross-platform compatibility
- Offline functionality

## Extending the Component

### Adding a New Sportsbook

To add a new sportsbook:

1. Update the `FilterOptions` interface:

```typescript
interface FilterOptions {
    showDraftKings: boolean;
    showFanDuel: boolean;
    showNewSportsbook: boolean; // Add this line
    minOdds: number | null;
    maxOdds: number | null;
}
```

2. Add state for the new sportsbook's odds:

```typescript
const [newSportsbookOdds, setNewSportsbookOdds] = useState<number | null>(null);
```

3. Update the `processOddsData` function to extract the new sportsbook's odds:

```typescript
// Extract NewSportsbook odds
let newOdds: number | null = null;
const newSportsbookBookmaker = selectedGame.bookmakers.find((book: Bookmaker) => book.key === 'newsportsbook');
if (newSportsbookBookmaker && newSportsbookBookmaker.markets[0] && newSportsbookBookmaker.markets[0].outcomes[0]) {
    newOdds = newSportsbookBookmaker.markets[0].outcomes[0].price;
    setNewSportsbookOdds(newOdds);
}
```

4. Add the new sportsbook to the sportsbooks array:

```typescript
if (filterOptions.showNewSportsbook) {
    sportsbooks.push({
        key: 'newsportsbook',
        name: 'New Sportsbook',
        odds: newSportsbookOdds,
        color: '#00FF00', // Choose appropriate color
        animation: new Animated.Value(0) // Create new animation value
    });
}
```

5. Update the filter UI to include the new sportsbook.

### Adding New Features

To add new features to the component:

1. Add new props to the `OddsComparisonComponentProps` interface if needed.
2. Add new state variables using the `useState` hook.
3. Implement the feature logic.
4. Add UI elements to render the feature.
5. Add appropriate accessibility attributes.
6. Add internationalization support.
7. Add tests for the new feature.

## Common Issues and Solutions

### Issue: Component re-renders too often

**Solution:**
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive calculations
- Use `React.memo` for child components
- Implement proper dependency arrays in `useEffect` hooks

### Issue: Animations cause performance issues

**Solution:**
- Use `useNativeDriver: true` for animations
- Reduce animation complexity on lower-end devices
- Use the `shouldEnableComplexAnimations` utility
- Ensure animations are properly cleaned up

### Issue: Memory leaks

**Solution:**
- Ensure all subscriptions are properly cleaned up
- Use the `registerCleanup` and `unregisterCleanup` utilities
- Implement proper cleanup in `useEffect` return functions
- Use the `componentId` pattern for tracking resources

### Issue: API calls fail

**Solution:**
- Implement proper error handling
- Use the `errorRecoveryService`
- Implement fallback mechanisms
- Cache data for offline use
- Provide clear error messages to users

### Issue: Internationalization missing

**Solution:**
- Ensure all user-facing strings use the `t` function
- Add new strings to the translation files
- Test with different languages
- Consider text expansion in different languages

This developer guide provides comprehensive information for working with the OddsComparisonComponent. For more details on specific aspects, refer to the related documentation files.