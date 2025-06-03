import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { useEnhancedInsights } from '../../../../hooks/useEnhancedInsights';
import { EnhancedInsight, InsightType } from '../../../../types/enhancedInsights';
import ErrorMessage from '../../../ErrorMessage';
import LoadingIndicator from '../../../LoadingIndicator';

const screenWidth = Dimensions.get('window').width;

interface InsightAnalyticsWidgetProps {
  dateRange: [Date, Date];
  insightTypes: InsightType[];
}

export const InsightAnalyticsWidget: React.FC<InsightAnalyticsWidgetProps> = ({
  dateRange,
  insightTypes,
}) => {
  const { insights, isLoading, error } = useEnhancedInsights({
    startDate: dateRange[0],
    endDate: dateRange[1],
    types: insightTypes,
  });

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error} />;

  const getInsightTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyCounts = last7Days.map(date => {
      return insights.filter(
        insight => new Date(insight.timestamp).toISOString().split('T')[0] === date
      ).length;
    });

    return {
      labels: last7Days.map(date => new Date(date).getDate().toString()),
      datasets: [
        {
          data: dailyCounts,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getInsightTypeDistribution = () => {
    const typeCounts = insights.reduce(
      (acc, insight) => {
        acc[insight.type] = (acc[insight.type] || 0) + 1;
        return acc;
      },
      {} as Record<InsightType, number>
    );

    const colors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384',
      '#C9CBCF',
    ];

    return Object.entries(typeCounts).map(([type, count], index) => ({
      name: type,
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getConfidenceDistribution = () => {
    const confidenceRanges = {
      'Low (0-0.3)': 0,
      'Medium (0.3-0.7)': 0,
      'High (0.7-1.0)': 0,
    };

    insights.forEach(insight => {
      if (insight.confidence <= 0.3) confidenceRanges['Low (0-0.3)']++;
      else if (insight.confidence <= 0.7) confidenceRanges['Medium (0.3-0.7)']++;
      else confidenceRanges['High (0.7-1.0)']++;
    });

    return {
      labels: Object.keys(confidenceRanges),
      datasets: [
        {
          data: Object.values(confidenceRanges),
          backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
          borderWidth: 1,
        },
      ],
    };
  };

  const getSeverityMetrics = () => {
    const severityCounts = insights.reduce(
      (acc, insight) => {
        acc[insight.severity] = (acc[insight.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      labels: Object.keys(severityCounts),
      datasets: [
        {
          data: Object.values(severityCounts),
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getTopInsightSources = () => {
    const sourceCounts = insights.reduce(
      (acc, insight) => {
        const source = insight.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#8641f4',
    },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Insight Analytics</Text>
        <Text style={styles.subtitle}>
          Analyzing {insights.length} insights from the selected period
        </Text>
      </View>

      {/* Insight Trend Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Insight Generation Trend</Text>
        <LineChart
          data={getInsightTrendData()}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Insight Type Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Insight Type Distribution</Text>
        <PieChart
          data={getInsightTypeDistribution()}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Confidence Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Confidence Level Distribution</Text>
        <BarChart
          data={getConfidenceDistribution()}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          verticalLabelRotation={30}
        />
      </View>

      {/* Severity Metrics */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Severity Distribution</Text>
        <LineChart
          data={getSeverityMetrics()}
          width={screenWidth - 60}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          }}
          style={styles.chart}
        />
      </View>

      {/* Top Insight Sources */}
      <View style={styles.metricsContainer}>
        <Text style={styles.chartTitle}>Top Insight Sources</Text>
        {getTopInsightSources().map(([source, count], index) => (
          <View key={source} style={styles.sourceItem}>
            <View style={styles.sourceRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>{source}</Text>
              <Text style={styles.sourceCount}>{count} insights</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Summary Metrics */}
      <View style={styles.summaryContainer}>
        <Text style={styles.chartTitle}>Summary Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{insights.length}</Text>
            <Text style={styles.metricLabel}>Total Insights</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {(
                (insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) *
                100
              ).toFixed(1)}
              %
            </Text>
            <Text style={styles.metricLabel}>Avg Confidence</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {insights.filter(i => i.severity === 'high').length}
            </Text>
            <Text style={styles.metricLabel}>High Severity</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{new Set(insights.map(i => i.source)).size}</Text>
            <Text style={styles.metricLabel}>Data Sources</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  metricsContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sourceRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8641f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sourceCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8641f4',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default InsightAnalyticsWidget;
