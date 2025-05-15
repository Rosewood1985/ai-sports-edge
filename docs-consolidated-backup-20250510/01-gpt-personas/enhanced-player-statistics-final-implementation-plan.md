# Enhanced Player Statistics: Final Implementation Plan

This document outlines the complete implementation plan for enhanced player statistics features, including subscription tier integration, microtransaction options, and technical implementation details.

## Subscription Tier Structure

### Free Tier
- **Basic Player Statistics**: Access to fundamental player statistics (points, rebounds, assists)
- **Plus/Minus Data**: Basic plus/minus data for players
- **Usage Limit**: 4 player statistics screen views before showing upgrade prompt
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

### Advanced Analytics Subscription ($39.99/month)
- **Enhanced Player Statistics Features**:
  - All Premium features
  - Fatigue/rest scores for all teams
  - Coach impact scores
  - Weather-based predictions (venue-specific)
  - Referee/Umpire Bias Analysis
  - Advanced historical trend analysis with predictive modeling

### Premium Annual ($99.99/year)
- **Enhanced Player Statistics Features**:
  - All Premium monthly features
  - 2 months free compared to monthly pricing
  - Early access to new statistical models and metrics
  - Downloadable player performance reports

### Advanced Analytics Annual ($329.99/year)
- **Enhanced Player Statistics Features**:
  - All Advanced Analytics monthly features
  - 2 months free compared to monthly pricing
  - Priority access to new analytical features
  - Custom report generation
  - API access for data export

## Microtransaction Options

### Existing Microtransactions
1. **Advanced Player Metrics ($0.99)**
   - Access to advanced metrics for players in a specific game
   - Duration: 24 hours from purchase

2. **Player Comparison Tool ($0.99)**
   - Side-by-side comparison of any two players with advanced metrics
   - One-time use (single comparison)

### New Microtransactions
3. **Historical Trends Package ($1.99)**
   - Access to detailed historical trend analysis for all players in a specific game
   - Duration: 48 hours from purchase

4. **Premium Bundle ($2.99)**
   - Complete access to all premium player statistics features for a specific game
   - Duration: 72 hours from purchase

5. **Rivalry Game Pack ($4.99)**
   - Intensity analysis + coach analytics for one game
   - Duration: 48 hours from purchase

6. **March Madness Pass ($29.99)**
   - All-inclusive access for the duration of March Madness
   - Covers both men's and women's tournaments
   - Duration: Entire tournament period

## Implementation Tasks

### 1. Update Subscription Service

```typescript
// Add new subscription plans to the existing array in subscriptionService.ts
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // ... existing subscription plans ...
  
  {
    id: 'advanced-analytics-monthly',
    name: 'Advanced Analytics',
    description: 'Professional-grade analytics for serious bettors',
    price: 39.99,
    amount: 3999, // For backward compatibility (in cents)
    interval: 'month',
    productType: 'subscription',
    features: [
      'All Premium features',
      'Fatigue/rest scores for all teams',
      'Coach impact scores',
      'Weather-based predictions',
      'Referee/Umpire Bias Analysis',
      'Advanced historical trend analysis'
    ]
  },
  {
    id: 'advanced-analytics-yearly',
    name: 'Advanced Analytics Annual',
    description: 'Our most comprehensive analytics package',
    price: 329.99,
    amount: 32999, // For backward compatibility (in cents)
    interval: 'year',
    productType: 'subscription',
    features: [
      'All Advanced Analytics features',
      '2 months free compared to monthly',
      'Priority access to new features',
      'Custom report generation',
      'API access for data export'
    ]
  }
];

// Add new microtransactions to the existing array
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
  },
  {
    id: 'rivalry-game-pack',
    name: 'Rivalry Game Pack',
    description: 'Intensity analysis + coach analytics for one game',
    price: 4.99,
    amount: 499,
    productType: 'microtransaction'
  },
  {
    id: 'march-madness-pass',
    name: 'March Madness Pass',
    description: 'All-inclusive access for the duration of March Madness (men and women)',
    price: 29.99,
    amount: 2999,
    productType: 'microtransaction'
  }
];
```

### 2. Add Access Control Functions

```typescript
/**
 * Check if user has access to advanced analytics features
 * @param userId User ID
 * @returns Whether the user has access
 */
export const hasAdvancedAnalyticsAccess = async (
  userId: string
): Promise<boolean> => {
  try {
    // Check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      // Get the subscription to check if it's an advanced analytics plan
      const subscription = await getUserSubscription(userId);
      if (subscription && (
        subscription.planId === 'advanced-analytics-monthly' ||
        subscription.planId === 'advanced-analytics-yearly'
      )) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking advanced analytics access:', error);
    return false;
  }
};

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
    // First check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    if (hasPremium) {
      // Get the subscription to check if it's a premium or advanced analytics plan
      const subscription = await getUserSubscription(userId);
      if (subscription && (
        subscription.planId === 'premium-monthly' ||
        subscription.planId === 'premium-yearly' ||
        subscription.planId === 'advanced-analytics-monthly' ||
        subscription.planId === 'advanced-analytics-yearly'
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
      (purchase.productId === 'historical-trends-package' || 
       purchase.productId === 'player-stats-premium-bundle' ||
       purchase.productId === 'march-madness-pass') &&
      (purchase.gameId === gameId || purchase.productId === 'march-madness-pass')
    );
    
    return hasUnusedHistoricalTrendsAccess;
  } catch (error) {
    console.error('Error checking historical trends access:', error);
    return false;
  }
};

/**
 * Check if user has access to rivalry game analytics
 * @param userId User ID
 * @param gameId Game ID
 * @returns Whether the user has access
 */
export const hasRivalryGameAnalyticsAccess = async (
  userId: string,
  gameId: string
): Promise<boolean> => {
  try {
    // First check if user has advanced analytics access
    const hasAdvanced = await hasAdvancedAnalyticsAccess(userId);
    if (hasAdvanced) {
      return true;
    }
    
    // Check if user has purchased rivalry game pack for this game
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused rivalry game pack purchase for this game
    const hasUnusedRivalryGameAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      (purchase.productId === 'rivalry-game-pack' || 
       purchase.productId === 'march-madness-pass') &&
      (purchase.gameId === gameId || purchase.productId === 'march-madness-pass')
    );
    
    return hasUnusedRivalryGameAccess;
  } catch (error) {
    console.error('Error checking rivalry game analytics access:', error);
    return false;
  }
};

/**
 * Check if user has March Madness pass
 * @param userId User ID
 * @returns Whether the user has access
 */
export const hasMarchMadnessAccess = async (
  userId: string
): Promise<boolean> => {
  try {
    // First check if user has advanced analytics access
    const hasAdvanced = await hasAdvancedAnalyticsAccess(userId);
    if (hasAdvanced) {
      return true;
    }
    
    // Check if user has purchased March Madness pass
    const microtransactionsKey = `microtransactions_${userId}`;
    const existingMicrotransactionsData = await AsyncStorage.getItem(microtransactionsKey);
    const existingMicrotransactions = existingMicrotransactionsData ? JSON.parse(existingMicrotransactionsData) : [];
    
    // Check if user has an unused March Madness pass
    const hasUnusedMarchMadnessAccess = existingMicrotransactions.some(
      (purchase: any) => !purchase.used &&
      purchase.productId === 'march-madness-pass' &&
      // Check if the pass is still valid (tournament is ongoing)
      isMarchMadnessTournamentActive()
    );
    
    return hasUnusedMarchMadnessAccess;
  } catch (error) {
    console.error('Error checking March Madness access:', error);
    return false;
  }
};

/**
 * Helper function to check if March Madness tournament is active
 * @returns Whether the tournament is active
 */
const isMarchMadnessTournamentActive = (): boolean => {
  // In a real implementation, this would check against tournament dates
  // For now, we'll use a simple date range check for March-April
  const now = new Date();
  const month = now.getMonth(); // 0-based (0 = January, 1 = February, etc.)
  
  // March (2) and April (3)
  return month === 2 || month === 3;
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

### 4. Weather API Integration

```typescript
// In a new file: services/weatherService.ts
import axios from 'axios';

// Free weather API endpoint
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'your_api_key_here';

/**
 * Get current weather for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Weather data
 */
export const getCurrentWeather = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'imperial' // Use imperial units for US sports
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * Get weather forecast for a location
 * @param lat Latitude
 * @param lon Longitude
 * @returns Forecast data
 */
export const getWeatherForecast = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'imperial'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
};

/**
 * Get weather impact on game
 * @param gameId Game ID
 * @returns Weather impact analysis
 */
export const getWeatherImpact = async (gameId: string) => {
  try {
    // Get game venue coordinates
    const game = await getGameDetails(gameId);
    if (!game || !game.venue || !game.venue.coordinates) {
      return null;
    }
    
    const { lat, lon } = game.venue.coordinates;
    
    // Get current weather
    const weather = await getCurrentWeather(lat, lon);
    if (!weather) {
      return null;
    }
    
    // Analyze weather impact
    return analyzeWeatherImpact(weather, game);
  } catch (error) {
    console.error('Error analyzing weather impact:', error);
    return null;
  }
};

/**
 * Analyze weather impact on game
 * @param weather Weather data
 * @param game Game data
 * @returns Weather impact analysis
 */
const analyzeWeatherImpact = (weather: any, game: any) => {
  // This would be a more sophisticated analysis in a real implementation
  const { main, wind, weather: conditions } = weather;
  const { temp, humidity } = main;
  const { speed: windSpeed } = wind;
  const condition = conditions[0].main;
  
  // Basic impact analysis
  const impact = {
    overall: 'neutral',
    factors: [],
    favoredTeam: null,
    description: ''
  };
  
  // Temperature impact
  if (temp < 40) {
    impact.factors.push({
      factor: 'temperature',
      value: temp,
      impact: 'negative',
      description: 'Cold temperatures may affect player performance'
    });
  } else if (temp > 90) {
    impact.factors.push({
      factor: 'temperature',
      value: temp,
      impact: 'negative',
      description: 'Hot temperatures may cause fatigue'
    });
  }
  
  // Wind impact
  if (windSpeed > 15) {
    impact.factors.push({
      factor: 'wind',
      value: windSpeed,
      impact: 'negative',
      description: 'High winds may affect passing and kicking'
    });
  }
  
  // Precipitation impact
  if (['Rain', 'Snow', 'Thunderstorm'].includes(condition)) {
    impact.factors.push({
      factor: 'precipitation',
      value: condition,
      impact: 'negative',
      description: `${condition} may affect ball handling and field conditions`
    });
  }
  
  // Overall impact
  if (impact.factors.length > 0) {
    const negativeFactors = impact.factors.filter(f => f.impact === 'negative');
    if (negativeFactors.length > 1) {
      impact.overall = 'significant';
    } else {
      impact.overall = 'moderate';
    }
    
    // Generate description
    impact.description = `Weather conditions may ${impact.overall === 'significant' ? 'significantly' : 'moderately'} impact this game.`;
  } else {
    impact.description = 'Weather conditions are not expected to significantly impact this game.';
  }
  
  return impact;
};

/**
 * Get game details
 * @param gameId Game ID
 * @returns Game details
 */
const getGameDetails = async (gameId: string) => {
  // This would fetch game details from your game service
  // For now, we'll return mock data
  return {
    id: gameId,
    venue: {
      name: 'Mock Stadium',
      coordinates: {
        lat: 40.7128,
        lon: -74.0060
      },
      isIndoor: false
    }
  };
};
```

### 5. Upgrade Prompt Component

```typescript
// In a new file: components/UpgradePrompt.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SUBSCRIPTION_PLANS, MICROTRANSACTIONS } from '../services/subscriptionService';

interface UpgradePromptProps {
  onClose: () => void;
  gameId?: string;
  showMicrotransactions?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  onClose, 
  gameId,
  showMicrotransactions = true
}) => {
  const navigation = useNavigation();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const navigateToSubscription = () => {
    onClose();
    navigation.navigate('Subscription');
  };
  
  const purchaseMicrotransaction = (productId: string) => {
    onClose();
    // This would call the appropriate purchase function
    // For now, we'll just navigate to the subscription screen
    navigation.navigate('Subscription');
  };

  // Filter relevant microtransactions for this game
  const relevantMicrotransactions = MICROTRANSACTIONS.filter(m => 
    ['advanced-player-metrics', 'player-comparison-tool', 'historical-trends-package', 'player-stats-premium-bundle'].includes(m.id)
  );

  return (
    <View style={styles.container}>
      <View style={styles.promptCard}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.title}>Unlock Premium Features</ThemedText>
          
          <ThemedText style={styles.description}>
            Get access to advanced player metrics, historical trends, and player comparison tools.
          </ThemedText>
          
          <View style={styles.optionsContainer}>
            {/* Subscription Options */}
            <View style={styles.subscriptionOptions}>
              <ThemedText style={styles.sectionTitle}>Subscription Options</ThemedText>
              
              {SUBSCRIPTION_PLANS.map((plan) => (
                <View key={plan.id} style={[
                  styles.subscriptionOption,
                  plan.popular && styles.popularOption
                ]}>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <ThemedText style={styles.popularBadgeText}>MOST POPULAR</ThemedText>
                    </View>
                  )}
                  
                  <ThemedText style={styles.optionTitle}>{plan.name}</ThemedText>
                  <ThemedText style={styles.optionPrice}>${plan.price}/{plan.interval}</ThemedText>
                  
                  <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#0a7ea4" />
                        <ThemedText style={styles.featureText}>{feature}</ThemedText>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.subscribeButton,
                      plan.popular && styles.popularButton
                    ]}
                    onPress={navigateToSubscription}
                  >
                    <ThemedText style={styles.buttonText}>Subscribe</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {/* Microtransaction Options */}
            {showMicrotransactions && (
              <View style={styles.microtransactionOptions}>
                <ThemedText style={styles.sectionTitle}>One-Time Purchases</ThemedText>
                
                {relevantMicrotransactions.map((product) => (
                  <TouchableOpacity 
                    key={product.id}
                    style={[
                      styles.microOption,
                      product.id === 'player-stats-premium-bundle' && styles.bestValue
                    ]}
                    onPress={() => purchaseMicrotransaction(product.id)}
                  >
                    <View style={styles.microOptionContent}>
                      <ThemedText style={styles.microOptionName}>{product.name}</ThemedText>
                      <ThemedText style={styles.microOptionDescription}>{product.description}</ThemedText>
                    </View>
                    
                    <View style={styles.microOptionPriceContainer}>
                      <ThemedText style={styles.microOptionPrice}>${product.price}</ThemedText>
                      {product.id === 'player-stats-premium-bundle' && (
                        <ThemedText style={styles.bestValueText}>Best Value</ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  promptCard: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: '#0a7ea4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subscriptionOptions: {
    marginBottom: 24,
  },
  subscriptionOption: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  popularOption: {
    borderColor: '#0a7ea4',
    borderWidth: 2,
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  optionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  popularButton: {
    backgroundColor: '#0a7ea4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  microtransactionOptions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  microOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  microOptionContent: {
    flex: 1,
  },
  microOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  microOptionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  microOptionPriceContainer: {
    alignItems: 'flex-end',
  },
  microOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  bestValue: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  bestValueText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});

export default UpgradePrompt;
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

## Aesthetic Standardization

### Color Palette
- **Primary**: #0a7ea4 (Neon Blue)
- **Success**: #34C759 (Neon Green)
- **Warning**: #FF9500 (Neon Orange)
- **Danger**: #FF3B30 (Neon Red)
- **Background**: #1c1c1e (Dark)
- **Card Background**: #2c2c2e (Dark Gray)
- **Text**: #FFFFFF (White)
- **Secondary Text**: rgba(255, 255, 255, 0.7) (Translucent White)

### Typography
- **Headings**: System font, semi-bold, sizes 24px/20px/18px
- **Body Text**: System font, regular, sizes 16px/14px/12px
- **Metrics**: System font, medium, sizes 18px/16px

### Animation Effects
- **Glow Effect**: Text and borders with subtle glow in primary color
- **Pulse Animation**: Important buttons and call-to-actions
- **Transition Effects**: Smooth transitions between screens

## Testing Strategy

1. **Subscription Access Testing**: Verify proper access control for premium features
2. **View Counter Testing**: Confirm the upgrade prompt appears after 4 views
3. **Microtransaction Testing**: Ensure one-time purchases provide access as expected
4. **Cross-Platform Testing**: Verify consistent behavior across web, iOS, and Android
5. **Weather API Integration Testing**: Verify weather data is properly fetched and integrated

## Implementation Timeline

1. **Week 1**: Update subscription service with new plans and microtransactions
2. **Week 2**: Implement view counter and access control functions
3. **Week 3**: Integrate with existing components and implement upgrade prompt
4. **Week 4**: Implement weather API integration
5. **Week 5**: Testing and refinement

## Success Metrics

1. **Conversion Rate**: Percentage of free users who upgrade to paid tiers
2. **Microtransaction Revenue**: Income from one-time purchases
3. **User Engagement**: Time spent on player statistics screens
4. **Retention Impact**: Effect on overall app retention rates