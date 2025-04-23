import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import atomic architecture components
import { ThemeProvider } from './atomic/organisms';
import { monitoringService } from './atomic/organisms';
import { firebaseService } from './atomic/organisms';

import Navigation from './navigation';

export default function App() {
  // Initialize services
  React.useEffect(() => {
    firebaseService.initialize();
    monitoringService.initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigation />
        <StatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
