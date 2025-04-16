import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme, Text, View, StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { LanguageProvider } from './contexts/LanguageContext';
import { NavigationStateProvider } from './contexts/NavigationStateContext';
import { initErrorTracking } from './services/errorTrackingService';
import { initPerformanceMonitoring } from './services/performanceMonitoringService';
// import { initAnalytics } from './services/analyticsService'; // Removed - function doesn't exist
import { initAlerting } from './services/alertingService';
import { initLogging, info, LogCategory } from './services/loggingService';
import { debugServiceInitialization, debugServiceDependencies } from './debug-services';
import ErrorBoundary from './components/ErrorBoundary';
import { Colors } from './constants/Colors'; // Import Colors

export default function App() {
  const colorScheme = useColorScheme();

  // Initialize monitoring services
  useEffect(() => {
    console.log('Initializing services...');

    // Run debug functions to check module resolution
    console.log('Running debug functions to check module resolution');
    try {
      debugServiceDependencies();
      debugServiceInitialization();
    } catch (debugError) {
      console.error('Error running debug functions:', debugError);
    }

    try {
      // Initialize logging first
      console.log('About to initialize logging service');
      const loggingInitialized = initLogging();
      console.log('Logging initialization result:', loggingInitialized);

      if (loggingInitialized) {
        info(LogCategory.APP, 'Logging service initialized');

        // Try to initialize error tracking with improved error handling
        console.log('About to initialize error tracking service');
        try {
          const errorTrackingInitialized = initErrorTracking();
          if (errorTrackingInitialized) {
            console.log('Error tracking service initialized successfully');
            info(LogCategory.APP, 'Error tracking service initialized');
          } else {
            console.warn('Error tracking service initialization returned false');
            info(LogCategory.APP, 'Error tracking service initialization failed');
          }
        } catch (errorTrackingError) {
          console.error('Exception caught while initializing error tracking:', errorTrackingError);
          info(LogCategory.APP, 'Error tracking service initialization failed with exception');
        }

        // Initialize other services with improved error handling
        console.log('About to initialize performance monitoring');
        try {
          const performanceMonitoringInitialized = initPerformanceMonitoring();
          if (performanceMonitoringInitialized) {
            console.log('Performance monitoring service initialized successfully');
            info(LogCategory.APP, 'Performance monitoring service initialized');
          } else {
            console.warn('Performance monitoring service initialization returned false');
            info(LogCategory.APP, 'Performance monitoring service initialization failed');
          }
        } catch (performanceMonitoringError) {
          console.error('Exception caught while initializing performance monitoring:', performanceMonitoringError);
          info(LogCategory.APP, 'Performance monitoring service initialization failed with exception');
        }

        console.log('About to initialize alerting service');
        try {
          const alertingInitialized = initAlerting();
          if (alertingInitialized) {
            console.log('Alerting service initialized successfully');
            info(LogCategory.APP, 'Alerting service initialized');
          } else {
            console.warn('Alerting service initialization returned false');
            info(LogCategory.APP, 'Alerting service initialization failed');
          }
        } catch (alertingError) {
          console.error('Exception caught while initializing alerting service:', alertingError);
          info(LogCategory.APP, 'Alerting service initialization failed with exception');
        }
      } else {
        console.error('Logging service failed to initialize');
      }

      // Log app start
      console.log('Logging application start');
      info(LogCategory.APP, 'Application started');
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  }, []);

  // Customize themes based on Colors.ts and guidelines
  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.tint, // Accent color
      background: Colors.light.background, // Dominant color
      card: '#f0f2f5', // Secondary background (light gray)
      text: Colors.light.text, // Secondary color
      border: '#d1d5db', // Secondary color (slightly lighter gray for borders)
      notification: '#FF3B30', // Accent color (keep red for notifications)
      icon: Colors.light.icon, // Add icon color from constants
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.neon.blue, // Use a neon accent for dark mode actions
      background: Colors.dark.background, // Dominant color
      card: '#2a2c2d', // Secondary background (lighter dark gray)
      text: Colors.dark.text, // Secondary color
      border: Colors.dark.icon, // Secondary color (use icon color for borders)
      notification: '#FF453A', // Accent color (keep red for notifications)
      icon: Colors.dark.icon, // Add icon color from constants
    },
  };

  // Create a custom fallback UI for critical errors
  const fallbackUI = (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>App Error</Text>
      <Text style={styles.fallbackText}>
        We encountered a problem with the app. Please restart the application.
      </Text>
    </View>
  );

  return (
    <ErrorBoundary fallback={fallbackUI}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <NavigationStateProvider>
              <NavigationContainer
                theme={colorScheme === 'dark' ? darkTheme : lightTheme}
                onReady={() => {
                  console.log('App: Navigation container ready');
                  info(LogCategory.NAVIGATION, 'Navigation container ready');
                }}
                onStateChange={(state) => {
                  const currentRoute = state?.routes[state.index]?.name;
                  if (currentRoute) {
                    console.log(`App: Navigated to ${currentRoute}`);
                    info(LogCategory.NAVIGATION, `Navigated to ${currentRoute}`);
                  }
                }}
              >
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <ErrorBoundary>
                  <AppNavigator />
                </ErrorBoundary>
              </NavigationContainer>
            </NavigationStateProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Styles for the fallback UI - updated with light theme colors and spacing
const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24, // Increased padding
    backgroundColor: Colors.light.background, // Use light background
  },
  fallbackTitle: {
    fontSize: 24, // Slightly larger
    fontWeight: 'bold',
    marginBottom: 16, // Increased spacing
    color: '#dc3545', // Keep error color distinct
    textAlign: 'center', // Center align header
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center', // Center align description text
    color: Colors.light.text, // Use standard text color
    lineHeight: 24, // Improve readability
  },
});