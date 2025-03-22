# System Patterns

## Testing Patterns

### Mocking External Services
```typescript
// Mock Firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id'
    }
  },
  firestore: jest.fn()
}));

// Mock firebaseSubscriptionService
jest.mock('../../services/firebaseSubscriptionService', () => ({
  subscribeToPlan: jest.fn(),
  cancelSubscription: jest.fn(),
  getUserSubscription: jest.fn()
}));
```

This pattern allows testing payment flows without making real API calls, providing:
- Isolation from external dependencies
- Consistent test behavior
- Fast test execution
- No side effects in production systems

### Test Organization by Functional Domain
```
__tests__/stripe/
  ├── config.test.ts           # Configuration tests
  ├── subscription.test.ts     # Individual subscription tests
  ├── group-subscription.test.ts # Group subscription tests
  ├── one-time-purchases.test.ts # One-time purchase tests
  ├── webhooks.test.ts         # Webhook tests
  ├── security.test.ts         # Security tests
  ├── run-stripe-tests.sh      # Test runner script
  └── README.md                # Documentation
```

This organization provides:
- Clear separation of concerns
- Easy navigation of test files
- Focused test files for specific functionality
- Comprehensive coverage of all aspects of the system

### Security-Focused Testing
```typescript
describe('API Key Protection', () => {
  test('should only expose publishable key to client', () => {
    // Verify that the publishable key starts with 'pk_'
    expect(STRIPE_PUBLISHABLE_KEY).toBeDefined();
    expect(STRIPE_PUBLISHABLE_KEY.startsWith('pk_')).toBe(true);
    
    // Verify that no secret key is exposed
    // @ts-ignore - Intentionally checking for undefined variable
    expect(typeof STRIPE_SECRET_KEY).toBe('undefined');
  });
});
```

This pattern ensures:
- API keys are properly protected
- Only publishable keys are exposed to clients
- Secret keys are kept secure
- Security vulnerabilities are caught early

### Test Runner Script
```bash
#!/bin/bash

# Run the tests
echo -e "\n${YELLOW}1. Testing Stripe Configuration${NC}"
npx jest --testMatch="**/__tests__/stripe/config.test.ts" --verbose

# ... more test commands ...

# Run all tests together and generate a coverage report
echo -e "\n${YELLOW}Running all tests with coverage report${NC}"
npx jest --testMatch="**/__tests__/stripe/*.test.ts" --coverage --coverageDirectory=test-results/stripe/coverage
```

This pattern provides:
- Easy execution of all tests
- Consistent test execution environment
- Coverage reporting for quality assurance
- Clear output for test results
## Implementation Patterns

### Secure Weather Integration for Sports Odds
```javascript
/**
 * Get weather adjustment factor for a specific sport and condition
 * @param {string} sport - Sport key (e.g., 'NBA', 'MLB')
 * @param {Object} weatherData - Weather data
 * @returns {Object} Weather adjustment factors
 */
async getWeatherAdjustmentFactor(sport, weatherData) {
  try {
    // Validate sport parameter
    if (!sport || typeof sport !== 'string') {
      console.error('Invalid sport parameter:', sport);
      return { factor: 1.0, impact: 'none', description: 'Invalid sport parameter' };
    }

    // Validate supported sports
    const supportedSports = ['MLB', 'NFL', 'NBA', 'WNBA', 'NCAA_MENS', 'NCAA_WOMENS',
                            'NHL', 'FORMULA_1', 'SOCCER_EPL', 'SOCCER_MLS',
                            'HORSE_RACING', 'UFC'];
    
    if (!supportedSports.includes(sport)) {
      console.error('Unsupported sport:', sport);
      return { factor: 1.0, impact: 'none', description: 'Unsupported sport' };
    }

    if (!weatherData) {
      return { factor: 1.0, impact: 'none', description: 'No weather data available' };
    }

    // Validate weatherData object
    if (typeof weatherData !== 'object') {
      console.error('Invalid weatherData parameter:', typeof weatherData);
      return { factor: 1.0, impact: 'none', description: 'Invalid weather data' };
    }

    // Get the weather condition with safe defaults
    const condition = weatherData.condition || 'Unknown';
    const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : 70;
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
    const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
    
    // Default adjustment (no impact)
    let factor = 1.0;
    let impact = 'none';
    let description = 'Weather has no significant impact on this sport';
    
    // Adjust based on sport and weather condition
    switch (sport) {
      case 'MLB':
        return this.getBaseballWeatherAdjustment(weatherData);
      
      case 'NFL':
        return this.getFootballWeatherAdjustment(weatherData);
      
      case 'NBA':
      case 'WNBA':
      case 'NCAA_MENS':
      case 'NCAA_WOMENS':
        // Basketball is mostly played indoors
        return {
          factor: 1.0,
          impact: 'none',
          description: 'Basketball is played indoors and not affected by weather'
        };
      
      // ... more sports ...
      
      default:
        return { factor: 1.0, impact: 'none', description: 'No specific weather adjustment for this sport' };
    }
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('Error getting weather adjustment factor:', error.message || 'Unknown error');
    return { factor: 1.0, impact: 'none', description: 'Error calculating weather adjustment' };
  }
}
```

This pattern provides:
- Comprehensive input validation for all parameters
- Type checking and safe defaults for all weather properties
- Explicit validation of supported sports
- Secure error handling that prevents information leakage
- Centralized weather adjustment logic with proper security controls
### Secure Sport-Specific Weather Adjustments
```javascript
/**
 * Get baseball weather adjustment
 * @param {Object} weatherData - Weather data
 * @returns {Object} Weather adjustment factors
 */
getBaseballWeatherAdjustment(weatherData) {
  // Validate input
  if (!weatherData || typeof weatherData !== 'object') {
    return {
      factor: 1.0,
      impact: 'none',
      description: 'Invalid weather data for baseball adjustment'
    };
  }

  // Extract weather properties with safe defaults
  const condition = weatherData.condition || 'Unknown';
  const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : 70;
  const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
  const precipitation = typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0;
  
  let factor = 1.0;
  let impact = 'none';
  let description = 'Normal baseball conditions';

  // Temperature impact
  if (temperature < 40) {
    factor *= 0.9; // Cold weather reduces scoring
    impact = 'negative';
    description = 'Cold temperatures typically reduce scoring in baseball';
  } else if (temperature > 90) {
    factor *= 1.1; // Hot weather increases scoring
    impact = 'positive';
    description = 'Hot temperatures typically increase scoring in baseball';
  }

  // Wind impact
  if (windSpeed > 15) {
    factor *= 1.15; // High winds can increase home runs in the right direction
    impact = 'significant';
    description = 'High winds can significantly affect ball flight and scoring';
  }

  // Rain impact
  if (condition === 'Rain' || precipitation > 0.1) {
    factor *= 0.85; // Rain reduces scoring
    impact = 'negative';
    description = 'Rain typically reduces scoring and increases pitching advantage';
  }

  // Ensure factor is within reasonable bounds
  factor = Math.max(0.5, Math.min(factor, 2.0));

  return { factor, impact, description };
}
```
```

This pattern provides:
- Input validation with proper error handling
- Safe defaults for all weather properties
- Bounds checking to prevent extreme adjustment values
- Detailed sport-specific weather adjustments with security controls
- Descriptive impact information for user display

### Secure Weather API Response Handling
```javascript
/**
 * Sanitize weather data before returning to client
 * @param {Object} weatherData - Raw weather data from API
 * @returns {Object} Sanitized weather data
 */
function sanitizeWeatherData(weatherData) {
  // Validate input
  if (!weatherData || typeof weatherData !== 'object') {
    return {
      temperature: 0,
      condition: 'Unknown',
      timestamp: new Date().toISOString()
    };
  }
  
  // Extract only the properties we need with safe defaults
  return {
    temperature: typeof weatherData.temperature === 'number' ? weatherData.temperature : 0,
    feelsLike: typeof weatherData.feelsLike === 'number' ? weatherData.feelsLike : 0,
    humidity: typeof weatherData.humidity === 'number' ? weatherData.humidity : 0,
    windSpeed: typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0,
    windDirection: weatherData.windDirection || 'Unknown',
    precipitation: typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0,
    condition: weatherData.condition || 'Unknown',
    conditionIcon: weatherData.conditionIcon || 'default-icon',
    location: weatherData.location || 'Unknown',
    timestamp: weatherData.timestamp || new Date().toISOString()
  };
}
```

This pattern provides:
- Data sanitization to prevent injection attacks
- Type checking for all weather properties
- Safe defaults for missing or invalid data
- Removal of potentially sensitive or unnecessary data
- Consistent data structure for client-side processing

### Webhook Handling
```javascript
// Check signature
const signature = req.headers['stripe-signature'];
if (!signature) {
  return res.status(400).send('Missing Stripe signature');
}
}

// Verify event
try {
  event = stripe.webhooks.constructEvent(
    req.rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

This pattern ensures:
- Webhook signatures are verified
- Invalid requests are rejected
- Error handling is robust
- Security is maintained

### User Authorization
```javascript
// Auth check
if (!context.auth) {
  throw new Error('unauthenticated');
}

// Owner check
if (groupData.ownerId !== userId) {
  throw new Error('permission-denied');
}
```

This pattern ensures:
- Only authenticated users can access resources
- Only authorized users can modify resources
- Security is maintained throughout the application
- Clear error messages for unauthorized access

## Usage-Based Billing Patterns

### Usage Tracking
```typescript
// services/usageTrackingService.ts
export const trackUsage = async (
  userId: string,
  featureId: string,
  quantity: number = 1
): Promise<void> => {
  try {
    await firestore.collection('usageRecords').add({
      userId,
      featureId,
      quantity,
      timestamp: serverTimestamp()
    });
    
    // Track analytics event
    await analyticsService.trackEvent(`used_metered_feature`, {
      featureId,
      quantity
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};
```

This pattern provides:
- Consistent tracking of feature usage
- Integration with analytics for business insights
- Error handling to prevent tracking failures
- Flexibility for different feature types

### Usage Reporting to Stripe
```javascript
// functions/src/reportUsage.js
exports.reportUsageToStripe = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all active metered subscriptions
    const subscriptionsSnapshot = await db.collectionGroup('subscriptions')
      .where('status', '==', 'active')
      .where('usageType', '==', 'metered')
      .get();
    
    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      const userId = doc.ref.parent.parent.id;
      
      // Get usage records for yesterday
      const usageSnapshot = await db.collection('usageRecords')
        .where('userId', '==', userId)
        .where('featureId', '==', subscription.featureId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(now))
        .get();
      
      // Sum up the quantities
      let totalUsage = 0;
      usageSnapshot.forEach(doc => {
        totalUsage += doc.data().quantity || 1;
      });
      
      if (totalUsage > 0) {
        // Report usage to Stripe
        await stripe.subscriptionItems.createUsageRecord(
          subscription.stripeSubscriptionItemId,
          {
            quantity: totalUsage,
            timestamp: Math.floor(now.getTime() / 1000),
            action: 'increment'
          }
        );
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    return null;
  }
});
```

This pattern ensures:
- Usage is reported to Stripe on a regular schedule
- Only active subscriptions are processed
- Usage is aggregated correctly
- Errors are handled gracefully

### Metered Subscription Creation
```javascript
// Create subscription with metered pricing
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{
    price_data: {
      currency: 'usd',
      product: METERED_PRODUCTS[featureId],
      recurring: {
        interval: 'month',
        usage_type: 'metered'
      },
      unit_amount: METERED_PRICES[featureId]
    }
  }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent']
});

// Store subscription in Firestore
await db.collection('users').doc(userId)
  .collection('subscriptions').doc(subscription.id).set({
    status: subscription.status,
    featureId: featureId,
    usageType: 'metered',
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionItemId: subscription.items.data[0].id,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

This pattern provides:
- Proper configuration of metered subscriptions in Stripe
- Storage of subscription details in Firestore
- Tracking of subscription item IDs for usage reporting
- Proper timestamp handling between Stripe and Firestore

### Usage Display Component
```tsx
// components/UsageTracker.tsx
const UsageTracker: React.FC<UsageTrackerProps> = ({ featureId }) => {
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { colors } = useTheme();
  
  const feature = METERED_FEATURES[featureId];
  
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const usage = await getCurrentUsage(userId, featureId);
        setCurrentUsage(usage);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsage();
  }, [featureId]);
  
  // Render usage information
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {feature.name} Usage
      </Text>
      <Text style={[styles.usage, { color: colors.primary }]}>
        {currentUsage} units used this month
      </Text>
      <Text style={[styles.info, { color: colors.textSecondary }]}>
        Base price: ${(feature.basePrice / 100).toFixed(2)}/month
        + ${(feature.unitPrice / 100).toFixed(2)} per unit
      </Text>
    </View>
  );
};
```

This pattern provides:
- Real-time display of usage information
- Clear presentation of pricing structure
- Integration with the app's theme system
- Loading state handling

## Internationalization Patterns

### Translation Context
```typescript
// contexts/I18nContext.tsx
export const I18nProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(i18n.getLanguage());
  const [isRTL, setIsRTL] = useState<boolean>(i18n.isRTLLanguage());
  
  const setLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
    setLanguageState(lang);
    setIsRTL(i18n.isRTLLanguage());
  };
  
  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: (key, params) => i18n.translate(key, params),
        formatNumber: (value, options) => i18n.formatNumber(value, options),
        formatCurrency: (value, currencyCode) => i18n.formatCurrency(value, currencyCode),
        formatDate: (date, options) => i18n.formatDate(date, options),
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};
```

This pattern provides:
- Centralized language management
- Consistent translation across the app
- Localized formatting for numbers, dates, and currencies
- Support for right-to-left languages
- Clean component code with the useI18n hook

### Language Detection
```typescript
// components/LanguageRedirect.tsx
export const LanguageRedirect: React.FC<LanguageRedirectProps> = ({
  currentLanguage,
  setLanguage
}) => {
  // Get device locale
  const getDeviceLocale = (): string => {
    // iOS
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] ||
        'en'
      );
    }
    // Android
    if (Platform.OS === 'android') {
      return NativeModules.I18nManager.localeIdentifier || 'en';
    }
    // Web - use navigator.language if available
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return navigator.language || 'en';
    }
    
    return 'en'; // Default to English
  };

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Extract language from URL path
      const path = window.location.pathname;
      const pathSegments = path.split('/').filter((segment: string) => segment.length > 0);
      const pathLang = pathSegments.length > 0 ? pathSegments[0] : '';
      
      if (pathLang === 'en' || pathLang === 'es') {
        // Set language based on URL
        if (pathLang !== currentLanguage) {
          setLanguage(pathLang as Language);
        }
      } else {
        // Determine language based on device locale
        const deviceLocale = getDeviceLocale().split('-')[0];
        const redirectLang = deviceLocale === 'es' ? 'es' : 'en';
        
        if (redirectLang !== currentLanguage) {
          setLanguage(redirectLang as Language);
        }
        
        // Redirect to language-specific URL
        const newPath = `/${redirectLang}${path === '/' ? '' : path}`;
        window.history.replaceState(null, '', newPath);
      }
    }
  }, [currentLanguage, setLanguage]);
  
  return null;
};
```

This pattern ensures:
- Automatic language detection based on URL or device settings
- Consistent language experience across platforms
- SEO-friendly URL structure for web
- Proper handling of language changes

## Accessibility Patterns

### Accessibility Service
```typescript
// services/accessibilityService.ts
export const getAccessibilityProps = (
  label: string,
  hint?: string,
  role?: AccessibilityRole,
  state?: Record<string, boolean>
): Record<string, any> => {
  const props: Record<string, any> = {
    accessible: true,
    accessibilityLabel: label
  };
  
  if (hint && preferences.screenReaderHints) {
    props.accessibilityHint = hint;
  }
  
  if (role) {
    props.accessibilityRole = role;
  }
  
  if (state) {
    props.accessibilityState = state;
  }
  
  return props;
};
```

This pattern ensures:
- Consistent accessibility properties across components
- Proper screen reader support
- Respect for user preferences
- Clean component code without repetitive accessibility logic

## Performance Optimization Patterns

### Code Splitting with Lazy Loading
```typescript
// utils/codeSplitting.tsx
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback: { text?: string; component?: ReactNode } = {}
): React.FC<ComponentProps<T>> {
  const LazyComponent = lazy(factory);
  
  return (props) => {
    const fallbackComponent = fallback.component || (
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        {fallback.text && <Text style={styles.fallbackText}>{fallback.text}</Text>}
      </View>
    );
    
    return (
      <Suspense fallback={fallbackComponent}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
```

This pattern provides:
- Reduced initial bundle size
- Faster initial load times
- On-demand loading of components
- Consistent loading experience

### Memory Management with TTL
```typescript
// utils/memoryManagement.ts
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): T {
  const cache: Record<string, { value: ReturnType<T>; timestamp: number }> = {};
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    const now = Date.now();
    
    // Check if cached value exists and is still valid
    if (cache[key] && now - cache[key].timestamp < ttl) {
      return cache[key].value;
    }
    
    // Calculate new value
    const result = fn(...args);
    
    // Cache the result
    cache[key] = {
      value: result,
      timestamp: now
    };
    
    // Clean up old cache entries
    Object.keys(cache).forEach(cacheKey => {
      if (now - cache[cacheKey].timestamp > ttl) {
        delete cache[cacheKey];
      }
    });
    
    return result;
  }) as T;
}
```

This pattern ensures:
- Efficient caching of expensive operations
- Automatic cache invalidation
- Memory leak prevention
- Improved performance for repeated operations

## Analytics and A/B Testing Patterns

### Event Tracking
```typescript
// services/analyticsService.ts
export const trackEvent = async (
  eventType: AnalyticsEventType,
  properties: Record<string, any> = {}
): Promise<void> => {
  try {
    // Add common properties
    const enhancedProperties = {
      ...properties,
      platform: Platform.OS,
      app_version: Constants.manifest.version,
      timestamp: new Date().toISOString()
    };
    
    // Log event for debugging in development
    if (__DEV__) {
      console.log(`[Analytics] ${eventType}:`, enhancedProperties);
    }
    
    // Store event in local queue
    await storeEventInQueue(eventType, enhancedProperties);
    
    // Process queue if conditions are met
    await processEventQueue();
    
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
};
```

This pattern provides:
- Consistent event tracking across the app
- Offline support with queuing
- Debug information in development
- Error handling to prevent app crashes

### A/B Testing Experiment Management
```typescript
// services/abTestingService.ts
export const getVariantForUser = async (
  experimentId: string
): Promise<ExperimentVariant | null> => {
  try {
    // Check if user already has an assigned variant
    const storedVariant = await AsyncStorage.getItem(`experiment_${experimentId}`);
    if (storedVariant) {
      return JSON.parse(storedVariant);
    }
    
    // Get experiment configuration
    const experiment = await getExperiment(experimentId);
    if (!experiment || !experiment.isActive) {
      return null;
    }
    
    // Check if user is in target audience
    if (!isUserInTargetAudience(experiment.targetAudience)) {
      return null;
    }
    
    // Assign variant based on weights
    const variant = assignVariantByWeight(experiment.variants);
    if (!variant) {
      return null;
    }
    
    // Store assigned variant
    await AsyncStorage.setItem(`experiment_${experimentId}`, JSON.stringify(variant));
    
    // Track impression
    await trackImpression(experimentId, variant.id);
    
    return variant;
  } catch (error) {
    console.error('Error getting variant for user:', error);
    return null;
  }
};
```

This pattern ensures:
- Consistent variant assignment
- Persistent user experience
- Proper targeting based on audience criteria
- Accurate tracking of impressions

## Personalization Patterns

### User Preferences Management
```typescript
// services/personalizationService.ts
export const setUserPreferences = async (
  preferences: Partial<UserPreferences>
): Promise<void> => {
  try {
    // Get current preferences
    const currentPreferences = await getUserPreferences();
    
    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      lastUpdated: Date.now()
    };
    
    // Save to storage
    const userId = auth.currentUser?.uid;
    const storageKey = userId ? `user_preferences_${userId}` : 'user_preferences';
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
    
    // Track preference changes
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'preferences_updated',
      ...Object.keys(preferences).reduce((obj, key) => {
        obj[`preference_${key}`] = preferences[key as keyof UserPreferences];
        return obj;
      }, {} as Record<string, any>)
    });
  } catch (error) {
    console.error('Error setting user preferences:', error);
  }
};
```

This pattern provides:
- Consistent preference management
- User-specific preferences when logged in
- Device-specific preferences when not logged in
- Analytics tracking for preference changes

### Chart Accessibility
```typescript
// components/HeatMapChart.tsx
// Create an accessible summary of the data for screen readers
const accessibleSummary = useMemo(() => {
  const totalActivities = Object.values(data).reduce((sum, count) => sum + count, 0);
  const activeDays = Object.values(data).filter(count => count > 0).length;
  const mostActiveDate = Object.entries(data).sort((a, b) => b[1] - a[1])[0];
  
  return t('charts.heatmap.accessibleSummary', {
    totalActivities,
    activeDays,
    totalDays: numDays,
    mostActiveDate: mostActiveDate ? `${mostActiveDate[0]} with ${mostActiveDate[1]} activities` : 'None'
  });
}, [data, numDays, t]);

// Handle keyboard navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!focusedDay && focusedDay !== 0) {
    setFocusedDay(0);
    return;
  }
  
  switch (e.key) {
    case 'ArrowRight':
      setFocusedDay(prev => (prev !== null && prev < numDays - 1) ? prev + 1 : prev);
      break;
    case 'ArrowLeft':
      setFocusedDay(prev => (prev !== null && prev > 0) ? prev - 1 : prev);
      break;
    // ... more key handlers
  }
};

// Component JSX
return (
  <View
    accessible={true}
    accessibilityLabel={title}
    accessibilityHint={t('charts.heatmap.accessibilityHint')}
  >
    {/* Screen reader summary */}
    {isScreenReaderEnabled && (
      <View accessibilityRole="summary" accessibilityLabel={accessibleSummary} />
    )}
    
    {/* Keyboard navigable chart wrapper */}
    <View
      ref={chartRef}
      accessible={!isScreenReaderEnabled}
      accessibilityLabel={t('charts.heatmap.accessibilityLabel')}
      accessibilityHint={t('charts.heatmap.keyboardHint')}
      onAccessibilityTap={() => setFocusedDay(0)}
      {...(Platform.OS === 'web' ? {
        tabIndex: 0,
        onKeyDown: handleKeyDown
      } : {})}
    >
      {/* Chart content */}
    </View>
  </View>
);
```

This pattern provides:
- Comprehensive accessibility for data visualizations
- Keyboard navigation for interactive charts
- Screen reader support with detailed data summaries
- Platform-specific accessibility optimizations
- Integration with internationalization for translated accessibility text

## UI/UX Animation Patterns

### Chart Transition Pattern
```tsx
// components/ChartTransition.tsx
const ChartTransition: React.FC<ChartTransitionProps> = ({
  children,
  delay = 0,
  index = 0,
  style,
  visible = true,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Get accessibility preferences
  const { isReducedMotionEnabled } = useAccessibilityService();
  
  // Calculate total delay including index
  const totalDelay = delay + (index * 100);
  
  // Run animation when component mounts or when visibility changes
  useEffect(() => {
    if (visible) {
      // Create animations
      const animations = [];
      
      // Fade animation (always used)
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isReducedMotionEnabled ? 0 : 400,
          delay: isReducedMotionEnabled ? 0 : totalDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Only add motion animations if reduced motion is not enabled
      if (!isReducedMotionEnabled) {
        // Slide up animation
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 500,
            delay: totalDelay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
        
        // Scale animation
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            delay: totalDelay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else {
        // Immediately set final values for reduced motion
        translateYAnim.setValue(0);
        scaleAnim.setValue(1);
      }
      
      // Run all animations in parallel
      Animated.parallel(animations).start();
    }
  }, [visible, totalDelay, isReducedMotionEnabled]);
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
```

This pattern provides:
- Smooth entrance animations for chart components
- Staggered animations based on index
- Accessibility considerations with reduced motion support
- Performance optimization with native driver
- Consistent animation style across the application

### Tab Transition Pattern
```tsx
// components/TabTransition.tsx
const TabTransition: React.FC<TabTransitionProps> = ({
  children,
  active,
  style,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(20)).current;
  
  // Get accessibility preferences
  const { isReducedMotionEnabled } = useAccessibilityService();
  
  // Run animation when active state changes
  useEffect(() => {
    if (active) {
      // Create animations
      const animations = [];
      
      // Fade animation (always used)
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isReducedMotionEnabled ? 0 : 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Only add motion animations if reduced motion is not enabled
      if (!isReducedMotionEnabled) {
        // Slide animation
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else {
        // Immediately set final values for reduced motion
        translateXAnim.setValue(0);
      }
      
      // Run all animations in parallel
      Animated.parallel(animations).start();
    } else {
      // Reset animations if not active
      opacityAnim.setValue(0);
      translateXAnim.setValue(20);
    }
  }, [active, isReducedMotionEnabled]);
  
  // Don't render anything if not active
  if (!active) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { translateX: translateXAnim },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
```

This pattern provides:
- Smooth transitions between tabs
- Conditional rendering based on active state
- Accessibility considerations with reduced motion support
- Performance optimization with native driver
- Clean component API for tab content

### Staggered Animation Pattern
```tsx
// Implementation in EnhancedAnalyticsDashboardScreen.tsx
<View style={styles.metricsRow}>
  <ChartTransition index={0} delay={100} style={styles.metricCardWrapper}>
    <ThemedView style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name="cash" size={24} color={Colors.neon.green} />
        <ThemedText style={styles.metricTitle}>Total Revenue</ThemedText>
      </View>
      <ThemedText style={[styles.metricValue, { color: Colors.neon.green }]}>
        ${dashboardData.revenue.total_revenue.toFixed(2)}
      </ThemedText>
    </ThemedView>
  </ChartTransition>
  
  <ChartTransition index={1} delay={100} style={styles.metricCardWrapper}>
    <ThemedView style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name="trending-up" size={24} color={Colors.neon.blue} />
        <ThemedText style={styles.metricTitle}>Win Rate</ThemedText>
      </View>
      <ThemedText style={[styles.metricValue, { color: Colors.neon.blue }]}>
        {dashboardData.betting_performance.win_rate.toFixed(1)}%
      </ThemedText>
    </ThemedView>
  </ChartTransition>
</View>
```

This pattern provides:
- Visually appealing staggered entrance for related elements
- Consistent timing and easing for a cohesive feel
- Improved user experience with progressive content reveal
- Accessibility considerations with reduced motion support
- Performance optimization with native driver

### Accessible Component Wrappers
```tsx
// components/AccessibleText.tsx
const AccessibleText: React.FC<AccessibleTextProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  applyHighContrast = true,
  applyLargeText = true,
  applyBoldText = true,
  highContrastStyle,
  largeTextStyle,
  boldTextStyle,
  style,
  children,
  ...props
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );
  
  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener((newPreferences) => {
      setPreferences(newPreferences);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Apply styles based on preferences
  const appliedStyle = [
    style,
    preferences.highContrast && applyHighContrast && [styles.highContrast, highContrastStyle],
    preferences.largeText && applyLargeText && [styles.largeText, largeTextStyle],
    (preferences.boldText || accessibilityService.isBoldTextActive()) && 
      applyBoldText && [styles.boldText, boldTextStyle]
  ];
  
  // Get accessibility props
  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole,
        accessibilityState
      )
    : {};
  
  return (
    <Text
      style={appliedStyle}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </Text>
  );
};
```

This pattern provides:
- Automatic adaptation to user preferences
- Consistent styling for accessibility features
- Clean component API
- Reusable accessibility logic

### Reduced Motion Animation
```typescript
// hooks/useAccessibleAnimation.ts
export const useAccessibleAnimation = (
  defaultConfig: Animated.TimingAnimationConfig
): Animated.TimingAnimationConfig => {
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    accessibilityService.isReduceMotionActive()
  );
  
  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener((preferences) => {
      setReduceMotion(
        preferences.reduceMotion || accessibilityService.isReduceMotionActive()
      );
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Return modified animation config based on reduce motion preference
  return reduceMotion
    ? {
        ...defaultConfig,
        duration: 0, // Disable animation
      }
    : defaultConfig;
};
```

This pattern ensures:
- Animations respect the reduce motion preference
- Consistent animation behavior across the app
- Clean component code without repetitive motion checks
- Proper handling of system and user preferences

### Accessibility Testing
```typescript
// scripts/accessibility-audit.js
function scanFile(filePath) {
  const issues = [];
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Check for missing accessibility props
  if (!fileContent.includes('accessibilityLabel') && 
      (fileContent.includes('<TouchableOpacity') || 
       fileContent.includes('<Button') || 
       fileContent.includes('<Pressable'))) {
    issues.push({
      file: filePath,
      line: findLineNumber(fileContent, '<TouchableOpacity') || 
            findLineNumber(fileContent, '<Button') || 
            findLineNumber(fileContent, '<Pressable'),
      criterion: '4.1.2',
      severity: 'error',
      message: 'Interactive element missing accessibilityLabel',
      code: 'missing-accessibility-label',
      suggestion: 'Add accessibilityLabel prop to describe the purpose of this control'
    });
  }
  
  // Check for small touch targets
  if (fileContent.includes('width:') && fileContent.includes('height:')) {
    const smallTouchTargetRegex = /width:\s*(\d+)(px|pt)?.+?height:\s*(\d+)(px|pt)?/gs;
    let match;
    while ((match = smallTouchTargetRegex.exec(fileContent)) !== null) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[3], 10);
      
      if ((width < 44 || height < 44) && 
          fileContent.substring(match.index - 200, match.index).includes('<TouchableOpacity')) {
        issues.push({
          file: filePath,
          line: findLineNumber(fileContent, match[0]),
          criterion: 'M1',
          severity: 'warning',
          message: 'Touch target may be too small',
          code: 'small-touch-target',
          suggestion: 'Ensure touch targets are at least 44x44 points'
        });
      }
    }
  }
  
  return issues;
}
```

This pattern provides:
- Automated accessibility testing
- Identification of common accessibility issues
- Specific suggestions for fixing issues
- Integration with development workflow