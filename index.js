import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Import atomic architecture components
import { environmentBootstrap } from './atomic/organisms';
import App from './App';

// Initialize environment
environmentBootstrap.initialize();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: ...',
  'Setting a timer for a long period of time',
]);

// Register the app
registerRootComponent(App);
