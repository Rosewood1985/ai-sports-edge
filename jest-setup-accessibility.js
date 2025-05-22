// Basic mocks for accessibility testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AccessibilityInfo = {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    setAccessibilityFocus: jest.fn(),
    announceForAccessibility: jest.fn(),
    isBoldTextEnabled: jest.fn(() => Promise.resolve(false)),
    isGrayscaleEnabled: jest.fn(() => Promise.resolve(false)),
    isInvertColorsEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
  };
  RN.Platform = {
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
    Version: 14,
  };
  RN.Dimensions = {
    get: jest.fn().mockReturnValue({ width: 375, height: 667 }),
    set: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  RN.Alert = {
    alert: jest.fn(),
  };
  RN.Linking = {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
  };
  RN.AppState = {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  };
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
  flushGetRequests: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useIsFocused: () => true,
  NavigationContainer: ({ children }) => children,
}));

// Mock for NetInfo without requiring the actual package
jest.mock(
  '@react-native-community/netinfo',
  () => ({
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  }),
  { virtual: true }
);

// Setup global variables for testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: {
      get: jest.fn(),
      forEach: jest.fn(),
    },
  })
);

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Mock @sentry/browser
jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  captureEvent: jest.fn(),
  Severity: {
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
  },
  addBreadcrumb: jest.fn(),
  configureScope: jest.fn(cb =>
    cb({
      setTag: jest.fn(),
      setUser: jest.fn(),
      setExtra: jest.fn(),
    })
  ),
}));

// Mock @sentry/types
jest.mock('@sentry/types', () => ({}));

// Mock useTheme from @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#000000',
      border: '#CCCCCC',
      notification: '#FF3B30',
      accent: '#FF9500',
      focus: '#3B82F6',
    },
    dark: false,
  })),
}));

// Setup our custom axe-react-native adapter
const { toHaveNoViolations } = require('./__tests__/accessibility/axe-react-native');
expect.extend({ toHaveNoViolations });
