/**
 * BetNowButton Component for React Native
 * Displays a neon-styled "Bet Now" button for affiliate links, aligned with the theme.
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
  Linking,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { useUITheme } from './UIThemeProvider'; // Use the hook inside the component
import { AccessibleTouchableOpacity } from '../atomic/atoms';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { bettingAffiliateService } from '../services/bettingAffiliateService';
import { fanduelCookieService } from '../services/fanduelCookieService';
import { microtransactionService } from '../services/microtransactionService';
import themeObject from '../styles/theme'; // Import the theme object directly for StyleSheet

interface BetNowButtonProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'inline' | 'floating' | 'fixed';
  contentType: string;
  teamId?: string;
  userId?: string;
  gameId?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const BetNowButton: React.FC<BetNowButtonProps> = ({
  size = 'medium',
  position = 'inline',
  contentType,
  teamId,
  userId,
  gameId,
  style,
  textStyle,
}) => {
  const { theme } = useUITheme(); // Use the hook to get theme for dynamic styles
  const pulseAnim = new Animated.Value(1);
  const [isSurging, setIsSurging] = useState(false);

  const {
    affiliateCode,
    buttonSettings,
    trackButtonClick,
    trackButtonImpression,
    getButtonColors,
    primaryTeam,
  } = useBettingAffiliate();

  const useTeamColors = buttonSettings.style === 'team-colored';
  const effectiveTeamId = teamId || primaryTeam;
  const teamColors = useTeamColors ? getButtonColors(effectiveTeamId) : null;

  useEffect(() => {
    trackButtonImpression(position, teamId, userId, gameId);
  }, [position, teamId, userId, gameId, trackButtonImpression]);

  useEffect(() => {
    if (buttonSettings.animation === 'none') return;

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    let surgeInterval: NodeJS.Timeout | null = null;
    if (buttonSettings.animation === 'surge') {
      surgeInterval = setInterval(() => {
        if (Math.random() > 0.8) {
          setIsSurging(true);
          setTimeout(() => setIsSurging(false), 500);
        }
      }, 10000);
    }

    return () => {
      pulseAnimation.stop();
      if (surgeInterval) clearInterval(surgeInterval);
    };
  }, [buttonSettings.animation, pulseAnim]);

  const handlePress = async () => {
    trackButtonClick(position, teamId, userId, gameId);
    microtransactionService.trackInteraction(
      'click',
      { type: 'bet_now', contentType, teamId, gameId, cookieEnabled: true },
      { id: userId }
    );

    let isPurchased = false;
    if (gameId) {
      try {
        const { crossPlatformSyncService } = require('../services/crossPlatformSyncService');
        isPurchased = crossPlatformSyncService.hasPurchasedOdds(gameId);
      } catch (error) {
        console.warn('Could not check purchase status:', error);
      }
    }

    await fanduelCookieService.trackInteraction('bet_button_click', {
      teamId,
      gameId,
      position,
      isPurchased,
    });

    let affiliateUrl;
    const baseUrl = 'https://fanduel.com/';
    const cookieData = await fanduelCookieService.getCookieData();

    if (cookieData) {
      affiliateUrl = await fanduelCookieService.generateUrlWithCookies(baseUrl);
    } else {
      await fanduelCookieService.initializeCookies(
        userId || 'anonymous',
        gameId || 'unknown',
        teamId || 'unknown'
      );
      affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
        baseUrl,
        affiliateCode,
        teamId,
        userId,
        gameId
      );
    }

    if (isPurchased) {
      bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
      microtransactionService.trackInteraction(
        'conversion',
        { type: 'bet_now', contentType, teamId, gameId, cookieEnabled: true },
        { id: userId }
      );
    }

    try {
      // Ensure affiliateUrl is defined before opening
      if (affiliateUrl) {
        await Linking.openURL(affiliateUrl);
        await fanduelCookieService.trackInteraction('redirect_success', {
          teamId,
          gameId,
          url: affiliateUrl,
        });
      } else {
        throw new Error('Affiliate URL could not be generated.');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      await fanduelCookieService.trackInteraction('redirect_failed', {
        teamId,
        gameId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Determine button styles based on props and theme
  const getButtonStyles = (): ViewStyle => {
    let sizeStyles: ViewStyle;
    switch (size) {
      case 'small':
        sizeStyles = {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          minWidth: 100,
        };
        break;
      case 'large':
        sizeStyles = {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minWidth: 150,
        };
        break;
      default: // medium
        sizeStyles = {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minWidth: 120,
        };
        break;
    }

    let positionStyles: ViewStyle;
    switch (position) {
      case 'floating':
        positionStyles = styles.floatingButton;
        break;
      case 'fixed':
        positionStyles = styles.fixedButton;
        break;
      default: // inline
        positionStyles = styles.inlineButton;
        break;
    }

    // Base styles using theme
    const baseStyles: ViewStyle = {
      borderRadius: theme.borderRadius.sm,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
      overflow: 'hidden',
      ...sizeStyles,
      ...positionStyles,
    };

    // Apply colors and glow
    if (useTeamColors && teamColors) {
      baseStyles.backgroundColor = teamColors.backgroundColor;
      baseStyles.shadowColor = teamColors.glowColor;
      baseStyles.shadowOpacity = isSurging ? 0.8 : 0.6;
      baseStyles.shadowRadius = isSurging ? 15 : 10;
    } else {
      baseStyles.backgroundColor = theme.colors.primaryAction;
      baseStyles.shadowColor = theme.colors.primaryAction;
      baseStyles.shadowOpacity = isSurging ? 0.8 : 0.6;
      baseStyles.shadowRadius = isSurging ? 15 : 10;
    }

    return baseStyles;
  };

  // Get text styles using theme
  const getTextStyles = (): TextStyle => {
    let sizeTextStyle: TextStyle;
    switch (size) {
      case 'small':
        sizeTextStyle = { fontSize: theme.typography.fontSize.small };
        break;
      case 'large':
        sizeTextStyle = { fontSize: theme.typography.fontSize.button };
        break;
      default: // medium
        sizeTextStyle = { fontSize: theme.typography.fontSize.label };
        break;
    }

    const baseTextStyles: TextStyle = {
      fontFamily: theme.typography.fontFamily.body,
      fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'],
      textAlign: 'center',
      color: useTeamColors && teamColors ? teamColors.textColor : '#000000', // Use black for contrast on neon blue
      ...sizeTextStyle,
    };

    return baseTextStyles;
  };

  return (
    <Animated.View
      style={[
        getButtonStyles(),
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <AccessibleTouchableOpacity
        onPress={handlePress}
        style={styles.touchable}
        activeOpacity={0.8}
        accessibilityLabel="Bet Now"
        accessibilityRole="button"
        accessibilityHint="Opens FanDuel to place a bet"
      >
        <Text style={[getTextStyles(), textStyle]}>BET NOW</Text>
      </AccessibleTouchableOpacity>
    </Animated.View>
  );
};

// Use the imported themeObject for static styles like zIndex
const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButton: {
    alignSelf: 'center',
    margin: themeObject.spacing.xs, // Use theme spacing
  },
  floatingButton: {
    position: 'absolute',
    bottom: themeObject.spacing.lg, // Use theme spacing
    right: themeObject.spacing.lg, // Use theme spacing
    zIndex: themeObject.zIndex.above, // Use theme zIndex from imported object
  },
  fixedButton: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: themeObject.spacing.sm, // Use theme spacing
  },
});

export default BetNowButton;
