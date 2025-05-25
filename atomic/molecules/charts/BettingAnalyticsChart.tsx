/**
 * Atomic Molecule: Betting Analytics Chart
 * Reusable chart component for betting analytics visualization
 * Location: /atomic/molecules/charts/BettingAnalyticsChart.tsx
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, PieChart } from './';
import { AnalyticsSummary, TimePeriodFilter } from '../../../services/bettingAnalyticsService';

interface BettingAnalyticsChartProps {
  data: AnalyticsSummary;
  chartType: 'profit' | 'betTypes' | 'winRate';
  period: TimePeriodFilter['period'];
  width?: number;
  height?: number;
}

export function BettingAnalyticsChart({
  data,
  chartType,
  period,
  width = Dimensions.get('window').width - 32,
  height = 200,
}: BettingAnalyticsChartProps) {
  
  // Transform data based on chart type
  const getChartData = () => {
    switch (chartType) {
      case 'profit':
        return data.profitOverTime?.map(item => ({
          date: item.date,
          count: item.profit || 0,
        })) || [];
      
      case 'winRate':
        return data.winRateOverTime?.map(item => ({
          date: item.date,
          count: item.winRate || 0,
        })) || [];
      
      case 'betTypes':
        return data.betTypeDistribution?.map(item => ({
          name: item.type || 'Unknown',
          value: item.count || 0,
        })) || [];
      
      default:
        return [];
    }
  };

  const chartData = getChartData();

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available for selected period</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width }]}>
      {chartType === 'betTypes' ? (
        <PieChart
          data={chartData}
          className="betting-chart"
          showLegend={true}
          colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']}
        />
      ) : (
        <LineChart
          data={chartData}
          height={height}
          lineColor={chartType === 'profit' ? '#10B981' : '#3B82F6'}
          areaColor={chartType === 'profit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'}
          showPoints={true}
          showLabels={true}
          className="betting-chart"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});