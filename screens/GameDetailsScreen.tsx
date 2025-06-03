import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';

// Define route params type
type GameDetailsParams = {
  gameId: string;
};

const GameDetailsScreen = () => {
  const route = useRoute<RouteProp<Record<string, GameDetailsParams>, string>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [game, setGame] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get game ID from route params
  const { gameId } = route.params || {};

  // Load game data from API
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);

        if (!gameId) {
          throw new Error('No game ID provided');
        }

        // Fetch specific game from Firebase function
        const response = await fetch(
          'https://us-central1-ai-sports-edge.cloudfunctions.net/featuredGames'
        );
        const data = await response.json();

        if (data.success) {
          // Find the specific game by ID
          const foundGame = data.games.find(g => g.id === gameId);
          if (foundGame) {
            setGame(foundGame);
          } else {
            throw new Error('Game not found');
          }
        } else {
          throw new Error('Failed to fetch game data');
        }
      } catch (error) {
        console.error('Error loading game details:', error);
        // Set game to null instead of mock data
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render loading state
  if (loading) {
    return (
      <AccessibleThemedView
        style={styles.loadingContainer}
        accessibilityLabel={t('common.loading_screen')}
        accessibilityRole="progressbar"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AccessibleThemedText
          style={styles.loadingText}
          type="bodyStd"
          accessibilityLabel={t('common.loading')}
        >
          {t('common.loading')}
        </AccessibleThemedText>
      </AccessibleThemedView>
    );
  }

  // Render error state if game not found
  if (!game) {
    return (
      <AccessibleThemedView
        style={styles.errorContainer}
        accessibilityLabel={t('games.error_screen')}
        accessibilityRole="alert"
      >
        <Ionicons name="alert-circle-outline" size={64} color={colors.text} />
        <AccessibleThemedText
          style={styles.errorText}
          type="h2"
          accessibilityLabel={t('games.game_not_found')}
        >
          {t('games.game_not_found')}
        </AccessibleThemedText>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <AccessibleThemedText style={styles.backButtonText} type="button">
            {t('common.back')}
          </AccessibleThemedText>
        </TouchableOpacity>
      </AccessibleThemedView>
    );
  }

  return (
    <AccessibleThemedView
      style={styles.container}
      accessibilityLabel={t('games.game_details_screen')}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <AccessibleThemedText
          style={styles.headerTitle}
          type="h1"
          accessibilityLabel={`${game.homeTeam.name} ${t('common.versus')} ${game.awayTeam.name}`}
        >
          {game.homeTeam.name} vs {game.awayTeam.name}
        </AccessibleThemedText>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <AccessibleThemedText
            style={[
              styles.tabText,
              activeTab === 'overview' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
            type="button"
            accessibilityLabel={t('games.overview')}
          >
            {t('games.overview')}
          </AccessibleThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stats' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <AccessibleThemedText
            style={[
              styles.tabText,
              activeTab === 'stats' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
            type="button"
            accessibilityLabel={t('games.stats')}
          >
            {t('games.stats')}
          </AccessibleThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'players' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('players')}
        >
          <AccessibleThemedText
            style={[
              styles.tabText,
              activeTab === 'players' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
            type="button"
            accessibilityLabel={t('games.players')}
          >
            {t('games.players')}
          </AccessibleThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.scoreboardContainer}>
          <View style={styles.teamContainer}>
            <AccessibleThemedText
              style={styles.teamLogo}
              type="h2"
              accessibilityLabel={`${t('game.home_team_logo')}`}
            >
              {game.homeTeam.logo}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamName}
              type="h3"
              accessibilityLabel={`${t('game.home_team')}: ${game.homeTeam.name}`}
            >
              {game.homeTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamScore}
              type="h1"
              accessibilityLabel={`${t('game.home_team_score')}: ${game.homeTeam.score}`}
            >
              {game.homeTeam.score}
            </AccessibleThemedText>
          </View>

          <View style={styles.gameInfoContainer}>
            <AccessibleThemedText
              style={styles.gameStatus}
              type="bodyStd"
              accessibilityLabel={`${t('game.status')}: ${
                game.status === 'live' ? t('game.live') : t('game.final')
              }`}
            >
              {game.status === 'live' ? 'LIVE' : 'FINAL'}
            </AccessibleThemedText>
          </View>

          <View style={styles.teamContainer}>
            <AccessibleThemedText
              style={styles.teamLogo}
              type="h2"
              accessibilityLabel={`${t('game.away_team_logo')}`}
            >
              {game.awayTeam.logo}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamName}
              type="h3"
              accessibilityLabel={`${t('game.away_team')}: ${game.awayTeam.name}`}
            >
              {game.awayTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamScore}
              type="h1"
              accessibilityLabel={`${t('game.away_team_score')}: ${game.awayTeam.score}`}
            >
              {game.awayTeam.score}
            </AccessibleThemedText>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <AccessibleThemedText
            style={styles.infoCardTitle}
            type="h3"
            accessibilityLabel={t('games.game_info')}
          >
            {t('games.game_info')}
          </AccessibleThemedText>
          <View style={styles.infoRow}>
            <AccessibleThemedText
              style={styles.infoLabel}
              type="bodyStd"
              accessibilityLabel={t('games.venue')}
            >
              {t('games.venue')}:
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.infoValue}
              type="bodyStd"
              accessibilityLabel={game.venue}
            >
              {game.venue}
            </AccessibleThemedText>
          </View>
          <View style={styles.infoRow}>
            <AccessibleThemedText
              style={styles.infoLabel}
              type="bodyStd"
              accessibilityLabel={t('games.date')}
            >
              {t('games.date')}:
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.infoValue}
              type="bodyStd"
              accessibilityLabel={formatDate(game.date)}
            >
              {formatDate(game.date)}
            </AccessibleThemedText>
          </View>
        </View>
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButtonContainer: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  teamContainer: {
    flex: 2,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 48,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  gameInfoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  gameStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GameDetailsScreen;
