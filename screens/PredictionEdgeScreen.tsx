import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks';
import { useTheme } from '../contexts/ThemeContext';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

// Define types for the component props and state
interface SportFilter {
  id: string;
  name: string;
}

interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  record: string;
  isHome: boolean;
}

interface GamePrediction {
  id: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  time: string;
  league: string;
  homeWinProbability: number;
  awayWinProbability: number;
  recommendedBet: string;
  recommendedLine: string;
  edgeStrength: 'STRONG' | 'MODERATE' | 'SLIGHT';
}

interface LineMovementInfo {
  id: string;
  teams: string;
  openingLine: string;
  currentLine: string;
  movement: string;
  significantMove: string;
}

interface BettingActionInfo {
  id: string;
  teams: string;
  spread: string;
  publicBettingHome: number;
  publicBettingAway: number;
  moneyDistributionHome: number;
  moneyDistributionAway: number;
  sharpActionDetected: boolean;
  sharpActionMessage: string;
}

interface KellyCalculation {
  id: string;
  game: string;
  selection: string;
  recommendedAmount: number;
  bankrollPercentage: number;
  winProbability: number;
  marketPrice: string;
  expectedValue: string;
  strategy: string;
}

/**
 * PredictionEdgeScreen Component
 * 
 * Displays AI-powered predictions, line movements, betting action, and Kelly calculations
 * for sports betting insights.
 */
const PredictionEdgeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState('all');

  // Sample data for sports filters
  const sportFilters: SportFilter[] = [
    { id: 'all', name: t('sports.all') },
    { id: 'nba', name: t('sports.nba') },
    { id: 'mlb', name: t('sports.mlb') },
    { id: 'nhl', name: t('sports.nhl') },
    { id: 'nfl', name: t('sports.nfl') },
    { id: 'soccer', name: t('sports.soccer') },
  ];

  // Sample data for game predictions
  const gamePredictions: GamePrediction[] = [
    {
      id: 'game1',
      homeTeam: {
        id: 'mia',
        name: 'Miami Heat',
        abbreviation: 'MIA',
        record: '42-28',
        isHome: true,
      },
      awayTeam: {
        id: 'chi',
        name: 'Chicago Bulls',
        abbreviation: 'CHI',
        record: '35-36',
        isHome: false,
      },
      time: '7:00 PM ET',
      league: 'NBA',
      homeWinProbability: 65,
      awayWinProbability: 35,
      recommendedBet: 'MIA -4.5',
      recommendedLine: 'MIA -4.5',
      edgeStrength: 'STRONG',
    },
  ];

  // Sample data for line movements
  const lineMovements: LineMovementInfo[] = [
    {
      id: 'line1',
      teams: 'Lakers vs Warriors',
      openingLine: 'LAL -2.5',
      currentLine: 'LAL -4.5',
      movement: '+2.0 Lakers',
      significantMove: '12:30 PM (-3.5 to -4.5)',
    },
  ];

  // Sample data for betting action
  const bettingActions: BettingActionInfo[] = [
    {
      id: 'action1',
      teams: 'Bucks vs 76ers',
      spread: 'MIL -3.5',
      publicBettingHome: 67,
      publicBettingAway: 33,
      moneyDistributionHome: 35,
      moneyDistributionAway: 65,
      sharpActionDetected: true,
      sharpActionMessage: 'Big money is on Philadelphia despite lower ticket volume. This indicates professional interest against the public.',
    },
  ];

  // Sample data for Kelly calculations
  const kellyCalculations: KellyCalculation[] = [
    {
      id: 'kelly1',
      game: 'Lakers vs Warriors',
      selection: 'Warriors +4.5',
      recommendedAmount: 42,
      bankrollPercentage: 4.2,
      winProbability: 56,
      marketPrice: '-110',
      expectedValue: '+2.8%',
      strategy: 'This is a moderate-sized allocation based on a modest edge. The expected value is positive but not overwhelming. Consider using this as part of a diversified approach.',
    },
  ];

  // Format date to display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Open calendar for date selection
  const openCalendar = () => {
    // Implementation for opening date picker would go here
    console.log('Open calendar');
  };

  // Open filter options
  const openFilters = () => {
    console.log('Open filters');
  };

  // Render sport filter item
  const renderSportFilter = ({ item }: { item: SportFilter }) => (
    <AccessibleTouchableOpacity
      style={[
        styles.sportFilterItem,
        {
          backgroundColor: selectedSport === item.id ? colors.primary : colors.card,
        },
      ]}
      onPress={() => setSelectedSport(item.id)}
      accessibilityLabel={t('accessibility.selectSport', { sport: item.name })}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedSport === item.id }}
    >
      <AccessibleThemedText
        style={[
          styles.sportFilterText,
          {
            color: selectedSport === item.id ? colors.background : colors.text,
          },
        ]}
      >
        {item.name}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );

  // Render game prediction card
  const renderGamePrediction = ({ item }: { item: GamePrediction }) => (
    <AccessibleThemedView style={styles.card}>
      {/* Teams Header */}
      <AccessibleThemedView style={styles.teamsHeader}>
        {/* Home Team */}
        <View style={styles.teamContainer}>
          <View style={[styles.teamLogo, { backgroundColor: colors.card }]}>
            <AccessibleThemedText style={styles.teamAbbreviation}>
              {item.homeTeam.abbreviation}
            </AccessibleThemedText>
          </View>
          <View style={styles.teamInfo}>
            <AccessibleThemedText style={styles.teamName}>
              {item.homeTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.teamRecord}>
              {t('prediction.home')} • {item.homeTeam.record}
            </AccessibleThemedText>
          </View>
        </View>

        {/* Game Time */}
        <View style={styles.gameTimeContainer}>
          <AccessibleThemedText style={styles.gameTime}>
            {item.time}
          </AccessibleThemedText>
          <AccessibleThemedText style={styles.leagueName}>
            {item.league}
          </AccessibleThemedText>
        </View>

        {/* Away Team */}
        <View style={[styles.teamContainer, styles.awayTeamContainer]}>
          <View style={styles.teamInfo}>
            <AccessibleThemedText style={[styles.teamName, styles.awayTeamName]}>
              {item.awayTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText style={[styles.teamRecord, styles.awayTeamRecord]}>
              {t('prediction.away')} • {item.awayTeam.record}
            </AccessibleThemedText>
          </View>
          <View style={[styles.teamLogo, { backgroundColor: colors.card }]}>
            <AccessibleThemedText style={styles.teamAbbreviation}>
              {item.awayTeam.abbreviation}
            </AccessibleThemedText>
          </View>
        </View>
      </AccessibleThemedView>

      {/* Prediction Content */}
      <AccessibleThemedView style={styles.predictionContent}>
        {/* Home Win Probability */}
        <View style={styles.probabilityContainer}>
          <View style={styles.probabilityCircle}>
            <View 
              style={[
                styles.probabilityFill, 
                { 
                  backgroundColor: colors.primary,
                  height: `${item.homeWinProbability}%`,
                }
              ]} 
            />
            <View style={styles.probabilityTextContainer}>
              <AccessibleThemedText style={styles.probabilityText}>
                {item.homeWinProbability}%
              </AccessibleThemedText>
            </View>
          </View>
          <AccessibleThemedText style={styles.probabilityLabel}>
            {t('prediction.winProbability')}
          </AccessibleThemedText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Recommended Bet */}
        <View style={styles.recommendationContainer}>
          <View 
            style={[
              styles.edgeIndicator, 
              { 
                backgroundColor: item.edgeStrength === 'STRONG' 
                  ? colors.success + '20' 
                  : item.edgeStrength === 'MODERATE' 
                    ? colors.warning + '20' 
                    : colors.notification + '20'
              }
            ]}
          >
            <AccessibleThemedText 
              style={[
                styles.edgeText, 
                { 
                  color: item.edgeStrength === 'STRONG' 
                    ? colors.success 
                    : item.edgeStrength === 'MODERATE' 
                      ? colors.warning 
                      : colors.notification
                }
              ]}
            >
              {t(`prediction.edge.${item.edgeStrength.toLowerCase()}`)}
            </AccessibleThemedText>
          </View>
          <AccessibleThemedText style={styles.recommendedBet}>
            {item.recommendedBet}
          </AccessibleThemedText>
          <AccessibleThemedText style={styles.recommendationLabel}>
            {t('prediction.recommendedPlay')}
          </AccessibleThemedText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Away Win Probability */}
        <View style={styles.probabilityContainer}>
          <View style={styles.probabilityCircle}>
            <View 
              style={[
                styles.probabilityFill, 
                { 
                  backgroundColor: colors.secondary,
                  height: `${item.awayWinProbability}%`,
                }
              ]} 
            />
            <View style={styles.probabilityTextContainer}>
              <AccessibleThemedText style={styles.probabilityText}>
                {item.awayWinProbability}%
              </AccessibleThemedText>
            </View>
          </View>
          <AccessibleThemedText style={styles.probabilityLabel}>
            {t('prediction.winProbability')}
          </AccessibleThemedText>
        </View>
      </AccessibleThemedView>

      {/* Action Buttons */}
      <AccessibleThemedView style={styles.actionButtons}>
        <AccessibleTouchableOpacity 
          style={[styles.actionButton, { borderRightWidth: 1, borderRightColor: colors.border }]}
          accessibilityLabel={t('accessibility.viewInsights')}
          accessibilityRole="button"
        >
          <Ionicons name="link-outline" size={16} color={colors.primary} />
          <AccessibleThemedText style={[styles.actionButtonText, { color: colors.primary }]}>
            {t('prediction.insights')}
          </AccessibleThemedText>
        </AccessibleTouchableOpacity>
        <AccessibleTouchableOpacity 
          style={styles.actionButton}
          accessibilityLabel={t('accessibility.sharePrediction')}
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
          <AccessibleThemedText style={[styles.actionButtonText, { color: colors.primary }]}>
            {t('prediction.share')}
          </AccessibleThemedText>
        </AccessibleTouchableOpacity>
      </AccessibleThemedView>
    </AccessibleThemedView>
  );

  // Render line movement card
  const renderLineMovement = ({ item }: { item: LineMovementInfo }) => (
    <AccessibleThemedView style={styles.card}>
      {/* Card Header */}
      <AccessibleThemedView style={styles.cardHeader}>
        <AccessibleThemedText style={styles.cardTitle}>
          {t('prediction.lineMovement')}: {item.teams}
        </AccessibleThemedText>
        <AccessibleTouchableOpacity
          accessibilityLabel={t('accessibility.sharePrediction')}
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
        </AccessibleTouchableOpacity>
      </AccessibleThemedView>

      {/* Line Chart */}
      <AccessibleThemedView style={styles.chartContainer}>
        <AccessibleThemedView 
          style={[styles.chart, { backgroundColor: colors.card }]}
          accessibilityLabel={t('accessibility.lineMovementChart')}
          accessibilityRole="image"
        >
          {/* This would be replaced with an actual chart component */}
          <AccessibleThemedText style={styles.chartPlaceholder}>
            {t('prediction.lineChart')}
          </AccessibleThemedText>
        </AccessibleThemedView>
        <View style={styles.timeLabels}>
          <AccessibleThemedText style={styles.timeLabel}>10 AM</AccessibleThemedText>
          <AccessibleThemedText style={styles.timeLabel}>2 PM</AccessibleThemedText>
          <AccessibleThemedText style={styles.timeLabel}>6 PM</AccessibleThemedText>
        </View>
      </AccessibleThemedView>
    </AccessibleThemedView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <AccessibleThemedView style={styles.header}>
          <AccessibleThemedText style={styles.title}>
            {t('prediction.title')}
          </AccessibleThemedText>
          <AccessibleThemedText style={styles.subtitle}>
            {t('prediction.subtitle')}
          </AccessibleThemedText>
        </AccessibleThemedView>

        {/* Loading State */}
        {loading && (
          <AccessibleThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AccessibleThemedText style={styles.loadingText}>
              {t('prediction.loading')}
            </AccessibleThemedText>
          </AccessibleThemedView>
        )}

        {/* Error State */}
        {error && (
          <AccessibleThemedView style={styles.errorContainer}>
            <AccessibleThemedText style={styles.errorText}>
              {error}
            </AccessibleThemedText>
            <AccessibleTouchableOpacity
              style={styles.retryButton}
              onPress={loadPredictions}
              accessibilityLabel={t('accessibility.retry')}
              accessibilityRole="button"
            >
              <AccessibleThemedText style={styles.retryText}>
                {t('common.retry')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </AccessibleThemedView>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Featured Prediction */}
            {featuredPrediction && renderFeaturedPrediction(featuredPrediction)}

            {/* Top Predictions */}
            <AccessibleThemedView style={styles.section}>
              <AccessibleThemedText style={styles.sectionTitle}>
                {t('prediction.topPredictions')}
              </AccessibleThemedText>
              <FlatList
                data={topPredictions}
                renderItem={renderPredictionCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </AccessibleThemedView>

            {/* Line Movement */}
            <AccessibleThemedView style={styles.section}>
              <AccessibleThemedText style={styles.sectionTitle}>
                {t('prediction.lineMovement')}
              </AccessibleThemedText>
              <FlatList
                data={lineMovementData}
                renderItem={renderLineMovement}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </AccessibleThemedView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chartContainer: {
    marginTop: 8,
  },
  chart: {
    height: 120,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    fontSize: 14,
    opacity: 0.6,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  timeLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default PredictionEdgeScreen;
