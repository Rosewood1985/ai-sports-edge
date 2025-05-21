#!/bin/bash

# Script to install Jest dependencies for TypeScript testing
echo "Installing Jest dependencies for TypeScript testing..."

# Install TypeScript-related Jest dependencies
npm install --save-dev @types/jest @testing-library/react-native @testing-library/jest-native ts-jest jest-expo

# Install React Testing Library dependencies
npm install --save-dev @testing-library/react

# Create tsconfig.jest.json if it doesn't exist
if [ ! -f "tsconfig.jest.json" ]; then
  echo "Creating tsconfig.jest.json..."
  cat > tsconfig.jest.json << EOL
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react",
    "esModuleInterop": true,
    "isolatedModules": true
  }
}
EOL
fi

# Update jest.setup.js to include testing-library/jest-native
if [ -f "jest.setup.js" ]; then
  echo "Updating jest.setup.js..."
  if ! grep -q "@testing-library/jest-native" "jest.setup.js"; then
    echo "import '@testing-library/jest-native/extend-expect';" >> jest.setup.js
  fi
else
  echo "Creating jest.setup.js..."
  cat > jest.setup.js << EOL
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

// Mock Expo modules if needed
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      apiUrl: 'https://test-api.example.com'
    }
  }
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn()
    }),
    useRoute: () => ({
      params: {}
    }),
    useTheme: () => ({
      colors: {
        text: '#000000',
        primary: '#0066CC',
        background: '#FFFFFF'
      }
    })
  };
});
EOL
fi

# Make the script executable
chmod +x scripts/install-jest-dependencies.sh

echo "Jest dependencies installation complete!"
echo "You can now run tests with: npm test"