import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../config/firebase';
import { hasActiveSubscription } from '../services/subscriptionService';
import Header from '../components/Header';
import PremiumFeature from '../components/PremiumFeature';
import OddsComparisonComponent from '../components/OddsComparisonComponent';

type OddsComparisonScreenProps = {
  navigation: StackNavigationProp<any, 'OddsComparison'>;
};

/**
 * OddsComparisonScreen component displays a comparison of odds between different sportsbooks
 * @param {OddsComparisonScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export default function OddsComparisonScreen({ navigation }: OddsComparisonScreenProps): JSX.Element {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const { colors, isDark } = useTheme();
  const oddsComponentRef = useRef<any>(null);
  
  // Check if user has premium access
  React.useEffect(() => {
    let isMounted = true;
    
    const checkPremiumAccess = async () => {
      try {
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          if (isMounted) setHasPremium(false);
          return;
        }
        
        const premium = await hasActiveSubscription(userId);
        if (isMounted) setHasPremium(premium);
      } catch (error) {
        console.error('Error checking premium access:', error);
        if (isMounted) setHasPremium(false);
      }
    };
    
    checkPremiumAccess();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isMounted) {
        checkPremiumAccess();
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // If we have a ref to the odds component, call its refresh method
    if (oddsComponentRef.current && oddsComponentRef.current.handleRefresh) {
      await oddsComponentRef.current.handleRefresh();
    }
    
    setRefreshing(false);
  }, []);
  
  // Navigate to subscription screen
  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}>
      <Header
        title="Odds Comparison"
        onRefresh={handleRefresh}
        isLoading={refreshing}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Compare odds between DraftKings and FanDuel for NBA games
          </Text>
          
          {hasPremium ? (
            <OddsComparisonComponent ref={oddsComponentRef} isPremium={true} />
          ) : (
            <PremiumFeature
              message="Upgrade to Premium to access Odds Comparison"
            >
              <OddsComparisonComponent ref={oddsComponentRef} isPremium={false} />
            </PremiumFeature>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Platform.OS === 'ios' ? 16 : 12,
  },
  subtitle: {
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    marginBottom: 16,
    opacity: 0.8,
    textAlign: 'center',
  }
});