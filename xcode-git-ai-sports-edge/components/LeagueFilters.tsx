import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LeagueFilter } from '../types/sports';
import { Ionicons } from '@expo/vector-icons';

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
const LeagueFilters: React.FC<LeagueFiltersProps> = ({ filters, onFilterChange }) => {
  const { colors, isDark } = useTheme();
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
  
  // Render selector modal
  const renderSelectorModal = (
    options: FilterOption[],
    visible: boolean,
    onClose: () => void,
    onSelect: (value: string) => void,
    selectedValue: string | undefined
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#2c2c2c' : '#ffffff' }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Option
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.optionsList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedValue === option.value && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }
    ]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Filter Leagues
      </Text>
      
      {/* Country Filter */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Country:</Text>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: colors.background, borderColor: colors.border }
          ]}
          onPress={() => setShowCountryModal(true)}
        >
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {getSelectedCountryLabel()}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Sport Filter */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Sport:</Text>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            { backgroundColor: colors.background, borderColor: colors.border }
          ]}
          onPress={() => setShowSportModal(true)}
        >
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {getSelectedSportLabel()}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* College Filter */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>
          College Leagues Only:
        </Text>
        <Switch
          value={filters.isCollege === true}
          onValueChange={(value: boolean) => onFilterChange({ isCollege: value ? true : undefined })}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={filters.isCollege ? '#f4f3f4' : '#f4f3f4'}
        />
      </View>
      
      {/* Reset Filters Button */}
      <TouchableOpacity
        style={[styles.resetButton, { borderColor: colors.primary }]}
        onPress={() => onFilterChange({ country: undefined, sport: undefined, isCollege: undefined })}
      >
        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        <Text style={[styles.resetButtonText, { color: colors.primary }]}>
          Reset Filters
        </Text>
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    flex: 1,
  },
  selectorButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderRadius: 4,
  },
  selectorText: {
    fontSize: 14,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 8,
  },
  resetButtonText: {
    marginLeft: 8,
    fontWeight: '500',
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
    borderRadius: 8,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
  },
});

export default LeagueFilters;