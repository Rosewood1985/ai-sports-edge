import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText } from './ThemedText';
import { BankrollData } from '../types/horseRacing';

interface BettingHistoryChartProps {
  bankrollData: BankrollData;
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

/**
 * Component to display betting history charts
 */
const BettingHistoryChart: React.FC<BettingHistoryChartProps> = ({
  bankrollData,
  timeRange = 'month'
}) => {
  const { colors, isDark } = useTheme();
  const [activeChart, setActiveChart] = useState<'roi' | 'winRate' | 'balance'>('balance');
  
  // Filter history based on time range
  const filteredHistory = React.useMemo(() => {
    if (!bankrollData.bettingHistory || bankrollData.bettingHistory.length === 0) {
      return [];
    }
    
    const now = new Date();
    const history = [...bankrollData.bettingHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    switch (timeRange) {
      case 'week':
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return history.filter(item => new Date(item.date) >= oneWeekAgo);
      
      case 'month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return history.filter(item => new Date(item.date) >= oneMonthAgo);
      
      case 'year':
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return history.filter(item => new Date(item.date) >= oneYearAgo);
      
      case 'all':
      default:
        return history;
    }
  }, [bankrollData.bettingHistory, timeRange]);
  
  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }
    
    // Get dates for labels (format as MM/DD)
    const labels = filteredHistory.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // Get data based on active chart
    let data: number[] = [];
    
    switch (activeChart) {
      case 'roi':
        data = filteredHistory.map(item => item.roi * 100); // Convert to percentage
        break;
      
      case 'winRate':
        data = filteredHistory.map(item => 
          item.betsPlaced > 0 ? (item.betsWon / item.betsPlaced) * 100 : 0
        );
        break;
      
      case 'balance':
      default:
        // Calculate cumulative profit/loss
        let runningBalance = bankrollData.totalDeposited;
        data = filteredHistory.map(item => {
          runningBalance += item.netProfit;
          return runningBalance;
        });
        break;
    }
    
    return {
      labels,
      datasets: [{ data }]
    };
  }, [filteredHistory, activeChart, bankrollData.totalDeposited]);
  
  // Get chart color based on data trend
  const getChartColor = () => {
    if (chartData.datasets[0].data.length <= 1) {
      return colors.primary;
    }
    
    const firstValue = chartData.datasets[0].data[0];
    const lastValue = chartData.datasets[0].data[chartData.datasets[0].data.length - 1];
    
    if (lastValue > firstValue) {
      return '#2ecc71'; // Green for positive trend
    } else if (lastValue < firstValue) {
      return '#e74c3c'; // Red for negative trend
    } else {
      return colors.primary; // Primary color for neutral trend
    }
  };
  
  // Get chart title
  const getChartTitle = () => {
    switch (activeChart) {
      case 'roi':
        return 'Return on Investment (%)';
      case 'winRate':
        return 'Win Rate (%)';
      case 'balance':
      default:
        return 'Bankroll Balance ($)';
    }
  };
  
  // Get chart description
  const getChartDescription = () => {
    if (chartData.datasets[0].data.length <= 1 || chartData.labels[0] === 'No Data') {
      return 'Not enough data to analyze trends.';
    }
    
    const firstValue = chartData.datasets[0].data[0];
    const lastValue = chartData.datasets[0].data[chartData.datasets[0].data.length - 1];
    const change = lastValue - firstValue;
    const percentChange = firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : 0;
    
    switch (activeChart) {
      case 'roi':
        if (change > 0) {
          return `Your ROI has improved by ${percentChange.toFixed(1)}% over this period.`;
        } else if (change < 0) {
          return `Your ROI has decreased by ${Math.abs(percentChange).toFixed(1)}% over this period.`;
        } else {
          return 'Your ROI has remained stable over this period.';
        }
      
      case 'winRate':
        if (change > 0) {
          return `Your win rate has improved by ${percentChange.toFixed(1)}% over this period.`;
        } else if (change < 0) {
          return `Your win rate has decreased by ${Math.abs(percentChange).toFixed(1)}% over this period.`;
        } else {
          return 'Your win rate has remained stable over this period.';
        }
      
      case 'balance':
      default:
        if (change > 0) {
          return `Your bankroll has grown by $${change.toFixed(2)} (${percentChange.toFixed(1)}%) over this period.`;
        } else if (change < 0) {
          return `Your bankroll has decreased by $${Math.abs(change).toFixed(2)} (${Math.abs(percentChange).toFixed(1)}%) over this period.`;
        } else {
          return 'Your bankroll has remained stable over this period.';
        }
    }
  };
  
  // Get chart statistics
  const getChartStatistics = () => {
    if (chartData.datasets[0].data.length <= 1 || chartData.labels[0] === 'No Data') {
      return [];
    }
    
    const data = chartData.datasets[0].data;
    
    // Calculate statistics
    const sum = data.reduce((acc, val) => acc + val, 0);
    const avg = sum / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Calculate standard deviation
    const squaredDiffs = data.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    switch (activeChart) {
      case 'roi':
        return [
          { label: 'Average ROI', value: `${avg.toFixed(1)}%` },
          { label: 'Best ROI', value: `${max.toFixed(1)}%` },
          { label: 'Worst ROI', value: `${min.toFixed(1)}%` },
          { label: 'Volatility', value: `${stdDev.toFixed(1)}%` }
        ];
      
      case 'winRate':
        return [
          { label: 'Average Win Rate', value: `${avg.toFixed(1)}%` },
          { label: 'Best Win Rate', value: `${max.toFixed(1)}%` },
          { label: 'Worst Win Rate', value: `${min.toFixed(1)}%` },
          { label: 'Consistency', value: `${(100 - stdDev).toFixed(1)}%` }
        ];
      
      case 'balance':
      default:
        return [
          { label: 'Average Balance', value: `$${avg.toFixed(2)}` },
          { label: 'Highest Balance', value: `$${max.toFixed(2)}` },
          { label: 'Lowest Balance', value: `$${min.toFixed(2)}` },
          { label: 'Volatility', value: `$${stdDev.toFixed(2)}` }
        ];
    }
  };
  
  // No data to display
  if (!bankrollData.bettingHistory || bankrollData.bettingHistory.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <ThemedText style={styles.noDataText}>
          No betting history available. Place bets to see your performance charts.
        </ThemedText>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Chart type selector */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            activeChart === 'balance' && [
              styles.activeChartTypeButton,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => setActiveChart('balance')}
        >
          <ThemedText
            style={[
              styles.chartTypeText,
              activeChart === 'balance' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Balance
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            activeChart === 'winRate' && [
              styles.activeChartTypeButton,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => setActiveChart('winRate')}
        >
          <ThemedText
            style={[
              styles.chartTypeText,
              activeChart === 'winRate' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Win Rate
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            activeChart === 'roi' && [
              styles.activeChartTypeButton,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => setActiveChart('roi')}
        >
          <ThemedText
            style={[
              styles.chartTypeText,
              activeChart === 'roi' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            ROI
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Chart title */}
      <ThemedText style={styles.chartTitle}>{getChartTitle()}</ThemedText>
      
      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={chartData}
          width={Math.max(Dimensions.get('window').width - 32, chartData.labels.length * 60)}
          height={220}
          chartConfig={{
            backgroundColor: isDark ? '#222222' : '#FFFFFF',
            backgroundGradientFrom: isDark ? '#222222' : '#FFFFFF',
            backgroundGradientTo: isDark ? '#222222' : '#FFFFFF',
            decimalPlaces: activeChart === 'balance' ? 2 : 1,
            color: (opacity = 1) => getChartColor(),
            labelColor: (opacity = 1) => colors.text,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: getChartColor(),
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
      
      {/* Chart description */}
      <ThemedText style={styles.chartDescription}>{getChartDescription()}</ThemedText>
      
      {/* Chart statistics */}
      <View style={styles.statisticsContainer}>
        {getChartStatistics().map((stat, index) => (
          <View key={index} style={styles.statisticItem}>
            <ThemedText style={styles.statisticLabel}>{stat.label}</ThemedText>
            <ThemedText style={styles.statisticValue}>{stat.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeChartTypeButton: {
    borderBottomWidth: 2,
  },
  chartTypeText: {
    fontSize: 14,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  statisticsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statisticItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  statisticLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statisticValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default BettingHistoryChart;