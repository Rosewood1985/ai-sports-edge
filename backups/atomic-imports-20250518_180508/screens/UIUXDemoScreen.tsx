import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import AnimatedTransition from '../components/AnimatedTransition';
import PageTransition from '../components/PageTransition';
import { useUITheme, UIThemeProvider, UIThemeType } from '../components/UIThemeProvider';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Demo Card component to showcase UI theme
 */
const DemoCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  index: number;
}> = ({ title, description, icon, index }) => {
  const { cardStyle, spacing, textStyle } = useUITheme();

  return (
    <AnimatedTransition
      type="slideUp"
      duration={500}
      delay={100}
      index={index}
      staggerDelay={100}
      style={[styles.card, cardStyle]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={24} color={Colors.neon.blue} />
        <Text style={[styles.cardTitle, textStyle]}>{title}</Text>
      </View>
      <Text style={[styles.cardDescription, textStyle]}>{description}</Text>
    </AnimatedTransition>
  );
};

/**
 * Demo Button component to showcase UI theme
 */
const DemoButton: React.FC<{
  title: string;
  icon?: string;
  onPress: () => void;
  primary?: boolean;
  index: number;
}> = ({ title, icon, onPress, primary = true, index }) => {
  const { buttonStyle, spacing } = useUITheme();

  return (
    <AnimatedTransition type="scale" duration={400} delay={200} index={index} staggerDelay={100}>
      <TouchableOpacity
        style={[
          styles.button,
          buttonStyle,
          { backgroundColor: primary ? Colors.neon.blue : 'transparent' },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color="#FFFFFF"
            style={{ marginRight: spacing.sm }}
          />
        )}
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    </AnimatedTransition>
  );
};

/**
 * Theme Selector component
 */
const ThemeSelector: React.FC = () => {
  const { uiTheme, setUITheme } = useUITheme();
  const { isDark } = useTheme();

  const themes: { key: UIThemeType; label: string; icon: string }[] = [
    { key: 'neon', label: 'Neon', icon: 'flash' },
    { key: 'minimal', label: 'Minimal', icon: 'remove' },
    { key: 'classic', label: 'Classic', icon: 'albums' },
    { key: 'default', label: 'Default', icon: 'options' },
  ];

  return (
    <View style={styles.themeSelector}>
      <ThemedText style={styles.themeSelectorTitle}>Select Theme</ThemedText>
      <View style={styles.themeOptions}>
        {themes.map((theme, index) => (
          <AnimatedTransition
            key={theme.key}
            type="fade"
            duration={400}
            delay={300}
            index={index}
            staggerDelay={100}
          >
            <TouchableOpacity
              style={[
                styles.themeOption,
                uiTheme === theme.key && styles.themeOptionActive,
                { borderColor: isDark ? '#333333' : '#E0E0E0' },
              ]}
              onPress={() => setUITheme(theme.key)}
            >
              <Ionicons
                name={theme.icon as any}
                size={24}
                color={uiTheme === theme.key ? Colors.neon.blue : isDark ? '#FFFFFF' : '#333333'}
              />
              <ThemedText style={styles.themeOptionLabel}>{theme.label}</ThemedText>
            </TouchableOpacity>
          </AnimatedTransition>
        ))}
      </View>
    </View>
  );
};

/**
 * Demo Section component
 */
const DemoSection: React.FC<{
  title: string;
  children: React.ReactNode;
  index: number;
}> = ({ title, children, index }) => {
  const { textStyle } = useUITheme();

  return (
    <AnimatedTransition type="slideUp" duration={500} delay={100 * index} style={styles.section}>
      <ThemedText style={[styles.sectionTitle, textStyle]}>{title}</ThemedText>
      {children}
    </AnimatedTransition>
  );
};

/**
 * UI/UX Demo Screen
 */
const UIUXDemoScreen: React.FC = () => {
  // State
  const [currentPage, setCurrentPage] = useState<'main' | 'details'>('main');
  const [transitionType, setTransitionType] = useState<'fade' | 'slideLeft' | 'slideRight'>('fade');
  const [darkMode, setDarkMode] = useState(false);

  // Get theme colors
  const { isDark, setTheme } = useTheme();

  // Update dark mode state when theme changes
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    setTheme(newMode ? 'dark' : 'light');
  };

  // Navigate to details page
  const goToDetails = (type: 'fade' | 'slideLeft' | 'slideRight') => {
    setTransitionType(type);
    setCurrentPage('details');
  };

  // Navigate back to main page
  const goBack = () => {
    setCurrentPage('main');
  };

  // Render main page
  const renderMainPage = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      <DemoSection title="UI Theme Showcase" index={0}>
        <ThemeSelector />
      </DemoSection>

      <DemoSection title="Card Components" index={1}>
        <DemoCard
          title="Animated Cards"
          description="Cards with smooth entrance animations and consistent styling across the app."
          icon="card"
          index={0}
        />
        <DemoCard
          title="Themed Components"
          description="Components that automatically adapt to light and dark mode with consistent styling."
          icon="color-palette"
          index={1}
        />
        <DemoCard
          title="Responsive Design"
          description="UI elements that adapt to different screen sizes and orientations."
          icon="resize"
          index={2}
        />
      </DemoSection>

      <DemoSection title="Page Transitions" index={2}>
        <View style={styles.buttonRow}>
          <DemoButton
            title="Fade Transition"
            icon="flash"
            onPress={() => goToDetails('fade')}
            index={0}
          />
          <DemoButton
            title="Slide Left"
            icon="arrow-forward"
            onPress={() => goToDetails('slideLeft')}
            index={1}
          />
          <DemoButton
            title="Slide Right"
            icon="arrow-back"
            onPress={() => goToDetails('slideRight')}
            index={2}
          />
        </View>
      </DemoSection>

      <DemoSection title="Theme Settings" index={3}>
        <View style={styles.settingRow}>
          <ThemedText>Dark Mode</ThemedText>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: `${Colors.neon.blue}50` }}
            thumbColor={darkMode ? Colors.neon.blue : '#f4f3f4'}
          />
        </View>
      </DemoSection>
    </ScrollView>
  );

  // Render details page
  const renderDetailsPage = () => (
    <View style={styles.detailsContainer}>
      <AnimatedTransition type="slideDown" duration={500}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.neon.blue} />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.detailsTitle}>Transition Demo</ThemedText>
        </View>
      </AnimatedTransition>

      <View style={styles.detailsContent}>
        <AnimatedTransition type="fade" duration={800} delay={300}>
          <ThemedView style={styles.detailsCard}>
            <Ionicons name="information-circle" size={48} color={Colors.neon.blue} />
            <ThemedText style={styles.detailsCardTitle}>
              {transitionType === 'fade'
                ? 'Fade Transition'
                : transitionType === 'slideLeft'
                  ? 'Slide Left Transition'
                  : 'Slide Right Transition'}
            </ThemedText>
            <ThemedText style={styles.detailsCardDescription}>
              This page demonstrates the {transitionType} transition effect. Smooth transitions
              between screens enhance the user experience by providing visual continuity and
              reducing the jarring effect of abrupt screen changes.
            </ThemedText>
          </ThemedView>
        </AnimatedTransition>

        <View style={styles.buttonRow}>
          <DemoButton title="Go Back" icon="arrow-back" onPress={goBack} index={0} />
        </View>
      </View>
    </View>
  );

  return (
    <UIThemeProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#121212' : '#F8F8F8'}
        />

        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>UI/UX Showcase</ThemedText>
        </View>

        <PageTransition
          type={currentPage === 'main' ? 'fade' : transitionType}
          visible={currentPage === 'main'}
          duration={300}
        >
          {renderMainPage()}
        </PageTransition>

        <PageTransition
          type={currentPage === 'details' ? transitionType : 'fade'}
          visible={currentPage === 'details'}
          duration={300}
        >
          {renderDetailsPage()}
        </PageTransition>
      </SafeAreaView>
    </UIThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  button: {
    margin: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  themeSelector: {
    marginBottom: 16,
  },
  themeSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  themeOption: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  themeOptionActive: {
    borderColor: Colors.neon.blue,
    borderWidth: 2,
  },
  themeOptionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailsContainer: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.neon.blue,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  detailsCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  detailsCardDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default UIUXDemoScreen;
