import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import {  ThemedText  } from '../atomic/atoms/ThemedText';
import {  ThemedView  } from '../atomic/atoms/ThemedView';
import { enhancedAnalyticsService } from '../services/enhancedAnalyticsService';
import {
  AnalyticsTimePeriod,
  UserActivityType,
  UserSegment,
  BetType,
  SportType,
  PlatformType,
  AnalyticsDashboardData
} from '../types/enhancedAnalytics';
import { useTheme } from '../contexts/ThemeContext';
import DateRangeSelector from '../components/DateRangeSelector';

/**
 * Enhanced Analytics Dashboard Screen
 * 
 * This screen provides an admin dashboard for monitoring app usage, popular bets,
 * and user engagement metrics.
 */
const EnhancedAnalyticsDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<AnalyticsTimePeriod>(AnalyticsTimePeriod.LAST_30_DAYS);
  const [customDateRange, setCustomDateRange] = useState<{ startDate: number; endDate: number } | undefined>(undefined);

  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  
  // Colors for the dashboard
  const backgroundColor = colors.background;
  const cardBackgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const cardBorderColor = isDark ? '#333333' : '#E0E0E0';
  const textColor = colors.text;
  const primaryColor = colors.primary;
  const secondaryColor = colors.secondary;
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#00BCD4', '#FF5722', '#607D8B'
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await enhancedAnalyticsService.getDashboardData(selectedTimePeriod, customDateRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading analytics dashboard data:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimePeriod, customDateRange]);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return '$' + formatNumber(Math.round(amount));
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  // Get time period label
  const getTimePeriodLabel = (timePeriod: AnalyticsTimePeriod): string => {
    switch (timePeriod) {
      case AnalyticsTimePeriod.TODAY:
        return 'Today';
      case AnalyticsTimePeriod.YESTERDAY:
        return 'Yesterday';
      case AnalyticsTimePeriod.LAST_7_DAYS:
        return 'Last 7 Days';
      case AnalyticsTimePeriod.LAST_30_DAYS:
        return 'Last 30 Days';
      case AnalyticsTimePeriod.THIS_MONTH:
        return 'This Month';
      case AnalyticsTimePeriod.LAST_MONTH:
        return 'Last Month';
      case AnalyticsTimePeriod.CUSTOM:
        return 'Custom Range';
      default:
        return 'Last 30 Days';
    }
  };

  // Handle time period selection
  const handleTimePeriodSelect = (period: string) => {
    // Map DateRangeSelector TimePeriod to AnalyticsTimePeriod
    switch (period) {
      case 'today':
        setSelectedTimePeriod(AnalyticsTimePeriod.TODAY);
        setCustomDateRange(undefined);
        break;
      case 'yesterday':
        setSelectedTimePeriod(AnalyticsTimePeriod.YESTERDAY);
        setCustomDateRange(undefined);
        break;
      case 'week':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_7_DAYS);
        setCustomDateRange(undefined);
        break;
      case 'month':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_30_DAYS);
        setCustomDateRange(undefined);
        break;
      case 'quarter':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_90_DAYS);
        setCustomDateRange(undefined);
        break;
      case 'this_month':
        setSelectedTimePeriod(AnalyticsTimePeriod.THIS_MONTH);
        setCustomDateRange(undefined);
        break;
      case 'last_month':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_MONTH);
        setCustomDateRange(undefined);
        break;
      case 'last_quarter':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_3_MONTHS);
        setCustomDateRange(undefined);
        break;
      case 'half_year':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_6_MONTHS);
        setCustomDateRange(undefined);
        break;
      case 'ytd':
        setSelectedTimePeriod(AnalyticsTimePeriod.YEAR_TO_DATE);
        setCustomDateRange(undefined);
        break;
      case 'year':
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_YEAR);
        setCustomDateRange(undefined);
        break;
      case 'custom':
        setSelectedTimePeriod(AnalyticsTimePeriod.CUSTOM);
        // Custom date range will be set by handleCustomRangeSelect
        break;
      default:
        setSelectedTimePeriod(AnalyticsTimePeriod.LAST_30_DAYS);
        setCustomDateRange(undefined);
    }
  };

  // Handle custom date range selection
  const handleCustomRangeSelect = (start: Date, end: Date) => {
    setSelectedTimePeriod(AnalyticsTimePeriod.CUSTOM);
    setCustomDateRange({
      startDate: start.getTime(),
      endDate: end.getTime()
    });
  };

  // Map AnalyticsTimePeriod to DateRangeSelector TimePeriod
  const mapTimePeriod = (): string => {
    switch (selectedTimePeriod) {
      case AnalyticsTimePeriod.TODAY:
        return 'today';
      case AnalyticsTimePeriod.YESTERDAY:
        return 'yesterday';
      case AnalyticsTimePeriod.LAST_7_DAYS:
        return 'week';
      case AnalyticsTimePeriod.LAST_30_DAYS:
        return 'month';
      case AnalyticsTimePeriod.LAST_90_DAYS:
        return 'quarter';
      case AnalyticsTimePeriod.THIS_MONTH:
        return 'this_month';
      case AnalyticsTimePeriod.LAST_MONTH:
        return 'last_month';
      case AnalyticsTimePeriod.LAST_3_MONTHS:
        return 'last_quarter';
      case AnalyticsTimePeriod.LAST_6_MONTHS:
        return 'half_year';
      case AnalyticsTimePeriod.YEAR_TO_DATE:
        return 'ytd';
      case AnalyticsTimePeriod.LAST_YEAR:
        return 'year';
      case AnalyticsTimePeriod.CUSTOM:
        return 'custom';
      default:
        return 'month';
    }
  };

  // Render user engagement metrics
  const renderUserEngagementMetrics = () => {
    if (!dashboardData) return null;
    
    const { userEngagement } = dashboardData;
    
    const cards = [
      {
        title: 'Total Users',
        value: formatNumber(userEngagement.totalUsers),
        icon: 'people'
      },
      {
        title: 'Daily Active Users',
        value: formatNumber(userEngagement.activeUsers.daily),
        icon: 'today'
      },
      {
        title: 'Monthly Active Users',
        value: formatNumber(userEngagement.activeUsers.monthly),
        icon: 'calendar'
      },
      {
        title: 'New Users',
        value: formatNumber(userEngagement.newUsers),
        icon: 'person-add'
      },
      {
        title: 'Retention Rate (30d)',
        value: formatPercentage(userEngagement.retentionRate.day30),
        icon: 'repeat'
      },
      {
        title: 'Churn Rate',
        value: formatPercentage(userEngagement.churnRate),
        icon: 'exit'
      }
    ];
    
    return (
      <View style={styles.metricsSection}>
        <ThemedText style={styles.sectionTitle}>User Engagement</ThemedText>
        <View style={styles.metricsGrid}>
          {cards.map((card, index) => (
            <View
              key={index}
              style={[
                styles.metricCard,
                {
                  backgroundColor: cardBackgroundColor,
                  borderColor: cardBorderColor
                }
              ]}
            >
              <View style={styles.metricCardHeader}>
                <ThemedText style={styles.metricCardTitle}>{card.title}</ThemedText>
                <Ionicons
                  name={card.icon as any}
                  size={24}
                  color={primaryColor}
                />
              </View>
              <ThemedText style={styles.metricCardValue}>{card.value}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading analytics dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Enhanced Analytics</ThemedText>
        <ThemedText style={styles.subtitle}>Admin Dashboard</ThemedText>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time period selector */}
        <DateRangeSelector
          selectedPeriod={mapTimePeriod()}
          onSelectPeriod={handleTimePeriodSelect}
          onSelectCustomRange={handleCustomRangeSelect}
          customDateRange={customDateRange ? {
            start: new Date(customDateRange.startDate),
            end: new Date(customDateRange.endDate)
          } : undefined}
        />
        
        {/* User engagement metrics */}
        {renderUserEngagementMetrics()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  metricsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricCardTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  }
});

export default EnhancedAnalyticsDashboardScreen;
