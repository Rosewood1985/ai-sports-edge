import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from '../atomic/atoms/ThemedText';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { useColorScheme } from '../hooks/useColorScheme';
import { useThemeColor } from '../hooks/useThemeColor';
import { getAdvancedPlayerMetrics, AdvancedPlayerMetrics } from '../services/playerStatsService';

// Import the RootStackParamList from the navigator file
type RootStackParamList = {
  PlayerHistoricalTrendsScreen: { gameId: string; playerId: string; playerName?: string };
  AdvancedPlayerStats: { gameId: string; gameTitle?: string };
  // Add other routes as needed
  [key: string]: object | undefined;
};

type PlayerHistoricalTrendsScreenProps = StackScreenProps<
  RootStackParamList,
  'PlayerHistoricalTrendsScreen'
>;

/**
 * Screen to display historical trends for a player
 */
const PlayerHistoricalTrendsScreen: React.FC<PlayerHistoricalTrendsScreenProps> = ({
  route,
  navigation,
}) => {
  const { gameId, playerId, playerName = 'Player' } = route.params;
  const [playerData, setPlayerData] = useState<AdvancedPlayerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<
    'points' | 'assists' | 'rebounds' | 'steals' | 'blocks' | 'fieldGoalPercentage'
  >('points');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showDataLabels, setShowDataLabels] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme() ?? 'light';
  const primaryColor = '#0a7ea4';
  const secondaryColor = '#34C759';

  // Chart background and grid colors
  const chartBackgroundColor = colorScheme === 'light' ? '#fff' : '#1c1c1e';
  const chartGridColor = colorScheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding

  // Load player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        const data = await getAdvancedPlayerMetrics(gameId, playerId);
        setPlayerData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching player historical data:', err);
        setError('Failed to load player historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [gameId, playerId]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: chartBackgroundColor,
    backgroundGradientFrom: chartBackgroundColor,
    backgroundGradientTo: chartBackgroundColor,
    decimalPlaces: selectedMetric === 'fieldGoalPercentage' ? 1 : 0,
    color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
    labelColor: (opacity = 1) =>
      colorScheme === 'light' ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: primaryColor,
    },
    propsForBackgroundLines: {
      stroke: chartGridColor,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
  };

  // Prepare chart data if available
  const hasChartData =
    playerData?.recentGamesAverages && playerData.recentGamesAverages[selectedMetric]?.length > 0;

  // Toggle chart type
  const toggleChartType = () => {
    setChartType(chartType === 'line' ? 'bar' : 'line');
  };

  // Toggle legend visibility
  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

  // Toggle data labels visibility
  const toggleDataLabels = () => {
    setShowDataLabels(!showDataLabels);
  };

  const chartData = hasChartData
    ? {
        labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
        datasets: [
          {
            data: playerData?.recentGamesAverages?.[selectedMetric] || [0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: [selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)],
      }
    : null;

  // Format metric name for display
  const formatMetricName = (metric: string): string => {
    if (metric === 'fieldGoalPercentage') return 'FG%';
    return metric.charAt(0).toUpperCase() + metric.slice(1);
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{playerName}</ThemedText>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading historical data...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{playerName}</ThemedText>
          <View style={styles.backButton} />
        </View>
        <ErrorMessage message={error} />
      </SafeAreaView>
    );
  }

  // Render empty state
  if (!playerData || !playerData.recentGamesAverages) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{playerName}</ThemedText>
          <View style={styles.backButton} />
        </View>
        <EmptyState message="No historical data available for this player." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>{playerData.playerName}</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ThemedText style={styles.subtitle}>Historical Trend Analysis</ThemedText>

      <ScrollView style={styles.scrollView}>
        {/* Metric Selection */}
        <View style={styles.metricSelectionContainer}>
          <ThemedText style={styles.sectionTitle}>Select Metric</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricButtonsContainer}
          >
            {(
              ['points', 'assists', 'rebounds', 'steals', 'blocks', 'fieldGoalPercentage'] as const
            ).map(metric => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.metricButton,
                  selectedMetric === metric
                    ? { backgroundColor: primaryColor }
                    : { borderColor: primaryColor, borderWidth: 1 },
                ]}
                onPress={() => setSelectedMetric(metric)}
              >
                <ThemedText
                  style={[
                    styles.metricButtonText,
                    selectedMetric === metric ? { color: 'white' } : { color: primaryColor },
                  ]}
                >
                  {formatMetricName(metric)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <ThemedText style={styles.sectionTitle}>
              {formatMetricName(selectedMetric)} - Last 5 Games
            </ThemedText>

            <View style={styles.chartControls}>
              <TouchableOpacity style={styles.chartControlButton} onPress={toggleChartType}>
                <Ionicons
                  name={chartType === 'line' ? 'stats-chart' : 'bar-chart'}
                  size={20}
                  color={primaryColor}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.chartControlButton} onPress={toggleLegend}>
                <Ionicons
                  name={showLegend ? 'list' : 'list-outline'}
                  size={20}
                  color={primaryColor}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.chartControlButton} onPress={toggleDataLabels}>
                <Ionicons
                  name={showDataLabels ? 'pricetag' : 'pricetag-outline'}
                  size={20}
                  color={primaryColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {hasChartData && chartData ? (
            <View style={styles.chartContainer}>
              <View style={[styles.chart, { width: screenWidth, height: 220 }]}>
                <ThemedText style={styles.chartPlaceholder}>
                  {`Chart visualization for ${formatMetricName(selectedMetric)}`}
                </ThemedText>
              </View>

              {/* Stats Summary */}
              <View style={styles.statsSummary}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Average</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {selectedMetric === 'fieldGoalPercentage'
                      ? `${((playerData.recentGamesAverages[selectedMetric].reduce((a, b) => a + b, 0) / playerData.recentGamesAverages[selectedMetric].length) * 100).toFixed(1)}%`
                      : (
                          playerData.recentGamesAverages[selectedMetric].reduce(
                            (a, b) => a + b,
                            0
                          ) / playerData.recentGamesAverages[selectedMetric].length
                        ).toFixed(1)}
                  </ThemedText>
                </View>

                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>High</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {selectedMetric === 'fieldGoalPercentage'
                      ? `${(Math.max(...playerData.recentGamesAverages[selectedMetric]) * 100).toFixed(1)}%`
                      : Math.max(...playerData.recentGamesAverages[selectedMetric]).toFixed(0)}
                  </ThemedText>
                </View>

                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Low</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {selectedMetric === 'fieldGoalPercentage'
                      ? `${(Math.min(...playerData.recentGamesAverages[selectedMetric]) * 100).toFixed(1)}%`
                      : Math.min(...playerData.recentGamesAverages[selectedMetric]).toFixed(0)}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons
                name="analytics-outline"
                size={48}
                color={textColor}
                style={{ opacity: 0.5 }}
              />
              <ThemedText style={styles.noDataText}>No data available for this metric</ThemedText>
            </View>
          )}
        </View>

        {/* Trend Analysis */}
        <View style={styles.trendAnalysisSection}>
          <ThemedText style={styles.sectionTitle}>Trend Analysis</ThemedText>

          {hasChartData ? (
            <View style={styles.trendAnalysisContent}>
              {/* Calculate trend */}
              {(() => {
                const data = playerData.recentGamesAverages[selectedMetric];
                const firstHalf = data.slice(0, Math.ceil(data.length / 2));
                const secondHalf = data.slice(Math.ceil(data.length / 2));

                const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

                const trendPercentage =
                  firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

                let trendText = '';
                let trendColor = textColor;
                let trendIcon = 'remove-outline';

                if (trendPercentage > 15) {
                  trendText = 'Strong upward trend';
                  trendColor = '#34C759';
                  trendIcon = 'trending-up';
                } else if (trendPercentage > 5) {
                  trendText = 'Slight upward trend';
                  trendColor = '#34C759';
                  trendIcon = 'trending-up';
                } else if (trendPercentage < -15) {
                  trendText = 'Strong downward trend';
                  trendColor = '#FF3B30';
                  trendIcon = 'trending-down';
                } else if (trendPercentage < -5) {
                  trendText = 'Slight downward trend';
                  trendColor = '#FF3B30';
                  trendIcon = 'trending-down';
                } else {
                  trendText = 'Stable performance';
                  trendIcon = 'remove-outline';
                }

                return (
                  <View style={styles.trendIndicator}>
                    <Ionicons name={trendIcon as any} size={24} color={trendColor} />
                    <ThemedText style={[styles.trendText, { color: trendColor }]}>
                      {trendText}
                    </ThemedText>
                    <ThemedText style={styles.trendDescription}>
                      {trendPercentage > 0
                        ? `${trendPercentage.toFixed(1)}% increase in recent games`
                        : trendPercentage < 0
                          ? `${Math.abs(trendPercentage).toFixed(1)}% decrease in recent games`
                          : 'Consistent performance across recent games'}
                    </ThemedText>
                  </View>
                );
              })()}

              <View style={styles.insightsContainer}>
                <ThemedText style={styles.insightsTitle}>Performance Insights</ThemedText>
                <View style={styles.insightItem}>
                  <Ionicons name="analytics-outline" size={20} color={secondaryColor} />
                  <ThemedText style={styles.insightText}>
                    {(() => {
                      const data = playerData.recentGamesAverages[selectedMetric];
                      const avg = data.reduce((a, b) => a + b, 0) / data.length;
                      const variance =
                        data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.length;
                      const stdDev = Math.sqrt(variance);

                      const consistencyRatio = stdDev / avg;

                      if (consistencyRatio < 0.2) {
                        return `Highly consistent ${formatMetricName(selectedMetric).toLowerCase()} production`;
                      } else if (consistencyRatio < 0.4) {
                        return `Moderately consistent ${formatMetricName(selectedMetric).toLowerCase()} production`;
                      } else {
                        return `Variable ${formatMetricName(selectedMetric).toLowerCase()} production from game to game`;
                      }
                    })()}
                  </ThemedText>
                </View>

                <View style={styles.insightItem}>
                  <Ionicons name="podium-outline" size={20} color={secondaryColor} />
                  <ThemedText style={styles.insightText}>
                    {(() => {
                      const data = playerData.recentGamesAverages[selectedMetric];
                      const lastGame = data[data.length - 1];
                      const prevGames = data.slice(0, data.length - 1);
                      const prevAvg = prevGames.reduce((a, b) => a + b, 0) / prevGames.length;

                      if (lastGame > prevAvg * 1.2) {
                        return `Last game ${formatMetricName(selectedMetric).toLowerCase()} was significantly above average`;
                      } else if (lastGame < prevAvg * 0.8) {
                        return `Last game ${formatMetricName(selectedMetric).toLowerCase()} was significantly below average`;
                      } else {
                        return `Last game ${formatMetricName(selectedMetric).toLowerCase()} was close to the player's average`;
                      }
                    })()}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <ThemedText style={styles.noDataText}>
                Insufficient data for trend analysis
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  metricSelectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricButtonsContainer: {
    paddingRight: 16,
  },
  metricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(10, 126, 164, 0.3)',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
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
  chartPlaceholder: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 100,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 16,
    textAlign: 'center',
  },
  trendAnalysisSection: {
    marginBottom: 24,
  },
  trendAnalysisContent: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  trendIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  trendText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  trendDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  insightsContainer: {
    marginTop: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default PlayerHistoricalTrendsScreen;
