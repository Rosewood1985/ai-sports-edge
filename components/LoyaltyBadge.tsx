import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { LoyaltyLevel } from '../types/rewards';

interface LoyaltyBadgeProps {
  level: LoyaltyLevel;
  size?: 'small' | 'medium' | 'large';
}

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ level, size = 'medium' }) => {
  const { colors } = useTheme();

  // Define badge colors and icons based on loyalty level
  const getBadgeConfig = () => {
    switch (level) {
      case 'Platinum':
        return {
          color: '#E5E4E2',
          icon: 'diamond',
          borderColor: '#B9B8B5',
        };
      case 'Gold':
        return {
          color: '#FFD700',
          icon: 'trophy',
          borderColor: '#DAA520',
        };
      case 'Silver':
        return {
          color: '#C0C0C0',
          icon: 'medal',
          borderColor: '#A9A9A9',
        };
      default:
        return {
          color: '#87CEEB',
          icon: 'person',
          borderColor: '#4682B4',
        };
    }
  };

  const badgeConfig = getBadgeConfig();

  // Define sizes
  const sizeConfig = {
    small: {
      container: 24,
      icon: 12,
      fontSize: 10,
    },
    medium: {
      container: 32,
      icon: 16,
      fontSize: 12,
    },
    large: {
      container: 48,
      icon: 24,
      fontSize: 14,
    },
  };

  const sizeValues = sizeConfig[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: badgeConfig.color,
            borderColor: badgeConfig.borderColor,
            width: sizeValues.container,
            height: sizeValues.container,
            borderRadius: sizeValues.container / 2,
          },
        ]}
      >
        <Ionicons name={badgeConfig.icon as any} size={sizeValues.icon} color="#FFFFFF" />
      </View>
      <Text
        style={[
          styles.levelText,
          {
            color: colors.text,
            fontSize: sizeValues.fontSize,
          },
        ]}
      >
        {level}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  levelText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
});

export default LoyaltyBadge;
