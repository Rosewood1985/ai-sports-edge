import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { bettingAnalyticsService, BetRecord, BettingStats, TimePeriodFilter } from '../services/bettingAnalyticsService';
import DateRangeSelector from './DateRangeSelector';

/**
 * Comparison type enum
 */
enum ComparisonType {
  TIME_PERIOD = 'time_period',
  BENCHMARK = 'benchmark',
  SPORT = 'sport',
  BET_TYPE = 'bet_type'
}

/**
 * Benchmark data interface
 */
interface Benchmark {
  id: string;
  name: string;
  stats: BettingStats;
}

/**
 * Comparative analysis props
 */
interface ComparativeAnalysisProps {
  currentStats: BettingStats;
  currentTimePeriod: TimePeriodFilter;
  onTimePeriodChange?: (period: TimePeriodFilter) => void;
}

/**
 * Component for comparing betting performance against benchmarks or other time periods
 */
const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  currentStats,
  currentTimePeriod,
  onTimePeriodChange
}) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>(ComparisonType.TIME_PERIOD);
  const [comparisonStats, setComparisonStats] = useState<BettingStats | null>(null);
  const [comparisonLabel, setComparisonLabel] = useState<string>('Previous Period');
  const [comparisonTimePeriod, setComparisonTimePeriod] = useState<TimePeriodFilter>({
    period: 'month',
    customStartDate: undefined,
    customEndDate: undefined
  });
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [betTypeFilter, setBetTypeFilter] = useState<string>('');
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [availableBetTypes, setAvailableBetTypes] = useState<string[]>([]);
  
  const primaryColor = '#0a7ea4';
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  // Load benchmarks and filters on mount
  useEffect(() => {
    loadBenchmarks();
    loadFilters();
  }, []);
  
  // Update comparison stats when comparison type or filters change
  useEffect(() => {
    updateComparisonStats();
  }, [comparisonType, comparisonTimePeriod, selectedBenchmark, sportFilter, betTypeFilter]);
  
  /**
   * Load benchmark data
   */
  const loadBenchmarks = async () => {
    try {
      // In a real app, these would come from an API
      const benchmarkData: Benchmark[] = [
        {
          id: 'average_user',
          name: 'Average User',
          stats: {
            totalBets: 120,
            winningBets: 62,
            losingBets: 58,
            totalWagered: 2400,
            totalReturns: 2640,
            netProfit: 240,
            roi: 10,
            winRate: 51.67,
            averageOdds: 2.1,
            streaks: {
              currentStreak: 2,
              longestWinStreak: 5,
              longestLoseStreak: 3
            }
          }
        },
        {
          id: 'pro_user',
          name: 'Professional Bettor',
          stats: {
            totalBets: 200,
            winningBets: 120,
            losingBets: 80,
            totalWagered: 5000,
            totalReturns: 6250,
            netProfit: 1250,
            roi: 25,
            winRate: 60,
            averageOdds: 2.3,
            streaks: {
              currentStreak: 4,
              longestWinStreak: 8,
              longestLoseStreak: 3
            }
          }
        },
        {
          id: 'industry_average',
          name: 'Industry Average',
          stats: {
            totalBets: 500,
            winningBets: 225,
            losingBets: 275,
            totalWagered: 10000,
            totalReturns: 9500,
            netProfit: -500,
            roi: -5,
            winRate: 45,
            averageOdds: 2.0,
            streaks: {
              currentStreak: -2,
              longestWinStreak: 4,
              longestLoseStreak: 5
            }
          }
        }
      ];
      
      setBenchmarks(benchmarkData);
      if (benchmarkData.length > 0) {
        setSelectedBenchmark(benchmarkData[0].id);
      }
    } catch (error) {
      console.error('Error loading benchmarks:', error);
    }
  };
  
  /**
   * Load available filters
   */
  const loadFilters = async () => {
    try {
      // In a real app, these would come from analyzing the user's bet history
      setAvailableSports(['Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer']);
      setAvailableBetTypes(['Moneyline', 'Spread', 'Over/Under', 'Parlay', 'Prop']);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };
  
  /**
   * Update comparison stats based on selected comparison type and filters
   */
  const updateComparisonStats = async () => {
    try {
      switch (comparisonType) {
        case ComparisonType.TIME_PERIOD:
          await loadPreviousPeriodStats();
          break;
        case ComparisonType.BENCHMARK:
          loadBenchmarkStats();
          break;
        case ComparisonType.SPORT:
          await loadSportFilteredStats();
          break;
        case ComparisonType.BET_TYPE:
          await loadBetTypeFilteredStats();
          break;
      }
    } catch (error) {
      console.error('Error updating comparison stats:', error);
    }
  };
  
  /**
   * Load stats from previous time period
   */
  const loadPreviousPeriodStats = async () => {
    try {
      // Calculate previous period based on current period
      const previousPeriod = calculatePreviousPeriod(currentTimePeriod);
      
      // In a real app, this would fetch data from the analytics service
      // For now, we'll simulate it with slightly worse performance
      const previousStats: BettingStats = {
        ...currentStats,
        totalBets: Math.round(currentStats.totalBets * 0.8),
        winningBets: Math.round(currentStats.winningBets * 0.7),
        losingBets: Math.round(currentStats.losingBets * 0.9),
        totalWagered: currentStats.totalWagered * 0.85,
        totalReturns: currentStats.totalReturns * 0.75,
        netProfit: currentStats.totalReturns * 0.75 - currentStats.totalWagered * 0.85,
        roi: ((currentStats.totalReturns * 0.75 - currentStats.totalWagered * 0.85) / (currentStats.totalWagered * 0.85)) * 100,
        winRate: (Math.round(currentStats.winningBets * 0.7) / (Math.round(currentStats.winningBets * 0.7) + Math.round(currentStats.losingBets * 0.9))) * 100,
        averageOdds: currentStats.averageOdds * 0.95,
        streaks: {
          currentStreak: 0,
          longestWinStreak: currentStats.streaks.longestWinStreak - 1,
          longestLoseStreak: currentStats.streaks.longestLoseStreak + 1
        }
      };
      
      setComparisonStats(previousStats);
      setComparisonLabel(`Previous ${getPeriodLabel(currentTimePeriod.period)}`);
    } catch (error) {
      console.error('Error loading previous period stats:', error);
    }
  };
  
  /**
   * Load benchmark stats
   */
  const loadBenchmarkStats = () => {
    try {
      const benchmark = benchmarks.find(b => b.id === selectedBenchmark);
      if (benchmark) {
        setComparisonStats(benchmark.stats);
        setComparisonLabel(benchmark.name);
      }
    } catch (error) {
      console.error('Error loading benchmark stats:', error);
    }
  };
  
  /**
   * Load stats filtered by sport
   */
  const loadSportFilteredStats = async () => {
    try {
      if (!sportFilter) return;
      
      // In a real app, this would fetch data from the analytics service
      // For now, we'll simulate it with different performance per sport
      const sportMultipliers: Record<string, number> = {
        'Football': 1.2,
        'Basketball': 0.9,
        'Baseball': 1.1,
        'Hockey': 0.8,
        'Soccer': 1.3
      };
      
      const multiplier = sportMultipliers[sportFilter] || 1;
      
      const sportStats: BettingStats = {
        ...currentStats,
        totalBets: Math.round(currentStats.totalBets * 0.3),
        winningBets: Math.round(currentStats.winningBets * 0.3 * multiplier),
        losingBets: Math.round(currentStats.totalBets * 0.3) - Math.round(currentStats.winningBets * 0.3 * multiplier),
        totalWagered: currentStats.totalWagered * 0.3,
        totalReturns: currentStats.totalReturns * 0.3 * multiplier,
        netProfit: (currentStats.totalReturns * 0.3 * multiplier) - (currentStats.totalWagered * 0.3),
        roi: (((currentStats.totalReturns * 0.3 * multiplier) - (currentStats.totalWagered * 0.3)) / (currentStats.totalWagered * 0.3)) * 100,
        winRate: (Math.round(currentStats.winningBets * 0.3 * multiplier) / Math.round(currentStats.totalBets * 0.3)) * 100,
        averageOdds: currentStats.averageOdds * (multiplier * 0.8 + 0.2),
        streaks: {
          currentStreak: multiplier > 1 ? 2 : -1,
          longestWinStreak: Math.round(currentStats.streaks.longestWinStreak * multiplier),
          longestLoseStreak: Math.round(currentStats.streaks.longestLoseStreak * (2 - multiplier))
        }
      };
      
      setComparisonStats(sportStats);
      setComparisonLabel(`${sportFilter} Bets`);
    } catch (error) {
      console.error('Error loading sport filtered stats:', error);
    }
  };
  
  /**
   * Load stats filtered by bet type
   */
  const loadBetTypeFilteredStats = async () => {
    try {
      if (!betTypeFilter) return;
      
      // In a real app, this would fetch data from the analytics service
      // For now, we'll simulate it with different performance per bet type
      const betTypeMultipliers: Record<string, number> = {
        'Moneyline': 1.1,
        'Spread': 0.95,
        'Over/Under': 1.05,
        'Parlay': 0.7,
        'Prop': 1.2
      };
      
      const multiplier = betTypeMultipliers[betTypeFilter] || 1;
      
      const betTypeStats: BettingStats = {
        ...currentStats,
        totalBets: Math.round(currentStats.totalBets * 0.25),
        winningBets: Math.round(currentStats.winningBets * 0.25 * multiplier),
        losingBets: Math.round(currentStats.totalBets * 0.25) - Math.round(currentStats.winningBets * 0.25 * multiplier),
        totalWagered: currentStats.totalWagered * 0.25,
        totalReturns: currentStats.totalReturns * 0.25 * multiplier,
        netProfit: (currentStats.totalReturns * 0.25 * multiplier) - (currentStats.totalWagered * 0.25),
        roi: (((currentStats.totalReturns * 0.25 * multiplier) - (currentStats.totalWagered * 0.25)) / (currentStats.totalWagered * 0.25)) * 100,
        winRate: (Math.round(currentStats.winningBets * 0.25 * multiplier) / Math.round(currentStats.totalBets * 0.25)) * 100,
        averageOdds: currentStats.averageOdds * (multiplier * 0.5 + 0.5),
        streaks: {
          currentStreak: multiplier > 1 ? 3 : -2,
          longestWinStreak: Math.round(currentStats.streaks.longestWinStreak * multiplier),
          longestLoseStreak: Math.round(currentStats.streaks.longestLoseStreak * (2 - multiplier))
        }
      };
      
      setComparisonStats(betTypeStats);
      setComparisonLabel(`${betTypeFilter} Bets`);
    } catch (error) {
      console.error('Error loading bet type filtered stats:', error);
    }
  };
  
  /**
   * Calculate previous time period based on current period
   */
  const calculatePreviousPeriod = (current: TimePeriodFilter): TimePeriodFilter => {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    switch (current.period) {
      case 'today':
        // Previous day
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        return { period: 'custom', customStartDate: startDate, customEndDate: endDate };
      
      case 'week':
        // Previous week
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - 7);
        endDate.setHours(23, 59, 59, 999);
        return { period: 'custom', customStartDate: startDate, customEndDate: endDate };
      
      case 'month':
        // Previous month
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 2);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() - 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        return { period: 'custom', customStartDate: startDate, customEndDate: endDate };
      
      case 'year':
        // Previous year
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 2);
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() - 1);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        return { period: 'custom', customStartDate: startDate, customEndDate: endDate };
      
      case 'custom':
        if (current.customStartDate && current.customEndDate) {
          const duration = current.customEndDate.getTime() - current.customStartDate.getTime();
          startDate = new Date(current.customStartDate.getTime() - duration);
          endDate = new Date(current.customStartDate.getTime() - 1);
          return { period: 'custom', customStartDate: startDate, customEndDate: endDate };
        }
        return { period: 'month' };
      
      default:
        return { period: 'month' };
    }
  };
  
  /**
   * Get human-readable label for time period
   */
  const getPeriodLabel = (period: TimePeriodFilter['period']): string => {
    switch (period) {
      case 'today': return 'Day';
      case 'week': return 'Week';
      case 'month': return 'Month';
      case 'year': return 'Year';
      case 'all': return 'All Time';
      case 'custom': return 'Period';
      default: return 'Period';
    }
  };
  
  /**
   * Handle comparison type selection
   */
  const handleComparisonTypeSelect = (type: ComparisonType) => {
    setComparisonType(type);
  };
  
  /**
   * Handle benchmark selection
   */
  const handleBenchmarkSelect = (benchmarkId: string) => {
    setSelectedBenchmark(benchmarkId);
  };
  
  /**
   * Handle sport filter selection
   */
  const handleSportSelect = (sport: string) => {
    setSportFilter(sport);
  };
  
  /**
   * Handle bet type filter selection
   */
  const handleBetTypeSelect = (betType: string) => {
    setBetTypeFilter(betType);
  };
  
  /**
   * Handle comparison time period change
   */
  const handleComparisonTimePeriodChange = (period: TimePeriodFilter['period'] | 'custom') => {
    setComparisonTimePeriod({
      ...comparisonTimePeriod,
      period: period === 'custom' ? 'custom' : period as TimePeriodFilter['period']
    });
  };
  
  /**
   * Handle comparison custom date range selection
   */
  const handleComparisonCustomRangeSelect = (startDate: Date, endDate: Date) => {
    setComparisonTimePeriod({
      period: 'custom',
      customStartDate: startDate,
      customEndDate: endDate
    });
  };
  
  /**
   * Format currency value
   */
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  /**
   * Format percentage value
   */
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  /**
   * Calculate percentage change between two values
   */
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  
  /**
   * Get color based on change value (green for positive, red for negative)
   */
  const getChangeColor = (change: number, inverse: boolean = false): string => {
    if (change === 0) return textColor;
    const isPositive = change > 0;
    return (isPositive && !inverse) || (!isPositive && inverse) ? '#4CAF50' : '#F44336';
  };
  
  /**
   * Render comparison type selector
   */
  const renderComparisonTypeSelector = () => {
    return (
      <View style={styles.selectorContainer}>
        <ThemedText style={styles.sectionTitle}>Compare Against</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScrollView}>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              comparisonType === ComparisonType.TIME_PERIOD && styles.selectedSelectorButton
            ]}
            onPress={() => handleComparisonTypeSelect(ComparisonType.TIME_PERIOD)}
          >
            <ThemedText
              style={[
                styles.selectorButtonText,
                comparisonType === ComparisonType.TIME_PERIOD && styles.selectedSelectorButtonText
              ]}
            >
              Previous Period
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.selectorButton,
              comparisonType === ComparisonType.BENCHMARK && styles.selectedSelectorButton
            ]}
            onPress={() => handleComparisonTypeSelect(ComparisonType.BENCHMARK)}
          >
            <ThemedText
              style={[
                styles.selectorButtonText,
                comparisonType === ComparisonType.BENCHMARK && styles.selectedSelectorButtonText
              ]}
            >
              Benchmark
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.selectorButton,
              comparisonType === ComparisonType.SPORT && styles.selectedSelectorButton
            ]}
            onPress={() => handleComparisonTypeSelect(ComparisonType.SPORT)}
          >
            <ThemedText
              style={[
                styles.selectorButtonText,
                comparisonType === ComparisonType.SPORT && styles.selectedSelectorButtonText
              ]}
            >
              By Sport
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.selectorButton,
              comparisonType === ComparisonType.BET_TYPE && styles.selectedSelectorButton
            ]}
            onPress={() => handleComparisonTypeSelect(ComparisonType.BET_TYPE)}
          >
            <ThemedText
              style={[
                styles.selectorButtonText,
                comparisonType === ComparisonType.BET_TYPE && styles.selectedSelectorButtonText
              ]}
            >
              By Bet Type
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };
  
  /**
   * Render comparison options based on selected comparison type
   */
  const renderComparisonOptions = () => {
    switch (comparisonType) {
      case ComparisonType.TIME_PERIOD:
        return (
          <View style={styles.optionsContainer}>
            <ThemedText style={styles.optionsTitle}>Select Comparison Period</ThemedText>
            <DateRangeSelector
              timePeriod={comparisonTimePeriod.period}
              startDate={comparisonTimePeriod.customStartDate}
              endDate={comparisonTimePeriod.customEndDate}
              onSelectPeriod={handleComparisonTimePeriodChange}
              onSelectCustomRange={handleComparisonCustomRangeSelect}
            />
          </View>
        );
      
      case ComparisonType.BENCHMARK:
        return (
          <View style={styles.optionsContainer}>
            <ThemedText style={styles.optionsTitle}>Select Benchmark</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
              {benchmarks.map(benchmark => (
                <TouchableOpacity
                  key={benchmark.id}
                  style={[
                    styles.optionButton,
                    selectedBenchmark === benchmark.id && styles.selectedOptionButton
                  ]}
                  onPress={() => handleBenchmarkSelect(benchmark.id)}
                >
                  <ThemedText
                    style={[
                      styles.optionButtonText,
                      selectedBenchmark === benchmark.id && styles.selectedOptionButtonText
                    ]}
                  >
                    {benchmark.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      
      case ComparisonType.SPORT:
        return (
          <View style={styles.optionsContainer}>
            <ThemedText style={styles.optionsTitle}>Select Sport</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
              {availableSports.map(sport => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.optionButton,
                    sportFilter === sport && styles.selectedOptionButton
                  ]}
                  onPress={() => handleSportSelect(sport)}
                >
                  <ThemedText
                    style={[
                      styles.optionButtonText,
                      sportFilter === sport && styles.selectedOptionButtonText
                    ]}
                  >
                    {sport}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      
      case ComparisonType.BET_TYPE:
        return (
          <View style={styles.optionsContainer}>
            <ThemedText style={styles.optionsTitle}>Select Bet Type</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScrollView}>
              {availableBetTypes.map(betType => (
                <TouchableOpacity
                  key={betType}
                  style={[
                    styles.optionButton,
                    betTypeFilter === betType && styles.selectedOptionButton
                  ]}
                  onPress={() => handleBetTypeSelect(betType)}
                >
                  <ThemedText
                    style={[
                      styles.optionButtonText,
                      betTypeFilter === betType && styles.selectedOptionButtonText
                    ]}
                  >
                    {betType}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  /**
   * Render comparison results
   */
  const renderComparisonResults = () => {
    if (!comparisonStats) return null;
    
    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultsTitle}>Comparison Results</ThemedText>
          <ThemedText style={styles.resultsSubtitle}>
            Current vs. {comparisonLabel}
          </ThemedText>
        </View>
        
        <View style={styles.metricsContainer}>
          {/* ROI */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>ROI</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {formatPercentage(currentStats.roi)}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {formatPercentage(comparisonStats.roi)}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(currentStats.roi, comparisonStats.roi)
                )}
              </View>
            </View>
          </View>
          
          {/* Win Rate */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Win Rate</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {formatPercentage(currentStats.winRate)}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {formatPercentage(comparisonStats.winRate)}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(currentStats.winRate, comparisonStats.winRate)
                )}
              </View>
            </View>
          </View>
          
          {/* Net Profit */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Net Profit</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {formatCurrency(currentStats.netProfit)}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {formatCurrency(comparisonStats.netProfit)}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(currentStats.netProfit, comparisonStats.netProfit)
                )}
              </View>
            </View>
          </View>
          
          {/* Average Odds */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Average Odds</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {currentStats.averageOdds.toFixed(2)}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {comparisonStats.averageOdds.toFixed(2)}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(currentStats.averageOdds, comparisonStats.averageOdds)
                )}
              </View>
            </View>
          </View>
          
          {/* Total Bets */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Total Bets</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {currentStats.totalBets}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {comparisonStats.totalBets}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(currentStats.totalBets, comparisonStats.totalBets)
                )}
              </View>
            </View>
          </View>
          
          {/* Longest Win Streak */}
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Longest Win Streak</ThemedText>
            <View style={styles.metricValues}>
              <ThemedText style={styles.currentValue}>
                {currentStats.streaks.longestWinStreak}
              </ThemedText>
              <View style={styles.comparisonValue}>
                <ThemedText style={styles.comparisonValueText}>
                  {comparisonStats.streaks.longestWinStreak}
                </ThemedText>
                {renderChangeIndicator(
                  calculateChange(
                    currentStats.streaks.longestWinStreak,
                    comparisonStats.streaks.longestWinStreak
                  )
                )}
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.insightsContainer}>
          <ThemedText style={styles.insightsTitle}>Key Insights</ThemedText>
          <View style={styles.insightsList}>
            {generateInsights().map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Ionicons
                  name={insight.icon}
                  size={20}
                  color={insight.color}
                  style={styles.insightIcon}
                />
                <ThemedText style={styles.insightText}>{insight.text}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };
  
  /**
   * Render change indicator (up or down arrow with percentage)
   */
  const renderChangeIndicator = (change: number, inverse: boolean = false) => {
    const formattedChange = Math.abs(change).toFixed(1);
    const color = getChangeColor(change, inverse);
    const iconName = change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'remove';
    
    return (
      <View style={[styles.changeIndicator, { backgroundColor: `${color}20` }]}>
        <Ionicons name={iconName} size={12} color={color} />
        <ThemedText style={[styles.changeText, { color }]}>
          {formattedChange}%
        </ThemedText>
      </View>
    );
  };
  
  /**
   * Insight interface
   */
  interface Insight {
    icon: any; // Using any to avoid TypeScript errors with Ionicons
    color: string;
    text: string;
  }
  
  /**
   * Generate insights based on comparison
   */
  const generateInsights = (): Insight[] => {
    if (!comparisonStats) return [];
    
    const insights: Insight[] = [];
    
    // ROI comparison
    const roiChange = calculateChange(currentStats.roi, comparisonStats.roi);
    if (roiChange > 10) {
      insights.push({
        icon: 'trending-up' as any,
        color: '#4CAF50',
        text: `Your ROI has improved by ${Math.abs(roiChange).toFixed(1)}% compared to ${comparisonLabel.toLowerCase()}.`
      });
    } else if (roiChange < -10) {
      insights.push({
        icon: 'trending-down' as any,
        color: '#F44336',
        text: `Your ROI has decreased by ${Math.abs(roiChange).toFixed(1)}% compared to ${comparisonLabel.toLowerCase()}.`
      });
    }
    
    // Win rate comparison
    const winRateChange = calculateChange(currentStats.winRate, comparisonStats.winRate);
    if (winRateChange > 5) {
      insights.push({
        icon: 'checkmark-circle' as any,
        color: '#4CAF50',
        text: `Your win rate has improved by ${Math.abs(winRateChange).toFixed(1)}% compared to ${comparisonLabel.toLowerCase()}.`
      });
    } else if (winRateChange < -5) {
      insights.push({
        icon: 'close-circle' as any,
        color: '#F44336',
        text: `Your win rate has decreased by ${Math.abs(winRateChange).toFixed(1)}% compared to ${comparisonLabel.toLowerCase()}.`
      });
    }
    
    // Average odds comparison
    const oddsChange = calculateChange(currentStats.averageOdds, comparisonStats.averageOdds);
    if (oddsChange > 10) {
      insights.push({
        icon: 'stats-chart' as any,
        color: '#FF9800',
        text: `You're taking more risks with ${Math.abs(oddsChange).toFixed(1)}% higher average odds compared to ${comparisonLabel.toLowerCase()}.`
      });
    } else if (oddsChange < -10) {
      insights.push({
        icon: 'shield-checkmark' as any,
        color: '#2196F3',
        text: `You're being more conservative with ${Math.abs(oddsChange).toFixed(1)}% lower average odds compared to ${comparisonLabel.toLowerCase()}.`
      });
    }
    
    // Volume comparison
    const volumeChange = calculateChange(currentStats.totalBets, comparisonStats.totalBets);
    if (volumeChange > 20) {
      insights.push({
        icon: 'flash' as any,
        color: '#9C27B0',
        text: `You're placing ${Math.abs(volumeChange).toFixed(1)}% more bets compared to ${comparisonLabel.toLowerCase()}.`
      });
    } else if (volumeChange < -20) {
      insights.push({
        icon: 'hourglass' as any,
        color: '#607D8B',
        text: `You're placing ${Math.abs(volumeChange).toFixed(1)}% fewer bets compared to ${comparisonLabel.toLowerCase()}.`
      });
    }
    
    // If no significant changes, add a generic insight
    if (insights.length === 0) {
      insights.push({
        icon: 'information-circle' as any,
        color: '#2196F3',
        text: `Your betting performance is similar to ${comparisonLabel.toLowerCase()} with no significant changes.`
      });
    }
    
    return insights;
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Comparative Analysis</ThemedText>
      
      {renderComparisonTypeSelector()}
      {renderComparisonOptions()}
      {renderComparisonResults()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectorScrollView: {
    flexDirection: 'row',
  },
  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  selectedSelectorButton: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  selectorButtonText: {
    fontSize: 14,
  },
  selectedSelectorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsScrollView: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  selectedOptionButton: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  optionButtonText: {
    fontSize: 14,
  },
  selectedOptionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValues: {
    flexDirection: 'column',
  },
  currentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comparisonValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonValueText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    fontSize: 12,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  insightsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightsList: {
    flexDirection: 'column',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    fontSize: 14,
    flex: 1,
  },
});

export default ComparativeAnalysis;