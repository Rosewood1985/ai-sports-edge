/**
 * Atomic Molecule: League Filters
 * Complex filtering component for leagues using UI theme system
 * Location: /atomic/molecules/filters/LeagueFilters.tsx
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Modal } from 'react-native';

import { useUITheme } from '../../../components/UIThemeProvider';
import { LeagueFilter } from '../../../types/sports';

interface LeagueFiltersProps {
  filters: LeagueFilter;
  onFilterChange: (filters: LeagueFilter) => void;
}

interface FilterOption {
  label: string;
  value: string;
}

const COUNTRIES: FilterOption[] = [
  { label: 'All Countries', value: '' },
  { label: 'United States', value: 'USA' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Australia', value: 'Australia' },
  // Add more countries as needed
];

const SPORTS: FilterOption[] = [
  { label: 'All Sports', value: '' },
  { label: 'Soccer', value: 'Soccer' },
  { label: 'Basketball', value: 'Basketball' },
  { label: 'American Football', value: 'American Football' },
  { label: 'Baseball', value: 'Baseball' },
  { label: 'Ice Hockey', value: 'Ice Hockey' },
  // Add more sports as needed
];

/**
 * LeagueFilters component provides UI for filtering leagues
 * @param {LeagueFiltersProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const LeagueFilters: React.FC<LeagueFiltersProps> = ({ filters, onFilterChange }) => {
  const { theme } = useUITheme();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);

  // Get display name for selected country
  const getSelectedCountryLabel = (): string => {
    if (!filters.country) return 'All Countries';
    const country = COUNTRIES.find(c => c.value === filters.country);
    return country ? country.label : 'All Countries';
  };

  // Get display name for selected sport
  const getSelectedSportLabel = (): string => {
    if (!filters.sport) return 'All Sports';
    const sport = SPORTS.find(s => s.value === filters.sport);
    return sport ? sport.label : 'All Sports';
  };

  // Create dynamic styles using theme
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceBackground,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing.sm,
      marginTop: 0,
    },
    title: {
      fontSize: theme.typography.fontSize.bodyLg,
      fontWeight: theme.typography.fontWeight.bold as '700',
      fontFamily: theme.typography.fontFamily.heading,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    filterLabel: {
      fontSize: theme.typography.fontSize.bodyStd,
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.text,
      flex: 1,
    },
    selectorButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primaryBackground,
      borderRadius: theme.borderRadius.sm,
    },
    selectorText: {
      fontSize: theme.typography.fontSize.label,
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.text,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.xs,
    },
    resetButtonText: {
      marginLeft: theme.spacing.xs,
      fontWeight: theme.typography.fontWeight.medium as '500',
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.primary,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      maxHeight: '70%',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceBackground,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    modalTitle: {
      fontSize: theme.typography.fontSize.bodyLg,
      fontWeight: theme.typography.fontWeight.bold as '700',
      fontFamily: theme.typography.fontFamily.heading,
      color: theme.colors.text,
    },
    optionsList: {
      maxHeight: 300,
    },
    optionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: theme.typography.fontSize.bodyStd,
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.text,
    },
  });

  // Render selector modal
  const renderSelectorModal = (
    options: FilterOption[],
    visible: boolean,
    onClose: () => void,
    onSelect: (value: string) => void,
    selectedValue: string | undefined
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Option</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsList}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedValue === option.value && {
                    backgroundColor: theme.colors.primary + '20',
                  },
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Leagues</Text>

      {/* Country Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Country:</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowCountryModal(true)}>
          <Text style={styles.selectorText}>{getSelectedCountryLabel()}</Text>
          <Ionicons name="chevron-down-outline" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sport Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Sport:</Text>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowSportModal(true)}>
          <Text style={styles.selectorText}>{getSelectedSportLabel()}</Text>
          <Ionicons name="chevron-down-outline" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* College Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>College Leagues Only:</Text>
        <Switch
          value={filters.isCollege === true}
          onValueChange={(value: boolean) =>
            onFilterChange({ isCollege: value ? true : undefined })
          }
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={filters.isCollege ? '#f4f3f4' : '#f4f3f4'}
        />
      </View>

      {/* Reset Filters Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() =>
          onFilterChange({ country: undefined, sport: undefined, isCollege: undefined })
        }
      >
        <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>

      {/* Country Selector Modal */}
      {renderSelectorModal(
        COUNTRIES,
        showCountryModal,
        () => setShowCountryModal(false),
        (value: string) => onFilterChange({ country: value || undefined }),
        filters.country
      )}

      {/* Sport Selector Modal */}
      {renderSelectorModal(
        SPORTS,
        showSportModal,
        () => setShowSportModal(false),
        (value: string) => onFilterChange({ sport: value || undefined }),
        filters.sport
      )}
    </View>
  );
};

export default LeagueFilters;
