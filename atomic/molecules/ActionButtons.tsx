import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp, View } from 'react-native';

import { AccessibleTouchableOpacity, AccessibleThemedText } from '../atoms';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * ActionButtons component that displays primary and secondary action buttons.
 *
 * This is a molecular component (molecule) that combines atoms to form
 * a more complex component in the atomic design system.
 */
export interface ActionButtonsProps {
  /**
   * Label for the primary button
   */
  primaryLabel: string;

  /**
   * Label for the secondary button
   */
  secondaryLabel: string;

  /**
   * Callback when the primary button is pressed
   */
  onPrimaryPress?: () => void;

  /**
   * Callback when the secondary button is pressed
   */
  onSecondaryPress?: () => void;

  /**
   * Whether the primary button is disabled
   * @default false
   */
  primaryDisabled?: boolean;

  /**
   * Whether the secondary button is disabled
   * @default false
   */
  secondaryDisabled?: boolean;

  /**
   * Accessibility label for the primary button
   */
  primaryAccessibilityLabel?: string;

  /**
   * Accessibility label for the secondary button
   */
  secondaryAccessibilityLabel?: string;

  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the primary button
   */
  primaryStyle?: StyleProp<ViewStyle>;

  /**
   * Additional style for the secondary button
   */
  secondaryStyle?: StyleProp<ViewStyle>;

  /**
   * Additional style for the primary button text
   */
  primaryTextStyle?: StyleProp<TextStyle>;

  /**
   * Additional style for the secondary button text
   */
  secondaryTextStyle?: StyleProp<TextStyle>;

  /**
   * Direction of the buttons
   * @default 'row'
   */
  direction?: 'row' | 'column';

  /**
   * Whether the primary button is loading
   * @default false
   */
  primaryLoading?: boolean;

  /**
   * Whether the secondary button is loading
   * @default false
   */
  secondaryLoading?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  primaryDisabled = false,
  secondaryDisabled = false,
  primaryAccessibilityLabel,
  secondaryAccessibilityLabel,
  style,
  primaryStyle,
  secondaryStyle,
  primaryTextStyle,
  secondaryTextStyle,
  direction = 'row',
  primaryLoading = false,
  secondaryLoading = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility labels if none provided
  const defaultPrimaryAccessibilityLabel =
    primaryAccessibilityLabel ||
    t('components.actionButtons.primaryLabel', { label: primaryLabel });

  const defaultSecondaryAccessibilityLabel =
    secondaryAccessibilityLabel ||
    t('components.actionButtons.secondaryLabel', { label: secondaryLabel });

  return (
    <View
      style={[
        styles.container,
        direction === 'column' ? styles.columnContainer : styles.rowContainer,
        style,
      ]}
    >
      <AccessibleTouchableOpacity
        onPress={onSecondaryPress}
        accessibilityLabel={defaultSecondaryAccessibilityLabel}
        accessibilityRole="button"
        disabled={secondaryDisabled || secondaryLoading}
        style={[
          styles.button,
          styles.secondaryButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          direction === 'column' && styles.fullWidthButton,
          secondaryStyle,
        ]}
      >
        <AccessibleThemedText
          style={[styles.buttonText, styles.secondaryButtonText, secondaryTextStyle]}
        >
          {secondaryLoading ? t('common.loading') : secondaryLabel}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>

      <AccessibleTouchableOpacity
        onPress={onPrimaryPress}
        accessibilityLabel={defaultPrimaryAccessibilityLabel}
        accessibilityRole="button"
        disabled={primaryDisabled || primaryLoading}
        style={[
          styles.button,
          styles.primaryButton,
          { backgroundColor: colors.primary },
          direction === 'column' && styles.fullWidthButton,
          primaryStyle,
        ]}
      >
        <AccessibleThemedText
          style={[styles.buttonText, styles.primaryButtonText, primaryTextStyle]}
        >
          {primaryLoading ? t('common.loading') : primaryLabel}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnContainer: {
    flexDirection: 'column',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
  },
  fullWidthButton: {
    marginLeft: 0,
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    // Uses the default text color from ThemedText
  },
});

export default ActionButtons;
