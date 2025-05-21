import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, FlatList, SafeAreaView } from 'react-native';
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

interface PropTypeFilter {
  id: string;
  name: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  team: string;
  opponent: string;
  gameTime: string;
  image?: any;
}

interface PropBet {
  id: string;
  player: PlayerInfo;
  propType: string;
  line: number;
  prediction: number;
  confidence: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  seasonAverage: number;
  last10Average: number;
  overRate: string;
  lastGames: number[];
  aiAnalysis: string;
  recommendation: 'OVER' | 'UNDER';
}

interface TopPropBet {
  id: string;
  player: PlayerInfo;
  propType: string;
  line: number;
  recommendation: 'OVER' | 'UNDER';
  average: number;
  last5Average: number;
  confidence: number;
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

  // Sample data for featured prop bet
  const featuredPropBet: PropBet = {
    id: 'prop1',
    player: {
      id: 'player1',
      name: 'Luka Dončić',
      team: 'Dallas Mavericks',
      opponent: 'Warriors',
      gameTime: '7:30 PM ET',
    },
    propType: 'Points',
    line: 30.5,
    prediction: 33.7,
    confidence: 72,
    confidenceLevel: 'High',
    seasonAverage: 32.4,
    last10Average: 33.7,
    overRate: '62% (8/13 games)',
    lastGames: [38, 26, 34, 29, 42, 31, 36, 28, 35, 33],
    aiAnalysis:
      'Dončić has exceeded this points line in 7 of his last 10 games. He faces a Warriors defense that ranks 18th against opposing guards, allowing 48.3 points per game to the position. His usage rate increases to 38% when playing against Golden State.',
    recommendation: 'OVER',
  };

  // Sample data for top prop bets
  const topPropBets: TopPropBet[] = [
    {
      id: 'top1',
      player: {
        id: 'player2',
        name: 'Nikola Jokić',
        team: 'Nuggets',
        opponent: 'Lakers',
        gameTime: '8:00 PM ET',
      },
      propType: 'Rebounds',
      line: 11.5,
      recommendation: 'OVER',
      average: 12.3,
      last5Average: 13.2,
      confidence: 75,
    },
    {
      id: 'top2',
      player: {
        id: 'player3',
        name: 'Stephen Curry',
        team: 'Warriors',
        opponent: 'Mavericks',
        gameTime: '7:30 PM ET',
      },
      propType: '3-Pointers',
      line: 4.5,
      recommendation: 'OVER',
      average: 5.2,
      last5Average: 6.0,
      confidence: 82,
    },
    {
      id: 'top3',
      player: {
        id: 'player4',
        name: 'LeBron James',
        team: 'Lakers',
        opponent: 'Nuggets',
        gameTime: '8:00 PM ET',
      },
      propType: 'Pts+Reb+Ast',
      line: 45.5,
      recommendation: 'UNDER',
      average: 42.7,
      last5Average: 40.2,
      confidence: 68,
    },
  ];

  // Open filter options
  const openFilters = () => {
    console.log('Open filters');
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
      onPress={() => setSelectedSport(item.id)}
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
      onPress={() => setSelectedPropType(item.id)}
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
  const renderFeaturedPropBet = () => (
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
      >
        {/* Featured Prop Bet */}
        {renderFeaturedPropBet()}

        {/* Top Prop Bets */}
        <AccessibleThemedView style={styles.topPropsSection}>
          <AccessibleThemedText style={styles.sectionTitle}>
            {t('props.topPlayerProps').toUpperCase()}
          </AccessibleThemedText>
          <FlatList
            data={topPropBets}
            renderItem={renderTopPropBet}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
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
});

export default PropsEdgeScreen;
