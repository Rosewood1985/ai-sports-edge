import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface DataSeries {
  label: string;
  data: number[];
  color?: string;
}

interface HistoricalTrendsChartProps {
  title?: string;
  series: DataSeries[];
  labels: string[];
  yAxisSuffix?: string;
  yAxisPrefix?: string;
  decimalPlaces?: number;
  height?: number;
  showLegend?: boolean;
  showDataPoints?: boolean;
  bezier?: boolean;
  onPress?: () => void;
}

/**
 * HistoricalTrendsChart component for visualizing multiple data series over time
 */
const HistoricalTrendsChart: React.FC<HistoricalTrendsChartProps> = ({
  title = 'Historical Trends',
  series,
  labels,
  yAxisSuffix = '',
  yAxisPrefix = '',
  decimalPlaces = 0,
  height = 220,
  showLegend = true,
  showDataPoints = true,
  bezier = true,
  onPress,
}) => {
  // State
  const [activeSeries, setActiveSeries] = useState<string[]>(series.map(s => s.label));
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 64);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  
  // Get theme colors
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Animate chart entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Toggle series visibility
  const toggleSeries = (label: string) => {
    if (activeSeries.includes(label)) {
      // Remove if already active
      if (activeSeries.length > 1) { // Keep at least one series visible
        setActiveSeries(activeSeries.filter(s => s !== label));
      }
    } else {
      // Add if not active
      setActiveSeries([...activeSeries, label]);
    }
  };
  
  // Memoized hex to RGB conversion function
  const hexToRgb = useCallback((hex: string | undefined) => {
    const safeHex = hex || Colors.neon.blue;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(safeHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 123, b: 255 }; // Default to blue
  }, []);
  
  // Memoized chart data preparation
  const chartData = useMemo(() => {
    // Filter to only active series
    const filteredSeries = series.filter(s => activeSeries.includes(s.label));
    
    return {
      labels,
      datasets: filteredSeries.map(s => ({
        data: s.data,
        color: (opacity = 1) => {
          const rgb = hexToRgb(s.color);
          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        },
        strokeWidth: 2,
      })),
      legend: filteredSeries.map(s => s.label),
    };
  }, [series, activeSeries, labels, hexToRgb]);
  
  // Memoized chart configuration
  const chartConfig = useMemo(() => {
    return {
      backgroundColor: backgroundColor,
      backgroundGradientFrom: backgroundColor,
      backgroundGradientTo: backgroundColor,
      decimalPlaces: decimalPlaces,
      color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: showDataPoints ? '4' : '0',
        strokeWidth: showDataPoints ? '2' : '0',
      },
      propsForLabels: {
        fontSize: 10,
      },
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    };
  }, [backgroundColor, decimalPlaces, isDark, showDataPoints]);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        
        {onPress && (
          <TouchableOpacity style={styles.expandButton} onPress={onPress}>
            <Ionicons name="expand" size={20} color={Colors.neon.blue} />
          </TouchableOpacity>
        )}
      </View>
      
      <LineChart
        data={chartData}
        width={chartWidth}
        height={height}
        chartConfig={chartConfig}
        bezier={bezier}
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withShadow={false}
        withDots={showDataPoints}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
        yAxisInterval={1}
        yAxisSuffix={yAxisSuffix}
        yAxisLabel={yAxisPrefix}
        hidePointsAtIndex={showDataPoints ? [] : labels.map((_, i) => i)}
      />
      
      {showLegend && (
        <View style={styles.legendContainer}>
          {series.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={styles.legendItem}
              onPress={() => toggleSeries(s.label)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.legendColor,
                  {
                    backgroundColor: s.color || Colors.neon.blue,
                    opacity: activeSeries.includes(s.label) ? 1 : 0.3,
                  },
                ]}
              />
              <ThemedText
                style={[
                  styles.legendText,
                  { opacity: activeSeries.includes(s.label) ? 1 : 0.3 },
                ]}
              >
                {s.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandButton: {
    padding: 4,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default HistoricalTrendsChart;