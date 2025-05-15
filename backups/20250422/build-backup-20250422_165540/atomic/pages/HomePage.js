/**
 * Home Page
 *
 * Example page component using the atomic architecture.
 * This demonstrates how to compose a complete page using atoms, molecules, organisms, and templates.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

// Import template
import MainLayout from '../templates/MainLayout';

// Import organisms
import firebase from '../organisms/firebaseService';
import monitoring from '../organisms/monitoringService';

// Import molecules
import { useTheme } from '../molecules/themeContext';

// Create logger
const logger = monitoring.logging.createLogger(monitoring.logging.LogCategory.APP);

/**
 * Header component for the home page
 */
const Header = ({ onThemeToggle }) => {
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>AI Sports Edge</Text>
      <TouchableOpacity
        style={[styles.themeButton, { backgroundColor: colors.primary }]}
        onPress={onThemeToggle}
      >
        <Text style={[styles.themeButtonText, { color: colors.background }]}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Footer component for the home page
 */
const Footer = ({ onLogout }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.footer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.footerButton, { backgroundColor: colors.primary }]}
        onPress={onLogout}
      >
        <Text style={[styles.footerButtonText, { color: colors.background }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Home page component
 */
const HomePage = ({ navigation }) => {
  // Get theme from context
  const { colors, toggleTheme } = useTheme();

  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      // Start performance timer
      const timer = monitoring.performance.createPerformanceTimer(
        'LoadUserData',
        monitoring.performance.TransactionType.DATA_OPERATION
      );

      try {
        // Get current user
        const currentUser = firebase.auth.getCurrentUser();

        if (!currentUser) {
          logger.warn('No user logged in, redirecting to login');
          // In a real app, navigate to login screen
          // navigation.replace('Login');
          setError('Please log in to continue');
          return;
        }

        // Log user access
        logger.info('User accessing home page', { userId: currentUser.uid });

        // Get user data from Firestore
        const userData = await firebase.firestore.getDocument('users', currentUser.uid);
        setUser(userData || currentUser);

        // Stop timer and log performance
        const duration = timer.stop();
        logger.info(`User data loaded in ${duration}ms`, { duration });
      } catch (err) {
        // Handle error
        timer.stop({ error: true });

        // Log error
        logger.error('Failed to load user data', err);

        // Capture exception
        monitoring.error.captureException(err);

        // Set user-friendly error message
        setError(monitoring.error.getUserFriendlyMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Track screen view
    monitoring.performance.trackNavigation('Home');

    // Clean up
    return () => {
      logger.debug('Home page unmounted');
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await firebase.auth.logOut();
      logger.info('User signed out');
      // In a real app, navigate to login screen
      // navigation.replace('Login');
    } catch (err) {
      logger.error('Failed to sign out', err);
      monitoring.error.captureException(err);
    }
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setError(null)}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (user) {
      return (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Welcome, {user.displayName || user.email}!
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              This is an example page using the atomic architecture.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Atomic Architecture</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              This page demonstrates how to compose a complete page using:
            </Text>
            <View style={styles.list}>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>
                • Atoms (basic building blocks)
              </Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>
                • Molecules (combinations of atoms)
              </Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>
                • Organisms (complex components)
              </Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>
                • Templates (layout structures)
              </Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>
                • Pages (specific implementations)
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  // Render page using MainLayout template
  return (
    <MainLayout
      header={<Header onThemeToggle={toggleTheme} />}
      footer={<Footer onLogout={handleLogout} />}
      scrollable={true}
    >
      {renderContent()}
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 8,
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 4,
    paddingLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomePage;
