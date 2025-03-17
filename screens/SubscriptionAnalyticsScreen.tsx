import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { generateSubscriptionReport } from '../services/subscriptionAnalyticsService';
import { NeonContainer, NeonText } from '../components/ui';
import Header from '../components/Header';

// Mock data for initial development
const MOCK_DATA = {
  activeSubscriptions: 1,
  totalRevenue: 29.97,
  averageRevenue: 9.99,
  churnRate: 5.2,
  conversionRate: 12.5,
  subscriptionsByPlan: [
    { name: 'Basic Monthly', count: 0, percentage: 0 },
    { name: 'Premium Monthly', count: 1, percentage: 100 },
    { name: 'Premium Annual', count: 0, percentage: 0 }
  ],
  revenueByMonth: [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 9.99 },
    { month: 'Apr', revenue: 9.99 },
    { month: 'May', revenue: 9.99 },
    { month: 'Jun', revenue: 0 }
  ],
  subscriptionsByStatus: [
    { status: 'Active', count: 1, percentage: 100 },
    { status: 'Canceled', count: 0, percentage: 0 },
    { status: 'Past Due', count: 0, percentage: 0 }
  ]
};

/**
 * SubscriptionAnalyticsScreen component displays subscription analytics
 */
const SubscriptionAnalyticsScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  const navigation = useNavigation();
  
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);
  
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // In a real implementation, we would fetch data from the backend
      // For now, we'll use mock data
      // const data = await generateSubscriptionReport(userId, timeRange);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalyticsData(MOCK_DATA);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === '7d' && styles.timeRangeButtonActive]}
        onPress={() => setTimeRange('7d')}
      >
        <Text style={[styles.timeRangeText, timeRange === '7d' && styles.timeRangeTextActive]}>
          7 Days
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === '30d' && styles.timeRangeButtonActive]}
        onPress={() => setTimeRange('30d')}
      >
        <Text style={[styles.timeRangeText, timeRange === '30d' && styles.timeRangeTextActive]}>
          30 Days
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === '90d' && styles.timeRangeButtonActive]}
        onPress={() => setTimeRange('90d')}
      >
        <Text style={[styles.timeRangeText, timeRange === '90d' && styles.timeRangeTextActive]}>
          90 Days
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.timeRangeButton, timeRange === 'all' && styles.timeRangeButtonActive]}
        onPress={() => setTimeRange('all')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'all' && styles.timeRangeTextActive]}>
          All Time
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
  
  const renderBarChart = (data: any[], xKey: string, yKey: string, title: string) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.barChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel}>{item[xKey]}</Text>
            </View>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${Math.min(100, (item[yKey] / Math.max(...data.map(d => d[yKey]))) * 100)}%`,
                    backgroundColor: '#3498db'
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>
              {typeof item[yKey] === 'number' ? 
                yKey === 'revenue' ? `$${item[yKey].toFixed(2)}` : item[yKey] 
                : item[yKey]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
  
  const renderPieChart = (data: any[], nameKey: string, valueKey: string, percentageKey: string, title: string) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: getColorForIndex(index) }
                ]} 
              />
              <Text style={styles.legendLabel}>{item[nameKey]}</Text>
              <Text style={styles.legendValue}>{item[valueKey]}</Text>
              <Text style={styles.legendPercentage}>({item[percentageKey]}%)</Text>
            </View>
          ))}
        </View>
        
        {/* Simple pie chart visualization */}
        <View style={styles.pieChartWrapper}>
          {data.map((item, index) => (
            <View 
              key={index}
              style={[
                styles.pieChartSegment,
                { 
                  backgroundColor: getColorForIndex(index),
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  position: 'absolute',
                  top: index * 10,
                  left: index * 10,
                  opacity: item[percentageKey] > 0 ? 1 : 0.3
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
  
  const getColorForIndex = (index: number): string => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    return colors[index % colors.length];
  };
  
  if (loading) {
    return (
      <NeonContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      </NeonContainer>
    );
  }
  
  return (
    <NeonContainer>
      <Header
        title="Subscription Analytics"
        onRefresh={loadAnalyticsData}
        isLoading={loading}
      />
      
      <ScrollView style={styles.container}>
        <NeonText type="heading" glow={true} style={styles.title}>
          Subscription Analytics
        </NeonText>
        
        {renderTimeRangeSelector()}
        
        <View style={styles.metricsContainer}>
          {renderMetricCard(
            'Active Subscriptions',
            analyticsData.activeSubscriptions,
            'people',
            '#3498db'
          )}
          
          {renderMetricCard(
            'Total Revenue',
            `$${analyticsData.totalRevenue.toFixed(2)}`,
            'cash',
            '#2ecc71'
          )}
          
          {renderMetricCard(
            'Churn Rate',
            `${analyticsData.churnRate}%`,
            'trending-down',
            '#e74c3c'
          )}
          
          {renderMetricCard(
            'Conversion Rate',
            `${analyticsData.conversionRate}%`,
            'trending-up',
            '#f39c12'
          )}
        </View>
        
        {renderBarChart(
          analyticsData.revenueByMonth,
          'month',
          'revenue',
          'Revenue by Month'
        )}
        
        {renderPieChart(
          analyticsData.subscriptionsByPlan,
          'name',
          'count',
          'percentage',
          'Subscriptions by Plan'
        )}
        
        {renderPieChart(
          analyticsData.subscriptionsByStatus,
          'status',
          'count',
          'percentage',
          'Subscriptions by Status'
        )}
      </ScrollView>
    </NeonContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#3498db',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  barChartContainer: {
    marginTop: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabelContainer: {
    width: 40,
    marginRight: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
  },
  barWrapper: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 8,
  },
  barValue: {
    width: 60,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: 8,
  },
  pieChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieChartWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieChartSegment: {
    // Styles applied dynamically
  },
  pieChartLegend: {
    flex: 1,
    marginRight: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  legendPercentage: {
    fontSize: 12,
    color: '#666',
  },
});

export default SubscriptionAnalyticsScreen;