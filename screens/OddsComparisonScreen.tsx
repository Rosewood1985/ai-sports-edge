import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { auth } from '../config/firebase';
import { hasActiveSubscription } from '../services/subscriptionService';
import { Header } from '../atomic/organisms';
import { PremiumFeature } from '../atomic/organisms';
import OddsComparisonComponent from '../components/OddsComparisonComponent';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';
import {
  AccessibleThemedText,
  AccessibleThemedView,
  AccessibleTouchableOpacity,
} from '../atomic/atoms';

type OddsComparisonScreenProps = {
  navigation: StackNavigationProp<any, 'OddsComparison'>;
};

/**
 * OddsComparisonScreen component displays a comparison of odds between different sportsbooks
 * @param {OddsComparisonScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export default function OddsComparisonScreen({
  navigation,
}: OddsComparisonScreenProps): JSX.Element {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const oddsComponentRef = useRef<any>(null);

  // Determine if we're on a small screen
  const isSmallScreen = width < 375;

  // Track screen view
  useEffect(() => {
    analyticsService.trackScreenView('OddsComparison', {
      language: t('language'),
      theme: isDark ? 'dark' : 'light',
      screen_width: width,
    });
  }, [isDark, t, width]);

  // Check if user has premium access
  useEffect(() => {
    let isMounted = true;

    const checkPremiumAccess = async () => {
      setIsLoading(true);
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
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkPremiumAccess();

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && isMounted) {
        checkPremiumAccess();
      } else if (isMounted) {
        setHasPremium(false);
        setIsLoading(false);
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

    // Track refresh event
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'odds_comparison_refresh',
      is_premium: hasPremium,
    });

    // If we have a ref to the odds component, call its refresh method
    if (oddsComponentRef.current && oddsComponentRef.current.handleRefresh) {
      await oddsComponentRef.current.handleRefresh();
    }

    setRefreshing(false);
  }, [hasPremium]);

  // Navigate to subscription screen
  const handleUpgrade = useCallback(() => {
    // Track upgrade click
    analyticsService.trackEvent(AnalyticsEventType.CONVERSION_STARTED, {
      conversion_type: 'premium_subscription',
      source: 'odds_comparison',
    });

    navigation.navigate('Subscription');
  }, [navigation]);

  return (
    <AccessibleThemedView
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}
      accessibilityLabel={t('oddsComparison.title')}
      accessibilityRole="none"
      accessibilityHint={t('oddsComparison.accessibility.screenHint')}
    >
      <Header
        title={t('oddsComparison.title')}
        onRefresh={handleRefresh}
        isLoading={refreshing}
        accessibilityHint={t('oddsComparison.accessibility.refreshButtonHint')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            accessibilityLabel={t('oddsComparison.refresh')}
            accessibilityHint={t('oddsComparison.accessibility.pullToRefreshHint')}
          />
        }
        accessible={true}
        accessibilityLabel={t('oddsComparison.accessibility.oddsScrollView')}
        accessibilityRole="scrollbar"
      >
        <AccessibleThemedView
          style={[styles.content, isSmallScreen && styles.contentSmall]}
          accessibilityLabel={t('oddsComparison.accessibility.contentContainer')}
        >
          <AccessibleThemedText
            style={[styles.subtitle, { color: colors.text }, isSmallScreen && styles.subtitleSmall]}
            accessibilityRole="text"
            type="bodyStd"
          >
            {t('oddsComparison.subtitle')}
          </AccessibleThemedText>

          {isLoading ? (
            <AccessibleThemedView
              style={styles.loadingContainer}
              accessibilityLabel={t('oddsComparison.accessibility.loadingSection')}
              accessibilityState={{ busy: true }}
            >
              <ActivityIndicator
                size="large"
                color={colors.primary}
                accessibilityLabel={t('oddsComparison.accessibility.loadingIndicator')}
              />
              <AccessibleThemedText
                style={[styles.loadingText, { color: colors.text }]}
                type="bodyStd"
                accessibilityRole="text"
              >
                {t('oddsComparison.loading')}
              </AccessibleThemedText>
            </AccessibleThemedView>
          ) : hasPremium ? (
            <OddsComparisonComponent ref={oddsComponentRef} isPremium={true} />
          ) : (
            <PremiumFeature message={t('oddsComparison.purchaseOdds')} onUpgrade={handleUpgrade}>
              <OddsComparisonComponent ref={oddsComponentRef} isPremium={false} />
            </PremiumFeature>
          )}
        </AccessibleThemedView>
      </ScrollView>
    </AccessibleThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    padding: Platform.OS === 'ios' ? 16 : 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  contentSmall: {
    padding: 8,
  },
  subtitle: {
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    marginBottom: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  subtitleSmall: {
    fontSize: Platform.OS === 'ios' ? 14 : 12,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
