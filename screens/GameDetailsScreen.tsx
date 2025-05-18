import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../atomic/organisms/i18n/LanguageContext';
import { ThemedView } from '../atomic/atoms/ThemedView';
import { ThemedText } from '../atomic/atoms/ThemedText';

// Define route params type
type GameDetailsParams = {
  gameId: string;
};

// Mock game data
const MOCK_GAME = {
  id: 'game1',
  homeTeam: {
    id: 'team1',
    name: 'Lakers',
    logo: '🏀',
    score: 105,
  },
  awayTeam: {
    id: 'team2',
    name: 'Warriors',
    logo: '🏀',
    score: 98,
  },
  status: 'completed',
  date: new Date(2025, 2, 20, 19, 30),
  venue: 'Staples Center',
};

const GameDetailsScreen = () => {
  const route = useRoute<RouteProp<Record<string, GameDetailsParams>, string>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [game, setGame] = useState<typeof MOCK_GAME | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get game ID from route params
  const { gameId } = route.params || {};

  // Load game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);

        // In a real app, this would be an API call
        // For now, we'll just use mock data
        setTimeout(() => {
          setGame(MOCK_GAME);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading game details:', error);
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  // Render error state if game not found
  if (!game) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text} />
        <ThemedText style={styles.errorText}>{t('games.game_not_found')}</ThemedText>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <ThemedText style={styles.backButtonText}>{t('common.back')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {game.homeTeam.name} vs {game.awayTeam.name}
        </ThemedText>
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
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'overview' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
          >
            {t('games.overview')}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stats' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'stats' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
          >
            {t('games.stats')}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'players' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('players')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'players' ? { color: colors.primary, fontWeight: 'bold' } : {},
            ]}
          >
            {t('games.players')}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.scoreboardContainer}>
          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{game.homeTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName}>{game.homeTeam.name}</ThemedText>
            <ThemedText style={styles.teamScore}>{game.homeTeam.score}</ThemedText>
          </View>

          <View style={styles.gameInfoContainer}>
            <ThemedText style={styles.gameStatus}>
              {game.status === 'live' ? 'LIVE' : 'FINAL'}
            </ThemedText>
          </View>

          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{game.awayTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName}>{game.awayTeam.name}</ThemedText>
            <ThemedText style={styles.teamScore}>{game.awayTeam.score}</ThemedText>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.infoCardTitle}>{t('games.game_info')}</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('games.venue')}:</ThemedText>
            <ThemedText style={styles.infoValue}>{game.venue}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>{t('games.date')}:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(game.date)}</ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
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
