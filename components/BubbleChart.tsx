import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface BubbleData {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number; // Optional secondary value for positioning
}

interface BubbleChartProps {
  data: BubbleData[];
  title?: string;
  maxBubbleSize?: number;
  minBubbleSize?: number;
  animated?: boolean;
}

/**
 * Custom BubbleChart component for visualizing data with varying bubble sizes
 */
const BubbleChart: React.FC<BubbleChartProps> = ({
  data,
  title = 'Bubble Chart',
  maxBubbleSize = 100,
  minBubbleSize = 30,
  animated = true,
}) => {
  // Get theme colors
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Get screen width
  const screenWidth = Dimensions.get('window').width - 64; // Adjust for padding
  
  // Animation values
  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;
  
  // Set up animation
  useEffect(() => {
    if (animated) {
      const animations = animatedValues.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(150, animations).start();
    } else {
      // Set all to 1 immediately if not animated
      animatedValues.forEach((anim) => anim.setValue(1));
    }
  }, [animated, data.length]);
  
  // Memoize min and max values to avoid recalculating them multiple times
  const { maxValue, minValue, maxSecondaryValue, minSecondaryValue } = useMemo(() => {
    return {
      maxValue: Math.max(...data.map((item) => item.value)),
      minValue: Math.min(...data.map((item) => item.value)),
      maxSecondaryValue: Math.max(...data.map((item) => item.secondaryValue || 0)),
      minSecondaryValue: Math.min(...data.map((item) => item.secondaryValue || 0)),
    };
  }, [data]);

  // Memoize the hash function to avoid recreating it on each render
  const hashCode = useCallback((str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }, []);
  
  // Calculate bubble size based on value - memoized
  const calculateBubbleSize = useCallback((value: number) => {
    // Handle case where all values are the same
    if (maxValue === minValue) {
      return (maxBubbleSize + minBubbleSize) / 2;
    }
    
    // Calculate size proportionally
    const sizeRange = maxBubbleSize - minBubbleSize;
    const valueRange = maxValue - minValue;
    const proportion = (value - minValue) / valueRange;
    
    return minBubbleSize + proportion * sizeRange;
  }, [maxValue, minValue, maxBubbleSize, minBubbleSize]);
  
  // Calculate position based on secondary value or random placement - memoized
  const calculatePosition = useCallback((index: number, size: number, secondaryValue?: number) => {
    const maxX = screenWidth - size;
    const maxY = 200 - size; // Chart height
    
    if (secondaryValue !== undefined) {
      // Use secondary value for vertical positioning
      const range = maxSecondaryValue - minSecondaryValue;
      
      // Calculate Y position based on secondary value
      const yProportion = range === 0 ? 0.5 : (secondaryValue - minSecondaryValue) / range;
      const y = maxY * (1 - yProportion);
      
      // Distribute X positions evenly
      const xStep = maxX / (data.length - 1 || 1);
      const x = index * xStep;
      
      return { x, y };
    } else {
      // Use pseudo-random placement based on index
      // This creates a deterministic but scattered layout
      const seed = hashCode(data[index].label);
      const x = (seed % 100) / 100 * maxX;
      const y = ((seed / 100) % 100) / 100 * maxY;
      
      return { x, y };
    }
  }, [screenWidth, data, maxSecondaryValue, minSecondaryValue, hashCode]);
  
  // Memoize bubble data to avoid recalculating on each render
  const bubbleData = useMemo(() => {
    return data.map((item, index) => {
      const size = calculateBubbleSize(item.value);
      const { x, y } = calculatePosition(index, size, item.secondaryValue);
      const bubbleColor = item.color || Colors.neon.blue;
      
      return {
        ...item,
        size,
        x,
        y,
        bubbleColor,
      };
    });
  }, [data, calculateBubbleSize, calculatePosition]);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {title && <ThemedText style={styles.title}>{title}</ThemedText>}
      
      <View style={styles.chartContainer}>
        {bubbleData.map((item, index) => (
          <Animated.View
            key={item.label}
            style={[
              styles.bubble,
              {
                width: item.size,
                height: item.size,
                backgroundColor: item.bubbleColor,
                left: item.x,
                top: item.y,
                opacity: animatedValues[index],
                transform: [
                  {
                    scale: animatedValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>{item.label}</Text>
            <Text style={styles.bubbleValue}>{item.value}</Text>
          </Animated.View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <ThemedText style={styles.legendTitle}>Bubble Size = Value</ThemedText>
        <View style={styles.legendItems}>
          {[minBubbleSize, (maxBubbleSize + minBubbleSize) / 2, maxBubbleSize].map((size, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendBubble,
                  {
                    width: size / 3,
                    height: size / 3,
                    backgroundColor: Colors.neon.blue,
                  },
                ]}
              />
              <ThemedText style={styles.legendText}>
                {index === 0 ? 'Small' : index === 1 ? 'Medium' : 'Large'}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bubbleValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 24,
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendBubble: {
    borderRadius: 100,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default BubbleChart;