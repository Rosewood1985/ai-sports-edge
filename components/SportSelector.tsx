import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Define available sports
export const AVAILABLE_SPORTS = [
  { key: 'basketball_nba', name: 'NBA Basketball', icon: 'basketball' },
  { key: 'basketball_ncaab', name: 'NCAA Basketball', icon: 'basketball-outline' },
  { key: 'football_nfl', name: 'NFL Football', icon: 'american-football' },
  { key: 'hockey_nhl', name: 'NHL Hockey', icon: 'snow' },
  { key: 'baseball_mlb', name: 'MLB Baseball', icon: 'baseball' },
  { key: 'soccer_epl', name: 'Premier League', icon: 'football' },
  { key: 'soccer_mls', name: 'MLS Soccer', icon: 'football-outline' },
  { key: 'mma_ufc', name: 'UFC MMA', icon: 'fitness' },
];

interface SportSelectorProps {
  selectedSport: string;
  onSelectSport: (sportKey: string) => void;
}

/**
 * SportSelector component allows users to select from available sports
 */
const SportSelector: React.FC<SportSelectorProps> = ({ selectedSport, onSelectSport }) => {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Select Sport:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVAILABLE_SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport.key}
            style={[
              styles.sportButton,
              selectedSport === sport.key && [styles.selectedSport, { backgroundColor: colors.primary }],
              { backgroundColor: isDark ? '#333333' : '#f0f0f0' }
            ]}
            onPress={() => onSelectSport(sport.key)}
            accessible={true}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedSport === sport.key }}
            accessibilityLabel={`Select ${sport.name}`}
            accessibilityHint={`Changes odds comparison to show ${sport.name} odds`}
          >
            <Ionicons 
              name={sport.icon as any} 
              size={20} 
              color={selectedSport === sport.key ? '#fff' : (isDark ? '#e0e0e0' : '#333')} 
            />
            <Text 
              style={[
                styles.sportText, 
                selectedSport === sport.key && styles.selectedSportText,
                { color: selectedSport === sport.key ? '#fff' : (isDark ? '#e0e0e0' : '#333') }
              ]}
              numberOfLines={1}
            >
              {sport.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 16,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedSport: {
    backgroundColor: '#007BFF',
  },
  sportText: {
    fontSize: 14,
    marginLeft: 6,
  },
  selectedSportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SportSelector;