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
  featureType?: 'advanced-metrics' | 'historical-trends' | 'player-comparison' | 'all';
}

/**
 * Upgrade prompt component that displays subscription options and microtransactions
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  onClose, 
  gameId,
  showMicrotransactions = true,
  featureType = 'all'
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
    navigation.navigate('Subscription' as never);
  };
  
  const purchaseMicrotransaction = (productId: string) => {
    onClose();
    // This would call the appropriate purchase function
    // For now, we'll just navigate to the subscription screen
    navigation.navigate('Subscription' as never);
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
              
              {SUBSCRIPTION_PLANS.filter(plan => 
                plan.id === 'premium-monthly' || 
                plan.id === 'premium-yearly' || 
                plan.id === 'advanced-analytics-monthly'
              ).map((plan) => (
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
                    {plan.features.filter(f => 
                      f.includes('player') || 
                      f.includes('metrics') || 
                      f.includes('analytics') || 
                      f.includes('comparison') || 
                      f.includes('historical') ||
                      f.includes('All')
                    ).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#0a7ea4" />
                        <ThemedText style={styles.featureText}>{feature}</ThemedText>
                      </View>
                    ))}
                  </View>
                  
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity 
                      style={[
                        styles.subscribeButton,
                        plan.popular && styles.popularButton
                      ]}
                      onPress={navigateToSubscription}
                    >
                      <ThemedText style={styles.buttonText}>Subscribe</ThemedText>
                    </TouchableOpacity>
                  </Animated.View>
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