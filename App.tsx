import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import atomic architecture components
import ThemeProvider from './atomic/organisms/themeProvider';
import { monitoringService } from './atomic/organisms';
import { firebaseService } from './atomic/organisms';
import { privacyService } from './atomic/organisms/privacy';

import Navigation from './navigation';

export default function App() {
  // Initialize services
  React.useEffect(() => {
    firebaseService.initialize();
    monitoringService.initialize();
    privacyService.initialize();
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
