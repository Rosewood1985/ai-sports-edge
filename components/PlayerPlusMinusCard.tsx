import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PlayerPlusMinus } from '../services/playerStatsService';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';

interface PlayerPlusMinusCardProps {
  playerData: PlayerPlusMinus;
  onPress?: () => void;
}

/**
 * Component to display a player's plus-minus statistics
 */
const PlayerPlusMinusCard: React.FC<PlayerPlusMinusCardProps> = ({ 
  playerData, 
  onPress 
}) => {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#1c1c1e' }, 'background');
  
  // Get the current color scheme
  const colorScheme = useColorScheme() ?? 'light';
  
  // Define colors based on the color scheme
  const borderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  const positiveColor = colorScheme === 'light' ? '#34C759' : '#30D158';
  const negativeColor = colorScheme === 'light' ? '#FF3B30' : '#FF453A';

  // Determine the color for the plus-minus value
  const plusMinusColor = playerData.plusMinus > 0
    ? positiveColor
    : playerData.plusMinus < 0
      ? negativeColor
      : 'gray';

  // Format the plus-minus value with a + sign for positive values
  const formattedPlusMinus = playerData.plusMinus > 0 
    ? `+${playerData.plusMinus}` 
    : `${playerData.plusMinus}`;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor, borderColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.playerInfo}>
        <ThemedText style={styles.playerName}>{playerData.playerName}</ThemedText>
        <ThemedText style={styles.teamName}>{playerData.team}</ThemedText>
      </View>
      
      <View style={styles.statsContainer}>
        <ThemedText 
          style={[styles.plusMinus, { color: plusMinusColor }]}
        >
          {formattedPlusMinus}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  plusMinus: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default PlayerPlusMinusCard;