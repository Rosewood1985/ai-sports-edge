import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';

/**
 * Bubble data point interface
 */
interface BubbleDataPoint {
  x: number;
  y: number;
  size: number;
  label: string;
  color?: string;
  data?: any; // Additional data for the bubble
}

/**
 * Bubble chart props
 */
interface BubbleChartProps {
  data: BubbleDataPoint[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  onBubblePress?: (bubble: BubbleDataPoint) => void;
}

/**
 * Bubble chart component for visualizing data with three dimensions
 */
const BubbleChart: React.FC<BubbleChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  title,
  onBubblePress
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Calculate chart dimensions
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Find min and max values for x and y
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  // Find min and max sizes
  const sizes = data.map(d => d.size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  
  // Scale functions
  const xScale = (x: number) => {
    return padding + (x - xMin) / (xMax - xMin) * chartWidth;
  };
  
  const yScale = (y: number) => {
    return height - padding - (y - yMin) / (yMax - yMin) * chartHeight;
  };
  
  const sizeScale = (size: number) => {
    const minRadius = 5;
    const maxRadius = 30;
    return minRadius + (size - minSize) / (maxSize - minSize) * (maxRadius - minRadius);
  };
  
  // Default color function
  const getColor = (index: number) => {
    const colors = [
      '#FF6384', // red
      '#36A2EB', // blue
      '#FFCE56', // yellow
      '#4BC0C0', // teal
      '#9966FF', // purple
      '#FF9F40', // orange
    ];
    return colors[index % colors.length];
  };
  
  // Handle bubble press
  const handleBubblePress = (bubble: BubbleDataPoint) => {
    if (onBubblePress) {
      onBubblePress(bubble);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      {title && <ThemedText style={styles.title}>{title}</ThemedText>}
      
      <Svg width={width} height={height}>
        {/* X-axis */}
        <SvgText
          x={width / 2}
          y={height - 10}
          fontSize="12"
          textAnchor="middle"
          fill={textColor}
        >
          {xAxisLabel}
        </SvgText>
        
        {/* Y-axis */}
        <SvgText
          x="10"
          y={height / 2}
          fontSize="12"
          textAnchor="middle"
          fill={textColor}
          rotation="-90"
          originX="10"
          originY={height / 2}
        >
          {yAxisLabel}
        </SvgText>
        
        {/* Bubbles */}
        {data.map((point, index) => {
          const cx = xScale(point.x);
          const cy = yScale(point.y);
          const r = sizeScale(point.size);
          const color = point.color || getColor(index);
          
          return (
            <G key={index} onPress={() => handleBubblePress(point)}>
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                fillOpacity="0.7"
                stroke={color}
                strokeWidth="1"
              />
              <SvgText
                x={cx}
                y={cy}
                fontSize="10"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#fff"
                fontWeight="bold"
              >
                {point.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      
      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendTitle}>Bubble Size: Relative Value</ThemedText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBubble, { width: 10, height: 10 }]} />
            <ThemedText style={styles.legendText}>Small</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBubble, { width: 20, height: 20 }]} />
            <ThemedText style={styles.legendText}>Medium</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBubble, { width: 30, height: 30 }]} />
            <ThemedText style={styles.legendText}>Large</ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendBubble: {
    borderRadius: 50,
    backgroundColor: 'rgba(54, 162, 235, 0.7)',
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default BubbleChart;