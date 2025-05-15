/**
 * App Initialization Example
 * 
 * This example demonstrates how to initialize the app using the atomic architecture.
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

// Import atomic components
import { environmentBootstrap, firebaseService, monitoringService, ThemeProvider } from '../atomic';

const AppInitialization = () => {
  // State for initialization status
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize environment
        const envResult = await environmentBootstrap.bootstrapEnvironment();
        if (!envResult.success) {
          throw new Error('Environment initialization failed');
        }
        
        // Initialize monitoring
        const monitoringResult = await monitoringService.initialize();
        if (!monitoringResult.success) {
          throw new Error('Monitoring initialization failed');
        }
        
        // Initialize Firebase
        const firebaseResult = await firebaseService.initialize();
        if (!firebaseResult.success) {
          throw new Error('Firebase initialization failed');
        }
        
        // Set initialization status
        setIsInitialized(true);
      } catch (error) {
        setError(error.message);
        monitoringService.error.captureException(error);
      }
    };
    
    initializeApp();
  }, []);
  
  // Render loading screen
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initializing app...</Text>
        {error && <Text style={{ color: 'red' }}>{error}</Text>}
      </View>
    );
  }
  
  // Render app with ThemeProvider
  return (
    <ThemeProvider>
      {/* App content */}
    </ThemeProvider>
  );
};

export default AppInitialization;
