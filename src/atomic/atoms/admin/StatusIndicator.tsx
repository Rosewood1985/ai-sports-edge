import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  animated?: boolean;
}

/**
 * StatusIndicator - An atomic component for displaying status
 * 
 * @param status - The status to display (success, warning, error, info, neutral)
 * @param size - The size of the indicator (small, medium, large)
 * @param label - Optional label to display next to the indicator
 * @param animated - Whether the indicator should pulse
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  label,
  animated = false,
}) => {
  // Determine color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Amber
      case 'error':
        return '#EF4444'; // Red
      case 'info':
        return '#0066FF'; // Blue
      case 'neutral':
      default:
        return '#6B7280'; // Gray
    }
  };

  // Determine size in pixels
  const getSize = () => {
    switch (size) {
      case 'small':
        return 8;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 12;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: getStatusColor(),
            width: getSize(),
            height: getSize(),
            borderRadius: getSize() / 2,
          },
          animated && styles.animated,
        ]}
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginRight: 4, // Use a fixed value for spacing
  },
  label: {
    fontSize: 14, // Use a fixed value for font size
    color: '#6B7280', // Gray
  },
  animated: {
    // Animation would be implemented with Animated API
    // This is a placeholder for the animation style
  },
});