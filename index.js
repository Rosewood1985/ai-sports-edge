import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Import atomic architecture components
import App from './App';
import { environmentBootstrap } from './atomic/organisms';

// Initialize environment
environmentBootstrap.initialize();

// Ignore specific warnings
LogBox.ignoreLogs(['Warning: ...', 'Setting a timer for a long period of time']);

// Register the app
registerRootComponent(App);
