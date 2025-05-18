import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {  ThemedText  } from '../atomic/atoms/ThemedText';
import {  ThemedView  } from '../atomic/atoms/ThemedView';
import BubbleChart from '../components/BubbleChart';
import HeatMapChart from '../components/HeatMapChart';
import { fraudDetectionService } from '../services/fraudDetectionService';
import {
  FraudAlert,
  AlertSeverity,
  AlertStatus,
  FraudPatternType,
  FraudDetectionStats
} from '../types/fraudDetection';
import { useTheme } from '../contexts/ThemeContext';

// Define the navigation param list
type RootStackParamList = {
  FraudDetectionDashboard: undefined;
  FraudAlertDetails: { alertId: string };
};

// Define the navigation prop type
type FraudDetectionDashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FraudDetectionDashboard'
>;

/**
 * Fraud Detection Dashboard Screen
 *
 * This screen provides an admin dashboard for monitoring and managing fraud alerts.
 */
const FraudDetectionDashboardScreen: React.FC = () => {
  const navigation = useNavigation<FraudDetectionDashboardScreenNavigationProp>();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudDetectionStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertSeverity>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Colors for the dashboard
  const backgroundColor = colors.background;
  const cardBackgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const cardBorderColor = isDark ? '#333333' : '#E0E0E0';
  const textColor = colors.text;
  const primaryColor = colors.primary;
  const accentColor = isDark ? '#4ECDC4' : '#2A9D8F';
  
  // Severity colors
  const severityColors = {
    [AlertSeverity.LOW]: '#4CAF50',
    [AlertSeverity.MEDIUM]: '#FFC107',
    [AlertSeverity.HIGH]: '#FF9800',
    [AlertSeverity.CRITICAL]: '#F44336'
  };

  // Load alerts and statistics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get alerts based on filter
      const alertsData = await fraudDetectionService.getAlerts(
        selectedFilter !== 'all' ? { severity: selectedFilter } : {},
        'timestamp',
        'desc',
        50
      );
      setAlerts(alertsData);
      
      // Get statistics based on time range
      const timeRangeMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      }[selectedTimeRange];
      
      const statsData = await fraudDetectionService.getStatistics(
        Date.now() - timeRangeMs
      );
      setStats(statsData);
    } catch (error) {
      console.error('Error loading fraud detection data:', error);
      Alert.alert('Error', 'Failed to load fraud detection data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, selectedTimeRange]);

  // Set up real-time listener for new alerts
  useEffect(() => {
    const setupListener = () => {
      // Clean up previous listener if exists
      if (unsubscribe) {
        unsubscribe();
      }
      
      // Set up new listener
      const newUnsubscribe = fraudDetectionService.listenForAlerts(
        (newAlerts) => {
          setAlerts(newAlerts);
          // Refresh stats if we get new alerts
          loadData();
        },
        selectedFilter !== 'all' ? { severity: selectedFilter } : {}
      );
      
      setUnsubscribe(newUnsubscribe);
    };
    
    setupListener();
    
    // Clean up listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedFilter]);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Navigate to alert details
  const navigateToAlertDetails = (alertId: string) => {
    navigation.navigate('FraudAlertDetails', { alertId });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render alert severity badge
  const renderSeverityBadge = (severity: AlertSeverity) => {
    const backgroundColor = severityColors[severity];
    
    return (
      <View style={[styles.severityBadge, { backgroundColor }]}>
        <Text style={styles.severityText}>
          {severity.toUpperCase()}
        </Text>
      </View>
    );
  };

  // Render alert item
  const renderAlertItem = ({ item }: { item: FraudAlert }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor
        }
      ]}
      onPress={() => navigateToAlertDetails(item.id)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertHeaderLeft}>
          {renderSeverityBadge(item.severity)}
          <ThemedText style={styles.alertType}>
            {item.patternType.replace(/_/g, ' ')}
          </ThemedText>
        </View>
        <ThemedText style={styles.alertTimestamp}>
          {formatTimestamp(item.timestamp)}
        </ThemedText>
      </View>
      
      <ThemedText style={styles.alertDescription}>
        {item.description}
      </ThemedText>
      
      <View style={styles.alertFooter}>
        <View style={styles.alertStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === AlertStatus.NEW
                    ? '#2196F3'
                    : item.status === AlertStatus.INVESTIGATING
                    ? '#FFC107'
                    : item.status === AlertStatus.RESOLVED
                    ? '#4CAF50'
                    : item.status === AlertStatus.CONFIRMED
                    ? '#9C27B0'
                    : '#757575'
              }
            ]}
          />
          <ThemedText style={styles.statusText}>
            {item.status.replace(/_/g, ' ')}
          </ThemedText>
        </View>
        
        <ThemedText style={styles.alertUser}>
          {item.username || item.userId}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Render filter buttons
  const renderFilterButtons = () => {
    const filters: ('all' | AlertSeverity)[] = [
      'all',
      AlertSeverity.CRITICAL,
      AlertSeverity.HIGH,
      AlertSeverity.MEDIUM,
      AlertSeverity.LOW
    ];
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  selectedFilter === filter
                    ? primaryColor
                    : 'transparent',
                borderColor: primaryColor
              }
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                {
                  color:
                    selectedFilter === filter
                      ? '#FFFFFF'
                      : primaryColor
                }
              ]}
            >
              {filter === 'all' ? 'All' : filter.toUpperCase()}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render time range buttons
  const renderTimeRangeButtons = () => {
    const timeRanges: { value: 'day' | 'week' | 'month'; label: string }[] = [
      { value: 'day', label: 'Last 24 Hours' },
      { value: 'week', label: 'Last 7 Days' },
      { value: 'month', label: 'Last 30 Days' }
    ];
    
    return (
      <View style={styles.timeRangeContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor:
                  selectedTimeRange === range.value
                    ? accentColor
                    : 'transparent',
                borderColor: accentColor
              }
            ]}
            onPress={() => setSelectedTimeRange(range.value)}
          >
            <ThemedText
              style={[
                styles.timeRangeButtonText,
                {
                  color:
                    selectedTimeRange === range.value
                      ? '#FFFFFF'
                      : accentColor
                }
              ]}
            >
              {range.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render statistics cards
  const renderStatisticsCards = () => {
    if (!stats) return null;
    
    const cards = [
      {
        title: 'Total Alerts',
        value: stats.totalAlerts.toString(),
        icon: 'alert-circle'
      },
      {
        title: 'Critical Alerts',
        value: stats.alertsBySeverity[AlertSeverity.CRITICAL].toString(),
        icon: 'warning',
        color: severityColors[AlertSeverity.CRITICAL]
      },
      {
        title: 'False Positive Rate',
        value: `${stats.falsePositiveRate.toFixed(1)}%`,
        icon: 'analytics'
      },
      {
        title: 'Avg. Resolution Time',
        value: `${stats.averageResolutionTime.toFixed(1)} hrs`,
        icon: 'time'
      }
    ];
    
    return (
      <View style={styles.statsCardsContainer}>
        {cards.map((card, index) => (
          <View
            key={index}
            style={[
              styles.statsCard,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor
              }
            ]}
          >
            <View style={styles.statsCardHeader}>
              <ThemedText style={styles.statsCardTitle}>{card.title}</ThemedText>
              <Ionicons
                name={card.icon as any}
                size={24}
                color={card.color || primaryColor}
              />
            </View>
            <ThemedText style={styles.statsCardValue}>{card.value}</ThemedText>
          </View>
        ))}
      </View>
    );
  };

  // Render alert distribution chart
  const renderAlertDistributionChart = () => {
    if (!stats) return null;
    
    const data = [
      {
        label: 'Unusual Betting',
        value: stats.alertsByType[FraudPatternType.UNUSUAL_BETTING_PATTERN],
        color: '#4285F4'
      },
      {
        label: 'Multiple Accounts',
        value: stats.alertsByType[FraudPatternType.MULTIPLE_ACCOUNTS],
        color: '#EA4335'
      },
      {
        label: 'Account Switching',
        value: stats.alertsByType[FraudPatternType.RAPID_ACCOUNT_SWITCHING],
        color: '#FBBC05'
      },
      {
        label: 'Suspicious Location',
        value: stats.alertsByType[FraudPatternType.SUSPICIOUS_LOCATION],
        color: '#34A853'
      },
      {
        label: 'Odds Manipulation',
        value: stats.alertsByType[FraudPatternType.ODDS_MANIPULATION_ATTEMPT],
        color: '#9C27B0'
      },
      {
        label: 'Automated Betting',
        value: stats.alertsByType[FraudPatternType.AUTOMATED_BETTING],
        color: '#FF9800'
      },
      {
        label: 'Payment Anomaly',
        value: stats.alertsByType[FraudPatternType.PAYMENT_ANOMALY],
        color: '#00BCD4'
      },
      {
        label: 'Account Takeover',
        value: stats.alertsByType[FraudPatternType.ACCOUNT_TAKEOVER],
        color: '#FF5722'
      }
    ];
    
    return (
      <View
        style={[
          styles.chartCard,
          {
            backgroundColor: cardBackgroundColor,
            borderColor: cardBorderColor
          }
        ]}
      >
        <ThemedText style={styles.chartTitle}>Alert Distribution by Type</ThemedText>
        <View style={{ height: 200 }}>
          <BubbleChart
            data={data}
            title="Fraud alert distribution by type"
            animated={true}
          />
        </View>
      </View>
    );
  };

  // Render alert activity heatmap
  const renderAlertActivityHeatmap = () => {
    if (!stats || !stats.alertsOverTime.length) return null;
    
    // Convert alertsOverTime to heatmap data format
    const heatmapData: { [date: string]: number } = {};
    
    stats.alertsOverTime.forEach(item => {
      const dateStr = new Date(item.timestamp).toISOString().split('T')[0];
      heatmapData[dateStr] = item.count;
    });
    
    return (
      <View
        style={[
          styles.chartCard,
          {
            backgroundColor: cardBackgroundColor,
            borderColor: cardBorderColor
          }
        ]}
      >
        <ThemedText style={styles.chartTitle}>Alert Activity Over Time</ThemedText>
        <HeatMapChart
          data={heatmapData}
          title="Fraud alert activity over time"
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        />
      </View>
    );
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading fraud detection dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Fraud Detection</ThemedText>
        <ThemedText style={styles.subtitle}>Admin Dashboard</ThemedText>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter buttons */}
        {renderFilterButtons()}
        
        {/* Time range selector */}
        {renderTimeRangeButtons()}
        
        {/* Statistics cards */}
        {renderStatisticsCards()}
        
        {/* Charts */}
        {renderAlertDistributionChart()}
        {renderAlertActivityHeatmap()}
        
        {/* Recent alerts */}
        <View style={styles.alertsSection}>
          <ThemedText style={styles.sectionTitle}>Recent Alerts</ThemedText>
          
          {alerts.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={textColor} />
              <ThemedText style={styles.emptyStateText}>
                No alerts found for the selected filter.
              </ThemedText>
            </ThemedView>
          ) : (
            <FlatList
              data={alerts}
              renderItem={renderAlertItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.alertsList}
            />
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
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsCardTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  alertsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  alertsList: {
    paddingBottom: 16,
  },
  alertCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertType: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  alertTimestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  alertDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  alertUser: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default FraudDetectionDashboardScreen;