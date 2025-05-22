import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleTouchableOpacity from './AccessibleTouchableOpacity';
import AccessibleThemedText from './AccessibleThemedText';
import AccessibleThemedView from './AccessibleThemedView';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * CheckboxWithLabel component that displays a checkbox with a label.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export interface CheckboxWithLabelProps {
  /**
   * Label text to display next to the checkbox
   */
  label: string;

  /**
   * Whether the checkbox is checked
   * @default false
   */
  checked?: boolean;

  /**
   * Callback when the checkbox is toggled
   */
  onToggle?: (checked: boolean) => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint for screen readers
   */
  accessibilityHint?: string;

  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the label
   */
  labelStyle?: StyleProp<TextStyle>;

  /**
   * Whether the checkbox is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Position of the label relative to the checkbox
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';

  /**
   * Size of the checkbox
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  checked = false,
  onToggle,
  accessibilityLabel,
  accessibilityHint,
  style,
  labelStyle,
  disabled = false,
  labelPosition = 'right',
  size = 'medium',
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel ||
    t('components.checkbox.label', {
      label,
      checked: checked ? t('common.checked') : t('common.unchecked'),
    });

  // Default accessibility hint if none provided
  const defaultAccessibilityHint = accessibilityHint || t('components.checkbox.hint');

  // Handle checkbox toggle
  const handleToggle = () => {
    if (!disabled && onToggle) {
      onToggle(!checked);
    }
  };

  // Determine checkbox size
  const getCheckboxSize = () => {
    switch (size) {
      case 'small':
        return {
          container: 16,
          icon: 12,
        };
      case 'large':
        return {
          container: 24,
          icon: 18,
        };
      case 'medium':
      default:
        return {
          container: 20,
          icon: 16,
        };
    }
  };

  const checkboxSize = getCheckboxSize();

  // Determine label font size
  const getLabelFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  };

  const labelFontSize = getLabelFontSize();

  // Determine checkbox and label order
  const isLabelFirst = labelPosition === 'left';

  return (
    <AccessibleTouchableOpacity
      onPress={handleToggle}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityHint={defaultAccessibilityHint}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      style={[
        styles.container,
        isLabelFirst ? styles.labelFirst : styles.checkboxFirst,
        disabled && styles.disabled,
        style,
      ]}
    >
      {isLabelFirst && (
        <AccessibleThemedText
          style={[styles.label, { fontSize: labelFontSize, marginRight: 8 }, labelStyle]}
        >
          {label}
        </AccessibleThemedText>
      )}

      <AccessibleThemedView
        style={[
          styles.checkbox,
          {
            width: checkboxSize.container,
            height: checkboxSize.container,
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark"
            size={checkboxSize.icon}
            color="#FFFFFF"
            style={styles.checkIcon}
          />
        )}
      </AccessibleThemedView>

      {!isLabelFirst && (
        <AccessibleThemedText
          style={[styles.label, { fontSize: labelFontSize, marginLeft: 8 }, labelStyle]}
        >
          {label}
        </AccessibleThemedText>
      )}
    </AccessibleTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  labelFirst: {
    flexDirection: 'row',
  },
  checkboxFirst: {
    flexDirection: 'row',
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    alignSelf: 'center',
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CheckboxWithLabel;
