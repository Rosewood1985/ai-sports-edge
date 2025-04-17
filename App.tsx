import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { Text, View, StyleSheet } from "react-native";
import AppNavigator from "./navigation/AppNavigator";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NavigationStateProvider } from "./contexts/NavigationStateContext";
import { initErrorTracking } from "./services/errorTrackingService";
import { initPerformanceMonitoring } from "./services/performanceMonitoringService";
import { initAlerting } from "./services/alertingService";
import { initLogging, info, LogCategory } from "./services/loggingService";
import { validateEnvironment } from "./utils/envCheck";
import {
  debugServiceInitialization,
  debugServiceDependencies,
} from "./debug-services";
import ErrorBoundary from "./components/ErrorBoundary";
import { Colors } from "./constants/Colors";
import { ThemeProvider, useTheme } from "./screens/Onboarding/Context/ThemeContext"; // 🌓 ThemeContext

// Custom light/dark theme objects based on your Colors.ts
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: "#f0f2f5",
    text: Colors.light.text,
    border: "#d1d5db",
    notification: "#FF3B30",
    icon: Colors.light.icon,
  },
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primaryAction,
    background: Colors.dark.primaryBackground,
    card: "#2a2c2d",
    text: Colors.dark.primaryText,
    border: Colors.dark.borderSubtle,
    notification: "#FF453A",
    icon: Colors.dark.iconPrimary,
  },
};

// ⛑️ App body wrapped inside custom ThemeConsumer
const AppInner = () => {
  const { theme } = useTheme(); // Get current theme from context

  // Monitoring setup
  useEffect(() => {
    try {
      debugServiceDependencies();
      debugServiceInitialization();

      // Validate environment variables with basic console logging
      const envValid = validateEnvironment({ exitOnError: false });
      if (!envValid) {
        console.warn("Environment validation failed - app may not function correctly");
      }

      const loggingInitialized = initLogging();
      
      // Log environment validation result with proper logging service
      if (loggingInitialized) {
        if (!envValid) {
          info(LogCategory.APP, "Environment validation failed - app may not function correctly");
        } else {
          info(LogCategory.APP, "Environment validation passed");
        }
      }
      if (loggingInitialized) {
        info(LogCategory.APP, "Logging service initialized");

        try {
          const errorTrackingInitialized = initErrorTracking();
          if (errorTrackingInitialized) {
            info(LogCategory.APP, "Error tracking service initialized");
          }
        } catch (err) {
          console.error("Error tracking failed:", err);
        }

        try {
          const perfInit = initPerformanceMonitoring();
          if (perfInit) {
            info(LogCategory.APP, "Performance monitoring service initialized");
          }
        } catch (err) {
          console.error("Perf monitoring failed:", err);
        }

        try {
          const alertingInit = initAlerting();
          if (alertingInit) {
            info(LogCategory.APP, "Alerting service initialized");
          }
        } catch (err) {
          console.error("Alerting failed:", err);
        }
      }
    } catch (err) {
      console.error("Init failed:", err);
    }
  }, []);

  const fallbackUI = (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>App Error</Text>
      <Text style={styles.fallbackText}>
        We encountered a problem. Please restart the app.
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
                theme={theme === "dark" ? darkTheme : lightTheme}
                onReady={() => {
                  info(LogCategory.NAVIGATION, "Navigation container ready");
                }}
                onStateChange={(state) => {
                  const currentRoute = state?.routes[state.index]?.name;
                  if (currentRoute) {
                    info(
                      LogCategory.NAVIGATION,
                      `Navigated to ${currentRoute}`
                    );
                  }
                }}
              >
                <StatusBar style={theme === "dark" ? "light" : "dark"} />
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
};

// Final wrapped export
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

// Fallback UI styles
const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#dc3545",
    textAlign: "center",
  },
  fallbackText: {
    fontSize: 16,
    textAlign: "center",
    color: Colors.light.text,
    lineHeight: 24,
  },
});
