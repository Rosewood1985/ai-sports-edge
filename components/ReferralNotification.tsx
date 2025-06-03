import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

import ReferralBadge from './ReferralBadge';
import { useThemeColor } from '../hooks/useThemeColor';
import NeonText from './ui/NeonText';
import { BadgeType } from '../types/rewards';

interface ReferralNotificationProps {
  visible: boolean;
  onClose: () => void;
  type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
  title: string;
  message: string;
  badgeType?: BadgeType;
  rewardAmount?: number;
  rewardType?: string;
}

/**
 * ReferralNotification component displays a notification for referral rewards
 * @param {ReferralNotificationProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralNotification: React.FC<ReferralNotificationProps> = ({
  visible,
  onClose,
  type,
  title,
  message,
  badgeType,
  rewardAmount,
  rewardType,
}) => {
  const [animation] = useState(new Animated.Value(0));
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      // Reset animation
      animation.setValue(0);

      // Start animation
      Animated.sequence([
        // Fade in and scale up
        Animated.timing(animation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Wait
        Animated.delay(500),
        // Pulse effect
        Animated.timing(animation, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animation]);

  // Animation styles
  const animatedStyle = {
    opacity: animation,
    transform: [{ scale: animation }],
  };

  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'milestone':
        return 'trophy';
      case 'referral':
        return 'people';
      case 'subscription_extension':
        return 'calendar';
      case 'badge':
        return 'ribbon';
      default:
        return 'gift';
    }
  };

  // Get gradient colors based on notification type
  const getGradientColors = () => {
    switch (type) {
      case 'milestone':
        return ['#f1c40f', '#e67e22'] as const;
      case 'referral':
        return ['#3498db', '#2980b9'] as const;
      case 'subscription_extension':
        return ['#2ecc71', '#27ae60'] as const;
      case 'badge':
        return ['#9b59b6', '#8e44ad'] as const;
      default:
        return ['#3498db', '#2980b9'] as const;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.modalContent, animatedStyle]}>
          <LinearGradient
            colors={getGradientColors()}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <NeonText type="heading" glow style={styles.title}>
                {title}
              </NeonText>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {type === 'badge' && badgeType ? (
                <View style={styles.badgeContainer}>
                  <ReferralBadge type={badgeType} size="large" showLabel />
                </View>
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name={getIcon()} size={64} color="#fff" />
                </View>
              )}

              <Text style={styles.message}>{message}</Text>

              {rewardAmount && rewardType && (
                <View style={styles.rewardContainer}>
                  <Text style={styles.rewardText}>
                    {rewardType === 'cash' ? `$${rewardAmount}` : `${rewardAmount} ${rewardType}`}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  rewardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReferralNotification;
