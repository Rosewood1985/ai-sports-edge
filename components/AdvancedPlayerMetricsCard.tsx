import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from './ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { useThemeColor } from '../hooks/useThemeColor';
import { AdvancedPlayerMetrics } from '../services/playerStatsService';

interface AdvancedPlayerMetricsCardProps {
  playerData: AdvancedPlayerMetrics;
  onPress?: () => void;
  expanded?: boolean;
  showHistoricalTrendsButton?: boolean;
}

/**
 * Component to display advanced player metrics
 */
const AdvancedPlayerMetricsCard: React.FC<AdvancedPlayerMetricsCardProps> = ({
  playerData,
  onPress,
  expanded = false,
  showHistoricalTrendsButton = true,
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1e' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');

  // Get the current color scheme
  const colorScheme = useColorScheme() ?? 'light';

  // Define colors based on the color scheme
  const borderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  const chartBackgroundColor = colorScheme === 'light' ? '#fff' : '#1c1c1e';
  const chartGridColor = colorScheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  // Format percentage values
  const formatPercentage = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format rating values
  const formatRating = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return value.toFixed(1);
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: chartBackgroundColor,
    backgroundGradientFrom: chartBackgroundColor,
    backgroundGradientTo: chartBackgroundColor,
    decimalPlaces: 1,
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
  };

  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding

  // Prepare chart data if available
  const hasChartData =
    playerData.recentGamesAverages && playerData.recentGamesAverages.points.length > 0;

  const pointsData = hasChartData
    ? {
        labels: ['G1', 'G2', 'G3', 'G4', 'G5'],
        datasets: [
          {
            data: playerData.recentGamesAverages?.points || [0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ['Points'],
      }
    : null;

  // Render compact view (when not expanded)
  if (!expanded) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor, borderColor }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>{playerData.playerName}</ThemedText>
          <ThemedText style={styles.teamName}>{playerData.team}</ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>PER:</ThemedText>
            <ThemedText
              style={[
                styles.statValue,
                {
                  color: (playerData.playerEfficiencyRating || 0) > 15 ? '#34C759' : textColor,
                },
              ]}
            >
              {formatRating(playerData.playerEfficiencyRating)}
            </ThemedText>
          </View>

          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>TS%:</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatPercentage(playerData.trueShootingPercentage)}
            </ThemedText>
          </View>

          {onPress && (
            <View style={styles.expandButton}>
              <Ionicons name="chevron-down" size={16} color={textColor} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Render expanded view with all metrics
  return (
    <View style={[styles.expandedContainer, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.playerName}>{playerData.playerName}</ThemedText>
          <ThemedText style={styles.teamName}>{playerData.team}</ThemedText>
        </View>

        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.collapseButton}>
            <Ionicons name="chevron-up" size={20} color={textColor} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Offensive Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Offensive Metrics</ThemedText>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>True Shooting %</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  {
                    color: (playerData.trueShootingPercentage || 0) > 0.55 ? '#34C759' : textColor,
                  },
                ]}
              >
                {formatPercentage(playerData.trueShootingPercentage)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Effective FG%</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(playerData.effectiveFieldGoalPercentage)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Offensive Rating</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  { color: (playerData.offensiveRating || 0) > 110 ? '#34C759' : textColor },
                ]}
              >
                {formatRating(playerData.offensiveRating)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Assist %</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(
                  playerData.assistPercentage ? playerData.assistPercentage / 100 : undefined
                )}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Usage Rate</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(playerData.usageRate ? playerData.usageRate / 100 : undefined)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Defensive Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Defensive Metrics</ThemedText>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Defensive Rating</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  { color: (playerData.defensiveRating || 0) < 105 ? '#34C759' : textColor },
                ]}
              >
                {formatRating(playerData.defensiveRating)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Steal %</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(
                  playerData.stealPercentage ? playerData.stealPercentage / 100 : undefined
                )}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Block %</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(
                  playerData.blockPercentage ? playerData.blockPercentage / 100 : undefined
                )}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Defensive Rebound %</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatPercentage(
                  playerData.defensiveReboundPercentage
                    ? playerData.defensiveReboundPercentage / 100
                    : undefined
                )}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Overall Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Overall Impact Metrics</ThemedText>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Player Efficiency Rating</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  { color: (playerData.playerEfficiencyRating || 0) > 15 ? '#34C759' : textColor },
                ]}
              >
                {formatRating(playerData.playerEfficiencyRating)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Value Over Replacement</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  {
                    color:
                      (playerData.valueOverReplacement || 0) > 0
                        ? '#34C759'
                        : (playerData.valueOverReplacement || 0) < 0
                          ? '#FF3B30'
                          : textColor,
                  },
                ]}
              >
                {formatRating(playerData.valueOverReplacement)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Win Shares</ThemedText>
              <ThemedText style={styles.metricValue}>
                {formatRating(playerData.winShares)}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Box Plus/Minus</ThemedText>
              <ThemedText
                style={[
                  styles.metricValue,
                  {
                    color:
                      (playerData.boxPlusMinus || 0) > 0
                        ? '#34C759'
                        : (playerData.boxPlusMinus || 0) < 0
                          ? '#FF3B30'
                          : textColor,
                  },
                ]}
              >
                {formatRating(playerData.boxPlusMinus)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Performance Chart */}
        {hasChartData && pointsData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Recent Performance</ThemedText>
              {showHistoricalTrendsButton && (
                <TouchableOpacity
                  style={styles.historicalTrendsButton}
                  onPress={() => {
                    navigation.navigate('PlayerHistoricalTrends', {
                      gameId: playerData.gameId,
                      playerId: playerData.playerId,
                      playerName: playerData.playerName,
                    });
                  }}
                >
                  <ThemedText style={styles.historicalTrendsButtonText}>View Trends</ThemedText>
                  <Ionicons name="analytics" size={16} color={primaryColor} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.chartContainer}>
              <LineChart
                data={pointsData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
              <ThemedText style={styles.chartLabel}>Points in Last 5 Games</ThemedText>
            </View>
          </View>
        )}

        {/* Explanation Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Metrics Explained</ThemedText>

          <View style={styles.explanationItem}>
            <ThemedText style={styles.explanationTitle}>Player Efficiency Rating (PER)</ThemedText>
            <ThemedText style={styles.explanationText}>
              A measure of per-minute production standardized such that the league average is 15.0.
            </ThemedText>
          </View>

          <View style={styles.explanationItem}>
            <ThemedText style={styles.explanationTitle}>True Shooting % (TS%)</ThemedText>
            <ThemedText style={styles.explanationText}>
              A measure of shooting efficiency that takes into account field goals, 3-point field
              goals, and free throws.
            </ThemedText>
          </View>

          <View style={styles.explanationItem}>
            <ThemedText style={styles.explanationTitle}>Box Plus/Minus (BPM)</ThemedText>
            <ThemedText style={styles.explanationText}>
              A box score estimate of the points per 100 possessions a player contributed above a
              league-average player.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historicalTrendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  historicalTrendsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
    marginRight: 4,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expandedContainer: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  collapseButton: {
    padding: 8,
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  explanationItem: {
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});

export default AdvancedPlayerMetricsCard;
