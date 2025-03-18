/**
 * BetNowButton Component for React Native
 * Displays a neon-styled "Bet Now" button for affiliate links
 */

import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
  Linking,
  Platform,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { bettingAffiliateService } from '../services/bettingAffiliateService';

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
  textStyle
}) => {
  // Animation values
  const pulseAnim = new Animated.Value(1);
  const [isSurging, setIsSurging] = useState(false);
  
  // Get context values
  const {
    affiliateCode,
    buttonSettings,
    trackButtonClick,
    trackButtonImpression,
    getButtonColors,
    primaryTeam,
  } = useBettingAffiliate();
  
  // Get theme colors
  const primaryColor = useThemeColor({ light: '#FF0055', dark: '#FF3300' }, 'text');
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');
  
  // Determine if button should use team colors
  const useTeamColors = buttonSettings.style === 'team-colored';
  const effectiveTeamId = teamId || primaryTeam;
  const teamColors = useTeamColors ? getButtonColors(effectiveTeamId) : null;
  
  // Track impression when button is mounted
  useEffect(() => {
    trackButtonImpression(position, teamId, userId, gameId);
  }, [position, teamId, userId, gameId, trackButtonImpression]);
  
  // Set up pulse animation
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
        })
      ])
    );
    
    pulseAnimation.start();
    
    // Set up surge animation (occasional)
    let surgeInterval: number;
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
  
  // Handle button click
  const handlePress = async () => {
    // Track the click
    trackButtonClick(position, teamId, userId, gameId);
    
    // Check if this is after a purchase using cross-platform sync
    let isPurchased = false;
    if (gameId) {
      try {
        const { crossPlatformSyncService } = require('../services/crossPlatformSyncService');
        isPurchased = crossPlatformSyncService.hasPurchasedOdds(gameId);
      } catch (error) {
        console.warn('Could not check purchase status:', error);
      }
    }
    
    // Generate affiliate URL
    const baseUrl = 'https://fanduel.com/';
    const affiliateUrl = await bettingAffiliateService.generateAffiliateLink(
      baseUrl,
      affiliateCode,
      teamId,
      userId,
      gameId
    );
    
    // Track conversion if this is after a purchase
    if (isPurchased) {
      bettingAffiliateService.trackConversion('odds_to_bet', 0, userId);
    }
    
    // Open URL
    Linking.openURL(affiliateUrl);
  };
  
  // Determine button styles based on props
  const getButtonStyles = () => {
    // Base styles
    const baseStyles: ViewStyle = {
      ...styles.button,
      ...getSizeStyles(),
      ...getPositionStyles(),
    };
    
    // Add team colors if applicable
    if (useTeamColors && teamColors) {
      baseStyles.backgroundColor = teamColors.backgroundColor;
      baseStyles.shadowColor = teamColors.glowColor;
      baseStyles.shadowOpacity = isSurging ? 0.8 : 0.6;
      baseStyles.shadowRadius = isSurging ? 15 : 10;
    } else {
      baseStyles.backgroundColor = primaryColor;
      baseStyles.shadowColor = primaryColor;
      baseStyles.shadowOpacity = isSurging ? 0.8 : 0.6;
      baseStyles.shadowRadius = isSurging ? 15 : 10;
    }
    
    return baseStyles;
  };
  
  // Get size-specific styles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };
  
  // Get position-specific styles
  const getPositionStyles = (): ViewStyle => {
    switch (position) {
      case 'floating':
        return styles.floatingButton;
      case 'fixed':
        return styles.fixedButton;
      default:
        return styles.inlineButton;
    }
  };
  
  // Get text styles
  const getTextStyles = (): TextStyle => {
    const baseTextStyles: TextStyle = {
      ...styles.buttonText,
      color: useTeamColors && teamColors ? teamColors.textColor : backgroundColor,
    };
    
    switch (size) {
      case 'small':
        return { ...baseTextStyles, ...styles.smallText };
      case 'large':
        return { ...baseTextStyles, ...styles.largeText };
      default:
        return { ...baseTextStyles, ...styles.mediumText };
    }
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
      <TouchableOpacity
        onPress={handlePress}
        style={styles.touchable}
        activeOpacity={0.8}
      >
        <Text style={[getTextStyles(), textStyle]}>BET NOW</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Size variations
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 150,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  // Position variations
  inlineButton: {
    alignSelf: 'center',
    margin: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  fixedButton: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 10,
  },
});

export default BetNowButton;