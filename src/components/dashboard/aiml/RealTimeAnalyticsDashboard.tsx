/**
 * Real-time Analytics Dashboard Component
 * Phase 4.2: Advanced AI/ML Features
 * Live streaming analytics and real-time data integration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Card, Button } from '../../../atomic';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useInsightStream, useEnhancedInsights } from '../../../hooks/useEnhancedInsights';
import { ChartComponent } from '../charts/ChartComponent';
import { LoadingState } from '../../atoms/LoadingState';
import { ErrorBoundary } from '../../organisms/ErrorBoundary';
import { EnhancedInsight, InsightFilters } from '../../../types/enhancedInsights';

const { width: screenWidth } = Dimensions.get('window');

interface RealTimeAnalyticsDashboardProps {
  className?: string;
}

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  timestamp: string;
}

interface StreamingData {
  timestamps: string[];
  values: number[];
  label: string;
  color: string;
}

export const RealTimeAnalyticsDashboard: React.FC<RealTimeAnalyticsDashboardProps> = ({
  className,
}) => {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'users', 'engagement']);
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [streamingData, setStreamingData] = useState<Record<string, StreamingData>>({});
  const [alerts, setAlerts] = useState<EnhancedInsight[]>([]);

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { stream, insights, startStream, stopStream } = useInsightStream();
  const { analytics, loading, error } = useEnhancedInsights();

  // Available metrics for real-time monitoring
  const availableMetrics = [
    { id: 'revenue', name: 'Revenue', unit: '$', color: '#22c55e' },
    { id: 'users', name: 'Active Users', unit: '', color: '#3b82f6' },
    { id: 'engagement', name: 'Engagement Rate', unit: '%', color: '#f59e0b' },
    { id: 'conversions', name: 'Conversions', unit: '', color: '#8b5cf6' },
    { id: 'churn', name: 'Churn Rate', unit: '%', color: '#ef4444' },
    { id: 'satisfaction', name: 'Satisfaction Score', unit: '/10', color: '#06b6d4' },
  ];

  // Initialize real-time metrics
  const initializeMetrics = useCallback(() => {
    const initialMetrics: RealTimeMetric[] = selectedMetrics.map(metricId => {
      const metricConfig = availableMetrics.find(m => m.id === metricId);
      return {
        id: metricId,
        name: metricConfig?.name || metricId,
        value: Math.random() * 1000 + 500,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: (Math.random() - 0.5) * 10,
        unit: metricConfig?.unit || '',
        timestamp: new Date().toISOString(),
      };
    });
    setRealTimeMetrics(initialMetrics);
  }, [selectedMetrics, availableMetrics]);

  // Update real-time data
  const updateRealTimeData = useCallback(() => {
    setRealTimeMetrics(prev => prev.map(metric => {
      const variance = (Math.random() - 0.5) * 50;
      const newValue = Math.max(0, metric.value + variance);
      const change = ((newValue - metric.value) / metric.value) * 100;
      
      return {
        ...metric,
        value: newValue,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        timestamp: new Date().toISOString(),
      };
    }));

    // Update streaming data for charts
    setStreamingData(prev => {
      const newData = { ...prev };
      const now = new Date().toISOString();
      
      selectedMetrics.forEach(metricId => {
        const metricConfig = availableMetrics.find(m => m.id === metricId);
        const currentMetric = realTimeMetrics.find(m => m.id === metricId);
        
        if (!newData[metricId]) {
          newData[metricId] = {
            timestamps: [],
            values: [],
            label: metricConfig?.name || metricId,
            color: metricConfig?.color || '#666666',
          };
        }
        
        // Add new data point
        newData[metricId].timestamps.push(now);
        newData[metricId].values.push(currentMetric?.value || 0);
        
        // Keep only recent data based on time window
        const maxPoints = {
          '1h': 60,   // 1 point per minute
          '6h': 360,  // 1 point per minute
          '24h': 288, // 1 point per 5 minutes
          '7d': 336,  // 1 point per 30 minutes
        }[timeWindow];
        
        if (newData[metricId].timestamps.length > maxPoints) {
          newData[metricId].timestamps = newData[metricId].timestamps.slice(-maxPoints);
          newData[metricId].values = newData[metricId].values.slice(-maxPoints);
        }
      });
      
      return newData;
    });
  }, [realTimeMetrics, selectedMetrics, timeWindow, availableMetrics]);

  // Start real-time streaming
  const startRealTimeStreaming = useCallback(async () => {
    try {
      setIsStreaming(true);
      
      // Start insight stream
      const filters: InsightFilters = {
        types: ['anomaly', 'trend', 'opportunity'],
        severities: ['medium', 'high', 'critical'],
      };
      
      await startStream(filters);
      
      // Start data updates
      intervalRef.current = setInterval(updateRealTimeData, 5000); // Update every 5 seconds
      
    } catch (error) {
      Alert.alert('Error', 'Failed to start real-time streaming');
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  }, [startStream, updateRealTimeData]);

  // Stop real-time streaming
  const stopRealTimeStreaming = useCallback(async () => {
    try {
      setIsStreaming(false);
      
      // Stop insight stream
      await stopStream();
      
      // Clear intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }, [stopStream]);

  // Toggle metric selection
  const toggleMetric = useCallback((metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else if (prev.length < 6) { // Limit to 6 metrics
        return [...prev, metricId];
      } else {
        Alert.alert('Limit Reached', 'You can monitor up to 6 metrics at once');
        return prev;
      }
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMetrics();
  }, [initializeMetrics]);

  // Update streaming data when real-time metrics change
  useEffect(() => {
    if (isStreaming) {
      dataUpdateRef.current = setTimeout(() => {
        updateRealTimeData();
      }, 100);
    }
    
    return () => {
      if (dataUpdateRef.current) {
        clearTimeout(dataUpdateRef.current);
      }
    };
  }, [realTimeMetrics, isStreaming, updateRealTimeData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (dataUpdateRef.current) {
        clearTimeout(dataUpdateRef.current);
      }
    };
  }, []);

  // Handle new insights from stream
  useEffect(() => {
    if (insights.length > alerts.length) {
      const newInsights = insights.slice(alerts.length);
      setAlerts(prev => [...newInsights, ...prev].slice(0, 10)); // Keep latest 10 alerts
    }
  }, [insights, alerts.length]);

  // Render metric cards
  const renderMetricCards = () => (
    <View style={styles.metricsGrid}>
      {realTimeMetrics.map((metric) => (
        <Card key={metric.id} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricName, { color: textColor }]}>
              {metric.name}
            </Text>
            <View style={[
              styles.trendIndicator,
              { backgroundColor: 
                metric.trend === 'up' ? '#22c55e' : 
                metric.trend === 'down' ? '#ef4444' : '#6b7280'
              }
            ]}>
              <Text style={styles.trendText}>
                {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
              </Text>
            </View>
          </View>
          
          <View style={styles.metricValue}>
            <Text style={[styles.metricNumber, { color: textColor }]}>
              {metric.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {metric.unit}
            </Text>
            <Text style={[
              styles.metricChange,
              { color: metric.change >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
            </Text>
          </View>
          
          <Text style={[styles.metricTimestamp, { color: textColor }]}>
            Last updated: {new Date(metric.timestamp).toLocaleTimeString()}
          </Text>
        </Card>
      ))}
    </View>
  );

  // Render streaming charts
  const renderStreamingCharts = () => (
    <View style={styles.chartsSection}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Live Data Streams
      </Text>
      
      {Object.entries(streamingData).map(([metricId, data]) => (
        <Card key={metricId} style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: textColor }]}>
            {data.label} - Live Stream
          </Text>
          
          <ChartComponent
            type="line"
            data={{
              labels: data.timestamps.map(t => new Date(t).toLocaleTimeString()),
              datasets: [{
                label: data.label,
                data: data.values,
                borderColor: data.color,
                backgroundColor: `${data.color}20`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Time',
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: data.label,
                  },
                },
              },
              animation: {
                duration: 750,
              },
            }}
            style={styles.chart}
          />
        </Card>
      ))}
    </View>
  );

  // Render alerts panel
  const renderAlertsPanel = () => (
    <Card style={styles.alertsCard}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Real-time Alerts
      </Text>
      
      {alerts.length === 0 ? (
        <Text style={[styles.noAlertsText, { color: textColor }]}>
          No alerts in the last hour
        </Text>
      ) : (
        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {alerts.map((alert, index) => (
            <View key={`${alert.id}-${index}`} style={styles.alertItem}>
              <View style={[
                styles.alertSeverity,
                { backgroundColor: 
                  alert.severity === 'critical' ? '#ef4444' :
                  alert.severity === 'high' ? '#f59e0b' :
                  alert.severity === 'medium' ? '#06b6d4' : '#6b7280'
                }
              ]} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: textColor }]}>
                  {alert.title}
                </Text>
                <Text style={[styles.alertDescription, { color: textColor }]}>
                  {alert.description}
                </Text>
                <Text style={[styles.alertTime, { color: textColor }]}>
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Card>
  );

  // Render metric selector
  const renderMetricSelector = () => (
    <Card style={styles.selectorCard}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Select Metrics to Monitor
      </Text>
      
      <View style={styles.metricsSelector}>
        {availableMetrics.map((metric) => (
          <TouchableOpacity
            key={metric.id}
            style={[
              styles.metricOption,
              { borderColor: selectedMetrics.includes(metric.id) ? primaryColor : '#e5e7eb' },
              selectedMetrics.includes(metric.id) && { backgroundColor: `${primaryColor}20` }
            ]}
            onPress={() => toggleMetric(metric.id)}
          >
            <View style={[styles.metricColorIndicator, { backgroundColor: metric.color }]} />
            <Text style={[
              styles.metricOptionText,
              { color: selectedMetrics.includes(metric.id) ? primaryColor : textColor }
            ]}>
              {metric.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingState message="Loading Real-time Analytics..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#ef4444' }]}>
          Error loading real-time analytics: {error}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor }]} className={className}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: textColor }]}>
              Real-time Analytics
            </Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Live streaming data and AI-powered insights
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.streamingToggle}>
              <Text style={[styles.toggleLabel, { color: textColor }]}>
                Live Streaming
              </Text>
              <Switch
                value={isStreaming}
                onValueChange={isStreaming ? stopRealTimeStreaming : startRealTimeStreaming}
                trackColor={{ false: '#f3f4f6', true: primaryColor }}
                thumbColor={isStreaming ? '#ffffff' : '#9ca3af'}
              />
            </View>
            
            {isStreaming && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={[styles.liveText, { color: '#ef4444' }]}>
                  LIVE
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Metric Selector */}
          {renderMetricSelector()}

          {/* Real-time Metrics */}
          {renderMetricCards()}

          {/* Streaming Charts */}
          {isStreaming && renderStreamingCharts()}

          {/* Alerts Panel */}
          {renderAlertsPanel()}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  streamingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    animation: 'pulse 1s infinite',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  metricColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricTimestamp: {
    fontSize: 10,
    opacity: 0.7,
  },
  chartsSection: {
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    height: 200,
  },
  alertsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noAlertsText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    padding: 20,
  },
  alertsList: {
    maxHeight: 300,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertSeverity: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: 10,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default RealTimeAnalyticsDashboard;