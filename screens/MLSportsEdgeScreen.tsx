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
