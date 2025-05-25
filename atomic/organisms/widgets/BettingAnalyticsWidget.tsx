/**
 * Atomic Organism: Betting Analytics Widget
 * Complex analytics widget with comprehensive betting data display
 * Location: /atomic/organisms/widgets/BettingAnalyticsWidget.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bettingAnalyticsService, AnalyticsSummary, TimePeriodFilter, BetResult, BetType } from '../../../services/bettingAnalyticsService';
import { ThemedText } from '../../atoms/ThemedText';
import { ThemedView } from '../../atoms/ThemedView';
import { BettingAnalyticsChart } from '../../molecules/charts';

interface BettingAnalyticsWidgetProps {
  onRefresh?: () => void;
  className?: string;
}

/**
 * Component that displays betting analytics for the user
 */
export const BettingAnalyticsWidget: React.FC<BettingAnalyticsWidgetProps> = ({ 
  onRefresh,
  className = ''
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodFilter['period']>('month');
  const [selectedChartType, setSelectedChartType] = useState<'profit' | 'betTypes' | 'winRate'>('profit');
  const [showCharts, setShowCharts] = useState<boolean>(false);
  
  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);
  
  /**
   * Load analytics data with error handling
   */
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await bettingAnalyticsService.getAnalyticsSummary({
        period: selectedPeriod,
        includeCharts: showCharts
      });
      
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error loading betting analytics:', err);
    } finally {
      setLoading(false);
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
  const handleChartTypeChange = (chartType: 'profit' | 'betTypes' | 'winRate') => {
    setSelectedChartType(chartType);
  };

  /**
   * Toggle charts visibility
   */
  const toggleCharts = () => {
    setShowCharts(prev => !prev);
  };

  /**
   * Share analytics data
   */
  const shareAnalytics = async () => {
    if (!analytics) return;
    
    try {
      const shareData = {
        title: 'My Betting Analytics',
        message: \`Win Rate: \${analytics.winRate}% | ROI: \${analytics.roi}% | Total Bets: \${analytics.totalBets}\`,
      };
      await Share.share(shareData);
    } catch (err) {
      console.error('Error sharing analytics:', err);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { className }]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { className }]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!analytics) {
    return (
      <ThemedView style={[styles.container, { className }]}>
        <ThemedText style={styles.emptyText}>No analytics data available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { className }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Betting Analytics</ThemedText>
          <TouchableOpacity onPress={shareAnalytics}>
            <Ionicons name="share-outline" size={24} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'quarter', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriod
              ]}
              onPress={() => handlePeriodChange(period as TimePeriodFilter['period'])}
            >
              <ThemedText style={[
                styles.periodText,
                selectedPeriod === period && styles.selectedPeriodText
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>Win Rate</ThemedText>
            <ThemedText style={styles.metricValue}>{analytics.winRate?.toFixed(1) ?? 0}%</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>ROI</ThemedText>
            <ThemedText style={[
              styles.metricValue,
              { color: (analytics.roi ?? 0) >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {analytics.roi?.toFixed(1) ?? 0}%
            </ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>Total Bets</ThemedText>
            <ThemedText style={styles.metricValue}>{analytics.totalBets ?? 0}</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>Profit/Loss</ThemedText>
            <ThemedText style={[
              styles.metricValue,
              { color: (analytics.totalProfit ?? 0) >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              ${analytics.totalProfit?.toFixed(2) ?? '0.00'}
            </ThemedText>
          </View>
        </View>

        {/* Charts Toggle */}
        <TouchableOpacity style={styles.chartsToggle} onPress={toggleCharts}>
          <ThemedText style={styles.chartsToggleText}>
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </ThemedText>
          <Ionicons 
            name={showCharts ? 'chevron-up' : 'chevron-down'} 
            size={20} 
          />
        </TouchableOpacity>

        {/* Charts Section */}
        {showCharts && (
          <View style={styles.chartsSection}>
            <View style={styles.chartTypeSelector}>
              {['profit', 'betTypes', 'winRate'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chartTypeButton,
                    selectedChartType === type && styles.selectedChartType
                  ]}
                  onPress={() => handleChartTypeChange(type as any)}
                >
                  <ThemedText style={[
                    styles.chartTypeText,
                    selectedChartType === type && styles.selectedChartTypeText
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <BettingAnalyticsChart
              data={analytics}
              chartType={selectedChartType}
              period={selectedPeriod}
            />
          </View>
        )}

        {/* Recent Bets Summary */}
        <View style={styles.recentBetsSection}>
          <ThemedText style={styles.sectionTitle}>Recent Performance</ThemedText>
          <View style={styles.recentStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Last 7 Days</ThemedText>
              <ThemedText style={styles.statValue}>
                {analytics.recentStats?.last7Days?.winRate?.toFixed(1) ?? 0}% Win Rate
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
              <ThemedText style={styles.statValue}>
                {analytics.streaks?.currentWin ?? 0} wins
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  selectedPeriod: {
    backgroundColor: '#3B82F6',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartsToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 16,
  },
  chartsToggleText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  chartsSection: {
    marginBottom: 20,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  chartTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  selectedChartType: {
    backgroundColor: '#10B981',
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedChartTypeText: {
    color: '#FFFFFF',
  },
  recentBetsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recentStats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});