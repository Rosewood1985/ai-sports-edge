import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';

interface LeaderboardPositionChangeProps {
  previousRank: number;
  currentRank: number;
  showAnimation?: boolean;
}

/**
 * LeaderboardPositionChange component displays an animated indicator for position changes
 * @param {LeaderboardPositionChangeProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const LeaderboardPositionChange: React.FC<LeaderboardPositionChangeProps> = ({
  previousRank,
  currentRank,
  showAnimation = true
}) => {
  // Calculate the change in position
  const positionChange = previousRank - currentRank;
  
  // Animation value
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Theme colors
  const textColor = useThemeColor({}, 'text');
  
  useEffect(() => {
    if (showAnimation && positionChange !== 0) {
      // Reset animation
      animatedValue.setValue(0);
      
      // Start animation
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }).start();
    }
  }, [currentRank, previousRank, showAnimation]);
  
  // If there's no change, don't render anything
  if (positionChange === 0) {
    return null;
  }
  
  // Determine color and icon based on position change
  const getColor = () => {
    if (positionChange > 0) {
      return '#2ecc71'; // Green for improvement
    } else {
      return '#e74c3c'; // Red for decline
    }
  };
  
  const getIcon = () => {
    if (positionChange > 0) {
      return 'arrow-up';
    } else {
      return 'arrow-down';
    }
  };
  
  // Animation styles
  const translateY = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [20, -5, 0]
  });
  
  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 1, 1]
  });
  
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0.5, 1.2, 0.9, 1]
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [
            { translateY },
            { scale }
          ]
        }
      ]}
    >
      <Ionicons 
        name={getIcon()} 
        size={12} 
        color={getColor()} 
        style={styles.icon}
      />
      
      <Text style={[styles.text, { color: getColor() }]}>
        {Math.abs(positionChange)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default LeaderboardPositionChange;