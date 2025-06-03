import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks';
import { propPredictionService, PropBet, TopPropBet } from '../services/propPredictionService';

// Define types for the component props and state
interface SportFilter {
  id: string;
  name: string;
}

interface PropTypeFilter {
  id: string;
  name: string;
}

/**
 * PropsEdgeScreen Component
 *
 * Displays AI-powered player prop bet predictions and insights.
 */
const PropsEdgeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedPropType, setSelectedPropType] = useState('points');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPropBet, setFeaturedPropBet] = useState<PropBet | null>(null);
  const [topPropBets, setTopPropBets] = useState<TopPropBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample data for sports filters
  const sportFilters: SportFilter[] = [
    { id: 'nba', name: t('sports.nba') },
    { id: 'mlb', name: t('sports.mlb') },
    { id: 'nfl', name: t('sports.nfl') },
    { id: 'nhl', name: t('sports.nhl') },
  ];

  // Sample data for prop type filters
  const propTypeFilters: PropTypeFilter[] = [
    { id: 'points', name: t('props.points') },
    { id: 'rebounds', name: t('props.rebounds') },
    { id: 'assists', name: t('props.assists') },
    { id: 'pra', name: t('props.ptsRebAst') },
    { id: 'threes', name: t('props.threePointers') },
  ];

  // Load real prop predictions
  useEffect(() => {
    loadPropPredictions();
  }, [selectedSport, selectedPropType]);

  const loadPropPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load featured prop and top props in parallel
      const [featured, topProps] = await Promise.all([
        propPredictionService.getFeaturedPropPrediction(selectedSport),
        propPredictionService.getTopPropPredictions(3, selectedSport),
      ]);

      setFeaturedPropBet(featured);
      setTopPropBets(topProps);
    } catch (err) {
      console.error('Error loading prop predictions:', err);
      setError('Failed to load predictions. Using cached data.');

      // Fallback to service's built-in fallback data
      const fallbackFeatured = await propPredictionService.getFeaturedPropPrediction(selectedSport);
      const fallbackTop = await propPredictionService.getTopPropPredictions(3, selectedSport);

      setFeaturedPropBet(fallbackFeatured);
      setTopPropBets(fallbackTop);
    } finally {
      setLoading(false);
    }
  };

  // Open filter options
  const openFilters = () => {
    console.log('Open filters');
    // TODO: Implement filter modal
  };

  // Handle sport selection change
  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    // loadPropPredictions will be called by useEffect
  };

  // Handle prop type selection change
  const handlePropTypeChange = (propTypeId: string) => {
    setSelectedPropType(propTypeId);
    // Could filter existing predictions or reload
  };

  // Render sport filter item
  const renderSportFilter = ({ item }: { item: SportFilter }) => (
    <AccessibleTouchableOpacity
      style={[
        styles.filterItem,
        {
          backgroundColor: selectedSport === item.id ? colors.primary : colors.card,
        },
      ]}
      onPress={() => handleSportChange(item.id)}
      accessibilityLabel={t('accessibility.selectSport', { sport: item.name })}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedSport === item.id }}
    >
      <AccessibleThemedText
        style={[
          styles.filterText,
          {
            color: selectedSport === item.id ? colors.background : colors.text,
          },
        ]}
      >
        {item.name}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );

  // Render prop type filter item
  const renderPropTypeFilter = ({ item }: { item: PropTypeFilter }) => (
    <AccessibleTouchableOpacity
      style={[
        styles.filterItem,
        {
          backgroundColor: selectedPropType === item.id ? colors.primary : colors.card,
        },
      ]}
      onPress={() => handlePropTypeChange(item.id)}
      accessibilityLabel={t('accessibility.selectPropType', { propType: item.name })}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedPropType === item.id }}
    >
      <AccessibleThemedText
        style={[
          styles.filterText,
          {
            color: selectedPropType === item.id ? colors.background : colors.text,
          },
        ]}
      >
        {item.name}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );

  // Render featured prop bet card
  const renderFeaturedPropBet = () => {
    if (!featuredPropBet) {
      return (
        <AccessibleThemedView style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AccessibleThemedText style={styles.loadingText}>
            Loading prop predictions...
          </AccessibleThemedText>
        </AccessibleThemedView>
      );
    }

    return (
      <AccessibleThemedView style={styles.card}>
        {/* Player Header */}
        <AccessibleThemedView style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <View style={[styles.playerAvatar, { backgroundColor: colors.card }]} />
            <View style={styles.playerDetails}>
              <AccessibleThemedText style={styles.playerName}>
                {featuredPropBet.player.name}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.playerTeam}>
                {featuredPropBet.player.team} • vs. {featuredPropBet.player.opponent} •{' '}
                {featuredPropBet.player.gameTime}
              </AccessibleThemedText>
            </View>
          </View>
          <AccessibleTouchableOpacity
            accessibilityLabel={t('accessibility.sharePrediction')}
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={16} color={colors.primary} />
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* Prop Type Header */}
        <AccessibleThemedView style={[styles.propTypeHeader, { backgroundColor: colors.card }]}>
          <View style={styles.propTypeInfo}>
            <View style={[styles.propTypeIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
            </View>
            <AccessibleThemedText style={styles.propTypeName}>
              {featuredPropBet.propType}
            </AccessibleThemedText>
          </View>
          <AccessibleThemedText style={[styles.propRecommendation, { color: colors.primary }]}>
            {featuredPropBet.recommendation} {featuredPropBet.line}
          </AccessibleThemedText>
        </AccessibleThemedView>

        {/* Prop Details */}
        <AccessibleThemedView style={styles.propDetails}>
          {/* AI Prediction */}
          <View style={styles.propDetailRow}>
            <View style={styles.propDetailLabel}>
              <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}>
                <AccessibleThemedText style={[styles.aiIconText, { color: colors.background }]}>
                  AI
                </AccessibleThemedText>
              </View>
              <AccessibleThemedText style={styles.propDetailLabelText}>
                {t('props.prediction')}:
              </AccessibleThemedText>
            </View>
            <AccessibleThemedText style={styles.propDetailValue}>
              {featuredPropBet.prediction} {featuredPropBet.propType}
            </AccessibleThemedText>
          </View>

          {/* Confidence */}
          <View style={styles.propDetailRow}>
            <AccessibleThemedText style={styles.propDetailLabelText}>
              {t('props.confidence')}:
            </AccessibleThemedText>
            <AccessibleThemedText style={[styles.propDetailValue, { color: colors.success }]}>
              {t(`props.confidenceLevel.${featuredPropBet.confidenceLevel.toLowerCase()}`)} (
              {featuredPropBet.confidence}%)
            </AccessibleThemedText>
          </View>

          {/* Season Average */}
          <View style={styles.propDetailRow}>
            <AccessibleThemedText style={styles.propDetailLabelText}>
              {t('props.seasonAverage')}:
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.propDetailValue}>
              {featuredPropBet.seasonAverage} {t('props.ppg')}
            </AccessibleThemedText>
          </View>

          {/* Last 10 Games */}
          <View style={styles.propDetailRow}>
            <AccessibleThemedText style={styles.propDetailLabelText}>
              {t('props.last10Games')}:
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.propDetailValue}>
              {featuredPropBet.last10Average} {t('props.ppg')}
            </AccessibleThemedText>
          </View>

          {/* Over Rate */}
          <View style={styles.propDetailRow}>
            <AccessibleThemedText style={styles.propDetailLabelText}>
              {t('props.overRate')}:
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.propDetailValue}>
              {featuredPropBet.overRate}
            </AccessibleThemedText>
          </View>

          {/* Performance Chart */}
          <View style={styles.chartSection}>
            <AccessibleThemedText style={styles.chartTitle}>
              {t('props.last10GamesPerformance')}
            </AccessibleThemedText>
            <View style={[styles.chart, { backgroundColor: colors.card }]}>
              {/* Line representing the prop line */}
              <View
                style={[
                  styles.propLine,
                  {
                    borderColor: colors.error,
                    top: '30%',
                  },
                ]}
              />
              <View style={styles.propLineLabel}>
                <AccessibleThemedText style={[styles.propLineLabelText, { color: colors.error }]}>
                  {featuredPropBet.line}
                </AccessibleThemedText>
              </View>

              {/* Bar chart */}
              <View style={styles.barChart}>
                {featuredPropBet.lastGames.map((value, index) => (
                  <View key={index} style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor:
                            value > featuredPropBet.line ? colors.success : colors.secondary,
                          height: `${Math.min(value * 1.5, 100)}%`,
                        },
                      ]}
                    />
                    <AccessibleThemedText style={styles.barValue}>{value}</AccessibleThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* AI Analysis */}
          <AccessibleThemedView
            style={[styles.aiAnalysis, { backgroundColor: colors.primary + '20' }]}
          >
            <AccessibleThemedText style={styles.aiAnalysisTitle}>
              {t('props.aiAnalysis')}
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.aiAnalysisText}>
              {featuredPropBet.aiAnalysis}
            </AccessibleThemedText>
          </AccessibleThemedView>
        </AccessibleThemedView>
      </AccessibleThemedView>
    );
  };

  // Render top prop bet card
  const renderTopPropBet = ({ item }: { item: TopPropBet }) => (
    <AccessibleThemedView style={styles.topPropCard}>
      <View style={styles.topPropHeader}>
        <View style={styles.topPropPlayerInfo}>
          <View style={[styles.topPropPlayerAvatar, { backgroundColor: colors.card }]} />
          <View>
            <AccessibleThemedText style={styles.topPropPlayerName}>
              {item.player.name}
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.topPropPlayerTeam}>
              {item.player.team} • vs {item.player.opponent}
            </AccessibleThemedText>
          </View>
        </View>
        <View style={styles.topPropTypeInfo}>
          <AccessibleThemedText style={styles.topPropTypeLabel}>
            {item.propType}
          </AccessibleThemedText>
          <AccessibleThemedText style={[styles.topPropRecommendation, { color: colors.primary }]}>
            {item.recommendation} {item.line}
          </AccessibleThemedText>
        </View>
      </View>
      <View style={styles.topPropFooter}>
        <AccessibleThemedText style={styles.topPropStats}>
          {t('props.avg')}: {item.average} | {t('props.last5')}: {item.last5Average}
        </AccessibleThemedText>
        <View style={[styles.confidenceBadge, { backgroundColor: colors.success + '20' }]}>
          <AccessibleThemedText style={[styles.confidenceBadgeText, { color: colors.success }]}>
            {item.confidence}% {t('props.confidence')}
          </AccessibleThemedText>
        </View>
      </View>
    </AccessibleThemedView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <AccessibleThemedView style={[styles.header, { backgroundColor: colors.primary }]}>
        <AccessibleThemedText
          style={[styles.headerTitle, { color: colors.background }]}
          accessibilityRole="header"
        >
          {t('screens.propsEdge')}
        </AccessibleThemedText>
        <AccessibleTouchableOpacity
          onPress={openFilters}
          accessibilityLabel={t('accessibility.openFilters')}
          accessibilityRole="button"
        >
          <Ionicons name="filter" size={24} color={colors.background} />
        </AccessibleTouchableOpacity>
      </AccessibleThemedView>

      {/* Sport Filters */}
      <AccessibleThemedView
        style={[styles.filtersContainer, { backgroundColor: colors.background }]}
      >
        <FlatList
          data={sportFilters}
          renderItem={renderSportFilter}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </AccessibleThemedView>

      {/* Prop Type Filters */}
      <AccessibleThemedView
        style={[styles.filtersContainer, { backgroundColor: colors.background }]}
      >
        <FlatList
          data={propTypeFilters}
          renderItem={renderPropTypeFilter}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </AccessibleThemedView>

      {/* Search Bar */}
      <AccessibleThemedView
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.secondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('props.searchForPlayer')}
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel={t('accessibility.searchForPlayer')}
          />
        </View>
      </AccessibleThemedView>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadPropPredictions}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error Message */}
        {error && (
          <AccessibleThemedView
            style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}
          >
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <AccessibleThemedText style={[styles.errorText, { color: colors.error }]}>
              {error}
            </AccessibleThemedText>
          </AccessibleThemedView>
        )}

        {/* Featured Prop Bet */}
        {renderFeaturedPropBet()}

        {/* Top Prop Bets */}
        <AccessibleThemedView style={styles.topPropsSection}>
          <AccessibleThemedText style={styles.sectionTitle}>
            {t('props.topPlayerProps').toUpperCase()}
          </AccessibleThemedText>
          {loading ? (
            <AccessibleThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AccessibleThemedText style={styles.loadingText}>
                Loading top props...
              </AccessibleThemedText>
            </AccessibleThemedView>
          ) : (
            <FlatList
              data={topPropBets}
              renderItem={renderTopPropBet}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <AccessibleThemedView style={styles.emptyContainer}>
                  <AccessibleThemedText style={styles.emptyText}>
                    No prop predictions available for {selectedSport.toUpperCase()}
                  </AccessibleThemedText>
                </AccessibleThemedView>
              }
            />
          )}
        </AccessibleThemedView>
      </ScrollView>

      {/* Tab Navigation */}
      <AccessibleThemedView
        style={[
          styles.tabBar,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {['Home', 'Prediction', 'Props', 'Analytics', 'More'].map((tab, index) => (
          <AccessibleTouchableOpacity
            key={index}
            style={styles.tab}
            accessibilityLabel={t(`tabs.${tab.toLowerCase()}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected: index === 2 }}
          >
            <View style={[styles.tabIcon, { backgroundColor: colors.card }]} />
            <AccessibleThemedText
              style={[
                styles.tabLabel,
                {
                  color: index === 2 ? colors.primary : colors.secondary,
                },
              ]}
            >
              {tab}
            </AccessibleThemedText>
          </AccessibleTouchableOpacity>
        ))}
      </AccessibleThemedView>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerTeam: {
    fontSize: 12,
    marginTop: 2,
  },
  propTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  propTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  propTypeName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  propRecommendation: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  propDetails: {
    padding: 16,
  },
  propDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  aiIconText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  propDetailLabelText: {
    fontSize: 12,
  },
  propDetailValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chart: {
    height: 112,
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  propLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 10,
  },
  propLineLabel: {
    position: 'absolute',
    top: '24%',
    right: 4,
    backgroundColor: 'white',
    paddingHorizontal: 4,
  },
  propLineLabelText: {
    fontSize: 10,
  },
  barChart: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  barValue: {
    fontSize: 10,
    marginTop: 4,
  },
  aiAnalysis: {
    padding: 12,
    borderRadius: 8,
  },
  aiAnalysisTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiAnalysisText: {
    fontSize: 12,
    lineHeight: 16,
  },
  topPropsSection: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  topPropCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    marginBottom: 12,
  },
  topPropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topPropPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPropPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  topPropPlayerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topPropPlayerTeam: {
    fontSize: 12,
  },
  topPropTypeInfo: {
    alignItems: 'flex-end',
  },
  topPropTypeLabel: {
    fontSize: 12,
  },
  topPropRecommendation: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  topPropFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  topPropStats: {
    fontSize: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PropsEdgeScreen;
