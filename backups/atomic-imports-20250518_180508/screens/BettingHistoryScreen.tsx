import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BettingHistoryChart from '../components/BettingHistoryChart';
import { TimePeriodFilter } from '../services/bettingAnalyticsService';
import {  ThemedText  } from '../atomic/atoms/ThemedText';
import {  ThemedView  } from '../atomic/atoms/ThemedView';

/**
 * Screen that displays betting history charts
 */
const BettingHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriodFilter['period']>('month');
  const [selectedChartType, setSelectedChartType] = useState<'profit' | 'winRate' | 'betType' | 'sport'>('profit');
  
  /**
   * Handle period selection
   */
  const handlePeriodChange = (period: TimePeriodFilter['period']) => {
    setSelectedPeriod(period);
  };
  
  /**
   * Handle chart type selection
   */
  const handleChartTypeChange = (chartType: 'profit' | 'winRate' | 'betType' | 'sport') => {
    setSelectedChartType(chartType);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Betting History</ThemedText>
      </View>
      
      <ThemedView style={styles.content}>
        {/* Time period selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.selectedPeriodButton
            ]}
            onPress={() => handlePeriodChange('week')}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.selectedPeriodButtonText
              ]}
            >
              Week
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.selectedPeriodButton
            ]}
            onPress={() => handlePeriodChange('month')}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.selectedPeriodButtonText
              ]}
            >
              Month
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'year' && styles.selectedPeriodButton
            ]}
            onPress={() => handlePeriodChange('year')}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                selectedPeriod === 'year' && styles.selectedPeriodButtonText
              ]}
            >
              Year
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'all' && styles.selectedPeriodButton
            ]}
            onPress={() => handlePeriodChange('all')}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                selectedPeriod === 'all' && styles.selectedPeriodButtonText
              ]}
            >
              All Time
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Chart type selector */}
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === 'profit' && styles.selectedChartTypeButton
            ]}
            onPress={() => handleChartTypeChange('profit')}
          >
            <Ionicons 
              name="trending-up" 
              size={20} 
              color={selectedChartType === 'profit' ? '#fff' : '#666'} 
            />
            <ThemedText
              style={[
                styles.chartTypeButtonText,
                selectedChartType === 'profit' && styles.selectedChartTypeButtonText
              ]}
            >
              Profit
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === 'winRate' && styles.selectedChartTypeButton
            ]}
            onPress={() => handleChartTypeChange('winRate')}
          >
            <Ionicons 
              name="stats-chart" 
              size={20} 
              color={selectedChartType === 'winRate' ? '#fff' : '#666'} 
            />
            <ThemedText
              style={[
                styles.chartTypeButtonText,
                selectedChartType === 'winRate' && styles.selectedChartTypeButtonText
              ]}
            >
              Win Rate
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === 'betType' && styles.selectedChartTypeButton
            ]}
            onPress={() => handleChartTypeChange('betType')}
          >
            <Ionicons 
              name="pie-chart" 
              size={20} 
              color={selectedChartType === 'betType' ? '#fff' : '#666'} 
            />
            <ThemedText
              style={[
                styles.chartTypeButtonText,
                selectedChartType === 'betType' && styles.selectedChartTypeButtonText
              ]}
            >
              Bet Types
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChartType === 'sport' && styles.selectedChartTypeButton
            ]}
            onPress={() => handleChartTypeChange('sport')}
          >
            <Ionicons 
              name="basketball" 
              size={20} 
              color={selectedChartType === 'sport' ? '#fff' : '#666'} 
            />
            <ThemedText
              style={[
                styles.chartTypeButtonText,
                selectedChartType === 'sport' && styles.selectedChartTypeButtonText
              ]}
            >
              Sports
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.chartContainer}>
          <BettingHistoryChart 
            timePeriod={selectedPeriod}
            chartType={selectedChartType}
          />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 8,
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
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  selectedChartTypeButton: {
    backgroundColor: '#4080ff',
  },
  chartTypeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  selectedChartTypeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chartContainer: {
    flex: 1,
  },
});

export default BettingHistoryScreen;