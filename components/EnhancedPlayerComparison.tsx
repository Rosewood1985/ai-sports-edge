import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import PlayerComparisonView from './PlayerComparisonView';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { useThemeColor } from '../hooks/useThemeColor';
import { PlayerComparisonData } from '../services/playerStatsService';

interface EnhancedPlayerComparisonProps {
  comparisonData: PlayerComparisonData;
  loading?: boolean;
}

/**
 * Enhanced component to display side-by-side comparison of two players with additional visualizations
 */
const EnhancedPlayerComparison: React.FC<EnhancedPlayerComparisonProps> = ({
  comparisonData,
  loading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'offensive' | 'defensive' | 'overall'>(
    'offensive'
  );
  const [showRadarChart, setShowRadarChart] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme() ?? 'light';

  // Define colors based on the color scheme
  const borderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  const positiveColor = colorScheme === 'light' ? '#34C759' : '#30D158';
  const negativeColor = colorScheme === 'light' ? '#FF3B30' : '#FF453A';
  const player1Color = '#0a7ea4';
  const player2Color = '#FF9500';

  // Chart background and grid colors
  const chartBackgroundColor = colorScheme === 'light' ? '#fff' : '#1c1c1e';
  const chartGridColor = colorScheme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  // Screen width for chart
  const screenWidth = Dimensions.get('window').width - 40; // Accounting for padding

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
    barPercentage: 0.7,
  };

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

  // Get metrics for the selected category
  const getCategoryMetrics = () => {
    switch (selectedCategory) {
      case 'offensive':
        return [
          {
            label: 'True Shooting %',
            value1: comparisonData.player1.trueShootingPercentage || 0,
            value2: comparisonData.player2.trueShootingPercentage || 0,
            formatter: formatPercentage,
            higherIsBetter: true,
          },
          {
            label: 'Effective FG%',
            value1: comparisonData.player1.effectiveFieldGoalPercentage || 0,
            value2: comparisonData.player2.effectiveFieldGoalPercentage || 0,
            formatter: formatPercentage,
            higherIsBetter: true,
          },
          {
            label: 'Offensive Rating',
            value1: comparisonData.player1.offensiveRating || 0,
            value2: comparisonData.player2.offensiveRating || 0,
            formatter: formatRating,
            higherIsBetter: true,
          },
          {
            label: 'Usage Rate',
            value1: comparisonData.player1.usageRate || 0,
            value2: comparisonData.player2.usageRate || 0,
            formatter: (value?: number) => formatPercentage(value ? value / 100 : undefined),
            higherIsBetter: true,
          },
        ];
      case 'defensive':
        return [
          {
            label: 'Defensive Rating',
            value1: comparisonData.player1.defensiveRating || 0,
            value2: comparisonData.player2.defensiveRating || 0,
            formatter: formatRating,
            higherIsBetter: false,
          },
          {
            label: 'Steal %',
            value1: comparisonData.player1.stealPercentage || 0,
            value2: comparisonData.player2.stealPercentage || 0,
            formatter: (value?: number) => formatPercentage(value ? value / 100 : undefined),
            higherIsBetter: true,
          },
          {
            label: 'Block %',
            value1: comparisonData.player1.blockPercentage || 0,
            value2: comparisonData.player2.blockPercentage || 0,
            formatter: (value?: number) => formatPercentage(value ? value / 100 : undefined),
            higherIsBetter: true,
          },
          {
            label: 'Defensive Rebound %',
            value1: comparisonData.player1.defensiveReboundPercentage || 0,
            value2: comparisonData.player2.defensiveReboundPercentage || 0,
            formatter: (value?: number) => formatPercentage(value ? value / 100 : undefined),
            higherIsBetter: true,
          },
        ];
      case 'overall':
        return [
          {
            label: 'PER',
            value1: comparisonData.player1.playerEfficiencyRating || 0,
            value2: comparisonData.player2.playerEfficiencyRating || 0,
            formatter: formatRating,
            higherIsBetter: true,
          },
          {
            label: 'VORP',
            value1: comparisonData.player1.valueOverReplacement || 0,
            value2: comparisonData.player2.valueOverReplacement || 0,
            formatter: formatRating,
            higherIsBetter: true,
          },
          {
            label: 'Win Shares',
            value1: comparisonData.player1.winShares || 0,
            value2: comparisonData.player2.winShares || 0,
            formatter: formatRating,
            higherIsBetter: true,
          },
          {
            label: 'Box +/-',
            value1: comparisonData.player1.boxPlusMinus || 0,
            value2: comparisonData.player2.boxPlusMinus || 0,
            formatter: formatRating,
            higherIsBetter: true,
          },
        ];
      default:
        return [];
    }
  };

  // Prepare bar chart data
  const getBarChartData = () => {
    const metrics = getCategoryMetrics();

    return {
      labels: metrics.map(m => m.label),
      datasets: [
        {
          data: metrics.map(m => {
            // Normalize values for better visualization
            const max = Math.max(m.value1, m.value2);
            return max === 0 ? 0 : (m.value1 / max) * 100;
          }),
          color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: metrics.map(m => {
            // Normalize values for better visualization
            const max = Math.max(m.value1, m.value2);
            return max === 0 ? 0 : (m.value2 / max) * 100;
          }),
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: [comparisonData.player1.playerName, comparisonData.player2.playerName],
    };
  };

  // Determine which player has the advantage in the selected category
  const getAdvantageAnalysis = () => {
    const metrics = getCategoryMetrics();
    let player1Wins = 0;
    let player2Wins = 0;

    metrics.forEach(metric => {
      if (metric.higherIsBetter) {
        if (metric.value1 > metric.value2) player1Wins++;
        else if (metric.value2 > metric.value1) player2Wins++;
      } else {
        if (metric.value1 < metric.value2) player1Wins++;
        else if (metric.value2 < metric.value1) player2Wins++;
      }
    });

    if (player1Wins > player2Wins) {
      return {
        player: comparisonData.player1.playerName,
        advantage: player1Wins - player2Wins,
        total: metrics.length,
        color: player1Color,
      };
    } else if (player2Wins > player1Wins) {
      return {
        player: comparisonData.player2.playerName,
        advantage: player2Wins - player1Wins,
        total: metrics.length,
        color: player2Color,
      };
    } else {
      return null; // Even match
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor, borderColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading comparison data...</ThemedText>
        </View>
      </View>
    );
  }

  const advantage = getAdvantageAnalysis();

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      {/* Original Player Comparison View */}
      <PlayerComparisonView
        player1={{
          id: comparisonData.player1.playerId,
          name: comparisonData.player1.playerName,
          team: comparisonData.player1.team,
          position: 'Forward', // Default position since it's not in the metrics
          jerseyNumber: '0', // Default jersey number since it's not in the metrics
          stats: {
            // Use recent game averages for basic stats if available
            points: comparisonData.player1.recentGamesAverages?.points?.[0] || 0,
            rebounds: comparisonData.player1.recentGamesAverages?.rebounds?.[0] || 0,
            assists: comparisonData.player1.recentGamesAverages?.assists?.[0] || 0,
            steals: comparisonData.player1.recentGamesAverages?.steals?.[0] || 0,
            blocks: comparisonData.player1.recentGamesAverages?.blocks?.[0] || 0,
            turnovers: 0, // Not available in the metrics
            fieldGoalPercentage:
              (comparisonData.player1.recentGamesAverages?.fieldGoalPercentage?.[0] || 0) * 100,
            threePointPercentage: 0, // Not available in the metrics
            freeThrowPercentage: 0, // Not available in the metrics
            plusMinus: comparisonData.player1.boxPlusMinus || 0,
            // Advanced metrics
            trueShootingPercentage: comparisonData.player1.trueShootingPercentage,
            effectiveFieldGoalPercentage: comparisonData.player1.effectiveFieldGoalPercentage,
            usageRate: comparisonData.player1.usageRate,
            playerEfficiencyRating: comparisonData.player1.playerEfficiencyRating,
            offensiveRating: comparisonData.player1.offensiveRating,
            defensiveRating: comparisonData.player1.defensiveRating,
          },
        }}
        player2={{
          id: comparisonData.player2.playerId,
          name: comparisonData.player2.playerName,
          team: comparisonData.player2.team,
          position: 'Forward', // Default position since it's not in the metrics
          jerseyNumber: '0', // Default jersey number since it's not in the metrics
          stats: {
            // Use recent game averages for basic stats if available
            points: comparisonData.player2.recentGamesAverages?.points?.[0] || 0,
            rebounds: comparisonData.player2.recentGamesAverages?.rebounds?.[0] || 0,
            assists: comparisonData.player2.recentGamesAverages?.assists?.[0] || 0,
            steals: comparisonData.player2.recentGamesAverages?.steals?.[0] || 0,
            blocks: comparisonData.player2.recentGamesAverages?.blocks?.[0] || 0,
            turnovers: 0, // Not available in the metrics
            fieldGoalPercentage:
              (comparisonData.player2.recentGamesAverages?.fieldGoalPercentage?.[0] || 0) * 100,
            threePointPercentage: 0, // Not available in the metrics
            freeThrowPercentage: 0, // Not available in the metrics
            plusMinus: comparisonData.player2.boxPlusMinus || 0,
            // Advanced metrics
            trueShootingPercentage: comparisonData.player2.trueShootingPercentage,
            effectiveFieldGoalPercentage: comparisonData.player2.effectiveFieldGoalPercentage,
            usageRate: comparisonData.player2.usageRate,
            playerEfficiencyRating: comparisonData.player2.playerEfficiencyRating,
            offensiveRating: comparisonData.player2.offensiveRating,
            defensiveRating: comparisonData.player2.defensiveRating,
          },
        }}
        gameId={comparisonData.player1.gameId || 'current'}
        userId="current"
      />

      {/* Enhanced Visualization Section */}
      <View style={styles.enhancedSection}>
        <ThemedText style={styles.enhancedTitle}>Enhanced Comparison</ThemedText>

        {/* Category Selection */}
        <View style={styles.categorySelection}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'offensive' && { backgroundColor: player1Color },
            ]}
            onPress={() => setSelectedCategory('offensive')}
          >
            <ThemedText
              style={[
                styles.categoryButtonText,
                selectedCategory === 'offensive' && { color: 'white' },
              ]}
            >
              Offensive
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'defensive' && { backgroundColor: player1Color },
            ]}
            onPress={() => setSelectedCategory('defensive')}
          >
            <ThemedText
              style={[
                styles.categoryButtonText,
                selectedCategory === 'defensive' && { color: 'white' },
              ]}
            >
              Defensive
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'overall' && { backgroundColor: player1Color },
            ]}
            onPress={() => setSelectedCategory('overall')}
          >
            <ThemedText
              style={[
                styles.categoryButtonText,
                selectedCategory === 'overall' && { color: 'white' },
              ]}
            >
              Overall
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Bar Chart Visualization */}
        <View style={styles.chartContainer}>
          <BarChart
            data={getBarChartData()}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
            showValuesOnTopOfBars={false}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Advantage Analysis */}
        <View style={styles.advantageContainer}>
          <ThemedText style={styles.advantageTitle}>
            {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Advantage
          </ThemedText>

          {advantage ? (
            <View style={styles.advantageContent}>
              <Ionicons name="trophy" size={24} color={advantage.color} />
              <ThemedText style={[styles.advantageText, { color: advantage.color }]}>
                {advantage.player} has the edge in {advantage.advantage} of {advantage.total}{' '}
                metrics
              </ThemedText>
            </View>
          ) : (
            <View style={styles.advantageContent}>
              <Ionicons name="scale" size={24} color={textColor} />
              <ThemedText style={styles.advantageText}>
                Even match in {selectedCategory} metrics
              </ThemedText>
            </View>
          )}
        </View>

        {/* Detailed Metrics Comparison */}
        <View style={styles.detailedMetricsContainer}>
          <ThemedText style={styles.detailedMetricsTitle}>Detailed Comparison</ThemedText>

          <View style={styles.metricsTable}>
            <View style={styles.tableHeader}>
              <ThemedText style={[styles.tableHeaderText, { flex: 2 }]}>Metric</ThemedText>
              <ThemedText
                style={[
                  styles.tableHeaderText,
                  { flex: 1, textAlign: 'center', color: player1Color },
                ]}
              >
                {comparisonData.player1.playerName.split(' ')[0]}
              </ThemedText>
              <ThemedText
                style={[
                  styles.tableHeaderText,
                  { flex: 1, textAlign: 'center', color: player2Color },
                ]}
              >
                {comparisonData.player2.playerName.split(' ')[0]}
              </ThemedText>
              <ThemedText style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>
                Diff
              </ThemedText>
            </View>

            {getCategoryMetrics().map((metric, index) => {
              const diff = metric.higherIsBetter
                ? metric.value1 - metric.value2
                : metric.value2 - metric.value1;

              const diffColor =
                diff > 0
                  ? metric.higherIsBetter
                    ? positiveColor
                    : negativeColor
                  : diff < 0
                    ? metric.higherIsBetter
                      ? negativeColor
                      : positiveColor
                    : textColor;

              const formattedDiff =
                diff === 0 ? '-' : (diff > 0 ? '+' : '') + metric.formatter(Math.abs(diff));

              return (
                <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                  <ThemedText style={[styles.tableCell, { flex: 2 }]}>{metric.label}</ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      {
                        flex: 1,
                        textAlign: 'center',
                        color: metric.higherIsBetter
                          ? metric.value1 > metric.value2
                            ? positiveColor
                            : textColor
                          : metric.value1 < metric.value2
                            ? positiveColor
                            : textColor,
                      },
                    ]}
                  >
                    {metric.formatter(metric.value1)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      {
                        flex: 1,
                        textAlign: 'center',
                        color: metric.higherIsBetter
                          ? metric.value2 > metric.value1
                            ? positiveColor
                            : textColor
                          : metric.value2 < metric.value1
                            ? positiveColor
                            : textColor,
                      },
                    ]}
                  >
                    {metric.formatter(metric.value2)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.tableCell,
                      {
                        flex: 1,
                        textAlign: 'center',
                        color: diffColor,
                      },
                    ]}
                  >
                    {formattedDiff}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  enhancedSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  enhancedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  categorySelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 0,
  },
  advantageContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  advantageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advantageText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  detailedMetricsContainer: {
    marginVertical: 16,
  },
  detailedMetricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsTable: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  tableCell: {
    fontSize: 14,
  },
});

export default EnhancedPlayerComparison;
