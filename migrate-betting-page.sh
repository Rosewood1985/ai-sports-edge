#!/bin/bash

# Script to migrate the BettingPage component to atomic architecture
# This script creates the BettingPage component in the atomic architecture

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="migrate-betting-page-$TIMESTAMP.log"

# Start logging
echo "Starting BettingPage migration at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Create BettingPage component in atomic architecture
echo "Creating BettingPage component in atomic architecture..." | tee -a $LOG_FILE

# Create atomic/pages/BettingPage.js
cat > atomic/pages/BettingPage.js << EOL
/**
 * Betting Page
 * 
 * A page component for the betting screen using the atomic architecture.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import atomic components
import { MainLayout } from '../templates';
import { useTheme } from '../molecules/themeContext';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';
import { formatCurrency } from '../atoms/formatUtils';

const BettingPage = () => {
  // State and hooks
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [potentialWinnings, setPotentialWinnings] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = firebaseService.auth.getCurrentUser();
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        
        const userData = await firebaseService.firestore.getUserData(user.uid);
        if (userData && userData.balance) {
          setBalance(userData.balance);
        }
        
        const gamesData = await firebaseService.firestore.getAvailableGames();
        setGames(gamesData);
      } catch (error) {
        monitoringService.error.captureException(error);
        Alert.alert(t('common.error'), t('betting.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigation, t]);
  
  // Event handlers
  const handleGameSelect = useCallback((game) => {
    setSelectedGame(game);
    setSelectedTeam(null);
    setBetAmount('');
    setPotentialWinnings(0);
  }, []);
  
  const handleTeamSelect = useCallback((team, odds) => {
    setSelectedTeam({ name: team, odds });
    calculatePotentialWinnings(betAmount, odds);
  }, [betAmount]);
  
  const handleBetAmountChange = useCallback((amount) => {
    setBetAmount(amount);
    if (selectedTeam) {
      calculatePotentialWinnings(amount, selectedTeam.odds);
    }
  }, [selectedTeam]);
  
  const calculatePotentialWinnings = useCallback((amount, odds) => {
    const numAmount = parseFloat(amount) || 0;
    const winnings = numAmount * odds;
    setPotentialWinnings(winnings);
  }, []);
  
  const handlePlaceBet = useCallback(async () => {
    if (!selectedGame || !selectedTeam || !betAmount) {
      Alert.alert(t('common.error'), t('betting.errors.incompleteForm'));
      return;
    }
    
    const betAmountNum = parseFloat(betAmount);
    
    if (isNaN(betAmountNum) || betAmountNum <= 0) {
      Alert.alert(t('common.error'), t('betting.errors.invalidAmount'));
      return;
    }
    
    if (betAmountNum > balance) {
      Alert.alert(t('common.error'), t('betting.errors.insufficientFunds'));
      return;
    }
    
    try {
      setSubmitting(true);
      
      const user = firebaseService.auth.getCurrentUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }
      
      // Create bet
      const bet = {
        userId: user.uid,
        gameId: selectedGame.id,
        gameTitle: selectedGame.title,
        team: selectedTeam.name,
        odds: selectedTeam.odds,
        amount: betAmountNum,
        potentialWinnings: potentialWinnings,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      await firebaseService.firestore.createBet(bet);
      await firebaseService.firestore.updateUserBalance(user.uid, balance - betAmountNum);
      
      setBalance(balance - betAmountNum);
      setSelectedGame(null);
      setSelectedTeam(null);
      setBetAmount('');
      setPotentialWinnings(0);
      
      Alert.alert(t('common.success'), t('betting.alerts.betPlaced'));
    } catch (error) {
      monitoringService.error.captureException(error);
      Alert.alert(t('common.error'), t('betting.errors.betFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [selectedGame, selectedTeam, betAmount, balance, potentialWinnings, navigation, t]);
  
  // Render components
  const renderGameList = useMemo(() => {
    if (games.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('betting.noGames')}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.gameListContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('betting.availableGames')}
        </Text>
        
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard,
              { 
                backgroundColor: colors.surface,
                borderColor: selectedGame && selectedGame.id === game.id ? colors.primary : colors.border
              }
            ]}
            onPress={() => handleGameSelect(game)}
          >
            <View style={styles.gameHeader}>
              <Text style={[styles.gameTitle, { color: colors.text }]}>
                {game.title}
              </Text>
              <Text style={[styles.gameTime, { color: colors.primary }]}>
                {game.time}
              </Text>
            </View>
            
            <View style={styles.teamsContainer}>
              <View style={styles.teamInfo}>
                <Image
                  source={{ uri: game.team1.logoUrl }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.teamName, { color: colors.text }]}>
                  {game.team1.name}
                </Text>
              </View>
              
              <Text style={[styles.vsText, { color: colors.textSecondary }]}>
                VS
              </Text>
              
              <View style={styles.teamInfo}>
                <Image
                  source={{ uri: game.team2.logoUrl }}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.teamName, { color: colors.text }]}>
                  {game.team2.name}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [games, selectedGame, colors, handleGameSelect, t]);
  
  const renderBetForm = useMemo(() => {
    if (!selectedGame) return null;
    
    return (
      <View style={[styles.betFormContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('betting.placeBet')}
        </Text>
        
        <Text style={[styles.selectedGameTitle, { color: colors.text }]}>
          {selectedGame.title}
        </Text>
        
        <View style={styles.teamSelectionContainer}>
          <TouchableOpacity
            style={[
              styles.teamSelectionButton,
              { 
                backgroundColor: selectedTeam && selectedTeam.name === selectedGame.team1.name ? colors.primary : colors.background,
                borderColor: colors.border
              }
            ]}
            onPress={() => handleTeamSelect(selectedGame.team1.name, selectedGame.team1.odds)}
          >
            <Text style={[
              styles.teamSelectionName,
              { color: selectedTeam && selectedTeam.name === selectedGame.team1.name ? colors.onPrimary : colors.text }
            ]}>
              {selectedGame.team1.name}
            </Text>
            <Text style={[
              styles.teamSelectionOdds,
              { color: selectedTeam && selectedTeam.name === selectedGame.team1.name ? colors.onPrimary : colors.primary }
            ]}>
              {selectedGame.team1.odds.toFixed(2)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.teamSelectionButton,
              { 
                backgroundColor: selectedTeam && selectedTeam.name === selectedGame.team2.name ? colors.primary : colors.background,
                borderColor: colors.border
              }
            ]}
            onPress={() => handleTeamSelect(selectedGame.team2.name, selectedGame.team2.odds)}
          >
            <Text style={[
              styles.teamSelectionName,
              { color: selectedTeam && selectedTeam.name === selectedGame.team2.name ? colors.onPrimary : colors.text }
            ]}>
              {selectedGame.team2.name}
            </Text>
            <Text style={[
              styles.teamSelectionOdds,
              { color: selectedTeam && selectedTeam.name === selectedGame.team2.name ? colors.onPrimary : colors.primary }
            ]}>
              {selectedGame.team2.odds.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.betAmountContainer}>
          <Text style={[styles.betAmountLabel, { color: colors.text }]}>
            {t('betting.betAmount')}
          </Text>
          <TextInput
            style={[styles.betAmountInput, { 
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text
            }]}
            value={betAmount}
            onChangeText={handleBetAmountChange}
            placeholder={t('betting.enterAmount')}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.betSummaryContainer}>
          <View style={styles.betSummaryRow}>
            <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
              {t('betting.currentBalance')}:
            </Text>
            <Text style={[styles.betSummaryValue, { color: colors.text }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
          
          {selectedTeam && betAmount && (
            <>
              <View style={styles.betSummaryRow}>
                <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
                  {t('betting.potentialWinnings')}:
                </Text>
                <Text style={[styles.betSummaryValue, { color: colors.success }]}>
                  {formatCurrency(potentialWinnings)}
                </Text>
              </View>
              
              <View style={styles.betSummaryRow}>
                <Text style={[styles.betSummaryLabel, { color: colors.textSecondary }]}>
                  {t('betting.remainingBalance')}:
                </Text>
                <Text style={[styles.betSummaryValue, { color: parseFloat(betAmount) > balance ? colors.error : colors.text }]}>
                  {formatCurrency(balance - (parseFloat(betAmount) || 0))}
                </Text>
              </View>
            </>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.placeBetButton,
            { 
              backgroundColor: 
                !selectedTeam || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance || submitting
                  ? colors.secondary
                  : colors.primary
            }
          ]}
          onPress={handlePlaceBet}
          disabled={!selectedTeam || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > balance || submitting}
        >
          <Text style={[styles.placeBetButtonText, { color: colors.onPrimary }]}>
            {submitting ? t('common.loading') : t('betting.placeBet')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [selectedGame, selectedTeam, betAmount, balance, potentialWinnings, colors, submitting, handleTeamSelect, handleBetAmountChange, handlePlaceBet, t]);
  
  // Content component
  const Content = useMemo(() => () => (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          {t('betting.balance')}
        </Text>
        <Text style={[styles.balanceValue, { color: colors.text }]}>
          {formatCurrency(balance)}
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : (
        <>
          {renderGameList}
          {renderBetForm}
        </>
      )}
    </ScrollView>
  ), [colors, loading, balance, renderGameList, renderBetForm, t]);
  
  // Render page using MainLayout template
  return (
    <MainLayout scrollable={false} safeArea={true}>
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, marginTop: 12 },
  balanceContainer: { marginBottom: 20 },
  balanceLabel: { fontSize: 14 },
  balanceValue: { fontSize: 24, fontWeight: 'bold' },
  gameListContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  gameCard: { borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 2 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gameTitle: { fontSize: 16, fontWeight: 'bold' },
  gameTime: { fontSize: 14, fontWeight: 'bold' },
  teamsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamInfo: { alignItems: 'center', width: '40%' },
  teamLogo: { width: 50, height: 50, marginBottom: 8 },
  teamName: { fontSize: 14, textAlign: 'center' },
  vsText: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 16 },
  betFormContainer: { borderRadius: 10, padding: 16 },
  selectedGameTitle: { fontSize: 16, marginBottom: 16 },
  teamSelectionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  teamSelectionButton: { width: '48%', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1 },
  teamSelectionName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  teamSelectionOdds: { fontSize: 16, fontWeight: 'bold' },
  betAmountContainer: { marginBottom: 16 },
  betAmountLabel: { fontSize: 14, marginBottom: 8 },
  betAmountInput: { height: 48, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
  betSummaryContainer: { marginBottom: 20 },
  betSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  betSummaryLabel: { fontSize: 14 },
  betSummaryValue: { fontSize: 14, fontWeight: 'bold' },
  placeBetButton: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  placeBetButtonText: { fontSize: 16, fontWeight: 'bold' },
});

export default BettingPage;
EOL

# Create formatUtils.js if needed
if [ ! -f "atomic/atoms/formatUtils.js" ]; then
  mkdir -p atomic/atoms
  echo "Creating formatUtils.js..." | tee -a $LOG_FILE
  cat > atomic/atoms/formatUtils.js << EOL
export const formatCurrency = (amount, locale = 'en-US', currency = 'USD') => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};
EOL

  # Update index.js
  if [ -f "atomic/atoms/index.js" ]; then
    sed -i.bak '/export/a export * from '\''./formatUtils'\'';' atomic/atoms/index.js
  else
    cat > atomic/atoms/index.js << EOL
export * from './formatUtils';
EOL
  fi
fi

# Create test file
mkdir -p __tests__/atomic/pages
echo "Creating test file..." | tee -a $LOG_FILE
cat > __tests__/atomic/pages/BettingPage.test.js << EOL
import React from 'react';
import { render } from '@testing-library/react-native';
import { BettingPage } from '../../../atomic/pages';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: () => ({ colors: { background: '#FFF', text: '#000', primary: '#007BFF' } }),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: () => ({ t: key => key }),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: { getCurrentUser: jest.fn() },
    firestore: { getUserData: jest.fn(), getAvailableGames: jest.fn() },
  },
  monitoringService: { error: { captureException: jest.fn() } },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

jest.mock('../../../atomic/atoms/formatUtils', () => ({
  formatCurrency: jest.fn(val => \`\$\${val}\`),
}));

describe('BettingPage', () => {
  it('renders correctly', () => {
    const { getByText } = render(<BettingPage />);
    expect(getByText('common.loading')).toBeTruthy();
  });
});
EOL

# Update index.js
echo "Updating index.js..." | tee -a $LOG_FILE
sed -i.bak '/export { default as ProfilePage } from/a export { default as BettingPage } from '\''./BettingPage'\'';' atomic/pages/index.js

# Update to-do files
echo "Updating to-do files..." | tee -a $LOG_FILE
sed -i.bak 's/- \[ \] BettingPage/- \[x\] BettingPage/g' ai-sports-edge-todo.md

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git add atomic/pages/BettingPage.js atomic/pages/index.js __tests__/atomic/pages/BettingPage.test.js
git add atomic/atoms/formatUtils.js atomic/atoms/index.js ai-sports-edge-todo.md
git commit -m "Migrate BettingPage to atomic architecture"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push origin $(git rev-parse --abbrev-ref HEAD)

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "BettingPage migration completed at $(date)" | tee -a $LOG_FILE
echo "✅ Migration completed successfully" | tee -a $LOG_FILE

echo "
Migration Summary:
1. Created BettingPage component in atomic/pages
2. Created formatUtils in atomic/atoms
3. Added tests for BettingPage
4. Updated index files and to-do list
5. Committed and pushed changes

Next steps:
1. Migrate SettingsPage
2. Continue with other components
"
