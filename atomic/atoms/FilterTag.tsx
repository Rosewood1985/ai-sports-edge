import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';

import AccessibleThemedText from './AccessibleThemedText';
import AccessibleTouchableOpacity from './AccessibleTouchableOpacity';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * FilterTag component that displays a selectable tag for filtering.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export interface FilterTagProps {
  /**
   * Text to display in the tag
   */
  label: string;

  /**
   * Whether the tag is selected
   * @default false
   */
  selected?: boolean;

  /**
   * Callback when the tag is pressed
   */
  onPress?: () => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the tag container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the tag text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Whether the tag is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Size of the tag
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

const FilterTag: React.FC<FilterTagProps> = ({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
  style,
  textStyle,
  disabled = false,
  size = 'medium',
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel ||
    t('components.filterTag.label', {
      label,
      selected: selected ? t('common.selected') : t('common.notSelected'),
    });

  // Determine colors based on selection state
  const backgroundColor = selected ? colors.primary : colors.card;
  const textColor = selected ? '#FFFFFF' : colors.text;
  const borderColor = selected ? colors.primary : colors.border;

  // Determine size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      case 'medium':
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <AccessibleTouchableOpacity
      onPress={onPress}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={[
        styles.container,
        sizeStyles.container,
        {
          backgroundColor,
          borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <AccessibleThemedText style={[styles.text, sizeStyles.text, { color: textColor }, textStyle]}>
        {label}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50, // Fully rounded corners
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 40,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 60,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 80,
  },
  text: {
    textAlign: 'center',
  },
  smallText: {
    fontSize: 10,
    fontWeight: '500',
  },
  mediumText: {
    fontSize: 12,
    fontWeight: '500',
  },
  largeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default FilterTag;
