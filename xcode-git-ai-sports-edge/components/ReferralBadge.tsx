import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../hooks/useThemeColor';
import { BadgeType } from '../types/rewards';

interface ReferralBadgeProps {
  type: BadgeType;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showLabel?: boolean;
}

/**
 * ReferralBadge component displays a badge for a referral tier
 * @param {ReferralBadgeProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralBadge: React.FC<ReferralBadgeProps> = ({
  type,
  size = 'medium',
  onPress,
  showLabel = false
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  const getBadgeConfig = () => {
    switch (type) {
      case 'rookie':
        return {
          icon: 'star-outline',
          colors: ['#3498db', '#2980b9'] as const,
          label: 'Rookie Referrer'
        };
      case 'elite':
        return {
          icon: 'star-half',
          colors: ['#f39c12', '#d35400'] as const,
          label: 'Elite Referrer'
        };
      case 'hall-of-fame':
        return {
          icon: 'star',
          colors: ['#f1c40f', '#e67e22'] as const,
          label: 'Hall of Fame'
        };
      default:
        return {
          icon: 'star-outline',
          colors: ['#3498db', '#2980b9'] as const,
          label: 'Rookie Referrer'
        };
    }
  };
  
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 40,
          iconSize: 20,
          fontSize: 10
        };
      case 'large':
        return {
          containerSize: 80,
          iconSize: 40,
          fontSize: 14
        };
      default:
        return {
          containerSize: 60,
          iconSize: 30,
          fontSize: 12
        };
    }
  };
  
  const badgeConfig = getBadgeConfig();
  const sizeConfig = getSizeConfig();
  
  const BadgeContent = () => (
    <LinearGradient
      colors={badgeConfig.colors}
      style={[
        styles.badgeContainer,
        { width: sizeConfig.containerSize, height: sizeConfig.containerSize }
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={badgeConfig.icon as any} size={sizeConfig.iconSize} color="#fff" />
    </LinearGradient>
  );
  
  return (
    <View style={styles.container}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <BadgeContent />
        </TouchableOpacity>
      ) : (
        <BadgeContent />
      )}
      
      {showLabel && (
        <Text style={[
          styles.label, 
          { color: textColor, fontSize: sizeConfig.fontSize }
        ]}>
          {badgeConfig.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReferralBadge;