import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Platform, View, Text } from 'react-native';

// Import Sentry service
import { sentryService, createSentryConfig } from './services/sentryService';
import { sentryNavigationInstrumentation } from './utils/sentryNavigationInstrumentation';

// Import optimization services
import { optimizationOrchestrator } from './services/optimizationOrchestrator';
import { advancedImageOptimizationService } from './services/advancedImageOptimizationService';

// Import navigation
import AppNavigator from './navigation/AppNavigator';

// Main App component
export default function App() {
  const navigationRef = React.useRef(null);

  // Initialize services
  React.useEffect(() => {
    // Initialize Sentry first
    const environment = __DEV__ ? 'development' : 'production';
    const sentryConfig = createSentryConfig(environment);
    
    if (sentryConfig.dsn) {
      sentryService.initialize(sentryConfig);
      sentryNavigationInstrumentation.initialize();
      
      console.log(`[Sentry] Initialized for ${environment} environment`);
    } else {
      console.log('[Sentry] DSN not configured - error tracking disabled');
    }

    // Initialize optimization services
    const initOptimizations = async () => {
      try {
        console.log('🚀 Initializing optimization services...');
        
        // Initialize optimization orchestrator
        await optimizationOrchestrator.initialize();
        
        // Enable lazy loading for images
        advancedImageOptimizationService.enableLazyLoading();
        
        console.log('✅ Optimization services activated');
        
        if (sentryService.isActive()) {
          sentryService.addBreadcrumb(
            'Optimization services initialized',
            'optimization',
            'info'
          );
        }
      } catch (error) {
        console.error('❌ Failed to initialize optimizations:', error);
        
        if (sentryService.isActive()) {
          sentryService.captureError(error, {
            additionalData: {
              context: 'optimization_initialization',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    };
    
    initOptimizations();

    // Initialize other services (will be added back when imports are fixed)
    // firebaseService.initialize();
    // monitoringService.initialize();
    // privacyService.initialize();

    // Set initial app context
    if (sentryService.isActive()) {
      sentryService.setContext('app_initialization', {
        platform: Platform.OS,
        expo_version: Constants.expoVersion,
        app_version: Constants.manifest?.version || '1.0.0',
        environment,
        features: ['racing_data_phase3', 'atomic_architecture', 'firebase_auth'],
      });

      sentryService.addBreadcrumb(
        'App initialized',
        'app_lifecycle',
        'info',
        {
          platform: Platform.OS,
          environment,
        }
      );
    }
  }, []);

  // Handle navigation state changes for Sentry
  const handleNavigationStateChange = React.useCallback((state) => {
    if (sentryService.isActive()) {
      sentryNavigationInstrumentation.onStateChange(state);
    }
  }, []);

  // Handle app errors
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('App Error:', error);
    
    if (sentryService.isActive()) {
      sentryService.captureError(error, {
        additionalData: {
          errorInfo,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        },
      });
    }
  }, []);

  // Error boundary component
  const ErrorBoundary = React.memo(({ children }: { children: React.ReactNode }) => {
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      const originalConsoleError = console.error;
      
      console.error = (...args) => {
        const error = args[0];
        if (error instanceof Error) {
          handleError(error);
        }
        originalConsoleError(...args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }, []);

    if (hasError) {
      return (
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
              Something went wrong
            </Text>
            <Text style={{ textAlign: 'center', color: '#666' }}>
              The error has been reported and will be fixed soon.
            </Text>
          </View>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      );
    }

    return <>{children}</>;
  });

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={handleNavigationStateChange}
          onReady={() => {
            // Navigation is ready
            if (sentryService.isActive()) {
              sentryService.addBreadcrumb(
                'Navigation ready',
                'navigation',
                'info'
              );
            }
          }}
        >
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}