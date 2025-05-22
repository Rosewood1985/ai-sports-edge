import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AccessibleThemedView } from '../atoms';
import { AlertTypeOption } from '../molecules';
import { AlertType } from '../atoms/AlertTypeIcon';
import { useI18n } from './i18n/I18nContext';

/**
 * AlertTypeSelector component that displays a grid of alert type options.
 *
 * This is an organism component that combines molecules to form
 * a more complex component in the atomic design system.
 */
export interface AlertTypeSelectorProps {
  /**
   * Currently selected alert type
   */
  selectedType?: AlertType;

  /**
   * Callback when an alert type is selected
   */
  onSelectType?: (type: AlertType) => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Number of columns in the grid
   * @default 2
   */
  numColumns?: number;

  /**
   * Whether the selector is disabled
   * @default false
   */
  disabled?: boolean;
}

const AlertTypeSelector: React.FC<AlertTypeSelectorProps> = ({
  selectedType,
  onSelectType,
  accessibilityLabel,
  style,
  numColumns = 2,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel = accessibilityLabel || t('components.alertTypeSelector.label');

  // Alert type options
  const alertTypes: { type: AlertType; label: string }[] = [
    { type: 'lineMovement', label: t('alerts.types.lineMovement') },
    { type: 'sharpAction', label: t('alerts.types.sharpAction') },
    { type: 'aiPrediction', label: t('alerts.types.aiPrediction') },
    { type: 'playerProps', label: t('alerts.types.playerProps') },
  ];

  // Handle alert type selection
  const handleSelectType = (type: AlertType) => {
    if (!disabled && onSelectType) {
      onSelectType(type);
    }
  };

  return (
    <AccessibleThemedView
      style={[styles.container, style]}
      accessibilityLabel={defaultAccessibilityLabel}
    >
      <View style={styles.grid}>
        {alertTypes.map(({ type, label }) => (
          <View key={type} style={[styles.gridItem, { width: `${100 / numColumns - 2}%` }]}>
            <AlertTypeOption
              type={type}
              label={label}
              selected={selectedType === type}
              onSelect={() => handleSelectType(type)}
              disabled={disabled}
            />
          </View>
        ))}
      </View>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
});

export default AlertTypeSelector;
