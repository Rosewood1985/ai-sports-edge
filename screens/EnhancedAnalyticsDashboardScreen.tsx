/**
 * Enhanced Analytics Dashboard Screen
 * 
 * A comprehensive dashboard for monitoring sports betting performance metrics
 * with advanced visualizations, interactive filters, and real-time updates.
 */

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  RefreshControl,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import Colors from '../constants/Colors';
import { analyticsService } from '../services/analyticsService';
import { DateRangeSelector, HeatMapChart, BubbleChart, HistoricalTrendsChart } from '../components/ui';
import SEOMetadata from '../components/SEOMetadata';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import ChartTransition from '../components/ChartTransition';
import TabTransition from '../components/TabTransition';

// Define TIME_PERIODS directly in this file
const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
};

// Get screen dimensions
const { width } = Dimensions.get('window');

// Loading fallback component for lazy-loaded charts
const ChartLoadingFallback = () => {
  const { t } = useI18n();
  return (
    <ThemedView style={[styles.chartCard, { height: 220, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={Colors.neon.blue} />
      <ThemedText style={{ marginTop: 10 }}>{t('dashboard.labels.loading')}</ThemedText>
    </ThemedView>
  );
};

/**
 * Enhanced Analytics Dashboard Screen component
 */
const EnhancedAnalyticsDashboardScreen: React.FC = () => {
  // Get translation function
  const { t } = useI18n();
  
  // State
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.LAST_7_DAYS);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showRealTimeUpdates, setShowRealTimeUpdates] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{start: Date, end: Date} | null>(null);
  
  // Get theme colors
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? '#121212' : '#F8F8F8';
  const cardBackgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates if enabled
    let intervalId: number;
    if (showRealTimeUpdates) {
      intervalId = setInterval(() => {
        loadDashboardData(false);
      }, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedPeriod, showRealTimeUpdates, customDateRange]);
  
  // Load dashboard data
  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      // Use mock service for development
      const data = await analyticsService.getDashboardData(selectedPeriod, customDateRange || undefined);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, [selectedPeriod, customDateRange]);
  
  // Handle period selection
  const handlePeriodSelect = (period: string) => {
    // Provide haptic feedback on selection
    Haptics.selectionAsync();
    setSelectedPeriod(period);
    
    // Clear custom date range if not selecting custom
    if (period !== TIME_PERIODS.CUSTOM) {
      setCustomDateRange(null);
    }
  };
  
  // Handle custom date range selection
  const handleCustomDateRange = (start: Date, end: Date) => {
    setCustomDateRange({ start, end });
    setSelectedPeriod(TIME_PERIODS.CUSTOM);
  };
  
  // Handle tab selection
  const handleTabSelect = (tab: string) => {
    // Provide haptic feedback on tab change
    Haptics.selectionAsync();
    setActiveTab(tab);
  };
  
  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setShowRealTimeUpdates(!showRealTimeUpdates);
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (!dashboardData) return null;

    return (
      <View>
        <View style={styles.metricsRow}>
          <ChartTransition index={0} delay={100} style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="cash" size={24} color={Colors.neon.green} />
                <ThemedText style={styles.metricTitle}>Total Revenue</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.green }]}>
                ${dashboardData.revenue.total_revenue.toFixed(2)}
              </ThemedText>
            </ThemedView>
          </ChartTransition>
          
          <ChartTransition index={1} delay={100} style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={24} color={Colors.neon.blue} />
                <ThemedText style={styles.metricTitle}>Win Rate</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.blue }]}>
                {dashboardData.betting_performance.win_rate.toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </ChartTransition>
        </View>
        
        <View style={styles.metricsRow}>
          <ChartTransition index={2} delay={100} style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="people" size={24} color={Colors.neon.purple} />
                <ThemedText style={styles.metricTitle}>Active Users</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.purple }]}>
                {dashboardData.user_engagement.daily_active_users.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </ChartTransition>
          
          <ChartTransition index={3} delay={100} style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trophy" size={24} color={Colors.neon.orange} />
                <ThemedText style={styles.metricTitle}>ROI</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.orange }]}>
                {dashboardData.betting_performance.roi.toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </ChartTransition>
        </View>
        
        <ChartTransition index={0}>
          <ThemedView style={styles.chartCard}>
            <ThemedText style={styles.chartTitle}>Revenue Trend</ThemedText>
            <LineChart
              data={{
                labels: Object.keys(dashboardData.revenue.daily_data).map(date => {
                  const parts = date.split('-');
                  return `${parts[1]}/${parts[2]}`;
                }),
                datasets: [
                  {
                    data: Object.values(dashboardData.revenue.daily_data),
                  },
                ],
              }}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
                backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: Colors.neon.blue,
                },
              }}
              bezier
              style={styles.chart}
            />
          </ThemedView>
        </ChartTransition>
        
        <ChartTransition index={1}>
          <HeatMapChart
            data={dashboardData.betting_performance.heat_map_data}
            title="Betting Activity"
            chartColor={Colors.neon.green}
          />
        </ChartTransition>
        
        <ChartTransition index={2}>
          <ThemedView style={styles.chartCard}>
            <ThemedText style={styles.chartTitle}>Performance by Sport</ThemedText>
            <BarChart
              data={{
                labels: Object.keys(dashboardData.betting_performance.by_sport).map(sport => sport),
                datasets: [
                  {
                    data: Object.values(dashboardData.betting_performance.by_sport).map(sport => (sport as any).win_rate),
                  },
                ],
              }}
              width={width - 64}
              height={220}
              chartConfig={{
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
                backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(157, 0, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix="%"
            />
          </ThemedView>
        </ChartTransition>
      </View>
    );
  };

  // Render betting tab
  const renderBettingTab = () => {
    if (!dashboardData || !dashboardData.betting_performance) return null;
    
    const { betting_performance } = dashboardData;
    
    // Prepare data for win rate by sport chart
    const sportWinRateData = {
      labels: Object.keys(betting_performance.by_sport),
      datasets: [
        {
          data: Object.values(betting_performance.by_sport).map(sport => (sport as any).win_rate),
          color: (opacity = 1) => `rgba(0, 255, 127, ${opacity})`,
        },
      ],
    };
    
    // Prepare data for profit by bet type chart
    const betTypeProfitData = {
      labels: Object.keys(betting_performance.by_bet_type),
      datasets: [
        {
          data: Object.values(betting_performance.by_bet_type).map(type => (type as any).profit),
          color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
        },
      ],
    };
    
    // Prepare data for monthly performance chart
    const monthlyPerformanceData = {
      labels: Object.keys(betting_performance.monthly_performance).map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year.substring(2)}`;
      }),
      datasets: [
        {
          data: Object.values(betting_performance.monthly_performance).map(month => (month as any).profit),
        },
      ],
    };
    
    // Prepare data for results distribution pie chart
    const resultsDistributionData = [
      {
        name: 'Wins',
        value: betting_performance.winning_bets,
        color: Colors.neon.green,
        legendFontColor: isDark ? '#FFFFFF' : '#000000',
        legendFontSize: 12,
      },
      {
        name: 'Losses',
        value: betting_performance.losing_bets,
        color: Colors.neon.pink,
        legendFontColor: isDark ? '#FFFFFF' : '#000000',
        legendFontSize: 12,
      },
      {
        name: 'Pushes',
        value: betting_performance.push_bets,
        color: Colors.neon.orange,
        legendFontColor: isDark ? '#FFFFFF' : '#000000',
        legendFontSize: 12,
      },
    ];
    
    return (
      <View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="stats-chart" size={24} color={Colors.neon.green} />
                <ThemedText style={styles.metricTitle}>Win Rate</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.green }]}>
                {betting_performance.win_rate.toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="cash" size={24} color={Colors.neon.blue} />
                <ThemedText style={styles.metricTitle}>Total Profit</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.blue }]}>
                ${betting_performance.profit.toFixed(2)}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={24} color={Colors.neon.orange} />
                <ThemedText style={styles.metricTitle}>ROI</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.orange }]}>
                {betting_performance.roi.toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="flame" size={24} color={Colors.neon.purple} />
                <ThemedText style={styles.metricTitle}>Current Streak</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.purple }]}>
                {betting_performance.streak_data.current_streak}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Results Distribution</ThemedText>
          <PieChart
            data={resultsDistributionData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </ThemedView>
        
        <Suspense fallback={<ChartLoadingFallback />}>
          <HistoricalTrendsChart
            title="Monthly Performance"
            series={[
              {
                label: 'Profit',
                data: Object.values(betting_performance.monthly_performance).map(month => (month as any).profit),
                color: Colors.neon.green,
              },
              {
                label: 'Win Rate',
                data: Object.values(betting_performance.monthly_performance).map(month => (month as any).win_rate),
                color: Colors.neon.blue,
              },
            ]}
            labels={Object.keys(betting_performance.monthly_performance).map(month => {
              const [year, monthNum] = month.split('-');
              return `${monthNum}/${year.substring(2)}`;
            })}
            yAxisPrefix="$"
          />
        </Suspense>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Win Rate by Sport</ThemedText>
          <BarChart
            data={sportWinRateData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 255, 127, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix="%"
          />
        </ThemedView>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Profit by Bet Type</ThemedText>
          <BarChart
            data={betTypeProfitData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel="$"
            yAxisSuffix=""
          />
        </ThemedView>
        
        <Suspense fallback={<ChartLoadingFallback />}>
          <HeatMapChart
            data={betting_performance.heat_map_data}
            title="Betting Activity Heatmap"
            chartColor={Colors.neon.purple}
          />
        </Suspense>
      </View>
    );
  };

  // Render engagement tab
  const renderEngagementTab = () => {
    if (!dashboardData || !dashboardData.user_engagement) return null;
    
    const { user_engagement } = dashboardData;
    
    // Prepare data for platform distribution pie chart
    const platformDistributionData = Object.entries(user_engagement.by_platform).map(([platform, count], index) => ({
      name: platform,
      value: count,
      color: [Colors.neon.blue, Colors.neon.green, Colors.neon.orange][index % 3],
      legendFontColor: isDark ? '#FFFFFF' : '#000000',
      legendFontSize: 12,
    }));
    
    // Create a consistent color mapping for features
    const featureColorMap: Record<string, string> = {
      'Odds Comparison': Colors.neon.blue,
      'Expert Picks': Colors.neon.green,
      'Live Betting': Colors.neon.orange,
      'Stats & Analysis': Colors.neon.pink,
      'Betting History': Colors.neon.purple,
    };
    
    // Prepare data for feature usage bubble chart
    const featureUsageData = Object.entries(user_engagement.by_feature).map(([feature, count]) => ({
      label: feature,
      value: count as number,
      color: featureColorMap[feature] || Colors.neon.blue, // Fallback to blue if not in map
    }));
    
    // Prepare data for user engagement over time chart
    const engagementOverTimeData = {
      labels: Object.keys(user_engagement.engagement_over_time).map(date => {
        const parts = date.split('-');
        return `${parts[1]}/${parts[2]}`;
      }),
      datasets: [
        {
          data: Object.values(user_engagement.engagement_over_time).map(day => (day as any).users),
          color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
        },
      ],
    };
    
    return (
      <View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="people" size={24} color={Colors.neon.blue} />
                <ThemedText style={styles.metricTitle}>Daily Active Users</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.blue }]}>
                {user_engagement.daily_active_users.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="time" size={24} color={Colors.neon.green} />
                <ThemedText style={styles.metricTitle}>Avg. Session</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.green }]}>
                {user_engagement.average_session_duration.toFixed(1)} min
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="heart" size={24} color={Colors.neon.pink} />
                <ThemedText style={styles.metricTitle}>Retention Rate</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.pink }]}>
                {user_engagement.retention_rate.toFixed(1)}%
              </ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="person-add" size={24} color={Colors.neon.orange} />
                <ThemedText style={styles.metricTitle}>New Users</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.orange }]}>
                {user_engagement.new_users.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>User Engagement Trend</ThemedText>
          <LineChart
            data={engagementOverTimeData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: Colors.neon.blue,
              },
            }}
            bezier
            style={styles.chart}
          />
        </ThemedView>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Platform Distribution</ThemedText>
          <PieChart
            data={platformDistributionData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </ThemedView>
        
        <Suspense fallback={<ChartLoadingFallback />}>
          <BubbleChart
            data={featureUsageData}
            title="Feature Usage"
            maxBubbleSize={100}
            minBubbleSize={30}
          />
        </Suspense>
        
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>User Engagement Stats</ThemedText>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.statsLabel}>Monthly Active Users:</ThemedText>
            <ThemedText style={styles.statsValue}>{user_engagement.monthly_active_users.toLocaleString()}</ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.statsLabel}>Sessions per User:</ThemedText>
            <ThemedText style={styles.statsValue}>{user_engagement.sessions_per_user.toFixed(1)}</ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.statsLabel}>Churn Rate:</ThemedText>
            <ThemedText style={styles.statsValue}>{user_engagement.churn_rate.toFixed(1)}%</ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.statsLabel}>Returning Users:</ThemedText>
            <ThemedText style={styles.statsValue}>{user_engagement.returning_users.toLocaleString()}</ThemedText>
          </View>
        </ThemedView>
      </View>
    );
  };

  // Render revenue tab
  const renderRevenueTab = () => {
    if (!dashboardData || !dashboardData.microtransactions) return null;
    
    const { microtransactions, revenue } = dashboardData;
    
    // Prepare data for revenue by type pie chart
    const revenueByTypeData = Object.entries(microtransactions.by_type).map(([type, data]: [string, any], index) => ({
      name: type,
      value: data.revenue,
      color: [Colors.neon.blue, Colors.neon.pink, Colors.neon.green, Colors.neon.orange, Colors.neon.purple][index % 5],
      legendFontColor: isDark ? '#FFFFFF' : '#000000',
      legendFontSize: 12,
    }));
    
    // Prepare data for revenue trend chart
    const revenueTrendData = {
      labels: Object.keys(revenue.daily_data).map(date => {
        const parts = date.split('-');
        return `${parts[1]}/${parts[2]}`;
      }),
      datasets: [
        {
          data: Object.values(revenue.daily_data).map(value => value as number),
          color: (opacity = 1) => `rgba(255, 0, 170, ${opacity})`,
        },
      ],
    };
    
    return (
      <View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="cash" size={24} color={Colors.neon.pink} />
                <ThemedText style={styles.metricTitle}>Total Revenue</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.pink }]}>
                ${revenue.total_revenue.toFixed(2)}
              </ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.metricCardWrapper}>
            <ThemedView style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="people" size={24} color={Colors.neon.blue} />
                <ThemedText style={styles.metricTitle}>Active Users</ThemedText>
              </View>
              <ThemedText style={[styles.metricValue, { color: Colors.neon.blue }]}>
                {revenue.active_users.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Revenue Trend</ThemedText>
          <LineChart
            data={revenueTrendData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 0, 170, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: Colors.neon.pink,
              },
            }}
            bezier
            style={styles.chart}
            yAxisLabel="$"
            yAxisSuffix=""
          />
        </ThemedView>
        
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.chartTitle}>Revenue by Type</ThemedText>
          <PieChart
            data={revenueByTypeData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
              backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 0, 170, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </ThemedView>
        
        <ThemedText style={styles.sectionTitle}>Microtransaction Performance</ThemedText>
        
        {Object.entries(microtransactions.by_type).map(([type, data]: [string, any]) => (
          <ThemedView key={type} style={styles.microtransactionCard}>
            <ThemedText style={styles.microtransactionTitle}>{type}</ThemedText>
            
            <View style={styles.microtransactionMetrics}>
              <View style={styles.microtransactionMetric}>
                <ThemedText style={styles.microtransactionMetricLabel}>Impressions</ThemedText>
                <ThemedText style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.impressions.toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <ThemedText style={styles.microtransactionMetricLabel}>Clicks</ThemedText>
                <ThemedText style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.clicks.toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <ThemedText style={styles.microtransactionMetricLabel}>Purchases</ThemedText>
                <ThemedText style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.purchases.toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <ThemedText style={styles.microtransactionMetricLabel}>Revenue</ThemedText>
                <ThemedText style={[styles.microtransactionMetricValue, { color: Colors.neon.green }]}>
                  ${data.revenue.toFixed(2)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.microtransactionRates}>
              <View style={styles.microtransactionRate}>
                <ThemedText style={styles.microtransactionRateLabel}>Click Rate</ThemedText>
                <ThemedText style={[styles.microtransactionRateValue, { color: Colors.neon.orange }]}>
                  {data.click_rate.toFixed(1)}%
                </ThemedText>
              </View>
              
              <View style={styles.microtransactionRate}>
                <ThemedText style={styles.microtransactionRateLabel}>Conversion Rate</ThemedText>
                <ThemedText style={[styles.microtransactionRateValue, { color: Colors.neon.orange }]}>
                  {data.conversion_rate.toFixed(1)}%
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        ))}
      </View>
    );
  };
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Colors.neon.blue} />
        <Text style={[styles.loadingText, { color: textColor }]}>{t('dashboard.labels.loadingDashboard')}</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* SEO Metadata for web platforms */}
      <SEOMetadata
        titleKey="dashboard.title"
        descriptionKey="dashboard.description"
        path="/dashboard"
        keywords={['analytics', 'sports betting', 'statistics', 'performance']}
      />
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          {t('dashboard.title')}
        </ThemedText>
        
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboardData()}>
            <Ionicons name="refresh" size={24} color={Colors.neon.blue} />
          </TouchableOpacity>
          
          <View style={styles.realTimeContainer}>
            <ThemedText style={styles.realTimeText}>{t('dashboard.labels.realTimeUpdates')}</ThemedText>
            <Switch
              value={showRealTimeUpdates}
              onValueChange={toggleRealTimeUpdates}
              trackColor={{ false: '#767577', true: `${Colors.neon.blue}50` }}
              thumbColor={showRealTimeUpdates ? Colors.neon.blue : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      <DateRangeSelector
        selectedPeriod={selectedPeriod}
        onSelectPeriod={handlePeriodSelect}
        onSelectCustomRange={handleCustomDateRange}
        customDateRange={customDateRange}
      />
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('overview')}
        >
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === 'overview' ? Colors.neon.blue : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'betting' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('betting')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'betting' ? Colors.neon.green : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'betting' && styles.activeTabText,
            ]}
          >
            Betting
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'engagement' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('engagement')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'engagement' ? Colors.neon.orange : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'engagement' && styles.activeTabText,
            ]}
          >
            Engagement
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'revenue' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('revenue')}
        >
          <Ionicons
            name="cash"
            size={20}
            color={activeTab === 'revenue' ? Colors.neon.pink : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'revenue' && styles.activeTabText,
            ]}
          >
            Revenue
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.neon.blue]}
            tintColor={Colors.neon.blue}
          />
        }
      >
        <TabTransition active={activeTab === 'overview'}>
          {renderOverviewTab()}
        </TabTransition>
        
        <TabTransition active={activeTab === 'betting'}>
          {renderBettingTab()}
        </TabTransition>
        
        <TabTransition active={activeTab === 'engagement'}>
          {renderEngagementTab()}
        </TabTransition>
        
        <TabTransition active={activeTab === 'revenue'}>
          {renderRevenueTab()}
        </TabTransition>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 16,
  },
  realTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realTimeText: {
    fontSize: 12,
    marginRight: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.neon.blue,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: Colors.neon.blue,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Metric card styles
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCardWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  // Chart styles
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  // Section title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  // Microtransaction card styles
  microtransactionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  microtransactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  microtransactionMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  microtransactionMetric: {
    width: '50%',
    marginBottom: 12,
  },
  microtransactionMetricLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  microtransactionMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  microtransactionRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  microtransactionRate: {
    alignItems: 'center',
  },
  microtransactionRateLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  microtransactionRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Stats card styles
  statsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 14,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EnhancedAnalyticsDashboardScreen;
