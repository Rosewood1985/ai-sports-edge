import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { League } from '../types/sports';

interface LeagueItemProps {
  league: League;
  onSelect: () => void;
  isSelected?: boolean;
}

/**
 * LeagueItem component displays a single league with its details
 * @param {LeagueItemProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const LeagueItem: React.FC<LeagueItemProps> = ({ league, onSelect, isSelected = false }) => {
  const { colors, isDark } = useTheme();

  // Determine icon based on sport
  const getSportIcon = (sport: string) => {
    const sportName = sport.toLowerCase();
    if (sportName === 'soccer') return 'football-outline';
    if (sportName === 'basketball') return 'basketball-outline';
    if (sportName === 'american football') return 'american-football-outline';
    if (sportName === 'baseball') return 'baseball-outline';
    if (sportName === 'ice hockey') return 'ice-cream-outline'; // Using a similar icon as hockey-sticks isn't available
    return 'trophy-outline';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderColor: colors.border,
          borderWidth: isSelected ? 2 : 1,
          borderLeftWidth: isSelected ? 6 : 1,
          borderLeftColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onSelect}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getSportIcon(league.strSport)} size={24} color={colors.primary} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.leagueName, { color: colors.text }]}>{league.strLeague}</Text>

        <View style={styles.detailsRow}>
          <Text style={[styles.sportName, { color: colors.text }]}>{league.strSport}</Text>

          <Text style={[styles.countryName, { color: colors.text }]}>{league.strCountry}</Text>

          {league.isCollege && (
            <View style={[styles.collegeTag, { backgroundColor: colors.primary }]}>
              <Text style={styles.collegeTagText}>College</Text>
            </View>
          )}
        </View>
      </View>

      {isSelected ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  iconContainer: {
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sportName: {
    fontSize: 14,
    marginRight: 8,
  },
  countryName: {
    fontSize: 14,
    opacity: 0.7,
  },
  collegeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  collegeTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LeagueItem;
