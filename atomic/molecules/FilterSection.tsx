import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, StyleProp, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { AccessibleThemedView, AccessibleThemedText } from '../atoms';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * FilterSection component that displays a section with a title and content.
 *
 * This is a molecular component (molecule) that combines atoms to form
 * a more complex component in the atomic design system.
 */
export interface FilterSectionProps {
  /**
   * Title text to display
   */
  title: string;

  /**
   * Content to display in the section
   */
  children: React.ReactNode;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the section container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the title text
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Additional style for the content container
   */
  contentStyle?: StyleProp<ViewStyle>;

  /**
   * Whether the section is collapsible
   * @default false
   */
  collapsible?: boolean;

  /**
   * Whether the section is initially collapsed
   * @default false
   */
  initiallyCollapsed?: boolean;

  /**
   * Whether to show a divider below the section
   * @default false
   */
  showDivider?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  accessibilityLabel,
  style,
  titleStyle,
  contentStyle,
  collapsible = false,
  initiallyCollapsed = false,
  showDivider = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // State for tracking collapsed state
  const [collapsed, setCollapsed] = React.useState(initiallyCollapsed);

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel || t('components.filterSection.label', { title });

  // Toggle collapsed state
  const toggleCollapsed = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <AccessibleThemedView
      style={[
        styles.container,
        showDivider && { borderBottomWidth: 1, borderBottomColor: colors.border },
        style,
      ]}
      accessibilityLabel={defaultAccessibilityLabel}
    >
      <View style={styles.titleContainer}>
        <AccessibleThemedText
          style={[styles.title, titleStyle]}
          onPress={collapsible ? toggleCollapsed : undefined}
          accessibilityRole={collapsible ? 'button' : undefined}
          accessibilityState={collapsible ? { expanded: !collapsed } : undefined}
        >
          {title}
        </AccessibleThemedText>

        {collapsible && (
          <AccessibleThemedText
            style={styles.collapseIcon}
            onPress={toggleCollapsed}
            accessibilityRole="button"
            accessibilityLabel={
              collapsed
                ? t('components.filterSection.expand')
                : t('components.filterSection.collapse')
            }
          >
            {collapsed ? '▼' : '▲'}
          </AccessibleThemedText>
        )}
      </View>

      {!collapsed && <View style={[styles.content, contentStyle]}>{children}</View>}
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  collapseIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  content: {
    marginTop: 4,
  },
});

export default FilterSection;
