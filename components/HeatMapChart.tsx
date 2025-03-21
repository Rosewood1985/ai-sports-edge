import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Line } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';

/**
 * Heat map data cell interface
 */
interface HeatMapCell {
  x: number;
  y: number;
  value: number;
  label?: string;
  data?: any; // Additional data for the cell
}

/**
 * Heat map chart props
 */
interface HeatMapChartProps {
  data: HeatMapCell[];
  width?: number;
  height?: number;
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  colorRange?: string[];
  onCellPress?: (cell: HeatMapCell) => void;
  showValues?: boolean;
}

/**
 * Heat map chart component for visualizing data intensity across two dimensions
 */
const HeatMapChart: React.FC<HeatMapChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 300,
  xLabels = [],
  yLabels = [],
  title,
  colorRange = ['#FFFFFF', '#36A2EB', '#4BC0C0', '#FFCE56', '#FF6384'],
  onCellPress,
  showValues = true
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Calculate chart dimensions
  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Find min and max values
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Find unique x and y values if labels not provided
  const uniqueX = [...new Set(data.map(d => d.x))].sort((a, b) => a - b);
  const uniqueY = [...new Set(data.map(d => d.y))].sort((a, b) => a - b);
  
  // Use provided labels or generate from data
  const finalXLabels = xLabels.length > 0 ? xLabels : uniqueX.map(x => x.toString());
  const finalYLabels = yLabels.length > 0 ? yLabels : uniqueY.map(y => y.toString());
  
  // Calculate cell dimensions
  const cellWidth = chartWidth / finalXLabels.length;
  const cellHeight = chartHeight / finalYLabels.length;
  
  // Color scale function
  const getColor = (value: number) => {
    if (minValue === maxValue) return colorRange[0];
    
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const colorIndex = Math.min(
      Math.floor(normalizedValue * (colorRange.length - 1)),
      colorRange.length - 2
    );
    
    // Interpolate between colors
    const startColor = hexToRgb(colorRange[colorIndex]);
    const endColor = hexToRgb(colorRange[colorIndex + 1]);
    const ratio = (normalizedValue * (colorRange.length - 1)) % 1;
    
    if (!startColor || !endColor) return colorRange[0];
    
    const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
    const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
    const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Handle cell press
  const handleCellPress = (cell: HeatMapCell) => {
    if (onCellPress) {
      onCellPress(cell);
    }
  };
  
  // Format value for display
  const formatValue = (value: number) => {
    if (value === Math.round(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  };
  
  return (
    <ThemedView style={styles.container}>
      {title && <ThemedText style={styles.title}>{title}</ThemedText>}
      
      <Svg width={width} height={height}>
        {/* Y-axis labels */}
        {finalYLabels.map((label, index) => (
          <SvgText
            key={`y-label-${index}`}
            x={padding - 10}
            y={padding + index * cellHeight + cellHeight / 2}
            fontSize="10"
            textAnchor="end"
            alignmentBaseline="middle"
            fill={textColor}
          >
            {label}
          </SvgText>
        ))}
        
        {/* X-axis labels */}
        {finalXLabels.map((label, index) => (
          <SvgText
            key={`x-label-${index}`}
            x={padding + index * cellWidth + cellWidth / 2}
            y={height - padding + 20}
            fontSize="10"
            textAnchor="middle"
            fill={textColor}
          >
            {label}
          </SvgText>
        ))}
        
        {/* Grid lines */}
        {finalYLabels.map((_, index) => (
          <Line
            key={`h-line-${index}`}
            x1={padding}
            y1={padding + index * cellHeight}
            x2={width - padding}
            y2={padding + index * cellHeight}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
        
        {finalXLabels.map((_, index) => (
          <Line
            key={`v-line-${index}`}
            x1={padding + index * cellWidth}
            y1={padding}
            x2={padding + index * cellWidth}
            y2={height - padding}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}
        <Line
          x1={width - padding}
          y1={padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
        
        {/* Heat map cells */}
        {data.map((cell, index) => {
          const xIndex = uniqueX.indexOf(cell.x);
          const yIndex = uniqueY.indexOf(cell.y);
          
          if (xIndex === -1 || yIndex === -1) return null;
          
          const x = padding + xIndex * cellWidth;
          const y = padding + yIndex * cellHeight;
          const color = getColor(cell.value);
          
          return (
            <G key={index} onPress={() => handleCellPress(cell)}>
              <Rect
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill={color}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              {showValues && (
                <SvgText
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2}
                  fontSize="10"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={cell.value > (maxValue - minValue) * 0.7 + minValue ? '#fff' : '#000'}
                  fontWeight="bold"
                >
                  {formatValue(cell.value)}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
      
      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendTitle}>Value Range</ThemedText>
        <View style={styles.legendGradient}>
          {colorRange.map((color, index) => (
            <View
              key={index}
              style={[
                styles.legendColorBlock,
                { backgroundColor: color }
              ]}
            />
          ))}
        </View>
        <View style={styles.legendLabels}>
          <ThemedText style={styles.legendText}>{minValue}</ThemedText>
          <ThemedText style={styles.legendText}>{maxValue}</ThemedText>
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
  legendGradient: {
    flexDirection: 'row',
    height: 20,
    width: '80%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  legendColorBlock: {
    flex: 1,
    height: '100%',
  },
  legendLabels: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default HeatMapChart;