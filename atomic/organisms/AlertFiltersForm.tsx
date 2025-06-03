import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, ViewStyle, StyleProp, View, ScrollView } from 'react-native';

import { AccessibleThemedView, FilterTag, Slider, CheckboxWithLabel } from '../atoms';
import { AlertType } from '../atoms/AlertTypeIcon';
import { FilterSection } from '../molecules';
import { useI18n } from './i18n/I18nContext';

/**
 * Alert filter configuration
 */
export interface AlertFilters {
  /**
   * Selected sports
   */
  sports: string[];

  /**
   * Selected team (if any)
   */
  team?: string;

  /**
   * Line movement threshold
   */
  threshold: number;

  /**
   * Alert methods
   */
  methods: {
    /**
     * Whether to send push notifications
     */
    pushNotification: boolean;

    /**
     * Whether to send emails
     */
    email: boolean;
  };
}

/**
 * AlertFiltersForm component that displays a form for configuring alert filters.
 *
 * This is an organism component that combines molecules to form
 * a more complex component in the atomic design system.
 */
export interface AlertFiltersFormProps {
  /**
   * Type of alert selected
   */
  alertType: AlertType;

  /**
   * Current filter values
   */
  filters: AlertFilters;

  /**
   * Callback when filters are changed
   */
  onFiltersChange?: (filters: AlertFilters) => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Whether the form is disabled
   * @default false
   */
  disabled?: boolean;
}

const AlertFiltersForm: React.FC<AlertFiltersFormProps> = ({
  alertType,
  filters,
  onFiltersChange,
  accessibilityLabel,
  style,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel = accessibilityLabel || t('components.alertFiltersForm.label');

  // Available sports
  const availableSports = [
    { id: 'NBA', label: 'NBA' },
    { id: 'NFL', label: 'NFL' },
    { id: 'MLB', label: 'MLB' },
    { id: 'NHL', label: 'NHL' },
  ];

  // Available teams based on selected sport
  const getAvailableTeams = () => {
    // In a real app, this would be fetched from an API or database
    // For now, we'll just return some example teams for NBA
    if (filters.sports.includes('NBA')) {
      return [
        { id: 'all', label: t('alerts.filters.allNbaTeams') },
        { id: 'lakers', label: 'Lakers' },
        { id: 'warriors', label: 'Warriors' },
        { id: 'celtics', label: 'Celtics' },
        { id: 'bucks', label: 'Bucks' },
      ];
    }

    return [{ id: 'all', label: t('alerts.filters.allTeams') }];
  };

  // Threshold labels
  const thresholdLabels = ['0.5', '2', '5', '10'];

  // Handle sport selection
  const handleSportToggle = (sportId: string) => {
    if (disabled) return;

    const newSports = filters.sports.includes(sportId)
      ? filters.sports.filter(id => id !== sportId)
      : [...filters.sports, sportId];

    // Reset team if no sports selected
    const newTeam = newSports.length === 0 ? undefined : filters.team;

    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        sports: newSports,
        team: newTeam,
      });
    }
  };

  // Handle threshold change
  const handleThresholdChange = (value: number) => {
    if (disabled) return;

    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        threshold: value,
      });
    }
  };

  // Handle alert method toggle
  const handleMethodToggle = (method: 'pushNotification' | 'email') => {
    if (disabled) return;

    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        methods: {
          ...filters.methods,
          [method]: !filters.methods[method],
        },
      });
    }
  };

  return (
    <AccessibleThemedView
      style={[styles.container, style]}
      accessibilityLabel={defaultAccessibilityLabel}
    >
      <ScrollView style={styles.scrollView}>
        {/* Sports Filter */}
        <FilterSection title={t('alerts.filters.sports')} style={styles.section}>
          <View style={styles.tagsContainer}>
            {availableSports.map(sport => (
              <FilterTag
                key={sport.id}
                label={sport.label}
                selected={filters.sports.includes(sport.id)}
                onPress={() => handleSportToggle(sport.id)}
                disabled={disabled}
                style={styles.tag}
              />
            ))}
          </View>
        </FilterSection>

        {/* Teams Filter (only show if sports are selected) */}
        {filters.sports.length > 0 && (
          <FilterSection title={t('alerts.filters.teams')} style={styles.section}>
            {/* In a real app, this would be a dropdown or picker component */}
            <View style={styles.teamSelector}>
              {/* Placeholder for team selector */}
              <AccessibleThemedView
                style={[
                  styles.teamSelectorPlaceholder,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {getAvailableTeams()[0].label}
              </AccessibleThemedView>
            </View>
          </FilterSection>
        )}

        {/* Threshold Filter (only show for line movement alerts) */}
        {alertType === 'lineMovement' && (
          <FilterSection title={t('alerts.filters.threshold')} style={styles.section}>
            <View style={styles.sliderContainer}>
              <Slider
                value={filters.threshold}
                onValueChange={handleThresholdChange}
                minimumValue={0.5}
                maximumValue={10}
                step={0.5}
                labels={thresholdLabels}
                disabled={disabled}
                formatValue={value => `${value} ${t('common.points')}`}
              />
            </View>
          </FilterSection>
        )}

        {/* Alert Methods */}
        <FilterSection title={t('alerts.filters.methods')} style={styles.section}>
          <View style={styles.methodsContainer}>
            <CheckboxWithLabel
              label={t('alerts.methods.pushNotification')}
              checked={filters.methods.pushNotification}
              onToggle={() => handleMethodToggle('pushNotification')}
              disabled={disabled}
              style={styles.methodOption}
            />

            <CheckboxWithLabel
              label={t('alerts.methods.email')}
              checked={filters.methods.email}
              onToggle={() => handleMethodToggle('email')}
              disabled={disabled}
              style={styles.methodOption}
            />
          </View>
        </FilterSection>
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Compensate for tag margins
  },
  tag: {
    margin: 4,
  },
  teamSelector: {
    width: '100%',
  },
  teamSelectorPlaceholder: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  methodsContainer: {
    width: '100%',
  },
  methodOption: {
    marginBottom: 8,
  },
});

export default AlertFiltersForm;
