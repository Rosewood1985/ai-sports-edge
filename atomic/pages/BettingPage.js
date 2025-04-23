// External imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';


import {


// Internal imports
import { MainLayout } from '../templates';
import { firebaseService } from '../organisms';
import { formatCurrency } from '../atoms/formatUtils';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';
import { useTheme } from '../molecules/themeContext';











































                      : colors.primary,
                      : colors.primary,
                      : colors.text,
                      : colors.text,
                      ? colors.onPrimary
                      ? colors.onPrimary
                      ? colors.onPrimary
                      ? colors.onPrimary
                    : colors.background,
                    : colors.background,
                    ? colors.primary
                    ? colors.primary
                    selectedTeam && selectedTeam.name === selectedGame.team1.name
                    selectedTeam && selectedTeam.name === selectedGame.team1.name
                    selectedTeam && selectedTeam.name === selectedGame.team2.name
                    selectedTeam && selectedTeam.name === selectedGame.team2.name
                    styles.betSummaryValue,
                    { color: parseFloat(betAmount) > balance ? colors.error : colors.text },
                  : colors.primary,
                  ? colors.secondary
                  ]}
                  color:
                  color:
                  color:
                  color:
                  resizeMode="contain"
                  resizeMode="contain"
                  selectedGame && selectedGame.id === game.id ? colors.primary : colors.border,
                  selectedTeam && selectedTeam.name === selectedGame.team1.name
                  selectedTeam && selectedTeam.name === selectedGame.team2.name
                  source={{ uri: game.team1.logoUrl }}
                  source={{ uri: game.team2.logoUrl }}
                  style={[
                  style={styles.teamLogo}
                  style={styles.teamLogo}
                  {formatCurrency(balance - (parseFloat(betAmount) || 0))}
                  {formatCurrency(potentialWinnings)}
                  {t('betting.potentialWinnings')}:
                  {t('betting.remainingBalance')}:
                !betAmount ||
                !selectedTeam ||
                />
                />
                </Text>
                </Text>
                </Text>
                </Text>
                <Image
                <Image
                <Text
                <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
                <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
                <Text style={[styles.betSummaryValue, { color: colors.success }]}>
                <Text style={[styles.teamName, { color: colors.text }]}>{game.team1.name}</Text>
                <Text style={[styles.teamName, { color: colors.text }]}>{game.team2.name}</Text>
                >
                backgroundColor:
                backgroundColor:
                backgroundColor: colors.background,
                backgroundColor: colors.surface,
                borderColor:
                borderColor: colors.border,
                borderColor: colors.border,
                borderColor: colors.border,
                color: colors.text,
                parseFloat(betAmount) <= 0 ||
                parseFloat(betAmount) > balance ||
                styles.teamSelectionName,
                styles.teamSelectionName,
                styles.teamSelectionOdds,
                styles.teamSelectionOdds,
                submitting
                {
                {
                {
                {
                },
                },
                },
                },
              </View>
              </View>
              </View>
              </View>
              <Text style={[styles.gameTime, { color: colors.primary }]}>{game.time}</Text>
              <Text style={[styles.gameTitle, { color: colors.text }]}>{game.title}</Text>
              <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>
              <View style={styles.betSummaryRow}>
              <View style={styles.betSummaryRow}>
              <View style={styles.teamInfo}>
              <View style={styles.teamInfo}>
              ]}
              ]}
              ]}
              ]}
              backgroundColor:
              style={[
              style={[
              style={[
              style={[
              styles.betAmountInput,
              styles.gameCard,
              styles.teamSelectionButton,
              styles.teamSelectionButton,
              {
              {
              {
              {
              {formatCurrency(balance)}
              {selectedGame.team1.name}
              {selectedGame.team1.odds.toFixed(2)}
              {selectedGame.team2.name}
              {selectedGame.team2.odds.toFixed(2)}
              {t('betting.currentBalance')}:
              {t('common.loading')}
              },
              },
              },
              },
            !betAmount ||
            !selectedTeam ||
            </>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </Text>
            </View>
            </View>
            <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
            <Text
            <Text
            <Text
            <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
            <Text style={[styles.betSummaryValue, { color: colors.text }]}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            <View style={styles.gameHeader}>
            <View style={styles.teamsContainer}>
            >
            >
            >
            >
            ]}
            ]}
            ]}
            ]}
            key={game.id}
            keyboardType="numeric"
            onChangeText={handleBetAmountChange}
            onPress={() => handleGameSelect(game)}
            onPress={() => handleTeamSelect(selectedGame.team1.name, selectedGame.team1.odds)}
            onPress={() => handleTeamSelect(selectedGame.team2.name, selectedGame.team2.odds)}
            parseFloat(betAmount) <= 0 ||
            parseFloat(betAmount) > balance ||
            placeholder={t('betting.enterAmount')}
            placeholderTextColor={colors.textSecondary}
            style={[
            style={[
            style={[
            style={[
            styles.placeBetButton,
            submitting
            value={betAmount}
            {
            {formatCurrency(balance)}
            {renderBetForm}
            {renderGameList}
            {submitting ? t('common.loading') : t('betting.placeBet')}
            {t('betting.balance')}
            {t('betting.betAmount')}
            {t('betting.noGames')}
            },
          )}
          />
          </>
          </Text>
          </Text>
          </Text>
          </Text>
          </Text>
          </TouchableOpacity>
          </TouchableOpacity>
          </TouchableOpacity>
          </View>
          </View>
          <>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
          <Text style={[styles.betAmountLabel, { color: colors.text }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          <Text style={[styles.placeBetButtonText, { color: colors.onPrimary }]}>
          <TextInput
          <TouchableOpacity
          <TouchableOpacity
          <TouchableOpacity
          <View style={styles.betSummaryRow}>
          <View style={styles.loadingContainer}>
          >
          >
          >
          ]}
          disabled={
          navigation.navigate('Login');
          onPress={handlePlaceBet}
          return;
          setBalance(userData.balance);
          style={[
          {selectedTeam && betAmount && (
          {t('betting.availableGames')}
          }
        ) : (
        ))}
        )}
        </Text>
        </TouchableOpacity>
        </View>
        </View>
        </View>
        </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('betting.placeBet')}</Text>
        <Text style={[styles.selectedGameTitle, { color: colors.text }]}>{selectedGame.title}</Text>
        <TouchableOpacity
        <View style={styles.balanceContainer}>
        <View style={styles.betAmountContainer}>
        <View style={styles.betSummaryContainer}>
        <View style={styles.emptyContainer}>
        <View style={styles.teamSelectionContainer}>
        >
        Alert.alert(t('common.error'), t('betting.errors.loadFailed'));
        amount: betAmountNum,
        calculatePotentialWinnings(amount, selectedTeam.odds);
        const gamesData = await firebaseService.firestore.getAvailableGames();
        const user = firebaseService.auth.getCurrentUser();
        const userData = await firebaseService.firestore.getUserData(user.uid);
        contentContainerStyle={styles.contentContainer}
        createdAt: new Date().toISOString(),
        gameId: selectedGame.id,
        gameTitle: selectedGame.title,
        if (!user) {
        if (userData && userData.balance) {
        monitoringService.error.captureException(error);
        navigation.navigate('Login');
        odds: selectedTeam.odds,
        potentialWinnings: potentialWinnings,
        return;
        setGames(gamesData);
        setLoading(false);
        setLoading(true);
        status: 'pending',
        style={[styles.container, { backgroundColor: colors.background }]}
        team: selectedTeam.name,
        userId: user.uid,
        {games.map(game => (
        {loading ? (
        }
        }
      );
      // Create bet
      </ScrollView>
      </View>
      </View>
      <Content />
      <ScrollView
      <View style={[styles.betFormContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.gameListContainer}>
      >
      Alert.alert(t('common.error'), t('betting.errors.betFailed'));
      Alert.alert(t('common.error'), t('betting.errors.incompleteForm'));
      Alert.alert(t('common.error'), t('betting.errors.insufficientFunds'));
      Alert.alert(t('common.error'), t('betting.errors.invalidAmount'));
      Alert.alert(t('common.success'), t('betting.alerts.betPlaced'));
      await firebaseService.firestore.createBet(bet);
      await firebaseService.firestore.updateUserBalance(user.uid, balance - betAmountNum);
      calculatePotentialWinnings(betAmount, odds);
      const bet = {
      const user = firebaseService.auth.getCurrentUser();
      if (!user) {
      if (selectedTeam) {
      monitoringService.error.captureException(error);
      return (
      return;
      return;
      return;
      setBalance(balance - betAmountNum);
      setBetAmount('');
      setBetAmount(amount);
      setPotentialWinnings(0);
      setSelectedGame(null);
      setSelectedTeam(null);
      setSelectedTeam({ name: team, odds });
      setSubmitting(false);
      setSubmitting(true);
      try {
      }
      }
      }
      } catch (error) {
      } finally {
      };
    () => () => (
    (team, odds) => {
    ),
    );
    );
    </MainLayout>
    <MainLayout scrollable={false} safeArea={true}>
    [betAmount]
    [colors, loading, balance, renderGameList, renderBetForm, t]
    [selectedTeam]
    alignItems: 'center',
    amount => {
    balance,
    betAmount,
    borderRadius: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderWidth: 1,
    colors,
    const betAmountNum = parseFloat(betAmount);
    const fetchData = async () => {
    const numAmount = parseFloat(amount) || 0;
    const winnings = numAmount * odds;
    fetchData();
    flexDirection: 'row',
    fontSize: 16,
    handleBetAmountChange,
    handlePlaceBet,
    handleTeamSelect,
    height: 48,
    if (!selectedGame || !selectedTeam || !betAmount) {
    if (!selectedGame) return null;
    if (betAmountNum > balance) {
    if (games.length === 0) {
    if (isNaN(betAmountNum) || betAmountNum <= 0) {
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    paddingHorizontal: 12,
    potentialWinnings,
    return (
    return (
    selectedGame,
    selectedTeam,
    setBetAmount('');
    setPotentialWinnings(0);
    setPotentialWinnings(winnings);
    setSelectedGame(game);
    setSelectedTeam(null);
    submitting,
    t,
    try {
    width: '48%',
    }
    }
    }
    }
    }
    } catch (error) {
    } finally {
    },
    },
    };
  );
  );
  );
  );
  // Content component
  // Event handlers
  // Fetch data on mount
  // Render components
  // Render page using MainLayout template
  // State and hooks
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ]);
  balanceContainer: { marginBottom: 20 },
  balanceLabel: { fontSize: 14 },
  balanceValue: { fontSize: 24, fontWeight: 'bold' },
  betAmountContainer: { marginBottom: 16 },
  betAmountInput: {
  betAmountLabel: { fontSize: 14, marginBottom: 8 },
  betFormContainer: { borderRadius: 10, padding: 16 },
  betSummaryContainer: { marginBottom: 20 },
  betSummaryLabel: { fontSize: 14 },
  betSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  betSummaryValue: { fontSize: 14, fontWeight: 'bold' },
  const Content = useMemo(
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const calculatePotentialWinnings = useCallback((amount, odds) => {
  const handleBetAmountChange = useCallback(
  const handleGameSelect = useCallback(game => {
  const handlePlaceBet = useCallback(async () => {
  const handleTeamSelect = useCallback(
  const navigation = useNavigation();
  const renderBetForm = useMemo(() => {
  const renderGameList = useMemo(() => {
  const { colors } = useTheme();
  const { t } = useI18n();
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 16 },
  gameCard: { borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 2 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gameListContainer: { marginBottom: 20 },
  gameTime: { fontSize: 14, fontWeight: 'bold' },
  gameTitle: { fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, marginTop: 12 },
  placeBetButton: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  placeBetButtonText: { fontSize: 16, fontWeight: 'bold' },
  return (
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  selectedGameTitle: { fontSize: 16, marginBottom: 16 },
  teamInfo: { alignItems: 'center', width: '40%' },
  teamLogo: { width: 50, height: 50, marginBottom: 8 },
  teamName: { fontSize: 14, textAlign: 'center' },
  teamSelectionButton: {
  teamSelectionContainer: {
  teamSelectionName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  teamSelectionOdds: { fontSize: 16, fontWeight: 'bold' },
  teamsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  useEffect(() => {
  vsText: { fontSize: 16, fontWeight: 'bold' },
  },
  },
  },
  }, [
  }, []);
  }, []);
  }, [games, selectedGame, colors, handleGameSelect, t]);
  }, [navigation, t]);
  }, [selectedGame, selectedTeam, betAmount, balance, potentialWinnings, navigation, t]);
 *
 * A page component for the betting screen using the atomic architecture.
 * Betting Page
 */
/**
// Import atomic components
// Styles
const BettingPage = () => {
const styles = StyleSheet.create({
export default BettingPage;
} from 'react-native';
});
};

