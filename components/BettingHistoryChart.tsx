import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import {
  bettingAnalyticsService,
  TimePeriodFilter,
  BetType,
  BetStatus,
  BetResult,
} from '../services/bettingAnalyticsService';

interface WageringHistoryChartProps {
  timePeriod?: TimePeriodFilter['period'];
  chartType?: 'profit' | 'winRate' | 'pickType' | 'sport';
  height?: number;
  width?: number;
}

/**
 * Component that displays wagering history charts
 */
const WageringHistoryChart: React.FC<WageringHistoryChartProps> = ({
  timePeriod = 'month',
  chartType = 'profit',
  height = 220,
  width = Dimensions.get('window').width - 40,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadChartData();
  }, [timePeriod, chartType]);

  /**
   * Load chart data based on chart type and time period
   */
  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const period: TimePeriodFilter = { period: timePeriod };
      const bets = await bettingAnalyticsService.getUserBets({
        status: BetStatus.SETTLED,
        timePeriod: period,
      });

      if (bets.length === 0) {
        setChartData(null);
        setLoading(false);
        return;
      }

      let data;

      switch (chartType) {
        case 'profit':
          data = generateProfitChartData(bets);
          break;
        case 'winRate':
          data = generateWinRateChartData(bets);
          break;
        case 'pickType':
          data = generatePickTypeChartData(bets);
          break;
        case 'sport':
          data = generateSportChartData(bets);
          break;
        default:
          data = generateProfitChartData(bets);
      }

      setChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setError('Failed to load chart data. Please try again later.');
      setLoading(false);
    }
  };

  /**
   * Generate profit chart data
   */
  const generateProfitChartData = (bets: any[]) => {
    // Sort bets by date (oldest first)
    const sortedBets = [...bets].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    // Group bets by day/week depending on time period
    const groupedBets = groupBetsByTimeUnit(sortedBets, timePeriod);

    // Calculate cumulative profit
    let cumulativeProfit = 0;
    const labels: string[] = [];
    const data: number[] = [];

    Object.entries(groupedBets).forEach(([date, betsInPeriod]) => {
      const periodProfit = betsInPeriod.reduce((sum, bet) => {
        if (bet.result === 'win') {
          return sum + (bet.potentialWinnings - bet.amount);
        } else if (bet.result === 'loss') {
          return sum - bet.amount;
        }
        return sum;
      }, 0);

      cumulativeProfit += periodProfit;
      labels.push(formatDateLabel(date, timePeriod));
      data.push(cumulativeProfit);
    });

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) =>
            cumulativeProfit >= 0
              ? `rgba(76, 175, 80, ${opacity})`
              : `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Cumulative Profit'],
    };
  };

  /**
   * Generate win rate chart data
   */
  const generateWinRateChartData = (bets: any[]) => {
    // Sort bets by date (oldest first)
    const sortedBets = [...bets].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    // Group bets by day/week depending on time period
    const groupedBets = groupBetsByTimeUnit(sortedBets, timePeriod);

    // Calculate win rate for each period
    const labels: string[] = [];
    const data: number[] = [];

    Object.entries(groupedBets).forEach(([date, betsInPeriod]) => {
      const totalBets = betsInPeriod.length;
      const winningBets = betsInPeriod.filter(bet => bet.result === 'win').length;
      const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;

      labels.push(formatDateLabel(date, timePeriod));
      data.push(winRate);
    });

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(64, 128, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Win Rate (%)'],
    };
  };

  /**
   * Generate pick type chart data
   */
  const generatePickTypeChartData = (bets: any[]) => {
    // Count bets by type
    const betTypeCounts: Record<string, number> = {};

    bets.forEach(bet => {
      const betType = bet.betType;
      betTypeCounts[betType] = (betTypeCounts[betType] || 0) + 1;
    });

    // Format data for pie chart
    const data = Object.entries(betTypeCounts).map(([betType, count], index) => {
      const colors = [
        '#FF6384', // red
        '#36A2EB', // blue
        '#FFCE56', // yellow
        '#4BC0C0', // teal
        '#9966FF', // purple
        '#FF9F40', // orange
      ];

      return {
        name: formatBetTypeName(betType),
        count,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });

    return data;
  };

  /**
   * Generate sport chart data
   */
  const generateSportChartData = (bets: any[]) => {
    // Count bets by sport
    const sportCounts: Record<string, number> = {};

    bets.forEach(bet => {
      const sport = bet.sport;
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });

    // Format data for pie chart
    const data = Object.entries(sportCounts).map(([sport, count], index) => {
      const colors = [
        '#FF6384', // red
        '#36A2EB', // blue
        '#FFCE56', // yellow
        '#4BC0C0', // teal
        '#9966FF', // purple
        '#FF9F40', // orange
      ];

      return {
        name: sport,
        count,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });

    return data;
  };

  /**
   * Group bets by time unit (day, week, month)
   */
  const groupBetsByTimeUnit = (bets: any[], period: string) => {
    const groupedBets: Record<string, any[]> = {};

    bets.forEach(bet => {
      const date = new Date(bet.createdAt.toMillis());
      let key;

      switch (period) {
        case 'week':
          // Group by day
          key = date.toISOString().split('T')[0];
          break;
        case 'month':
          // Group by day
          key = date.toISOString().split('T')[0];
          break;
        case 'year':
          // Group by week
          const weekNumber = getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'all':
          // Group by month
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedBets[key]) {
        groupedBets[key] = [];
      }

      groupedBets[key].push(bet);
    });

    return groupedBets;
  };

  /**
   * Get week number for a date
   */
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  /**
   * Format date label based on time period
   */
  const formatDateLabel = (dateStr: string, period: string) => {
    if (period === 'week' || period === 'month') {
      // For day format: MM/DD
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (period === 'year') {
      // For week format: WW
      return `W${dateStr.split('W')[1]}`;
    } else {
      // For month format: MM/YY
      const [year, month] = dateStr.split('-');
      return `${month}/${year.slice(2)}`;
    }
  };

  /**
   * Format bet type name
   */
  const formatBetTypeName = (betType: string) => {
    switch (betType) {
      case BetType.MONEYLINE:
        return 'Moneyline';
      case BetType.SPREAD:
        return 'Spread';
      case BetType.OVER_UNDER:
        return 'Over/Under';
      case BetType.PROP:
        return 'Prop';
      case BetType.PARLAY:
        return 'Parlay';
      case BetType.FUTURES:
        return 'Futures';
      default:
        return betType.charAt(0).toUpperCase() + betType.slice(1);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4080ff" />
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </View>
    );
  }

  /**
   * Render empty state
   */
  if (
    !chartData ||
    (Array.isArray(chartData) && chartData.length === 0) ||
    (chartData.datasets && chartData.datasets[0].data.length === 0)
  ) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          No betting data available for this time period
        </ThemedText>
      </View>
    );
  }

  /**
   * Chart configuration
   */
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: chartType === 'profit' ? 2 : 0,
    color: (opacity = 1) => `rgba(64, 128, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  /**
   * Render chart based on type
   */
  // Get chart title and description
  const getChartTitleAndDescription = () => {
    switch (chartType) {
      case 'profit':
        return {
          title: 'Profit History',
          description:
            chartData.datasets[0].data[chartData.datasets[0].data.length - 1] >= 0
              ? `Overall profit: $${chartData.datasets[0].data[chartData.datasets[0].data.length - 1].toFixed(2)}`
              : `Overall loss: $${Math.abs(chartData.datasets[0].data[chartData.datasets[0].data.length - 1]).toFixed(2)}`,
        };
      case 'winRate':
        const avgWinRate =
          chartData.datasets[0].data.reduce((sum: number, rate: number) => sum + rate, 0) /
          chartData.datasets[0].data.length;
        return {
          title: 'Win Rate History',
          description: `Average win rate: ${avgWinRate.toFixed(1)}%`,
        };
      case 'pickType':
        const totalBets = chartData.reduce((sum: number, item: any) => sum + item.count, 0);
        const topType = chartData.sort((a: any, b: any) => b.count - a.count)[0];
        return {
          title: 'Pick Types',
          description: `Most common: ${topType.name} (${((topType.count / totalBets) * 100).toFixed(1)}%)`,
        };
      case 'sport':
        const totalSportBets = chartData.reduce((sum: number, item: any) => sum + item.count, 0);
        const topSport = chartData.sort((a: any, b: any) => b.count - a.count)[0];
        return {
          title: 'Sports',
          description: `Most bet: ${topSport.name} (${((topSport.count / totalSportBets) * 100).toFixed(1)}%)`,
        };
      default:
        return { title: 'Betting History', description: '' };
    }
  };

  const { title, description } = getChartTitleAndDescription();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {description && <ThemedText style={styles.description}>{description}</ThemedText>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(chartType === 'profit' || chartType === 'winRate') && (
          <LineChart
            data={chartData}
            width={Math.max(width, chartData.labels.length * 60)}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix={chartType === 'profit' ? '$' : '%'}
            renderDotContent={({ x, y, index }) => (
              <View key={index} style={[styles.tooltipContainer, { top: y - 35, left: x - 40 }]}>
                <ThemedText style={styles.tooltipText}>
                  {chartType === 'profit'
                    ? `$${chartData.datasets[0].data[index].toFixed(2)}`
                    : `${chartData.datasets[0].data[index].toFixed(1)}%`}
                </ThemedText>
              </View>
            )}
          />
        )}

        {(chartType === 'pickType' || chartType === 'sport') && (
          <PieChart
            data={chartData}
            width={width}
            height={height}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend
            center={[width / 4, 0]}
          />
        )}
      </ScrollView>
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
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: 4,
    width: 80,
    alignItems: 'center',
    opacity: 0.9,
    zIndex: 999,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WageringHistoryChart;
