import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '@react-navigation/native';
import {
  AccessibleThemedView,
  AccessibleThemedText,
  AccessibleTouchableOpacity,
  AlertTypeIcon,
} from '../atoms';
import { AlertType } from '../atoms/AlertTypeIcon';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * AlertTypeOption component that displays a selectable option for alert types.
 *
 * This is a molecular component (molecule) that combines atoms to form
 * a more complex component in the atomic design system.
 */
export interface AlertTypeOptionProps {
  /**
   * Type of alert
   */
  type: AlertType;

  /**
   * Label text to display below the icon
   */
  label: string;

  /**
   * Whether the option is selected
   * @default false
   */
  selected?: boolean;

  /**
   * Callback when the option is selected
   */
  onSelect?: () => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the option container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the label text
   */
  labelStyle?: StyleProp<TextStyle>;

  /**
   * Whether the option is disabled
   * @default false
   */
  disabled?: boolean;
}

const AlertTypeOption: React.FC<AlertTypeOptionProps> = ({
  type,
  label,
  selected = false,
  onSelect,
  accessibilityLabel,
  style,
  labelStyle,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel ||
    t('components.alertTypeOption.label', {
      type: label,
      selected: selected ? t('common.selected') : t('common.notSelected'),
    });

  // Determine colors based on selection state
  const backgroundColor = selected ? colors.primary + '10' : colors.card;
  const borderColor = selected ? colors.primary : colors.border;

  return (
    <AccessibleTouchableOpacity
      onPress={onSelect}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <AlertTypeIcon type={type} size={32} selected={selected} style={styles.icon} />

      <AccessibleThemedText
        style={[
          styles.label,
          selected && { color: colors.primary, fontWeight: 'bold' },
          labelStyle,
        ]}
      >
        {label}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AlertTypeOption;
