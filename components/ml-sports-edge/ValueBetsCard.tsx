import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Divider } from 'react-native-paper';

import { useTheme } from '../../contexts/ThemeContext';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';

interface ValueBet {
  home_team_name: string;
  away_team_name: string;
  home_odds: number;
  away_odds: number;
  home_value_bet: boolean;
  away_value_bet: boolean;
  ensemble_probability: number;
  home_value: number;
  away_value: number;
}

interface ValueBetsCardProps {
  sport: string;
  league: string;
}

const ValueBetsCard: React.FC<ValueBetsCardProps> = ({ sport, league }) => {
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchValueBets();
  }, [sport, league]);

  const fetchValueBets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MLSportsEdgeService.getValueBets(sport, league);
      setValueBets(data.value_bets || []);
    } catch (err) {
      setError('Failed to load value bets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderValueBet = (bet: ValueBet, index: number) => {
    const teamToBet = bet.home_value_bet ? bet.home_team_name : bet.away_team_name;
    const odds = bet.home_value_bet ? bet.home_odds : bet.away_odds;
    const probability = bet.home_value_bet
      ? bet.ensemble_probability
      : 1 - bet.ensemble_probability;
    const value = bet.home_value_bet ? bet.home_value : bet.away_value;

    return (
      <View key={index} style={styles.betContainer}>
        <Text style={[styles.matchup, { color: theme.colors.text }]}>
          {bet.home_team_name} vs {bet.away_team_name}
        </Text>
        <View style={styles.betDetails}>
          <Text style={[styles.teamToBet, { color: theme.colors.primary }]}>
            Bet on: {teamToBet}
          </Text>
          <Text style={[styles.odds, { color: theme.colors.text }]}>Odds: {odds.toFixed(2)}</Text>
        </View>
        <View style={styles.valueDetails}>
          <Text style={[styles.probability, { color: theme.colors.text }]}>
            Model probability: {(probability * 100).toFixed(1)}%
          </Text>
          <Text style={[styles.value, { color: theme.colors.accent }]}>
            Value: {(value * 100).toFixed(1)}%
          </Text>
        </View>
        <Divider style={styles.divider} />
      </View>
    );
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Title
        title="AI Value Bets"
        subtitle={`${sport.toUpperCase()} - ${league.toUpperCase()}`}
      />
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : valueBets.length === 0 ? (
          <Text style={[styles.noData, { color: theme.colors.text }]}>No value bets available</Text>
        ) : (
          <View style={styles.betsContainer}>
            {valueBets.map((bet, index) => renderValueBet(bet, index))}
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchValueBets}>
          <Text style={[styles.refreshButtonText, { color: theme.colors.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 4,
  },
  betsContainer: {
    marginTop: 10,
  },
  betContainer: {
    marginBottom: 15,
  },
  matchup: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  betDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  teamToBet: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  odds: {
    fontSize: 14,
  },
  valueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  probability: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    marginTop: 10,
  },
  error: {
    textAlign: 'center',
    marginVertical: 20,
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
  },
  refreshButton: {
    padding: 10,
  },
  refreshButtonText: {
    fontWeight: 'bold',
  },
});

export default ValueBetsCard;
