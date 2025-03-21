/**
 * Analytics Dashboard Screen
 * 
 * A comprehensive dashboard for monitoring microtransaction and cookie performance.
 * Features animated neon headings and real-time data visualization.
 */

import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { analyticsService } from '../services/analyticsService';

// Define TIME_PERIODS directly in this file since the constants file might not be properly imported
const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
};

// Mock implementation for development
const mockAnalyticsService = {
  getDashboardData: async (timePeriod: string) => {
    // Return mock data for development
    return {
      revenue: {
        total_revenue: 1250.75,
        active_users: 450,
        daily_data: {
          '2025-03-12': 150.25,
          '2025-03-13': 175.50,
          '2025-03-14': 200.00,
          '2025-03-15': 185.75,
          '2025-03-16': 210.25,
          '2025-03-17': 225.50,
          '2025-03-18': 103.50,
        }
      },
      cookies: {
        cookie_inits: 850,
        cookie_persists: 720,
        redirects: 380,
        conversions: 210,
        persist_rate: 84.7,
        redirect_success_rate: 55.3,
      },
      microtransactions: {
        total_revenue: 1250.75,
        by_type: {
          'Live Parlay Odds': {
            impressions: 2500,
            clicks: 450,
            purchases: 180,
            revenue: 540.00,
            click_rate: 18.0,
            conversion_rate: 40.0,
          },
          'Premium Stats': {
            impressions: 3200,
            clicks: 580,
            purchases: 210,
            revenue: 420.00,
            click_rate: 18.1,
            conversion_rate: 36.2,
          },
          'Expert Picks': {
            impressions: 1800,
            clicks: 320,
            purchases: 95,
            revenue: 190.75,
            click_rate: 17.8,
            conversion_rate: 29.7,
          },
          'Player Insights': {
            impressions: 1200,
            clicks: 180,
            purchases: 50,
            revenue: 100.00,
            click_rate: 15.0,
            conversion_rate: 27.8,
          },
        }
      },
      user_journey: {
        stages: {
          impressions: 8700,
          clicks: 1530,
          purchases: 535,
          redirects: 380,
          conversions: 210,
        },
        dropoff_rates: {
          impression_to_click: 82.4,
          click_to_purchase: 65.0,
          purchase_to_redirect: 29.0,
          redirect_to_conversion: 44.7,
        },
        completion_rate: 2.4,
      }
    };
  }
};
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';

// Get screen dimensions
const { width } = Dimensions.get('window');

/**
 * Neon Text component for headings
 */
const NeonText: React.FC<{
  text: string;
  color?: string;
  fontSize?: number;
  style?: any;
}> = ({ text, color = Colors.neon.blue, fontSize = 24, style }) => {
  // Animation value for glow effect
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Set up animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Calculate shadow opacity based on animation
  const textShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.9],
  });
  
  return (
    <Animated.Text
      style={[
        styles.neonText,
        {
          color,
          fontSize,
          textShadowColor: color,
          textShadowOpacity,
        },
        style,
      ]}
    >
      {text}
    </Animated.Text>
  );
};

/**
 * Metric Card component
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
}> = ({ 
  title, 
  value, 
  subtitle, 
  icon = 'analytics', 
  color = Colors.neon.blue,
  trend,
  trendValue,
}) => {
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  
  // Determine trend icon and color
  let trendIcon = 'remove';
  let trendColor = '#888888';
  
  if (trend === 'up') {
    trendIcon = 'arrow-up';
    trendColor = '#4CAF50';
  } else if (trend === 'down') {
    trendIcon = 'arrow-down';
    trendColor = '#F44336';
  }
  
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.metricTitle, { color: textColor }]}>{title}</Text>
      </View>
      
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: textColor }]}>{subtitle}</Text>
      )}
      
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons name={trendIcon as any} size={16} color={trendColor} />
          <Text style={[styles.trendValue, { color: trendColor }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Chart Card component
 */
const ChartCard: React.FC<{
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: any;
  color?: string;
  height?: number;
}> = ({ 
  title, 
  type, 
  data, 
  color = Colors.neon.blue,
  height = 220,
}) => {
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1A1A1A' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const isDarkMode = textColor === '#FFFFFF';
  
  // Chart config
  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${color === Colors.neon.blue ? '0, 123, 255' : '255, 99, 132'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
    },
  };
  
  // Render chart based on type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={width - 64}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            width={width - 64}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data}
            width={width - 64}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.chartCard, { backgroundColor }]}>
      <Text style={[styles.chartTitle, { color: textColor }]}>{title}</Text>
      {renderChart()}
    </View>
  );
};

/**
 * Time Period Selector component
 */
const TimePeriodSelector: React.FC<{
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
}> = ({ selectedPeriod, onSelectPeriod }) => {
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#2A2A2A' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  
  // Time period options
  const periods = [
    { key: TIME_PERIODS.TODAY, label: 'Today' },
    { key: TIME_PERIODS.YESTERDAY, label: 'Yesterday' },
    { key: TIME_PERIODS.LAST_7_DAYS, label: 'Last 7 Days' },
    { key: TIME_PERIODS.LAST_30_DAYS, label: 'Last 30 Days' },
    { key: TIME_PERIODS.THIS_MONTH, label: 'This Month' },
  ];
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.periodSelector}
      contentContainerStyle={styles.periodSelectorContent}
    >
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodOption,
            selectedPeriod === period.key && styles.selectedPeriod,
            { backgroundColor },
          ]}
          onPress={() => onSelectPeriod(period.key)}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period.key && styles.selectedPeriodText,
              { color: textColor },
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

/**
 * Analytics Dashboard Screen component
 */
const AnalyticsDashboardScreen: React.FC = () => {
  // State
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.LAST_7_DAYS);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#F8F8F8', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  
  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);
  
  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Use mock service for development
      const data = await mockAnalyticsService.getDashboardData(selectedPeriod);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle period selection
  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };
  
  // Handle tab selection
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Prepare revenue chart data
  const prepareRevenueChartData = () => {
    if (!dashboardData || !dashboardData.revenue || !dashboardData.revenue.daily_data) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
    
    const dailyData = dashboardData.revenue.daily_data;
    const labels = Object.keys(dailyData).map(date => {
      const parts = date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    
    const data = Object.values(dailyData);
    
    return {
      labels,
      datasets: [{ data }],
    };
  };
  
  // Prepare conversion funnel data
  const prepareConversionFunnelData = () => {
    if (!dashboardData || !dashboardData.user_journey || !dashboardData.user_journey.stages) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
    
    const stages = dashboardData.user_journey.stages;
    
    return {
      labels: ['Impressions', 'Clicks', 'Purchases', 'Redirects', 'Conversions'],
      datasets: [
        {
          data: [
            stages.impressions || 0,
            stages.clicks || 0,
            stages.purchases || 0,
            stages.redirects || 0,
            stages.conversions || 0,
          ],
        },
      ],
    };
  };
  
  // Prepare microtransaction type data
  const prepareMicrotransactionTypeData = () => {
    if (!dashboardData || !dashboardData.microtransactions || !dashboardData.microtransactions.by_type) {
      return [];
    }
    
    const byType = dashboardData.microtransactions.by_type;
    const colors = [
      Colors.neon.blue,
      Colors.neon.pink,
      Colors.neon.green,
      Colors.neon.orange,
      Colors.neon.purple,
    ];
    
    return Object.entries(byType).map(([type, data]: [string, any], index) => ({
      name: type,
      value: data.revenue || 0,
      color: colors[index % colors.length],
      legendFontColor: textColor,
      legendFontSize: 12,
    }));
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={Colors.neon.blue} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading dashboard data...</Text>
      </View>
    );
  }
  
  // Render overview tab
  const renderOverviewTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Revenue"
            value={`$${dashboardData?.revenue?.total_revenue?.toFixed(2) || '0.00'}`}
            icon="cash"
            color={Colors.neon.green}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${dashboardData?.user_journey?.completion_rate?.toFixed(2) || '0.00'}%`}
            icon="trending-up"
            color={Colors.neon.blue}
          />
        </View>
        
        <View style={styles.metricsRow}>
          <MetricCard
            title="Cookie Success"
            value={`${dashboardData?.cookies?.persist_rate?.toFixed(2) || '0.00'}%`}
            icon="checkmark-circle"
            color={Colors.neon.orange}
          />
          <MetricCard
            title="Active Users"
            value={dashboardData?.revenue?.active_users || '0'}
            icon="people"
            color={Colors.neon.purple}
          />
        </View>
        
        <ChartCard
          title="Revenue Trend"
          type="line"
          data={prepareRevenueChartData()}
          color={Colors.neon.green}
        />
        
        <ChartCard
          title="Conversion Funnel"
          type="bar"
          data={prepareConversionFunnelData()}
          color={Colors.neon.blue}
        />
        
        <ChartCard
          title="Revenue by Type"
          type="pie"
          data={prepareMicrotransactionTypeData()}
        />
      </View>
    );
  };
  
  // Render microtransactions tab
  const renderMicrotransactionsTab = () => {
    if (!dashboardData || !dashboardData.microtransactions || !dashboardData.microtransactions.by_type) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={Colors.neon.orange} />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No microtransaction data available
          </Text>
        </View>
      );
    }
    
    const byType = dashboardData.microtransactions.by_type;
    
    return (
      <View style={styles.tabContent}>
        <MetricCard
          title="Total Revenue"
          value={`$${dashboardData.microtransactions.total_revenue?.toFixed(2) || '0.00'}`}
          icon="cash"
          color={Colors.neon.green}
        />
        
        <ChartCard
          title="Revenue by Type"
          type="pie"
          data={prepareMicrotransactionTypeData()}
        />
        
        <NeonText
          text="Microtransaction Performance"
          fontSize={20}
          color={Colors.neon.blue}
          style={styles.sectionTitle}
        />
        
        {Object.entries(byType).map(([type, data]: [string, any]) => (
          <View key={type} style={[styles.microtransactionCard, { backgroundColor }]}>
            <Text style={[styles.microtransactionTitle, { color: textColor }]}>{type}</Text>
            
            <View style={styles.microtransactionMetrics}>
              <View style={styles.microtransactionMetric}>
                <Text style={[styles.microtransactionMetricLabel, { color: textColor }]}>Impressions</Text>
                <Text style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.impressions || 0}
                </Text>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <Text style={[styles.microtransactionMetricLabel, { color: textColor }]}>Clicks</Text>
                <Text style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.clicks || 0}
                </Text>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <Text style={[styles.microtransactionMetricLabel, { color: textColor }]}>Purchases</Text>
                <Text style={[styles.microtransactionMetricValue, { color: Colors.neon.blue }]}>
                  {data.purchases || 0}
                </Text>
              </View>
              
              <View style={styles.microtransactionMetric}>
                <Text style={[styles.microtransactionMetricLabel, { color: textColor }]}>Revenue</Text>
                <Text style={[styles.microtransactionMetricValue, { color: Colors.neon.green }]}>
                  ${data.revenue?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            
            <View style={styles.microtransactionRates}>
              <View style={styles.microtransactionRate}>
                <Text style={[styles.microtransactionRateLabel, { color: textColor }]}>Click Rate</Text>
                <Text style={[styles.microtransactionRateValue, { color: Colors.neon.orange }]}>
                  {data.click_rate?.toFixed(2) || '0.00'}%
                </Text>
              </View>
              
              <View style={styles.microtransactionRate}>
                <Text style={[styles.microtransactionRateLabel, { color: textColor }]}>Conversion Rate</Text>
                <Text style={[styles.microtransactionRateValue, { color: Colors.neon.orange }]}>
                  {data.conversion_rate?.toFixed(2) || '0.00'}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  // Render cookies tab
  const renderCookiesTab = () => {
    if (!dashboardData || !dashboardData.cookies) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={Colors.neon.orange} />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No cookie data available
          </Text>
        </View>
      );
    }
    
    const cookies = dashboardData.cookies;
    
    // Prepare cookie performance chart data
    const cookiePerformanceData = {
      labels: ['Inits', 'Persists', 'Redirects', 'Conversions'],
      datasets: [
        {
          data: [
            cookies.cookie_inits || 0,
            cookies.cookie_persists || 0,
            cookies.redirects || 0,
            cookies.conversions || 0,
          ],
        },
      ],
    };
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Cookie Success"
            value={`${cookies.persist_rate?.toFixed(2) || '0.00'}%`}
            icon="checkmark-circle"
            color={Colors.neon.orange}
          />
          <MetricCard
            title="Redirect Success"
            value={`${cookies.redirect_success_rate?.toFixed(2) || '0.00'}%`}
            icon="arrow-forward-circle"
            color={Colors.neon.blue}
          />
        </View>
        
        <ChartCard
          title="Cookie Performance"
          type="bar"
          data={cookiePerformanceData}
          color={Colors.neon.orange}
        />
        
        <NeonText
          text="Cookie Metrics"
          fontSize={20}
          color={Colors.neon.orange}
          style={styles.sectionTitle}
        />
        
        <View style={[styles.cookieMetricsCard, { backgroundColor }]}>
          <View style={styles.cookieMetric}>
            <Text style={[styles.cookieMetricLabel, { color: textColor }]}>Cookie Initializations</Text>
            <Text style={[styles.cookieMetricValue, { color: Colors.neon.blue }]}>
              {cookies.cookie_inits || 0}
            </Text>
          </View>
          
          <View style={styles.cookieMetric}>
            <Text style={[styles.cookieMetricLabel, { color: textColor }]}>Cookie Persists</Text>
            <Text style={[styles.cookieMetricValue, { color: Colors.neon.blue }]}>
              {cookies.cookie_persists || 0}
            </Text>
          </View>
          
          <View style={styles.cookieMetric}>
            <Text style={[styles.cookieMetricLabel, { color: textColor }]}>FanDuel Redirects</Text>
            <Text style={[styles.cookieMetricValue, { color: Colors.neon.blue }]}>
              {cookies.redirects || 0}
            </Text>
          </View>
          
          <View style={styles.cookieMetric}>
            <Text style={[styles.cookieMetricLabel, { color: textColor }]}>FanDuel Conversions</Text>
            <Text style={[styles.cookieMetricValue, { color: Colors.neon.blue }]}>
              {cookies.conversions || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render user journey tab
  const renderUserJourneyTab = () => {
    if (!dashboardData || !dashboardData.user_journey) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={Colors.neon.orange} />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No user journey data available
          </Text>
        </View>
      );
    }
    
    const journey = dashboardData.user_journey;
    
    return (
      <View style={styles.tabContent}>
        <MetricCard
          title="Completion Rate"
          value={`${journey.completion_rate?.toFixed(2) || '0.00'}%`}
          icon="flag"
          color={Colors.neon.green}
        />
        
        <ChartCard
          title="Conversion Funnel"
          type="bar"
          data={prepareConversionFunnelData()}
          color={Colors.neon.blue}
        />
        
        <NeonText
          text="Drop-off Analysis"
          fontSize={20}
          color={Colors.neon.pink}
          style={styles.sectionTitle}
        />
        
        <View style={[styles.dropoffCard, { backgroundColor }]}>
          <View style={styles.dropoffStage}>
            <View style={styles.dropoffStageHeader}>
              <Text style={[styles.dropoffStageLabel, { color: textColor }]}>Impression → Click</Text>
              <Text style={[styles.dropoffStageValue, { color: Colors.neon.pink }]}>
                {journey.dropoff_rates.impression_to_click?.toFixed(2) || '0.00'}%
              </Text>
            </View>
            <View style={styles.dropoffBar}>
              <View
                style={[
                  styles.dropoffBarFill,
                  {
                    width: `${journey.dropoff_rates.impression_to_click || 0}%`,
                    backgroundColor: Colors.neon.pink,
                  },
                ]}
              />
            </View>
          </View>
          
          <View style={styles.dropoffStage}>
            <View style={styles.dropoffStageHeader}>
              <Text style={[styles.dropoffStageLabel, { color: textColor }]}>Click → Purchase</Text>
              <Text style={[styles.dropoffStageValue, { color: Colors.neon.pink }]}>
                {journey.dropoff_rates.click_to_purchase?.toFixed(2) || '0.00'}%
              </Text>
            </View>
            <View style={styles.dropoffBar}>
              <View
                style={[
                  styles.dropoffBarFill,
                  {
                    width: `${journey.dropoff_rates.click_to_purchase || 0}%`,
                    backgroundColor: Colors.neon.pink,
                  },
                ]}
              />
            </View>
          </View>
          
          <View style={styles.dropoffStage}>
            <View style={styles.dropoffStageHeader}>
              <Text style={[styles.dropoffStageLabel, { color: textColor }]}>Purchase → Redirect</Text>
              <Text style={[styles.dropoffStageValue, { color: Colors.neon.pink }]}>
                {journey.dropoff_rates.purchase_to_redirect?.toFixed(2) || '0.00'}%
              </Text>
            </View>
            <View style={styles.dropoffBar}>
              <View
                style={[
                  styles.dropoffBarFill,
                  {
                    width: `${journey.dropoff_rates.purchase_to_redirect || 0}%`,
                    backgroundColor: Colors.neon.pink,
                  },
                ]}
              />
            </View>
          </View>
          
          <View style={styles.dropoffStage}>
            <View style={styles.dropoffStageHeader}>
              <Text style={[styles.dropoffStageLabel, { color: textColor }]}>Redirect → Conversion</Text>
              <Text style={[styles.dropoffStageValue, { color: Colors.neon.pink }]}>
                {journey.dropoff_rates.redirect_to_conversion?.toFixed(2) || '0.00'}%
              </Text>
            </View>
            <View style={styles.dropoffBar}>
              <View
                style={[
                  styles.dropoffBarFill,
                  {
                    width: `${journey.dropoff_rates.redirect_to_conversion || 0}%`,
                    backgroundColor: Colors.neon.pink,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'microtransactions':
        return renderMicrotransactionsTab();
      case 'cookies':
        return renderCookiesTab();
      case 'user_journey':
        return renderUserJourneyTab();
      default:
        return renderOverviewTab();
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <NeonText
          text="Analytics Dashboard"
          color={Colors.neon.blue}
          fontSize={28}
          style={styles.headerTitle}
        />
        
        <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={24} color={Colors.neon.blue} />
        </TouchableOpacity>
      </View>
      
      <TimePeriodSelector
        selectedPeriod={selectedPeriod}
        onSelectPeriod={handlePeriodSelect}
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
            activeTab === 'microtransactions' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('microtransactions')}
        >
          <Ionicons
            name="cash"
            size={20}
            color={activeTab === 'microtransactions' ? Colors.neon.green : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'microtransactions' && styles.activeTabText,
            ]}
          >
            Microtransactions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'cookies' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('cookies')}
        >
          <Ionicons
            name="analytics"
            size={20}
            color={activeTab === 'cookies' ? Colors.neon.orange : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'cookies' && styles.activeTabText,
            ]}
          >
            Cookies
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'user_journey' && styles.activeTab,
          ]}
          onPress={() => handleTabSelect('user_journey')}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'user_journey' ? Colors.neon.pink : textColor}
          />
          <Text
            style={[
              styles.tabText,
              { color: textColor },
              activeTab === 'user_journey' && styles.activeTabText,
            ]}
          >
            User Journey
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
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
  refreshButton: {
    padding: 8,
  },
  neonText: {
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  periodSelector: {
    maxHeight: 50,
    marginBottom: 16,
  },
  periodSelectorContent: {
    paddingHorizontal: 16,
  },
  periodOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedPeriod: {
    backgroundColor: Colors.neon.blue,
  },
  periodText: {
    fontSize: 14,
  },
  selectedPeriodText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  tabContent: {
    flex: 1,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendValue: {
    fontSize: 12,
    marginLeft: 4,
  },
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  sectionTitle: {
    marginVertical: 16,
  },
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
  cookieMetricsCard: {
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
  cookieMetric: {
    marginBottom: 16,
  },
  cookieMetricLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  cookieMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dropoffCard: {
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
  dropoffStage: {
    marginBottom: 16,
  },
  dropoffStageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropoffStageLabel: {
    fontSize: 14,
  },
  dropoffStageValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropoffBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dropoffBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AnalyticsDashboardScreen;