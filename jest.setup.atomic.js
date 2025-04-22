/**
 * Jest Setup for Atomic Architecture
 *
 * This file sets up the testing environment for atomic components.
 */

// Define __DEV__ for React Native
global.__DEV__ = true;

// Mock React Native
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Platform: {
    OS: 'web',
    select: jest.fn(obj => obj.web || obj.default),
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));

// Mock React Native modules that might not be available in the test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  getApp: jest.fn(() => ({ name: 'mock-app' })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'mock-uid', email: 'user@example.com' },
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
    signOut: jest.fn(() => Promise.resolve()),
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
}));

// Mock NetInfo - using a simple mock to avoid dependency issues
jest.mock('@react-native-community/netinfo', () => {
  return {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true }))
  };
}, { virtual: true });

// Mock Expo modules with virtual mocks to avoid dependency issues
jest.mock('expo-constants', () => ({
  default: {
    manifest: {
      extra: {
        firebaseApiKey: 'mock-api-key',
        firebaseAuthDomain: 'mock-auth-domain',
        firebaseProjectId: 'mock-project-id',
        firebaseStorageBucket: 'mock-storage-bucket',
        firebaseMessagingSenderId: 'mock-messaging-sender-id',
        firebaseAppId: 'mock-app-id',
      },
    },
  },
}), { virtual: true });

// Mock Expo Device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone',
  modelId: 'iPhone12,1',
  deviceYearClass: 2019,
  totalMemory: 4000000000,
  osName: 'iOS',
  osVersion: '14.0',
}), { virtual: true });

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-push-token' })),
  setNotificationHandler: jest.fn(),
}), { virtual: true });

// Global setup
global.console = {
  ...console,
  // Make console.error throw so we can catch it in tests
  error: jest.fn(),
  // Make console.warn not output during tests
  warn: jest.fn(),
};