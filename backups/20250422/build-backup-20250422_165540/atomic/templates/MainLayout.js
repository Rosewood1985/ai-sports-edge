/**
 * MainLayout Template
 *
 * A template for the main layout of the application.
 * This template provides a consistent structure for pages with header, content, and footer.
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';

import { useTheme } from '../molecules/themeContext';

/**
 * MainLayout component props
 * @typedef {Object} MainLayoutProps
 * @property {React.ReactNode} children - Content to render in the main area
 * @property {React.ReactNode} [header] - Header component
 * @property {React.ReactNode} [footer] - Footer component
 * @property {boolean} [scrollable=true] - Whether the content is scrollable
 * @property {Object} [style] - Additional style for the container
 * @property {Object} [contentStyle] - Additional style for the content area
 * @property {boolean} [safeArea=true] - Whether to use SafeAreaView
 * @property {string} [statusBarStyle='auto'] - Status bar style ('auto', 'light', 'dark')
 */

/**
 * MainLayout component
 * @param {MainLayoutProps} props - Component props
 * @returns {React.ReactNode} Rendered component
 */
const MainLayout = ({
  children,
  header,
  footer,
  scrollable = true,
  style,
  contentStyle,
  safeArea = true,
  statusBarStyle = 'auto',
}) => {
  // Get theme from context
  const { colors, effectiveTheme } = useTheme();

  // Determine status bar style based on theme
  const barStyle =
    statusBarStyle === 'auto'
      ? effectiveTheme === 'dark'
        ? 'light-content'
        : 'dark-content'
      : statusBarStyle === 'light'
        ? 'light-content'
        : 'dark-content';

  // Create styles based on theme
  const themedStyles = {
    container: {
      backgroundColor: colors.background,
    },
    content: {
      backgroundColor: colors.background,
    },
  };

  // Render content with or without ScrollView
  const renderContent = () => {
    const contentComponent = (
      <View style={[styles.content, themedStyles.content, contentStyle]}>{children}</View>
    );

    if (scrollable) {
      return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {contentComponent}
        </ScrollView>
      );
    }

    return contentComponent;
  };

  // Main component structure
  const layoutContent = (
    <View style={[styles.container, themedStyles.container, style]}>
      <StatusBar barStyle={barStyle} />

      {/* Header */}
      {header && <View style={styles.header}>{header}</View>}

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  // Wrap with SafeAreaView if needed
  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {layoutContent}
      </SafeAreaView>
    );
  }

  return layoutContent;
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    width: '100%',
    zIndex: 10,
  },
});

export default MainLayout;
