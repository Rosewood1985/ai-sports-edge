import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import AccessibleThemedView from './AccessibleThemedView';
import AccessibleThemedText from './AccessibleThemedText';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * Alert types supported by the component
 */
export type AlertType = 'lineMovement' | 'sharpAction' | 'aiPrediction' | 'playerProps';

/**
 * AlertTypeIcon component that displays an icon for a specific alert type.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export interface AlertTypeIconProps {
  /**
   * Type of alert
   */
  type: AlertType;

  /**
   * Size of the icon container
   * @default 32
   */
  size?: number;

  /**
   * Whether the icon is selected
   * @default false
   */
  selected?: boolean;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the icon container
   */
  style?: StyleProp<ViewStyle>;
}

const AlertTypeIcon: React.FC<AlertTypeIconProps> = ({
  type,
  size = 32,
  selected = false,
  accessibilityLabel,
  style,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Get icon configuration based on alert type
  const getIconConfig = () => {
    switch (type) {
      case 'lineMovement':
        return {
          iconType: 'material',
          name: 'chart-bar',
          label: t('alerts.types.lineMovement'),
        };
      case 'sharpAction':
        return {
          iconType: 'ionicons',
          name: 'information-circle',
          label: t('alerts.types.sharpAction'),
        };
      case 'aiPrediction':
        return {
          iconType: 'material',
          name: 'message-text',
          label: t('alerts.types.aiPrediction'),
        };
      case 'playerProps':
        return {
          iconType: 'ionicons',
          name: 'person',
          label: t('alerts.types.playerProps'),
        };
      default:
        return {
          iconType: 'ionicons',
          name: 'alert-circle',
          label: t('alerts.types.default'),
        };
    }
  };

  const iconConfig = getIconConfig();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel || t('components.alertTypeIcon.label', { type: iconConfig.label });

  // Determine colors based on selection state
  const backgroundColor = selected ? colors.primary + '20' : colors.card;
  const borderColor = selected ? colors.primary : colors.border;
  const iconColor = selected ? colors.primary : colors.text;

  // Calculate icon size based on container size
  const iconSize = Math.floor(size * 0.6);

  return (
    <AccessibleThemedView
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      accessibilityLabel={defaultAccessibilityLabel}
    >
      {iconConfig.iconType === 'ionicons' ? (
        <Ionicons name={iconConfig.name as any} size={iconSize} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name={iconConfig.name as any} size={iconSize} color={iconColor} />
      )}
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default AlertTypeIcon;
