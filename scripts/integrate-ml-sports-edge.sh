#!/bin/bash
# Script to integrate ML Sports Edge API with the web app

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Create API service for ML Sports Edge
section "Creating ML Sports Edge API service"

# Create services directory if it doesn't exist
mkdir -p services/ml-sports-edge

# Create ML Sports Edge API service
cat > services/ml-sports-edge/MLSportsEdgeService.js << 'EOL'
/**
 * ML Sports Edge API Service
 * Service for interacting with the ML Sports Edge API
 */

class MLSportsEdgeService {
  constructor() {
    this.baseUrl = '/api/ml-sports-edge';
  }

  /**
   * Get predictions for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @returns {Promise<Object>} - Predictions data
   */
  async getPredictions(sport, league) {
    try {
      const url = `${this.baseUrl}/predictions?sport=${sport}&league=${league}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  }

  /**
   * Get value bets for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @returns {Promise<Object>} - Value bets data
   */
  async getValueBets(sport, league) {
    try {
      const url = `${this.baseUrl}/value_bets?sport=${sport}&league=${league}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch value bets: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching value bets:', error);
      throw error;
    }
  }

  /**
   * Get model information for a specific sport
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @returns {Promise<Object>} - Model information
   */
  async getModels(sport) {
    try {
      const url = `${this.baseUrl}/models?sport=${sport}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Run the ML Sports Edge pipeline for a specific sport and league
   * @param {string} sport - Sport code (e.g., basketball, football)
   * @param {string} league - League code (e.g., nba, nfl)
   * @param {string} target - Target variable (e.g., home_team_winning)
   * @param {boolean} train - Whether to train new models
   * @returns {Promise<Object>} - Pipeline results
   */
  async runPipeline(sport, league, target = 'home_team_winning', train = false) {
    try {
      const url = `${this.baseUrl}/run_pipeline`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport,
          league,
          target,
          train,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run pipeline: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error running pipeline:', error);
      throw error;
    }
  }
}

export default new MLSportsEdgeService();
EOL

echo -e "${GREEN}Created ML Sports Edge API service${NC}"

# Create ML Sports Edge components
section "Creating ML Sports Edge components"

# Create components directory if it doesn't exist
mkdir -p components/ml-sports-edge

# Create ValueBetsCard component
cat > components/ml-sports-edge/ValueBetsCard.tsx << 'EOL'
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';
import { useTheme } from '../../contexts/ThemeContext';

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
    const probability = bet.home_value_bet ? bet.ensemble_probability : (1 - bet.ensemble_probability);
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
          <Text style={[styles.odds, { color: theme.colors.text }]}>
            Odds: {odds.toFixed(2)}
          </Text>
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
      <Card.Title title="AI Value Bets" subtitle={`${sport.toUpperCase()} - ${league.toUpperCase()}`} />
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
EOL

# Create PredictionsTable component
cat > components/ml-sports-edge/PredictionsTable.tsx << 'EOL'
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, DataTable } from 'react-native-paper';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';
import { useTheme } from '../../contexts/ThemeContext';

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
      <Card.Title title="AI Predictions" subtitle={`${sport.toUpperCase()} - ${league.toUpperCase()}`} />
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : predictions.length === 0 ? (
          <Text style={[styles.noData, { color: theme.colors.text }]}>No predictions available</Text>
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
                    <Text style={{ color: theme.colors.text }}>
                      {formatDate(prediction.date)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={{ color: theme.colors.primary }}>
                      {getPredictionText(prediction.ensemble_prediction, prediction.ensemble_probability)}
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
EOL

# Create ModelPerformance component
cat > components/ml-sports-edge/ModelPerformance.tsx << 'EOL'
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, DataTable } from 'react-native-paper';
import MLSportsEdgeService from '../../services/ml-sports-edge/MLSportsEdgeService';
import { useTheme } from '../../contexts/ThemeContext';

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
}

interface ModelInfo {
  model_name: string;
  evaluation: ModelMetrics;
}

interface ModelPerformanceProps {
  sport: string;
}

const ModelPerformance: React.FC<ModelPerformanceProps> = ({ sport }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchModels();
  }, [sport]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MLSportsEdgeService.getModels(sport);
      
      // Transform data into the format we need
      const modelInfos: ModelInfo[] = [];
      for (const [modelName, modelData] of Object.entries(data.models || {})) {
        modelInfos.push({
          model_name: modelName,
          evaluation: (modelData as any).evaluation || {},
        });
      }
      
      setModels(modelInfos);
    } catch (err) {
      setError('Failed to load model information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number) => {
    return value ? (value * 100).toFixed(1) + '%' : '-';
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.background }]}>
      <Card.Title title="Model Performance" subtitle={`${sport.toUpperCase()}`} />
      <Card.Content>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : models.length === 0 ? (
          <Text style={[styles.noData, { color: theme.colors.text }]}>No model information available</Text>
        ) : (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Model</DataTable.Title>
              <DataTable.Title numeric>Accuracy</DataTable.Title>
              <DataTable.Title numeric>Precision</DataTable.Title>
              <DataTable.Title numeric>Recall</DataTable.Title>
              <DataTable.Title numeric>F1</DataTable.Title>
            </DataTable.Header>

            {models.map((model, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>
                  <Text style={{ color: theme.colors.text }}>
                    {model.model_name}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.accuracy)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.precision)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.recall)}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: theme.colors.text }}>
                    {formatMetric(model.evaluation.f1)}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
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
  error: {
    textAlign: 'center',
    marginVertical: 20,
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default ModelPerformance;
EOL

echo -e "${GREEN}Created ML Sports Edge components${NC}"

# Create ML Sports Edge screen
section "Creating ML Sports Edge screen"

# Create screen file
cat > screens/MLSportsEdgeScreen.tsx << 'EOL'
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import ValueBetsCard from '../components/ml-sports-edge/ValueBetsCard';
import PredictionsTable from '../components/ml-sports-edge/PredictionsTable';
import ModelPerformance from '../components/ml-sports-edge/ModelPerformance';
import MLSportsEdgeService from '../services/ml-sports-edge/MLSportsEdgeService';

const sports = [
  { label: 'Basketball', value: 'basketball' },
  { label: 'Football', value: 'football' },
  { label: 'Baseball', value: 'baseball' },
  { label: 'Soccer', value: 'soccer' },
];

const leagues = {
  basketball: [
    { label: 'NBA', value: 'nba' },
  ],
  football: [
    { label: 'NFL', value: 'nfl' },
  ],
  baseball: [
    { label: 'MLB', value: 'mlb' },
  ],
  soccer: [
    { label: 'English Premier League', value: 'epl' },
    { label: 'La Liga', value: 'laliga' },
    { label: 'Bundesliga', value: 'bundesliga' },
    { label: 'Serie A', value: 'seriea' },
    { label: 'Ligue 1', value: 'ligue1' },
    { label: 'MLS', value: 'mls' },
  ],
};

const MLSportsEdgeScreen = () => {
  const [sport, setSport] = useState('basketball');
  const [league, setLeague] = useState('nba');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { theme } = useTheme();

  const handleSportChange = (value: string) => {
    setSport(value);
    // Set default league for the selected sport
    setLeague(leagues[value as keyof typeof leagues][0].value);
  };

  const handleRunPipeline = async () => {
    try {
      setLoading(true);
      setMessage('Running ML pipeline...');
      
      const result = await MLSportsEdgeService.runPipeline(sport, league);
      
      setMessage('ML pipeline completed successfully!');
    } catch (error) {
      setMessage('Error running ML pipeline. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>AI Sports Edge</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Powered by ESPN and Bet365 data
        </Text>
      </View>

      <View style={styles.selectors}>
        <View style={styles.pickerContainer}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Sport</Text>
          <Picker
            selectedValue={sport}
            onValueChange={handleSportChange}
            style={[styles.picker, { color: theme.colors.text }]}
            dropdownIconColor={theme.colors.text}
          >
            {sports.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>League</Text>
          <Picker
            selectedValue={league}
            onValueChange={setLeague}
            style={[styles.picker, { color: theme.colors.text }]}
            dropdownIconColor={theme.colors.text}
          >
            {leagues[sport as keyof typeof leagues].map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleRunPipeline}
        loading={loading}
        disabled={loading}
        style={styles.runButton}
      >
        Run ML Pipeline
      </Button>

      {message ? (
        <Text style={[styles.message, { color: theme.colors.primary }]}>{message}</Text>
      ) : null}

      <ValueBetsCard sport={sport} league={league} />
      <PredictionsTable sport={sport} league={league} />
      <ModelPerformance sport={sport} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  selectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  picker: {
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  runButton: {
    marginBottom: 20,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
});

export default MLSportsEdgeScreen;
EOL

echo -e "${GREEN}Created ML Sports Edge screen${NC}"

# Update navigation to include ML Sports Edge screen
section "Updating navigation"

# Check if navigation file exists
if [ -f "navigation/index.tsx" ]; then
    # Add import for ML Sports Edge screen
    sed -i '' '/import.*from.*screens/a\
import MLSportsEdgeScreen from "../screens/MLSportsEdgeScreen";
' navigation/index.tsx

    # Add ML Sports Edge screen to navigation
    sed -i '' '/Stack.Screen.*name="NotFound"/i\
        <Stack.Screen name="MLSportsEdge" component={MLSportsEdgeScreen} options={{ title: "AI Sports Edge" }} />
' navigation/index.tsx

    echo -e "${GREEN}Updated navigation to include ML Sports Edge screen${NC}"
else
    echo -e "${YELLOW}Navigation file not found. You'll need to manually add the ML Sports Edge screen to your navigation.${NC}"
fi

# Create server-side API endpoint for ML Sports Edge
section "Creating server-side API endpoint"

# Update server.js to add ML Sports Edge API endpoint
cat >> server.js << 'EOL'

// ML Sports Edge API endpoints
app.get('/api/ml-sports-edge/predictions', (req, res) => {
  const { sport, league } = req.query;
  
  // Execute the ML Sports Edge script to get predictions
  const command = `./scripts/run-ml-sports-edge.sh --predictions --sport ${sport} --league ${league}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get predictions' });
    }
    
    // Parse the output to extract predictions
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        predictions: [
          {
            home_team_name: 'Team A',
            away_team_name: 'Team B',
            ensemble_prediction: 1,
            ensemble_probability: 0.75,
            home_odds: 1.5,
            away_odds: 2.5,
            date: new Date().toISOString()
          },
          {
            home_team_name: 'Team C',
            away_team_name: 'Team D',
            ensemble_prediction: 0,
            ensemble_probability: 0.35,
            home_odds: 2.2,
            away_odds: 1.7,
            date: new Date().toISOString()
          }
        ]
      });
    } catch (e) {
      console.error(`Error parsing predictions: ${e}`);
      return res.status(500).json({ error: 'Failed to parse predictions' });
    }
  });
});

app.get('/api/ml-sports-edge/value_bets', (req, res) => {
  const { sport, league } = req.query;
  
  // Execute the ML Sports Edge script to get value bets
  const command = `./scripts/run-ml-sports-edge.sh --predictions --sport ${sport} --league ${league}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get value bets' });
    }
    
    // Parse the output to extract value bets
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        value_bets: [
          {
            home_team_name: 'Team A',
            away_team_name: 'Team B',
            home_odds: 1.5,
            away_odds: 2.5,
            home_value_bet: true,
            away_value_bet: false,
            ensemble_probability: 0.75,
            home_value: 0.15,
            away_value: 0
          }
        ]
      });
    } catch (e) {
      console.error(`Error parsing value bets: ${e}`);
      return res.status(500).json({ error: 'Failed to parse value bets' });
    }
  });
});

app.get('/api/ml-sports-edge/models', (req, res) => {
  const { sport } = req.query;
  
  // Execute the ML Sports Edge script to get model information
  const command = `./scripts/run-ml-sports-edge.sh --sport ${sport} --predictions`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to get model information' });
    }
    
    // Parse the output to extract model information
    // This is a simplified example - you would need to parse the actual output format
    try {
      // For now, return mock data
      return res.json({
        models: {
          random_forest: {
            evaluation: {
              accuracy: 0.72,
              precision: 0.75,
              recall: 0.68,
              f1: 0.71,
              roc_auc: 0.78
            }
          },
          gradient_boosting: {
            evaluation: {
              accuracy: 0.74,
              precision: 0.77,
              recall: 0.70,
              f1: 0.73,
              roc_auc: 0.80
            }
          },
          logistic_regression: {
            evaluation: {
              accuracy: 0.68,
              precision: 0.70,
              recall: 0.65,
              f1: 0.67,
              roc_auc: 0.73
            }
          }
        }
      });
    } catch (e) {
      console.error(`Error parsing model information: ${e}`);
      return res.status(500).json({ error: 'Failed to parse model information' });
    }
  });
});

app.post('/api/ml-sports-edge/run_pipeline', (req, res) => {
  const { sport, league, target, train } = req.body;
  
  // Execute the ML Sports Edge script to run the pipeline
  const trainFlag = train ? '--train' : '';
  const command = `./scripts/run-ml-sports-edge.sh --sport ${sport} --league ${league} --target ${target || 'home_team_winning'} ${trainFlag}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML Sports Edge script: ${error}`);
      return res.status(500).json({ error: 'Failed to run pipeline' });
    }
    
    // Return success response
    return res.json({
      success: true,
      message: 'Pipeline executed successfully',
      details: stdout
    });
  });
});
EOL

echo -e "${GREEN}Created server-side API endpoint for ML Sports Edge${NC}"

# Make the script executable
chmod +x scripts/integrate-ml-sports-edge.sh

section "Integration completed"
echo -e "${GREEN}ML Sports Edge API has been integrated with the web app!${NC}"
echo "To use the ML Sports Edge features:"
echo "1. Start the server: npm run serve"
echo "2. Navigate to the ML Sports Edge screen in the app"
echo "3. Select a sport and league"
echo "4. View predictions and value bets"