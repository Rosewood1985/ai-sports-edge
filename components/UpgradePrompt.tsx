import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { ThemedText } from './ThemedText';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_PLANS, MICROTRANSACTIONS } from '../services/firebaseSubscriptionService';
import advancedPlayerStatsService from '../services/advancedPlayerStatsService';
import { auth } from '../config/firebase';
import { analyticsService } from '../services/analyticsService';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface UpgradePromptProps {
  onClose: () => void;
  gameId?: string;
  showMicrotransactions?: boolean;
  featureType?: 'advanced-metrics' | 'historical-trends' | 'player-comparison' | 'all';
  viewsRemaining?: number | null;
  hasReachedLimit?: boolean;
}

/**
 * Upgrade prompt component that displays subscription options and microtransactions
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  onClose,
  gameId,
  showMicrotransactions = true,
  featureType = 'all',
  viewsRemaining = null,
  hasReachedLimit = false
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const successAnim = React.useRef(new Animated.Value(0)).current;
  
  // Track prompt display in analytics
  useEffect(() => {
    const trackPromptDisplay = async () => {
      try {
        await analyticsService.trackEvent('upgrade_prompt_displayed', {
          featureType,
          gameId: gameId || 'none',
          showMicrotransactions
        });
      } catch (error) {
        console.error('Error tracking prompt display:', error);
      }
    };
    
    trackPromptDisplay();
  }, [featureType, gameId, showMicrotransactions]);
  
  // Handle screen dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions(Dimensions.get('window'));
    };
    
    const dimensionsListener = Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      dimensionsListener.remove();
    };
  }, []);
  
  // Pulse animation for popular options
  useEffect(() => {
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
  
  // Success animation
  useEffect(() => {
    if (purchaseSuccess) {
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setPurchaseSuccess(false);
        onClose();
      });
    }
  }, [purchaseSuccess]);

  const navigateToSubscription = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    analyticsService.trackEvent('navigate_to_subscription', {
      fromFeature: featureType,
      gameId: gameId || 'none'
    });
    
    onClose();
    navigation.navigate('Subscription' as never);
  };
  
  const purchaseMicrotransaction = async (productId: string) => {
    if (!gameId) {
      // If no gameId is provided, navigate to subscription screen
      onClose();
      navigation.navigate('Subscription' as never);
      return;
    }

    try {
      // Get the current user ID
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to purchase this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => {
              onClose();
              navigation.navigate('Auth' as never);
            }}
          ]
        );
        return;
      }
      
      const userId = user.uid;
      
      // Provide haptic feedback
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Track purchase attempt
      await analyticsService.trackEvent('microtransaction_purchase_attempt', {
        productId,
        gameId,
        featureType
      });
      
      // Show loading indicator
      setLoading(productId);

      // Call the appropriate purchase function based on the product ID
      let success = false;
      
      switch (productId) {
        case 'advanced-player-metrics':
          success = await advancedPlayerStatsService.purchaseAdvancedPlayerMetrics(userId, gameId);
          break;
        case 'player-comparison-tool':
          success = await advancedPlayerStatsService.purchasePlayerComparison(userId, gameId);
          break;
        case 'historical-trends-package':
          success = await advancedPlayerStatsService.purchaseHistoricalTrends(userId, gameId);
          break;
        case 'player-stats-premium-bundle':
          success = await advancedPlayerStatsService.purchasePremiumBundle(userId, gameId);
          break;
        default:
          // For other products, navigate to subscription screen
          setLoading(null);
          onClose();
          navigation.navigate('Subscription' as never);
          return;
      }

      // Hide loading indicator
      setLoading(null);
if (success) {
  // Track successful purchase
  await analyticsService.trackEvent('microtransaction_purchase_success', {
    productId,
    gameId,
    featureType
  });
  
  // Store purchase in history
  const user = auth.currentUser;
  if (user) {
    try {
      // Get current purchase history
      const purchaseHistoryKey = `user_purchases_${user.uid}`;
      const purchaseHistoryJson = await AsyncStorage.getItem(purchaseHistoryKey);
      let purchaseHistory = purchaseHistoryJson ? JSON.parse(purchaseHistoryJson) : [];
      
      // Add new purchase
      const product = relevantMicrotransactions.find(m => m.id === productId);
      const purchaseRecord = {
        id: `purchase_${Date.now()}`,
        name: product?.name || productId,
        date: new Date().toISOString(),
        price: product?.price ? product.price * 100 : undefined, // Convert to cents
        gameId,
        productType: featureType,
        status: 'active'
      };
      
      purchaseHistory.push(purchaseRecord);
      
      // Save updated history
      await AsyncStorage.setItem(purchaseHistoryKey, JSON.stringify(purchaseHistory));
    } catch (error) {
      console.error('Error saving purchase history:', error);
    }
  }
  
  // Show success animation
  setPurchaseSuccess(true);
        setPurchaseSuccess(true);
      } else {
        // Track failed purchase
        await analyticsService.trackEvent('microtransaction_purchase_failed', {
          productId,
          gameId,
          featureType
        });
        
        // Show error message
        Alert.alert(
          'Purchase Failed',
          'We couldn\'t process your purchase. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setLoading(null);
      console.error('Error purchasing microtransaction:', error);
      
      // Track error
      await analyticsService.trackEvent('microtransaction_purchase_error', {
        productId,
        gameId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Filter relevant microtransactions based on feature type
  const getRelevantMicrotransactions = () => {
    switch (featureType) {
      case 'advanced-metrics':
        return MICROTRANSACTIONS.filter(m =>
          m.id === 'advanced-player-metrics' || m.id === 'player-stats-premium-bundle'
        );
      case 'historical-trends':
        return MICROTRANSACTIONS.filter(m =>
          m.id === 'historical-trends-package' || m.id === 'player-stats-premium-bundle'
        );
      case 'player-comparison':
        return MICROTRANSACTIONS.filter(m =>
          m.id === 'player-comparison-tool' || m.id === 'player-stats-premium-bundle'
        );
      case 'all':
      default:
        return MICROTRANSACTIONS.filter(m =>
          ['advanced-player-metrics', 'player-comparison-tool', 'historical-trends-package', 'player-stats-premium-bundle'].includes(m.id)
        );
    }
  };

  const relevantMicrotransactions = getRelevantMicrotransactions();
  
  // Get feature-specific title and description
  const getFeatureSpecificContent = () => {
    let baseContent = {
      title: '',
      description: ''
    };
    
    switch (featureType) {
      case 'advanced-metrics':
        baseContent = {
          title: 'Unlock Advanced Metrics',
          description: 'Get deep insights into player performance with advanced analytics and metrics.'
        };
        break;
      case 'historical-trends':
        baseContent = {
          title: 'Unlock Historical Trends',
          description: 'Analyze player performance over time with detailed historical trends and patterns.'
        };
        break;
      case 'player-comparison':
        baseContent = {
          title: 'Unlock Player Comparison',
          description: 'Compare players side-by-side with detailed statistical analysis and visualizations.'
        };
        break;
      case 'all':
      default:
        baseContent = {
          title: 'Unlock Premium Features',
          description: 'Get access to advanced player metrics, historical trends, and player comparison tools.'
        };
        break;
    }
    
    // Add view limit information if available
    if (hasReachedLimit) {
      return {
        title: baseContent.title,
        description: `You've reached your free view limit. ${baseContent.description}`
      };
    } else if (viewsRemaining !== null && viewsRemaining <= advancedPlayerStatsService.FREE_TIER_WARNING_THRESHOLD) {
      return {
        title: baseContent.title,
        description: `You have ${viewsRemaining} free ${viewsRemaining === 1 ? 'view' : 'views'} remaining. ${baseContent.description}`
      };
    }
    
    return baseContent;
  };
  
  const { title, description } = getFeatureSpecificContent();
  
  // Determine if we're in landscape mode
  const isLandscape = screenDimensions.width > screenDimensions.height;
  
  // Success animation overlay
  const renderSuccessOverlay = () => {
    if (!purchaseSuccess) return null;
    
    return (
      <Animated.View
        style={[
          styles.successOverlay,
          { opacity: successAnim }
        ]}
      >
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={64} color="#34C759" />
          <ThemedText style={styles.successText}>Purchase Successful!</ThemedText>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.promptCard,
          isLandscape && styles.promptCardLandscape,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#f8f8f8',
            borderColor: colors.primary
          }
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityHint="Closes the upgrade prompt"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLandscape ? styles.scrollContentLandscape : undefined}
        >
          <ThemedText
            style={[
              styles.title,
              {
                color: colors.text,
                textShadowColor: colors.primary
              }
            ]}
          >
            {title}
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: colors.text }]}>
            {description}
          </ThemedText>
          
          {/* View Limit Indicator */}
          {viewsRemaining !== null && viewsRemaining <= advancedPlayerStatsService.FREE_TIER_VIEW_LIMIT && (
            <View style={styles.viewLimitContainer}>
              <View style={styles.viewLimitTrack}>
                <View
                  style={[
                    styles.viewLimitProgress,
                    {
                      width: `${(viewsRemaining / advancedPlayerStatsService.FREE_TIER_VIEW_LIMIT) * 100}%`,
                      backgroundColor: viewsRemaining <= advancedPlayerStatsService.FREE_TIER_WARNING_THRESHOLD
                        ? '#FF9500' // Warning color
                        : '#34C759' // Normal color
                    }
                  ]}
                />
              </View>
              <ThemedText style={styles.viewLimitText}>
                {viewsRemaining} {viewsRemaining === 1 ? 'view' : 'views'} remaining
              </ThemedText>
            </View>
          )}
          
          <View style={[
            styles.optionsContainer,
            isLandscape && styles.optionsContainerLandscape
          ]}>
            {/* Subscription Options */}
            <View style={[
              styles.subscriptionOptions,
              isLandscape && styles.subscriptionOptionsLandscape
            ]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Subscription Options
              </ThemedText>
              
              {SUBSCRIPTION_PLANS.filter(plan =>
                plan.id === 'premium-monthly' ||
                plan.id === 'premium-yearly' ||
                plan.id === 'advanced-analytics-monthly'
              ).map((plan) => (
                <View key={plan.id} style={[
                  styles.subscriptionOption,
                  { backgroundColor: isDark ? 'rgba(10, 126, 164, 0.1)' : 'rgba(10, 126, 164, 0.05)' },
                  plan.popular && [
                    styles.popularOption,
                    {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : 'rgba(10, 126, 164, 0.1)'
                    }
                  ]
                ]}>
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                      <ThemedText style={styles.popularBadgeText}>MOST POPULAR</ThemedText>
                    </View>
                  )}
                  
                  <ThemedText style={[styles.optionTitle, { color: colors.text }]}>
                    {plan.name}
                  </ThemedText>
                  
                  <ThemedText style={[styles.optionPrice, { color: colors.primary }]}>
                    ${plan.price}/{plan.interval}
                  </ThemedText>
                  
                  <View style={styles.featuresList}>
                    {plan.features.filter(f =>
                      f.includes('player') ||
                      f.includes('metrics') ||
                      f.includes('analytics') ||
                      f.includes('comparison') ||
                      f.includes('historical') ||
                      f.includes('All')
                    ).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        <ThemedText style={[styles.featureText, { color: colors.text }]}>
                          {feature}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                  
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                      style={[
                        styles.subscribeButton,
                        {
                          backgroundColor: colors.primary,
                          shadowColor: colors.primary
                        },
                        plan.popular && styles.popularButton
                      ]}
                      onPress={navigateToSubscription}
                      accessibilityLabel={`Subscribe to ${plan.name}`}
                      accessibilityHint={`Subscribes to the ${plan.name} plan`}
                    >
                      <ThemedText style={styles.buttonText}>Subscribe</ThemedText>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              ))}
            </View>
            
            {/* Microtransaction Options */}
            {showMicrotransactions && (
              <View style={[
                styles.microtransactionOptions,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                isLandscape && styles.microtransactionOptionsLandscape
              ]}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  One-Time Purchases
                </ThemedText>
                
                {relevantMicrotransactions.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.microOption,
                      { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                      product.id === 'player-stats-premium-bundle' && [
                        styles.bestValue,
                        {
                          backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : 'rgba(10, 126, 164, 0.1)'
                        }
                      ],
                      loading === product.id && styles.microOptionLoading
                    ]}
                    onPress={() => purchaseMicrotransaction(product.id)}
                    disabled={loading !== null}
                    accessibilityLabel={`Purchase ${product.name}`}
                    accessibilityHint={`Makes a one-time purchase of ${product.name}`}
                  >
                    <View style={styles.microOptionContent}>
                      <ThemedText style={[styles.microOptionName, { color: colors.text }]}>
                        {product.name}
                      </ThemedText>
                      <ThemedText style={[
                        styles.microOptionDescription,
                        { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }
                      ]}>
                        {product.description}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.microOptionPriceContainer}>
                      {loading === product.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <ThemedText style={[styles.microOptionPrice, { color: colors.primary }]}>
                            ${product.price}
                          </ThemedText>
                          {product.id === 'player-stats-premium-bundle' && (
                            <ThemedText style={[styles.bestValueText, { color: colors.primary }]}>
                              Best Value
                            </ThemedText>
                          )}
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      {renderSuccessOverlay()}
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  promptCardLandscape: {
    width: '80%',
    maxHeight: '90%',
  },
  scrollContentLandscape: {
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8, // Increased touch target
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  optionsContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subscriptionOptions: {
    marginBottom: 24,
  },
  subscriptionOptionsLandscape: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  subscriptionOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  popularOption: {
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
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
    marginBottom: 8,
  },
  optionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginLeft: 8,
  },
  subscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  popularButton: {
    // Additional styles for popular button
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  microtransactionOptions: {
    borderRadius: 12,
    padding: 16,
  },
  microtransactionOptionsLandscape: {
    flex: 1,
    marginLeft: 12,
  },
  microOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  microOptionLoading: {
    opacity: 0.7,
  },
  microOptionContent: {
    flex: 1,
  },
  microOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  microOptionDescription: {
    fontSize: 12,
  },
  microOptionPriceContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
    justifyContent: 'center',
  },
  microOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bestValue: {
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContent: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  viewLimitContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  viewLimitTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  viewLimitProgress: {
    height: '100%',
    borderRadius: 4,
  },
  viewLimitText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UpgradePrompt;