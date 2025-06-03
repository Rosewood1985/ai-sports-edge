import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';

import { AccessibleThemedView, AccessibleThemedText, IconButton } from '../atoms';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * ModalHeader component that displays a title and a close button.
 *
 * This is a molecular component (molecule) that combines atoms to form
 * a more complex component in the atomic design system.
 */
export interface ModalHeaderProps {
  /**
   * Title text to display
   */
  title: string;

  /**
   * Callback when the close button is pressed
   */
  onClose?: () => void;

  /**
   * Accessibility label for the header
   */
  accessibilityLabel?: string;

  /**
   * Accessibility label for the close button
   */
  closeButtonAccessibilityLabel?: string;

  /**
   * Additional style for the header container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the title text
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Background color of the header
   */
  backgroundColor?: string;

  /**
   * Text color of the title
   */
  textColor?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  accessibilityLabel,
  closeButtonAccessibilityLabel,
  style,
  titleStyle,
  backgroundColor,
  textColor,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel || t('components.modalHeader.label', { title });

  // Default close button accessibility label if none provided
  const defaultCloseButtonAccessibilityLabel =
    closeButtonAccessibilityLabel || t('components.modalHeader.closeButton');

  // Use theme colors if no custom colors provided
  const headerBackgroundColor = backgroundColor || colors.primary;
  const headerTextColor = textColor || '#FFFFFF';

  return (
    <AccessibleThemedView
      style={[styles.container, { backgroundColor: headerBackgroundColor }, style]}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityRole="header"
    >
      <AccessibleThemedText
        style={[styles.title, { color: headerTextColor }, titleStyle]}
        type="h3"
      >
        {title}
      </AccessibleThemedText>

      {onClose && (
        <IconButton
          name="close"
          size={20}
          color={headerTextColor}
          backgroundColor="rgba(255, 255, 255, 0.25)"
          circular
          onPress={onClose}
          accessibilityLabel={defaultCloseButtonAccessibilityLabel}
          style={styles.closeButton}
        />
      )}
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginLeft: 8,
  },
});

export default ModalHeader;
