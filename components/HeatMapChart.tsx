import React, { useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable, AccessibilityInfo, findNodeHandle, Platform } from 'react-native';
import { ContributionGraph } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import Colors from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface HeatMapChartProps {
  data: { [date: string]: number };
  title?: string;
  startDate?: Date;
  numDays?: number;
  chartColor?: string;
}

/**
 * HeatMapChart component for visualizing activity frequency over time
 */
const HeatMapChart: React.FC<HeatMapChartProps> = ({
  data,
  title = 'Activity Heatmap',
  startDate,
  numDays = 105,
  chartColor = Colors.neon.blue,
}) => {
  // Get translations
  const { t } = useI18n();
  
  // Get theme colors
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Get screen width
  const screenWidth = Dimensions.get('window').width - 32; // Adjust for padding
  
  // State for keyboard navigation
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const chartRef = useRef(null);
  
  // Check if screen reader is enabled
  React.useEffect(() => {
    const checkScreenReader = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(screenReaderEnabled);
    };
    
    checkScreenReader();
    
    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      checkScreenReader
    );
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Convert data object to array format required by ContributionGraph
  // Memoize to prevent unnecessary recalculations
  const formattedData = useMemo(() => {
    return Object.entries(data).map(([date, count]) => ({
      date,
      count,
    }));
  }, [data]);
  
  // Convert hex color to rgba - memoized helper function
  const hexToRgb = useMemo(() => {
    return (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 123, b: 255 }; // Default to blue
    };
  }, []);
  
  // Chart configuration - memoized to prevent recreation on each render
  const chartConfig = useMemo(() => {
    return {
      backgroundColor: backgroundColor,
      backgroundGradientFrom: backgroundColor,
      backgroundGradientTo: backgroundColor,
      decimalPlaces: 0,
      color: (opacity = 1) => {
        const rgb = hexToRgb(chartColor);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      },
      labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    };
  }, [backgroundColor, chartColor, isDark, hexToRgb]);
  
  // Calculate end date based on start date and number of days - memoized
  const endDate = useMemo(() => {
    const end = startDate ? new Date(startDate) : new Date();
    end.setDate(end.getDate() + numDays);
    return end;
  }, [startDate, numDays]);
  
  // Create an accessible summary of the data for screen readers
  const accessibleSummary = useMemo(() => {
    const totalActivities = Object.values(data).reduce((sum, count) => sum + count, 0);
    const activeDays = Object.values(data).filter(count => count > 0).length;
    const mostActiveDate = Object.entries(data).sort((a, b) => b[1] - a[1])[0];
    
    return t('charts.heatmap.accessibleSummary', {
      totalActivities,
      activeDays,
      totalDays: numDays,
      mostActiveDate: mostActiveDate ? `${mostActiveDate[0]} with ${mostActiveDate[1]} activities` : 'None'
    });
  }, [data, numDays, t]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedDay && focusedDay !== 0) {
      setFocusedDay(0);
      return;
    }
    
    switch (e.key) {
      case 'ArrowRight':
        setFocusedDay(prev => (prev !== null && prev < numDays - 1) ? prev + 1 : prev);
        break;
      case 'ArrowLeft':
        setFocusedDay(prev => (prev !== null && prev > 0) ? prev - 1 : prev);
        break;
      case 'ArrowUp':
        setFocusedDay(prev => (prev !== null && prev >= 7) ? prev - 7 : prev);
        break;
      case 'ArrowDown':
        setFocusedDay(prev => (prev !== null && prev < numDays - 7) ? prev + 7 : prev);
        break;
      case 'Enter':
      case ' ':
        // Announce the focused day's data
        if (focusedDay !== null) {
          const focusedDate = new Date(startDate || new Date());
          focusedDate.setDate(focusedDate.getDate() + focusedDay);
          const dateString = focusedDate.toISOString().split('T')[0];
          const count = data[dateString] || 0;
          
          AccessibilityInfo.announceForAccessibility(
            `${dateString}: ${count} ${count === 1 ? 'activity' : 'activities'}`
          );
        }
        break;
    }
  };
  
  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessible={true}
      accessibilityLabel={title}
      accessibilityHint={t('charts.heatmap.accessibilityHint')}
    >
      {title && (
        <ThemedText
          style={styles.title}
          accessibilityRole="header"
        >
          {title}
        </ThemedText>
      )}
      
      {/* Screen reader summary */}
      {isScreenReaderEnabled && (
        <View accessibilityRole="summary" accessibilityLabel={accessibleSummary} />
      )}
      
      {/* Keyboard navigable chart wrapper */}
      <View
        ref={chartRef}
        accessible={!isScreenReaderEnabled}
        accessibilityLabel={t('charts.heatmap.accessibilityLabel')}
        accessibilityHint={t('charts.heatmap.keyboardHint')}
        onAccessibilityTap={() => setFocusedDay(0)}
        // Note: tabIndex and onKeyDown are web-only props
        // They will work in React Native Web but are not part of the React Native type definitions
        {...(Platform.OS === 'web' ? {
          tabIndex: 0,
          onKeyDown: handleKeyDown
        } : {})}
      >
        <ContributionGraph
          values={formattedData}
          endDate={endDate}
          numDays={numDays}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          tooltipDataAttrs={(value: any) => {
            // Type assertion to fix TypeScript error
            return {
              'data-tip': `${value.date}: ${value.count} activities`,
              'aria-label': `${value.date}: ${value.count} activities`,
            } as any;
          }}
          style={styles.chart}
        />
      </View>
      
      <View
        style={styles.legend}
        accessible={true}
        accessibilityLabel={t('charts.heatmap.legendLabel')}
      >
        <ThemedText style={styles.legendText}>{t('charts.heatmap.less')}</ThemedText>
        <View style={styles.legendItems}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, index) => (
            <View
              key={index}
              style={[
                styles.legendItem,
                {
                  backgroundColor: chartConfig.color(opacity),
                },
              ]}
              accessibilityLabel={`${t('charts.heatmap.intensity')} ${index + 1}`}
            />
          ))}
        </View>
        <ThemedText style={styles.legendText}>{t('charts.heatmap.more')}</ThemedText>
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
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendText: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  legendItems: {
    flexDirection: 'row',
  },
  legendItem: {
    width: 16,
    height: 16,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

export default HeatMapChart;