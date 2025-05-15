import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

/**
 * MetricCard - An atomic component for displaying a metric
 * 
 * @param title - The title of the metric
 * @param value - The value of the metric
 * @param trend - The trend direction (up, down, neutral)
 * @param trendValue - The trend value
 * @param icon - Optional icon to display
 * @param color - Optional color override
 * @param onClick - Optional click handler
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend = 'neutral',
  trendValue,
  icon,
  color,
  onClick,
}) => {
  // Get trend color
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10B981'; // Green
      case 'down':
        return '#EF4444'; // Red
      case 'neutral':
      default:
        return '#6B7280'; // Gray
    }
  };

  // Create container style with optional background color
  const containerStyle: StyleProp<ViewStyle>[] = [styles.container];
  if (color) {
    containerStyle.push({ backgroundColor: color });
  }

  // Render with TouchableOpacity if onClick is provided, otherwise use View
  if (onClick) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onClick}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
        <Text style={styles.value}>{value}</Text>
        {trendValue && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trendValue,
                { color: getTrendColor() },
              ]}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Default render with View
  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={styles.value}>{value}</Text>
      {trendValue && (
        <View style={styles.trendContainer}>
          <Text
            style={[
              styles.trendValue,
              { color: getTrendColor() },
            ]}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA', // Light gray background
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#6B7280', // Gray
  },
  iconContainer: {
    marginLeft: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Black
  },
  trendContainer: {
    marginTop: 8,
  },
  trendValue: {
    fontSize: 12,
  },
});