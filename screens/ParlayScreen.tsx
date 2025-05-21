import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTrendingParlays, ParlayPackage } from '../services/parlayService';
import useOddsData from '../hooks/useOddsData';
import ParlayCard from '../components/ParlayCard';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { trackEvent } from '../services/analyticsService';
import { hasActiveSubscription } from '../services/subscriptionService';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

type ParlayScreenProps = {
  navigation: StackNavigationProp<any, 'Parlays'>;
};

/**
 * ParlayScreen component displays AI-driven parlay suggestions
 * @param {ParlayScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ParlayScreen: React.FC<ParlayScreenProps> = ({ navigation }) => {
  const [parlays, setParlays] = useState<ParlayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const { colors, isDark } = useTheme();

  // Use our custom hook to get odds data
  const { data: odds, loading: oddsLoading, error: oddsError } = useOddsData();

  // Track screen view
  useEffect(() => {
    trackEvent('screen_view', { screen_name: 'ParlayScreen' });
  }, []);

  // Check if user has premium access
  useEffect(() => {
    const checkPremiumAccess = async () => {
      try {
        // Get current user ID from AsyncStorage
        // This is a simplified approach to avoid auth dependency issues
        const userId = (await AsyncStorage.getItem('userId')) || '';
        if (userId) {
          const premium = await hasActiveSubscription(userId);
          setHasPremium(premium);
        }
      } catch (error) {
        console.error('Error checking premium access:', error);
      }
    };

    checkPremiumAccess();
  }, []);

  // Load parlay suggestions
  const loadParlays = useCallback(async () => {
    if (odds.length === 0) return;

    try {
      setLoading(true);
      const trendingParlays = await getTrendingParlays(odds);
      setParlays(trendingParlays);
    } catch (error) {
      console.error('Error loading parlays:', error);
      Alert.alert('Error', 'Failed to load parlay suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [odds]);

  // Load parlays when odds data is available
  useEffect(() => {
    if (!oddsLoading && odds.length > 0) {
      loadParlays();
    }
  }, [oddsLoading, odds, loadParlays]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadParlays();
    setRefreshing(false);
  };

  // Handle parlay purchase completion
  const handlePurchaseComplete = () => {
    // Reload parlays to update purchased status
    loadParlays();
  };

  // Render loading state
  if (loading || oddsLoading) {
    return (
      <AccessibleThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Loading AI parlay suggestions"
        accessibilityRole="none"
      >
        <Header title="AI Parlay Suggestions" onRefresh={() => {}} isLoading={loading} />
        <AccessibleThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AccessibleThemedText
            type="bodyStd"
            style={[styles.loadingText, { color: colors.text }]}
            accessibilityRole="text"
          >
            Generating AI parlay suggestions...
          </AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>
    );
  }

  // Render error state
  if (oddsError) {
    return (
      <AccessibleThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Error loading odds data"
        accessibilityRole="none"
      >
        <Header
          title="AI Parlay Suggestions"
          onRefresh={handleRefresh}
          isLoading={false}
          accessibilityHint="Refresh to try loading odds data again"
        />
        <EmptyState
          message="Error loading odds data. Please try refreshing."
          icon={<Ionicons name="alert-circle" size={40} color={colors.primary} />}
        />
      </AccessibleThemedView>
    );
  }

  return (
    <AccessibleThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="AI Parlay Suggestions Screen"
      accessibilityRole="none"
    >
      <Header
        title="AI Parlay Suggestions"
        onRefresh={handleRefresh}
        isLoading={refreshing}
        accessibilityHint="Refresh to update parlay suggestions"
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            accessibilityLabel="Refresh parlay suggestions"
          />
        }
        accessible={true}
        accessibilityLabel="Parlay suggestions list"
      >
        {/* Premium User Banner */}
        {hasPremium && (
          <AccessibleThemedView
            style={[styles.premiumBanner, { backgroundColor: colors.primary }]}
            accessibilityRole="text"
            accessibilityLabel="Premium member discount"
          >
            <Ionicons name="star" size={18} color="#fff" />
            <AccessibleThemedText type="bodyStd" style={styles.premiumBannerText}>
              Premium members get 30% off all parlay purchases!
            </AccessibleThemedText>
          </AccessibleThemedView>
        )}

        {/* Info Banner */}
        <AccessibleThemedView
          style={[styles.infoBanner, { backgroundColor: isDark ? '#1e1e1e' : '#f0f8ff' }]}
          accessibilityRole="text"
          accessibilityLabel="Information about parlay suggestions"
        >
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <AccessibleThemedText
            type="bodyStd"
            style={[styles.infoBannerText, { color: colors.text }]}
          >
            AI-generated parlay suggestions based on real-time trends and historical data
          </AccessibleThemedText>
        </AccessibleThemedView>

        {/* Parlays */}
        {parlays.length === 0 ? (
          <EmptyState
            message="No parlay suggestions available. Check back later for AI-generated parlay suggestions."
            icon={<Ionicons name="analytics" size={40} color={colors.primary} />}
          />
        ) : (
          <>
            <AccessibleThemedText
              type="h2"
              style={[styles.sectionTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              Trending Parlays
            </AccessibleThemedText>

            {parlays.map(parlay => (
              <ParlayCard
                key={parlay.id}
                parlay={parlay}
                onPurchaseComplete={handlePurchaseComplete}
              />
            ))}
          </>
        )}
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  premiumBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoBannerText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
});

export default ParlayScreen;
