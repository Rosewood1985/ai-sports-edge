# Enhanced Player Statistics Implementation Plan

## Overview

This document outlines the implementation plan for enhanced player statistics features with standardized aesthetics across platforms and proper subscription tier integration.

## 1. Standardized Aesthetics

### Color Palette & Design System
- Maintain consistency with the app's existing color palette
- Incorporate neon effects for key statistics and highlights
- Use animated transitions for data visualization elements
- Implement pulsing effects for important metrics that change in real-time

### Design Elements
- **Neon Accents**: Use neon blue (#0a7ea4) for primary actions and highlights
- **Contrast**: Maintain high contrast for readability of statistics
- **Animations**: Implement subtle animations for transitions between data views
- **Gambling Psychology Elements**:
  - Use celebratory animations for positive trends
  - Implement progress indicators that encourage continued engagement
  - Design "near-miss" visualizations that encourage users to unlock more insights

### Cross-Platform Consistency
- Create a shared `PlayerStatsTheme.ts` file with standardized styling constants
- Implement responsive layouts that adapt to different screen sizes
- Ensure consistent rendering of charts and visualizations across platforms

## 2. Subscription Tier Integration

### Free Tier Access
- Allow users to view basic player plus/minus statistics
- Limit to 4 player statistics screen views before showing upgrade prompt
- Show previews of advanced features with partial data or blurred elements

### Premium Features (Subscription-Only)
- **Advanced Player Metrics**: Complete access to all advanced offensive and defensive metrics
- **Historical Trend Analysis**: Full access to historical performance data and trend visualizations
- **Player Comparison Tools**: Ability to compare any two players with detailed analysis

### Microtransaction Options
- **Single Game Advanced Metrics**: $0.99 - Access to all advanced metrics for players in a specific game
- **Player Comparison Tool**: $0.99 - One-time access to compare any two players
- **Historical Trends Package**: $1.99 - Access to historical trend analysis for all players in a specific game
- **Premium Bundle**: $2.99 - All premium features for a specific game (best value)

## 3. User Experience Improvements

### Upgrade Flow
- Design a non-intrusive but visually appealing upgrade prompt
- Implement a "View Count" tracker to monitor the number of player statistics screens viewed
- After 4 views, display the upgrade prompt with subscription options and microtransaction alternatives
- Include a prominent "Upgrade Now" button that leads directly to the subscription screen

### Visual Cues for Premium Content
- Use lock icons to indicate premium features
- Implement partial blurring of premium data visualizations
- Add "Premium" badges to advanced features
- Use neon highlighting to draw attention to upgrade opportunities

## 4. Implementation Tasks

### Shared Components
1. Create `PlayerStatsTheme.ts` with shared styling constants
2. Develop responsive layout components for cross-platform consistency
3. Implement standardized chart and data visualization components with neon effects

### Free Tier Implementation
1. Add a view counter to track player statistics screen views
2. Create an `UpgradePrompt.tsx` component to display after 4 views
3. Implement partial data previews for premium features

### Premium Features Access
1. Update `subscriptionService.ts` to check for feature access
2. Modify advanced statistics components to verify subscription status
3. Implement microtransaction options with the suggested price points

### Upgrade Flow
1. Design an attractive upgrade prompt with subscription options and microtransaction alternatives
2. Create a streamlined subscription flow with minimal steps
3. Implement return navigation to bring users back to their previous screen after upgrading

## 5. Technical Implementation Details

### View Counter Implementation
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

### Upgrade Prompt Component
```typescript
// In a new file: components/UpgradePrompt.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface UpgradePromptProps {
  onClose: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ onClose }) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.promptCard}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <ThemedText style={styles.title}>Unlock Premium Features</ThemedText>
        
        <ThemedText style={styles.description}>
          Get access to advanced player metrics, historical trends, and player comparison tools.
        </ThemedText>
        
        <View style={styles.optionsContainer}>
          <View style={styles.subscriptionOption}>
            <ThemedText style={styles.optionTitle}>Premium Subscription</ThemedText>
            <ThemedText style={styles.optionPrice}>$9.99/month</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Full access to all premium features
            </ThemedText>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={navigateToSubscription}
              >
                <ThemedText style={styles.buttonText}>Subscribe Now</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <View style={styles.microtransactionOptions}>
            <ThemedText style={styles.optionTitle}>One-Time Purchases</ThemedText>
            
            <TouchableOpacity style={styles.microOption}>
              <ThemedText style={styles.microOptionName}>Advanced Metrics</ThemedText>
              <ThemedText style={styles.microOptionPrice}>$0.99</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.microOption}>
              <ThemedText style={styles.microOptionName}>Player Comparison</ThemedText>
              <ThemedText style={styles.microOptionPrice}>$0.99</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.microOption}>
              <ThemedText style={styles.microOptionName}>Historical Trends</ThemedText>
              <ThemedText style={styles.microOptionPrice}>$1.99</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.microOption, styles.bestValue]}>
              <ThemedText style={styles.microOptionName}>Premium Bundle</ThemedText>
              <ThemedText style={styles.microOptionPrice}>$2.99</ThemedText>
              <ThemedText style={styles.bestValueText}>Best Value</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
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
  subscriptionOption: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
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
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
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
  microOptionName: {
    fontSize: 16,
    color: '#fff',
  },
  microOptionPrice: {
    fontSize: 16,
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
    position: 'absolute',
    top: -8,
    right: 8,
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: 'bold',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default UpgradePrompt;
```

## 6. Testing Strategy

1. **Visual Consistency Testing**: Ensure consistent appearance across iOS, Android, and web
2. **Subscription Access Testing**: Verify proper access control for premium features
3. **View Counter Testing**: Confirm the upgrade prompt appears after 4 views
4. **Performance Testing**: Ensure smooth animations and transitions
5. **Usability Testing**: Gather feedback on the upgrade flow and prompt design

## 7. Implementation Timeline

1. **Week 1**: Implement shared theme and styling components
2. **Week 2**: Develop view counter service and upgrade prompt component
3. **Week 3**: Integrate subscription checks and premium feature access control
4. **Week 4**: Implement microtransaction options and finalize upgrade flow
5. **Week 5**: Testing and refinement

## 8. Success Metrics

- **Conversion Rate**: Percentage of free users who upgrade to premium
- **Engagement**: Time spent on player statistics screens
- **Retention**: Impact on overall app retention rates
- **Revenue**: Income from subscriptions and microtransactions