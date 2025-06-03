import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';

import BettingAnalyticsChart from './BettingAnalyticsChart';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import {
  bettingAnalyticsService,
  AnalyticsSummary,
  TimePeriodFilter,
  BetResult,
  BetType,
} from '../services/bettingAnalyticsService';

interface WageringAnalyticsProps {
  onRefresh?: () => void;
}

/**
 * Component that displays wagering analytics for the user
 */
const WageringAnalytics: React.FC<WageringAnalyticsProps> = ({ onRefresh }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodFilter['period']>('month');
  const [selectedChartType, setSelectedChartType] = useState<'profit' | 'betTypes' | 'winRate'>(
    'profit'
  );
  const [showCharts, setShowCharts] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  /**
   * Load analytics data
   */
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const timePeriod: TimePeriodFilter = { period: selectedPeriod };
      const analyticsData = await bettingAnalyticsService.getAnalyticsSummary(timePeriod);

      setAnalytics(analyticsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load betting analytics. Please try again later.');
      setLoading(false);
    }
  };

  /**
   * Handle refresh button press
   */
  const handleRefresh = () => {
    loadAnalytics();
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Handle period selection
   */
  const handlePeriodChange = (period: TimePeriodFilter['period']) => {
    setSelectedPeriod(period);
  };

  /**
   * Handle chart type selection
   */
  const handleChartTypeChange = (type: 'profit' | 'betTypes' | 'winRate') => {
    setSelectedChartType(type);
  };

  /**
   * Toggle charts visibility
   */
  const toggleCharts = () => {
    setShowCharts(!showCharts);
  };

  /**
   * Share analytics summary
   */
  const shareAnalytics = async () => {
    if (!analytics) return;

    try {
      const message = `
My Betting Analytics Summary:

Total Bets: ${analytics.totalBets}
Win Rate: ${formatPercentage(analytics.winRate)}
Total Wagered: ${formatCurrency(analytics.totalWagered)}
Total Winnings: ${formatCurrency(analytics.totalWinnings)}
Net Profit: ${formatCurrency(analytics.netProfit)}
ROI: ${formatPercentage(analytics.roi)}

Current Streak: ${analytics.streaks.currentStreak.count} ${analytics.streaks.currentStreak.type}(s)
Longest Win Streak: ${analytics.streaks.longestWinStreak}
Longest Loss Streak: ${analytics.streaks.longestLossStreak}

Shared from AI Sports Edge
      `;

      await Share.share({
        message,
        title: 'My Betting Analytics',
      });
    } catch (error) {
      console.error('Error sharing analytics:', error);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4080ff" />
        <ThemedText style={styles.loadingText}>Loading your betting analytics...</ThemedText>
      </ThemedView>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <ThemedText style={styles.refreshButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  /**
   * Render empty state
   */
  if (!analytics || analytics.totalBets === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color="#999" />
        <ThemedText style={styles.emptyTitle}>No Betting Data</ThemedText>
        <ThemedText style={styles.emptyText}>
          You haven't placed any bets yet. Start betting to see your analytics here.
        </ThemedText>
      </ThemedView>
    );
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  /**
   * Get color based on value (positive/negative)
   */
  const getValueColor = (value: number): string => {
    return value >= 0 ? '#4caf50' : '#f44336';
  };

  /**
   * Get icon for bet result
   */
  const getBetResultIcon = (result: BetResult): React.ReactNode => {
    switch (result) {
      case BetResult.WIN:
        return <Ionicons name="checkmark-circle" size={16} color="#4caf50" />;
      case BetResult.LOSS:
        return <Ionicons name="close-circle" size={16} color="#f44336" />;
      case BetResult.PUSH:
        return <Ionicons name="remove-circle" size={16} color="#ff9800" />;
      case BetResult.VOID:
        return <Ionicons name="ban" size={16} color="#9e9e9e" />;
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Betting Analytics</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleCharts}>
            <Ionicons
              name={showCharts ? 'stats-chart' : 'stats-chart-outline'}
              size={24}
              color="#4080ff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={shareAnalytics}>
            <Ionicons name="share-outline" size={24} color="#4080ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#4080ff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time period selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.selectedPeriodButton]}
          onPress={() => handlePeriodChange('week')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.selectedPeriodButtonText,
            ]}
          >
            Week
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriodButton]}
          onPress={() => handlePeriodChange('month')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.selectedPeriodButtonText,
            ]}
          >
            Month
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriodButton]}
          onPress={() => handlePeriodChange('year')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              selectedPeriod === 'year' && styles.selectedPeriodButtonText,
            ]}
          >
            Year
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'all' && styles.selectedPeriodButton]}
          onPress={() => handlePeriodChange('all')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              selectedPeriod === 'all' && styles.selectedPeriodButtonText,
            ]}
          >
            All Time
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Charts Section */}
        {showCharts && (
          <View style={styles.chartSection}>
            <View style={styles.chartTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  selectedChartType === 'profit' && styles.selectedChartTypeButton,
                ]}
                onPress={() => handleChartTypeChange('profit')}
              >
                <ThemedText
                  style={[
                    styles.chartTypeButtonText,
                    selectedChartType === 'profit' && styles.selectedChartTypeButtonText,
                  ]}
                >
                  Profit
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  selectedChartType === 'betTypes' && styles.selectedChartTypeButton,
                ]}
                onPress={() => handleChartTypeChange('betTypes')}
              >
                <ThemedText
                  style={[
                    styles.chartTypeButtonText,
                    selectedChartType === 'betTypes' && styles.selectedChartTypeButtonText,
                  ]}
                >
                  Bet Types
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  selectedChartType === 'winRate' && styles.selectedChartTypeButton,
                ]}
                onPress={() => handleChartTypeChange('winRate')}
              >
                <ThemedText
                  style={[
                    styles.chartTypeButtonText,
                    selectedChartType === 'winRate' && styles.selectedChartTypeButtonText,
                  ]}
                >
                  Win Rate
                </ThemedText>
              </TouchableOpacity>
            </View>

            <BettingAnalyticsChart data={analytics} chartType={selectedChartType} />
          </View>
        )}

        {/* Summary Card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Summary</ThemedText>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Bets</ThemedText>
              <ThemedText style={styles.summaryValue}>{analytics.totalBets}</ThemedText>
            </View>

            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Win Rate</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatPercentage(analytics.winRate)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Wagered</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(analytics.totalWagered)}
              </ThemedText>
            </View>

            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Total Winnings</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {formatCurrency(analytics.totalWinnings)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.profitContainer}>
            <ThemedText style={styles.profitLabel}>Net Profit</ThemedText>
            <ThemedText style={[styles.profitValue, { color: getValueColor(analytics.netProfit) }]}>
              {formatCurrency(analytics.netProfit)}
            </ThemedText>
          </View>

          <View style={styles.roiContainer}>
            <ThemedText style={styles.roiLabel}>ROI</ThemedText>
            <ThemedText style={[styles.roiValue, { color: getValueColor(analytics.roi) }]}>
              {formatPercentage(analytics.roi)}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Recent Form Card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Recent Form</ThemedText>

          <View style={styles.recentFormContainer}>
            {analytics.recentForm.length > 0 ? (
              <View style={styles.recentFormRow}>
                {analytics.recentForm.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.resultBadge,
                      result === BetResult.WIN && styles.winBadge,
                      result === BetResult.LOSS && styles.lossBadge,
                      result === BetResult.PUSH && styles.pushBadge,
                      result === BetResult.VOID && styles.voidBadge,
                    ]}
                  >
                    <ThemedText style={styles.resultText}>
                      {result === BetResult.WIN
                        ? 'W'
                        : result === BetResult.LOSS
                          ? 'L'
                          : result === BetResult.PUSH
                            ? 'P'
                            : 'V'}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.noDataText}>No recent bets</ThemedText>
            )}
          </View>

          <View style={styles.streakContainer}>
            <ThemedText style={styles.streakLabel}>Current Streak:</ThemedText>
            <View style={styles.streakValue}>
              {getBetResultIcon(analytics.streaks.currentStreak.type)}
              <ThemedText style={styles.streakText}>
                {analytics.streaks.currentStreak.count} {analytics.streaks.currentStreak.type}
                {analytics.streaks.currentStreak.count !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>

          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <ThemedText style={styles.streakItemLabel}>Longest Win Streak:</ThemedText>
              <ThemedText style={styles.streakItemValue}>
                {analytics.streaks.longestWinStreak}
              </ThemedText>
            </View>

            <View style={styles.streakItem}>
              <ThemedText style={styles.streakItemLabel}>Longest Loss Streak:</ThemedText>
              <ThemedText style={styles.streakItemValue}>
                {analytics.streaks.longestLossStreak}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Bet Type Breakdown Card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Bet Type Breakdown</ThemedText>

          {Object.entries(analytics.betTypeBreakdown).length > 0 ? (
            Object.entries(analytics.betTypeBreakdown).map(([betType, data]) => (
              <View key={betType} style={styles.betTypeRow}>
                <View style={styles.betTypeInfo}>
                  <ThemedText style={styles.betTypeName}>
                    {betType.charAt(0).toUpperCase() + betType.slice(1)}
                  </ThemedText>
                  <ThemedText style={styles.betTypeCount}>
                    {data.count} bet{data.count !== 1 ? 's' : ''}
                  </ThemedText>
                </View>

                <View style={styles.betTypeStats}>
                  <ThemedText style={styles.betTypeWinRate}>
                    {formatPercentage(data.winRate)}
                  </ThemedText>
                  <ThemedText style={[styles.betTypeProfit, { color: getValueColor(data.profit) }]}>
                    {formatCurrency(data.profit)}
                  </ThemedText>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noDataText}>No bet type data available</ThemedText>
          )}
        </ThemedView>

        {/* Most Bet Card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Most Bet</ThemedText>

          <View style={styles.mostBetRow}>
            <View style={styles.mostBetItem}>
              <ThemedText style={styles.mostBetLabel}>Sport</ThemedText>
              {analytics.mostBetSport ? (
                <>
                  <ThemedText style={styles.mostBetValue}>
                    {analytics.mostBetSport.sport}
                  </ThemedText>
                  <ThemedText style={styles.mostBetCount}>
                    {analytics.mostBetSport.count} bet
                    {analytics.mostBetSport.count !== 1 ? 's' : ''}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data</ThemedText>
              )}
            </View>

            <View style={styles.mostBetItem}>
              <ThemedText style={styles.mostBetLabel}>Team</ThemedText>
              {analytics.mostBetTeam ? (
                <>
                  <ThemedText style={styles.mostBetValue}>
                    {analytics.mostBetTeam.teamName}
                  </ThemedText>
                  <ThemedText style={styles.mostBetCount}>
                    {analytics.mostBetTeam.count} bet{analytics.mostBetTeam.count !== 1 ? 's' : ''}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data</ThemedText>
              )}
            </View>
          </View>
        </ThemedView>

        {/* Best and Worst Bets Card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Best & Worst Bets</ThemedText>

          <View style={styles.bestWorstRow}>
            <View style={styles.bestWorstItem}>
              <ThemedText style={styles.bestWorstLabel}>Best Bet</ThemedText>
              {analytics.bestBet ? (
                <>
                  <ThemedText style={styles.bestWorstTeam}>{analytics.bestBet.teamName}</ThemedText>
                  <ThemedText style={styles.bestWorstAmount}>
                    {formatCurrency(analytics.bestBet.amount)}
                  </ThemedText>
                  <ThemedText style={[styles.bestWorstProfit, { color: '#4caf50' }]}>
                    +
                    {formatCurrency(
                      (analytics.bestBet.potentialWinnings || 0) - analytics.bestBet.amount
                    )}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data</ThemedText>
              )}
            </View>

            <View style={styles.bestWorstItem}>
              <ThemedText style={styles.bestWorstLabel}>Worst Bet</ThemedText>
              {analytics.worstBet ? (
                <>
                  <ThemedText style={styles.bestWorstTeam}>
                    {analytics.worstBet.teamName}
                  </ThemedText>
                  <ThemedText style={styles.bestWorstAmount}>
                    {formatCurrency(analytics.worstBet.amount)}
                  </ThemedText>
                  <ThemedText style={[styles.bestWorstProfit, { color: '#f44336' }]}>
                    -{formatCurrency(analytics.worstBet.amount)}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data</ThemedText>
              )}
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  selectedPeriodButton: {
    backgroundColor: '#4080ff',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPeriodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  profitLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roiContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roiLabel: {
    fontSize: 14,
    color: '#666',
  },
  roiValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentFormContainer: {
    marginBottom: 16,
  },
  recentFormRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  winBadge: {
    backgroundColor: '#4caf50',
  },
  lossBadge: {
    backgroundColor: '#f44336',
  },
  pushBadge: {
    backgroundColor: '#ff9800',
  },
  voidBadge: {
    backgroundColor: '#9e9e9e',
  },
  resultText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakItem: {
    flex: 1,
  },
  streakItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  streakItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  betTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  betTypeInfo: {
    flex: 1,
  },
  betTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  betTypeCount: {
    fontSize: 14,
    color: '#666',
  },
  betTypeStats: {
    alignItems: 'flex-end',
  },
  betTypeWinRate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  betTypeProfit: {
    fontSize: 14,
  },
  mostBetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mostBetItem: {
    flex: 1,
    padding: 8,
  },
  mostBetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mostBetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mostBetCount: {
    fontSize: 14,
    color: '#666',
  },
  bestWorstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bestWorstItem: {
    flex: 1,
    padding: 8,
  },
  bestWorstLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bestWorstTeam: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bestWorstAmount: {
    fontSize: 14,
    color: '#666',
  },
  bestWorstProfit: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4080ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 300,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  chartSection: {
    marginBottom: 16,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedChartTypeButton: {
    backgroundColor: '#4080ff',
  },
  chartTypeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedChartTypeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WageringAnalytics;
