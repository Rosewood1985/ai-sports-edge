import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';

import ResponsiveBookmakerLogo from './ResponsiveBookmakerLogo';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { shouldEnableComplexAnimations } from '../utils/animationOptimizer';

interface ResponsiveBookmakerCardProps {
  bookmaker: string;
  displayName: string;
  odds: number | null;
  color: string;
  animation: Animated.Value;
  onPress: () => void;
  isPremium: boolean;
  showParlay?: boolean;
  parlayComponent?: React.ReactNode;
}

const ResponsiveBookmakerCard: React.FC<ResponsiveBookmakerCardProps> = ({
  bookmaker,
  displayName,
  odds,
  color,
  animation,
  onPress,
  isPremium,
  showParlay = false,
  parlayComponent,
}) => {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Determine if we're on a small screen
  const isSmallScreen = windowWidth < 375;

  // Determine if we should use complex animations based on device performance
  const useComplexAnimations = shouldEnableComplexAnimations();

  // Create animated styles with memoization to prevent unnecessary recalculations
  const animatedStyles = useMemo(
    () => ({
      transform: [
        {
          scale: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, useComplexAnimations ? 1.03 : 1.01],
          }),
        },
      ],
      // Only use shadow on iOS as it's more performant
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, useComplexAnimations ? 0.6 : 0.4],
            }),
            shadowRadius: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [2, useComplexAnimations ? 6 : 4],
            }),
          }
        : {
            // Use elevation for Android
            elevation: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [2, useComplexAnimations ? 6 : 3],
            }),
          }),
    }),
    [animation, color, useComplexAnimations]
  );

  // Format odds for display
  const formattedOdds =
    odds !== null ? (odds > 0 ? `+${odds}` : odds.toString()) : t('oddsComparison.notAvailable');

  // Determine what text to display based on premium status
  const displayText = isPremium ? formattedOdds : t('oddsComparison.unlockOdds');

  return (
    <Animated.View
      style={[styles.container, animatedStyles, isSmallScreen && styles.containerSmall]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color }, isSmallScreen && styles.buttonSmall]}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('oddsComparison.accessibility.bookmakerButton', {
          bookmaker: displayName,
          odds: isPremium ? formattedOdds : t('oddsComparison.accessibility.lockedOdds'),
        })}
        accessibilityHint={t('oddsComparison.accessibility.bookmakerButtonHint')}
      >
        <View style={styles.logoContainer}>
          <ResponsiveBookmakerLogo
            bookmaker={bookmaker}
            size={isSmallScreen ? 'small' : 'medium'}
          />
        </View>
        <Text
          style={[styles.bookmakerName, isSmallScreen && styles.bookmakerNameSmall]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
        <Text style={[styles.oddsValue, isSmallScreen && styles.oddsValueSmall]}>
          {displayText}
        </Text>
      </TouchableOpacity>

      {showParlay && parlayComponent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    width: Platform.OS === 'web' ? 300 : '48%',
    maxWidth: 350,
  },
  containerSmall: {
    width: '100%',
    maxWidth: 300,
    marginHorizontal: 'auto',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonSmall: {
    padding: 8,
  },
  logoContainer: {
    marginRight: 8,
  },
  bookmakerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bookmakerNameSmall: {
    fontSize: 14,
  },
  oddsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    marginLeft: 4,
  },
  oddsValueSmall: {
    fontSize: 16,
  },
});

export default ResponsiveBookmakerCard;
