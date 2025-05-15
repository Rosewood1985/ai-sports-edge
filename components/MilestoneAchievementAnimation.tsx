import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralMilestone } from '../types/rewards';
import { useThemeColor } from '../hooks/useThemeColor';

interface MilestoneAchievementAnimationProps {
  milestone: ReferralMilestone;
  onAnimationComplete?: () => void;
}

/**
 * MilestoneAchievementAnimation component displays an animation when a milestone is achieved
 * @param {MilestoneAchievementAnimationProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const MilestoneAchievementAnimation: React.FC<MilestoneAchievementAnimationProps> = ({
  milestone,
  onAnimationComplete
}) => {
  // Animation values
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Screen dimensions
  const { width, height } = Dimensions.get('window');
  
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  
  // Get icon based on milestone type
  const getIcon = () => {
    switch (milestone.reward.type) {
      case 'subscription_extension':
        return 'calendar';
      case 'premium_trial':
        return 'star';
      case 'cash_or_upgrade':
        return 'cash';
      case 'elite_status':
        return 'trophy';
      default:
        return 'gift';
    }
  };
  
  useEffect(() => {
    // Run animation sequence
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        })
      ]),
      
      // Rotate slightly back and forth
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad)
        })
      ]),
      
      // Hold for a moment
      Animated.delay(1000),
      
      // Fade out if needed
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad)
      })
    ]).start(() => {
      // Call onAnimationComplete callback
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);
  
  // Convert rotate value to degrees
  const spin = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg']
  });
  
  // Create particle animation
  const particles = Array(20).fill(0).map((_, i) => ({
    translateY: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
  }));
  
  useEffect(() => {
    // Animate particles
    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * 2 * Math.PI;
      const distance = 100 + Math.random() * 100;
      const delay = i * 50;
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad)
          }),
          Animated.timing(particle.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad)
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true
            }),
            Animated.delay(500),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
            })
          ]),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ]).start();
    });
  }, []);
  
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Particles */}
      {particles.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: i % 3 === 0 ? '#f1c40f' : i % 3 === 1 ? '#3498db' : '#e74c3c',
              opacity: particle.opacity,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale }
              ]
            }
          ]}
        />
      ))}
      
      {/* Main animation */}
      <Animated.View
        style={[
          styles.animationContainer,
          {
            opacity,
            transform: [
              { scale },
              { rotate: spin }
            ]
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon() as any} size={80} color={primaryColor} />
        </View>
        
        <Text style={[styles.milestoneText, { color: textColor }]}>
          {milestone.count} Referrals Achieved!
        </Text>
        
        <Text style={[styles.rewardText, { color: primaryColor }]}>
          {milestone.reward.description}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  animationContainer: {
    width: 300,
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  milestoneText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 16,
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
  },
});

export default MilestoneAchievementAnimation;