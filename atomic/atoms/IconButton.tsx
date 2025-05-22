import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import AccessibleTouchableOpacity from './AccessibleTouchableOpacity';
import AccessibleThemedView from './AccessibleThemedView';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * IconButton component that displays an icon with a touchable area.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export interface IconButtonProps {
  /**
   * Name of the icon from Ionicons
   */
  name: keyof typeof Ionicons.glyphMap;

  /**
   * Size of the icon
   * @default 24
   */
  size?: number;

  /**
   * Color of the icon (overrides theme color)
   */
  color?: string;

  /**
   * Background color of the button (overrides theme color)
   */
  backgroundColor?: string;

  /**
   * Whether the button has a circular shape
   * @default false
   */
  circular?: boolean;

  /**
   * Callback when the button is pressed
   */
  onPress?: () => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint for screen readers
   */
  accessibilityHint?: string;

  /**
   * Additional style for the button container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 24,
  color,
  backgroundColor,
  circular = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel || t('components.iconButton.defaultLabel', { icon: name });

  // Use theme colors if no custom colors provided
  const iconColor = color || colors.text;
  const bgColor = backgroundColor || 'transparent';

  return (
    <AccessibleTouchableOpacity
      onPress={onPress}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.container,
        circular && styles.circular,
        { backgroundColor: bgColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <AccessibleThemedView style={styles.iconContainer}>
        <Ionicons name={name} size={size} color={disabled ? colors.border : iconColor} />
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circular: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
