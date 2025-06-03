import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BetType, BetResult } from '../services/bettingAnalyticsService';

interface BettingAnalyticsChartProps {
  data: {
    totalBets: number;
    totalWagered: number;
    totalWinnings: number;
    netProfit: number;
    roi: number;
    winRate: number;
    betTypeBreakdown: {
      [key in BetType]?: {
        count: number;
        winRate: number;
        profit: number;
      };
    };
    recentForm: BetResult[];
  };
  chartType: 'profit' | 'betTypes' | 'winRate';
}

/**
 * Component that displays betting analytics charts
 */
const BettingAnalyticsChart: React.FC<BettingAnalyticsChartProps> = ({ data, chartType }) => {
  const screenWidth = Dimensions.get('window').width - 32; // Adjust for padding

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(64, 128, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  /**
   * Render profit chart
   */
  const renderProfitChart = () => {
    // Create dummy data for demonstration
    // In a real implementation, this would use historical profit data
    const profitData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [data.netProfit * 0.2, data.netProfit * 0.5, data.netProfit * 0.7, data.netProfit],
          color: (opacity = 1) =>
            data.netProfit >= 0 ? `rgba(76, 175, 80, ${opacity})` : `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Profit Over Time'],
    };

    return (
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Profit Trend</ThemedText>
        <LineChart
          data={profitData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  /**
   * Render bet types chart
   */
  const renderBetTypesChart = () => {
    const betTypes = Object.entries(data.betTypeBreakdown);

    if (betTypes.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <ThemedText style={styles.emptyChartText}>No bet type data available</ThemedText>
        </View>
      );
    }

    const betTypeData = {
      labels: betTypes.map(([type]) => type.substring(0, 4)),
      datasets: [
        {
          data: betTypes.map(([_, typeData]) => typeData.count),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Bet Types Distribution</ThemedText>
        <BarChart
          data={betTypeData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>
    );
  };

  /**
   * Render win rate chart
   */
  const renderWinRateChart = () => {
    // Calculate win/loss/push percentages
    const winCount = data.recentForm.filter(result => result === BetResult.WIN).length;
    const lossCount = data.recentForm.filter(result => result === BetResult.LOSS).length;
    const pushCount = data.recentForm.filter(result => result === BetResult.PUSH).length;
    const voidCount = data.recentForm.filter(result => result === BetResult.VOID).length;

    const total = data.totalBets || 1; // Avoid division by zero

    const winRate = (winCount / total) * 100;
    const lossRate = (lossCount / total) * 100;
    const pushRate = (pushCount / total) * 100;
    const voidRate = (voidCount / total) * 100;

    const pieData = [
      {
        name: 'Wins',
        population: winRate,
        color: '#4caf50',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Losses',
        population: lossRate,
        color: '#f44336',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Pushes',
        population: pushRate,
        color: '#ff9800',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Voids',
        population: voidRate,
        color: '#9e9e9e',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ].filter(item => item.population > 0);

    if (pieData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <ThemedText style={styles.emptyChartText}>No win rate data available</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Results Distribution</ThemedText>
        <PieChart
          data={pieData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute={false}
          style={styles.chart}
        />
      </View>
    );
  };

  /**
   * Render the appropriate chart based on chartType
   */
  const renderChart = () => {
    switch (chartType) {
      case 'profit':
        return renderProfitChart();
      case 'betTypes':
        return renderBetTypesChart();
      case 'winRate':
        return renderWinRateChart();
      default:
        return null;
    }
  };

  return <ThemedView style={styles.container}>{renderChart()}</ThemedView>;
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
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default BettingAnalyticsChart;
