import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AccessibleThemedView, AccessibleThemedText } from '../atoms';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * AlertPreview component that displays a preview of what the alert will look like.
 *
 * This is a molecular component (molecule) that combines atoms to form
 * a more complex component in the atomic design system.
 */
export interface AlertPreviewProps {
  /**
   * Title of the alert
   */
  title: string;

  /**
   * Description of the alert
   */
  description: string;

  /**
   * Icon name to display
   * @default 'notifications'
   */
  iconName?: keyof typeof Ionicons.glyphMap;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the preview container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the title text
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Additional style for the description text
   */
  descriptionStyle?: StyleProp<TextStyle>;

  /**
   * Color of the icon
   */
  iconColor?: string;
}

const AlertPreview: React.FC<AlertPreviewProps> = ({
  title,
  description,
  iconName = 'notifications',
  accessibilityLabel,
  style,
  titleStyle,
  descriptionStyle,
  iconColor,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel || t('components.alertPreview.label', { title });

  // Use theme colors if no custom colors provided
  const actualIconColor = iconColor || colors.primary;

  return (
    <AccessibleThemedView
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      accessibilityLabel={defaultAccessibilityLabel}
    >
      <View style={styles.header}>
        <Ionicons name={iconName} size={20} color={actualIconColor} style={styles.icon} />

        <AccessibleThemedText style={[styles.title, titleStyle]}>{title}</AccessibleThemedText>
      </View>

      <AccessibleThemedText style={[styles.description, descriptionStyle]}>
        {description}
      </AccessibleThemedText>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default AlertPreview;
