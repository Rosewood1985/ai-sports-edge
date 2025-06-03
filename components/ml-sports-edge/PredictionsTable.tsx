import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, DataTable } from 'react-native-paper';

import { useTheme } from '../../contexts/ThemeContext';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';

interface Prediction {
  home_team_name: string;
  away_team_name: string;
  ensemble_prediction: number;
  ensemble_probability: number;
  home_odds: number;
  away_odds: number;
  date: string;
}

interface PredictionsTableProps {
  sport: string;
  league: string;
}

const PredictionsTable: React.FC<PredictionsTableProps> = ({ sport, league }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchPredictions();
  }, [sport, league]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MLSportsEdgeService.getPredictions(sport, league);
      setPredictions(data.predictions || []);
    } catch (err) {
      setError('Failed to load predictions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPredictionText = (prediction: number, probability: number) => {
    if (prediction === 1) {
      return `Home (${(probability * 100).toFixed(1)}%)`;
    } else {
      return `Away (${((1 - probability) * 100).toFixed(1)}%)`;
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Title
        title="AI Predictions"
        subtitle={`${sport.toUpperCase()} - ${league.toUpperCase()}`}
      />
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : predictions.length === 0 ? (
          <Text style={[styles.noData, { color: theme.colors.text }]}>
            No predictions available
          </Text>
        ) : (
          <ScrollView horizontal>
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.matchupColumn}>Matchup</DataTable.Title>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Prediction</DataTable.Title>
                <DataTable.Title numeric>Home Odds</DataTable.Title>
                <DataTable.Title numeric>Away Odds</DataTable.Title>
              </DataTable.Header>

              {predictions.map((prediction, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell style={styles.matchupColumn}>
                    <Text style={{ color: theme.colors.text }}>
                      {prediction.home_team_name} vs {prediction.away_team_name}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ color: theme.colors.text }}>{formatDate(prediction.date)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ color: theme.colors.primary }}>
                      {getPredictionText(
                        prediction.ensemble_prediction,
                        prediction.ensemble_probability
                      )}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={{ color: theme.colors.text }}>
                      {prediction.home_odds?.toFixed(2) || '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text style={{ color: theme.colors.text }}>
                      {prediction.away_odds?.toFixed(2) || '-'}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 4,
  },
  table: {
    minWidth: 500,
  },
  matchupColumn: {
    flex: 2,
  },
  error: {
    textAlign: 'center',
    marginVertical: 20,
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default PredictionsTable;
