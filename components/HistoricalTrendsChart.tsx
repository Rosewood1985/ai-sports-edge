import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsService } from '../services/analyticsService';

interface GameData {
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  plusMinus: number;
}

interface TrendData {
  dates: string[];
  values: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
}

interface HistoricalTrendsChartProps {
  playerId: string;
  playerName: string;
  gameId: string;
  onError?: (error: string) => void;
}

/**
 * Component to display historical trends chart for player statistics
 */
const HistoricalTrendsChart: React.FC<HistoricalTrendsChartProps> = ({
  playerId,
  playerName,
  gameId,
  onError
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<GameData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('points');
  const [timeFrame, setTimeFrame] = useState<'5games' | '10games' | 'season'>('10games');
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width - 32; // Padding
  
  // Available metrics
  const metrics = [
    { id: 'points', label: 'Points', color: '#FF9500' },
    { id: 'rebounds', label: 'Rebounds', color: '#34C759' },
    { id: 'assists', label: 'Assists', color: '#0A84FF' },
    { id: 'steals', label: 'Steals', color: '#5856D6' },
    { id: 'blocks', label: 'Blocks', color: '#FF2D55' },
    { id: 'fieldGoalPercentage', label: 'FG%', color: '#30D158' },
    { id: 'plusMinus', label: '+/-', color: '#64D2FF' }
  ];
  
  // Time frame options
  const timeFrames = [
    { id: '5games', label: 'Last 5 Games' },
    { id: '10games', label: 'Last 10 Games' },
    { id: 'season', label: 'Season' }
  ];
  
  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, this would fetch data from an API or Firestore
        // For now, we'll generate mock data
        const mockData = generateMockHistoricalData(playerId);
        setHistoricalData(mockData);
        
        // Track analytics event
        await analyticsService.trackEvent('viewed_historical_trends', {
          playerId,
          gameId,
          timeFrame
        });
      } catch (err) {
        console.error('Error loading historical data:', err);
        const errorMsg = 'Unable to load historical data';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadHistoricalData();
  }, [playerId, gameId]);
  
  // Calculate trend data when metric or time frame changes
  useEffect(() => {
    if (historicalData.length === 0) return;
    
    // Filter data based on time frame
    let filteredData = [...historicalData];
    if (timeFrame === '5games') {
      filteredData = filteredData.slice(0, 5);
    } else if (timeFrame === '10games') {
      filteredData = filteredData.slice(0, 10);
    }
    
    // Reverse data to show oldest to newest
    filteredData = filteredData.reverse();
    
    // Extract dates and values for the selected metric
    const dates = filteredData.map(game => game.date);
    const values = filteredData.map(game => game[selectedMetric as keyof GameData] as number);
    
    // Calculate trend
    const trend = calculateTrend(values);
    
    // Calculate percent change
    const percentChange = calculatePercentChange(values);
    
    setTrendData({
      dates,
      values,
      trend,
      percentChange
    });
  }, [historicalData, selectedMetric, timeFrame]);
  
  // Generate mock historical data
  const generateMockHistoricalData = (playerId: string): GameData[] => {
    // Use playerId as a seed for consistent random data
    const seed = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number) => {
      const x = Math.sin(seed + historicalData.length) * 10000;
      const r = x - Math.floor(x);
      return Math.floor(r * (max - min + 1)) + min;
    };
    
    const teams = ['LAL', 'BOS', 'MIA', 'PHI', 'GSW', 'CHI', 'BKN', 'DAL', 'DEN', 'HOU', 'LAC', 'MIL', 'NYK', 'ORL', 'PHX'];
    const data: GameData[] = [];
    
    // Generate data for the last 20 games
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 2); // Every 2 days
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opponent: teams[random(0, teams.length - 1)],
        points: random(10, 30),
        rebounds: random(2, 12),
        assists: random(1, 10),
        steals: random(0, 4),
        blocks: random(0, 3),
        turnovers: random(0, 5),
        fieldGoalPercentage: random(35, 65),
        threePointPercentage: random(25, 50),
        plusMinus: random(-15, 20)
      });
    }
    
    return data;
  };
  
  // Calculate trend from values
  const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    // Simple linear regression
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < values.length; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const n = values.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  };
  
  // Calculate percent change
  const calculatePercentChange = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    // Calculate average of first half vs second half
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half);
    const secondHalf = values.slice(half);
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    if (firstAvg === 0) return 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  };
  
  // Get color for trend
  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable', isPositive: boolean = true): string => {
    if (trend === 'increasing') return isPositive ? '#34C759' : '#FF3B30';
    if (trend === 'decreasing') return isPositive ? '#FF3B30' : '#34C759';
    return '#8E8E93';
  };
  
  // Get icon for trend
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return 'arrow-up' as const;
    if (trend === 'decreasing') return 'arrow-down' as const;
    return 'remove' as const;
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading historical data...</ThemedText>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color={colors.error} />
        <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
      </View>
    );
  }
  
  // Render empty state
  if (historicalData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics" size={48} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText style={styles.emptyText}>No historical data available</ThemedText>
      </View>
    );
  }
  
  // Get current metric color
  const currentMetricColor = metrics.find(m => m.id === selectedMetric)?.color || colors.primary;
  
  // Determine if trend is positive (depends on the metric)
  const isTrendPositive = selectedMetric !== 'turnovers';
  
  return (
    <View style={styles.container}>
      {/* Metric selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.metricSelector}
        contentContainerStyle={styles.metricSelectorContent}
      >
        {metrics.map(metric => (
          <TouchableOpacity
            key={metric.id}
            style={[
              styles.metricButton,
              selectedMetric === metric.id && [
                styles.selectedMetricButton,
                { borderColor: metric.color }
              ]
            ]}
            onPress={() => setSelectedMetric(metric.id)}
            accessibilityLabel={`${metric.label} metric`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedMetric === metric.id }}
          >
            <ThemedText style={[
              styles.metricButtonText,
              selectedMetric === metric.id && { color: metric.color, fontWeight: 'bold' }
            ]}>
              {metric.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Time frame selector */}
      <View style={styles.timeFrameSelector}>
        {timeFrames.map(frame => (
          <TouchableOpacity
            key={frame.id}
            style={[
              styles.timeFrameButton,
              timeFrame === frame.id && [
                styles.selectedTimeFrameButton,
                { backgroundColor: colors.primary }
              ]
            ]}
            onPress={() => setTimeFrame(frame.id as '5games' | '10games' | 'season')}
            accessibilityLabel={frame.label}
            accessibilityRole="button"
            accessibilityState={{ selected: timeFrame === frame.id }}
          >
            <ThemedText style={[
              styles.timeFrameButtonText,
              timeFrame === frame.id && styles.selectedTimeFrameButtonText
            ]}>
              {frame.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Chart */}
      {trendData && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: trendData.dates,
              datasets: [
                {
                  data: trendData.values,
                  color: () => currentMetricColor,
                  strokeWidth: 2
                }
              ]
            }}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
              backgroundGradientFrom: isDark ? '#1c1c1e' : '#ffffff',
              backgroundGradientTo: isDark ? '#1c1c1e' : '#ffffff',
              decimalPlaces: selectedMetric.includes('Percentage') ? 1 : 0,
              color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: currentMetricColor
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withDots={true}
            segments={5}
          />
        </View>
      )}
      
      {/* Trend analysis */}
      {trendData && (
        <View style={[
          styles.trendContainer,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
        ]}>
          <View style={styles.trendHeader}>
            <View style={styles.trendTitleContainer}>
              <Ionicons 
                name={getTrendIcon(trendData.trend)} 
                size={20} 
                color={getTrendColor(trendData.trend, isTrendPositive)} 
              />
              <ThemedText style={[
                styles.trendTitle,
                { color: getTrendColor(trendData.trend, isTrendPositive) }
              ]}>
                {trendData.trend.charAt(0).toUpperCase() + trendData.trend.slice(1)} Trend
              </ThemedText>
            </View>
            
            <View style={[
              styles.percentChangeBadge,
              { backgroundColor: getTrendColor(trendData.trend, isTrendPositive) }
            ]}>
              <ThemedText style={styles.percentChangeText}>
                {trendData.percentChange > 0 ? '+' : ''}
                {trendData.percentChange.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.trendAnalysis}>
            {playerName}'s {metrics.find(m => m.id === selectedMetric)?.label.toLowerCase()} are 
            {trendData.trend === 'increasing' ? ' increasing' : 
             trendData.trend === 'decreasing' ? ' decreasing' : ' remaining stable'} 
            over the selected time period, with a 
            {trendData.percentChange > 0 ? ' positive' : trendData.percentChange < 0 ? ' negative' : 'n unchanged'} 
            trend of {trendData.percentChange > 0 ? '+' : ''}{trendData.percentChange.toFixed(1)}%.
            
            {trendData.trend === 'increasing' && isTrendPositive && 
              ` This positive trend suggests ${playerName} is improving in this area.`}
            
            {trendData.trend === 'decreasing' && !isTrendPositive && 
              ` This positive trend suggests ${playerName} is improving in this area.`}
            
            {trendData.trend === 'increasing' && !isTrendPositive && 
              ` This negative trend suggests ${playerName} is struggling in this area.`}
            
            {trendData.trend === 'decreasing' && isTrendPositive && 
              ` This negative trend suggests ${playerName} is struggling in this area.`}
            
            {trendData.trend === 'stable' && 
              ` This suggests ${playerName} is performing consistently in this area.`}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    flexDirection: 'row',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  metricSelector: {
    marginBottom: 16,
  },
  metricSelectorContent: {
    paddingHorizontal: 8,
  },
  metricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    marginHorizontal: 4,
  },
  selectedMetricButton: {
    borderWidth: 2,
  },
  metricButtonText: {
    fontSize: 14,
  },
  timeFrameSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  selectedTimeFrameButton: {
    borderWidth: 0,
  },
  timeFrameButtonText: {
    fontSize: 12,
  },
  selectedTimeFrameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  trendContainer: {
    padding: 16,
    borderRadius: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  percentChangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentChangeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendAnalysis: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HistoricalTrendsChart;