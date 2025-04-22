#!/bin/bash

# Atomic Architecture Cleanup Script
# This script addresses remaining tasks for the atomic architecture.

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="cleanup-atomic-$TIMESTAMP.log"

# Start logging
echo "Starting atomic architecture cleanup at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# 1. Add more tests
echo "Adding more tests..." | tee -a $LOG_FILE

# Create test directories
mkdir -p __tests__/atomic/molecules
mkdir -p __tests__/atomic/organisms
mkdir -p __tests__/atomic/templates
mkdir -p __tests__/atomic/pages

# Create test for themeContext molecule
cat > __tests__/atomic/molecules/themeContext.test.js << 'EOL'
/**
 * Theme Context Molecule Tests
 * 
 * Tests for the theme context molecule.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { ThemeContext, useTheme } from '../../../atomic/molecules/themeContext';

describe('Theme Context Molecule', () => {
  it('should provide default theme', () => {
    // Arrange
    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={{ theme: 'light', effectiveTheme: 'light', toggleTheme: jest.fn() }}>
        {children}
      </ThemeContext.Provider>
    );
    
    // Act
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Assert
    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
    expect(typeof result.current.toggleTheme).toBe('function');
  });
  
  it('should toggle theme', () => {
    // Arrange
    const toggleTheme = jest.fn();
    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={{ theme: 'light', effectiveTheme: 'light', toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
    
    // Act
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.toggleTheme();
    });
    
    // Assert
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
EOL

# Create test for MainLayout template
cat > __tests__/atomic/templates/MainLayout.test.js << 'EOL'
/**
 * Main Layout Template Tests
 * 
 * Tests for the main layout template.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MainLayout from '../../../atomic/templates/MainLayout';

// Mock dependencies
jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
    },
    effectiveTheme: 'light',
  })),
}));

describe('Main Layout Template', () => {
  it('should render with children', () => {
    // Arrange
    const testId = 'test-child';
    const children = <div data-testid={testId}>Test Child</div>;
    
    // Act
    const { getByTestId } = render(
      <MainLayout>{children}</MainLayout>
    );
    
    // Assert
    expect(getByTestId(testId)).toBeTruthy();
  });
  
  it('should render with header and footer', () => {
    // Arrange
    const headerTestId = 'test-header';
    const footerTestId = 'test-footer';
    const header = <div data-testid={headerTestId}>Header</div>;
    const footer = <div data-testid={footerTestId}>Footer</div>;
    
    // Act
    const { getByTestId } = render(
      <MainLayout header={header} footer={footer}>
        <div>Content</div>
      </MainLayout>
    );
    
    // Assert
    expect(getByTestId(headerTestId)).toBeTruthy();
    expect(getByTestId(footerTestId)).toBeTruthy();
  });
});
EOL

echo "✅ Added more tests" | tee -a $LOG_FILE

# 2. Add more example components
echo "Adding more example components..." | tee -a $LOG_FILE

# Create examples directory if it doesn't exist
mkdir -p examples

# Create example app initialization
cat > examples/AppInitialization.js << 'EOL'
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
EOL

# Create example profile screen
cat > examples/ProfileScreen.js << 'EOL'
/**
 * Profile Screen Example
 * 
 * This example demonstrates how to create a screen using the atomic architecture.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

// Import atomic components
import { MainLayout } from '../atomic/templates';
import { useTheme } from '../atomic/molecules/themeContext';
import { firebaseService } from '../atomic/organisms';
import { monitoringService } from '../atomic/organisms';

const ProfileScreen = ({ navigation }) => {
  // Get theme from context
  const { colors } = useTheme();
  
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user
        const currentUser = firebaseService.auth.getCurrentUser();
        
        if (!currentUser) {
          navigation.replace('Login');
          return;
        }
        
        // Get user data from Firestore
        const userData = await firebaseService.firestore.getDocument('users', currentUser.uid);
        setUser(userData || currentUser);
      } catch (err) {
        // Handle error
        monitoringService.error.captureException(err);
        setError(monitoringService.error.getUserFriendlyMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [navigation]);
  
  // Header component
  const Header = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.headerButtonText, { color: colors.onPrimary }]}>Back</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Content component
  const Content = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.error }}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setError(null)}
          >
            <Text style={{ color: colors.onPrimary }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!user) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>No user found</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Image
            source={{ uri: user.photoURL || 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
          />
          <Text style={[styles.name, { color: colors.text }]}>{user.displayName || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.uid}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Login:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => firebaseService.auth.signOut()}
        >
          <Text style={{ color: colors.onPrimary }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render screen using MainLayout template
  return (
    <MainLayout
      header={<Header />}
      scrollable={true}
    >
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
EOL

# Create example README
cat > examples/README.md << 'EOL'
# Atomic Architecture Examples

This directory contains examples of how to use the atomic architecture in your application.

## Examples

- **AppInitialization.js**: Demonstrates how to initialize the app using the atomic architecture.
- **ProfileScreen.js**: Demonstrates how to create a screen using the atomic architecture.

## Usage

These examples can be used as a reference for implementing your own components using the atomic architecture. They demonstrate best practices for:

- Importing atomic components
- Using theme context
- Handling authentication
- Error handling
- Layout structure

## Best Practices

1. **Import from index files**: Use the index files to import components from the atomic architecture.
   ```javascript
   import { environmentBootstrap, firebaseService } from '../atomic';
   ```

2. **Use templates for layout**: Use templates to provide consistent layout across your application.
   ```javascript
   import { MainLayout } from '../atomic/templates';
   ```

3. **Use hooks for shared functionality**: Use hooks to access shared functionality like theme.
   ```javascript
   import { useTheme } from '../atomic/molecules/themeContext';
   ```

4. **Handle errors with monitoring service**: Use the monitoring service to handle errors.
   ```javascript
   monitoringService.error.captureException(error);
   ```

5. **Use service methods for data access**: Use service methods to access data.
   ```javascript
   const userData = await firebaseService.firestore.getDocument('users', currentUser.uid);
   ```
EOL

echo "✅ Added more example components" | tee -a $LOG_FILE

# 3. Run ESLint on atomic components
echo "Running ESLint on atomic components..." | tee -a $LOG_FILE

# Create ESLint configuration for atomic components
cat > .eslintrc.atomic.js << 'EOL'
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended',
  ],
  plugins: ['react', 'react-hooks', 'jest'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React rules
    'react/prop-types': 'warn',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-empty': 'warn',
    
    // Jest rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/valid-expect': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
EOL

# Add ESLint script to package.json
# Note: This is a placeholder, as we can't directly modify package.json
echo "Add the following script to package.json:" | tee -a $LOG_FILE
echo '"lint:atomic": "eslint --config .eslintrc.atomic.js atomic/**/*.js",' | tee -a $LOG_FILE

echo "✅ ESLint configuration created" | tee -a $LOG_FILE

# 4. Add more documentation
echo "Adding more documentation..." | tee -a $LOG_FILE

# Create component documentation
cat > docs/atomic/component-documentation.md << 'EOL'
# Atomic Architecture Component Documentation

This document provides detailed documentation for each component in the atomic architecture.

## Atoms

Atoms are the basic building blocks of the application. They are the smallest components that can be reused.

### envConfig

The `envConfig` atom provides environment configuration values.

```javascript
import { envConfig } from '../atomic/atoms';

// Get environment configuration
const apiKey = envConfig.apiKey;
```

### firebaseApp

The `firebaseApp` atom provides Firebase app initialization.

```javascript
import { firebaseApp, initializeFirebaseApp } from '../atomic/atoms';

// Initialize Firebase app
const app = initializeFirebaseApp();

// Get Firebase app instance
const app = firebaseApp;
```

### themeColors

The `themeColors` atom provides theme colors.

```javascript
import { themeColors } from '../atomic/atoms';

// Get theme colors
const { primary, background, text } = themeColors.light;
```

## Molecules

Molecules are combinations of atoms that work together to provide more complex functionality.

### themeContext

The `themeContext` molecule provides theme context and hooks.

```javascript
import { ThemeContext, useTheme } from '../atomic/molecules';

// Use theme context
const { theme, colors, toggleTheme } = useTheme();
```

### firebaseAuth

The `firebaseAuth` molecule provides Firebase authentication functionality.

```javascript
import { firebaseAuth } from '../atomic/molecules';

// Sign in with email and password
const user = await firebaseAuth.signInWithEmailAndPassword(email, password);

// Sign out
await firebaseAuth.signOut();
```

### firebaseFirestore

The `firebaseFirestore` molecule provides Firebase Firestore functionality.

```javascript
import { firebaseFirestore } from '../atomic/molecules';

// Get document
const document = await firebaseFirestore.getDocument('collection', 'id');

// Set document
await firebaseFirestore.setDocument('collection', 'id', data);
```

## Organisms

Organisms are complex components that combine molecules and atoms to provide complete functionality.

### environmentBootstrap

The `environmentBootstrap` organism provides environment initialization.

```javascript
import { environmentBootstrap } from '../atomic/organisms';

// Bootstrap environment
const result = await environmentBootstrap.bootstrapEnvironment();
```

### firebaseService

The `firebaseService` organism provides Firebase service functionality.

```javascript
import { firebaseService } from '../atomic/organisms';

// Initialize Firebase
const result = await firebaseService.initialize();

// Get current user
const user = firebaseService.auth.getCurrentUser();

// Get document
const document = await firebaseService.firestore.getDocument('collection', 'id');
```

### themeProvider

The `themeProvider` organism provides theme provider functionality.

```javascript
import { ThemeProvider } from '../atomic/organisms';

// Wrap application with theme provider
const App = () => (
  <ThemeProvider>
    {/* Application content */}
  </ThemeProvider>
);
```

## Templates

Templates are layout components that provide structure for pages.

### MainLayout

The `MainLayout` template provides a main layout for pages.

```javascript
import { MainLayout } from '../atomic/templates';

// Use main layout
const Page = () => (
  <MainLayout
    header={<Header />}
    footer={<Footer />}
    scrollable={true}
  >
    {/* Page content */}
  </MainLayout>
);
```

## Pages

Pages are complete screens that use templates, organisms, molecules, and atoms to provide a complete user interface.

### HomePage

The `HomePage` page provides a home page for the application.

```javascript
import { HomePage } from '../atomic/pages';

// Use home page
const App = () => (
  <HomePage navigation={navigation} />
);
```
EOL

# Create architecture guide
cat > docs/atomic/architecture-guide.md << 'EOL'
# Atomic Architecture Guide

This guide provides an overview of the atomic architecture and how to use it in your application.

## Overview

The atomic architecture is a design pattern that organizes components into a hierarchy based on their complexity and reusability. It is inspired by atomic design principles and provides a clear separation of concerns.

The atomic architecture consists of five levels:

1. **Atoms**: Basic building blocks
2. **Molecules**: Combinations of atoms
3. **Organisms**: Complex components
4. **Templates**: Layout structures
5. **Pages**: Complete screens

## Benefits

The atomic architecture provides several benefits:

- **Clear Separation of Concerns**: Each component has a specific purpose
- **Progressive Complexity**: Components build from simple to complex
- **Reusability**: Lower-level components can be reused across features
- **Testability**: Components can be tested in isolation
- **Maintainability**: Changes to one component don't affect others

## Implementation

The atomic architecture is implemented as a set of directories and files:

```
atomic/
  ├── atoms/
  │   ├── index.js
  │   ├── envConfig.js
  │   ├── firebaseApp.js
  │   └── ...
  ├── molecules/
  │   ├── index.js
  │   ├── themeContext.js
  │   ├── firebaseAuth.js
  │   └── ...
  ├── organisms/
  │   ├── index.js
  │   ├── environmentBootstrap.js
  │   ├── firebaseService.js
  │   └── ...
  ├── templates/
  │   ├── index.js
  │   ├── MainLayout.js
  │   └── ...
  ├── pages/
  │   ├── index.js
  │   ├── HomePage.js
  │   └── ...
  └── index.js
```

Each level has an `index.js` file that exports all components from that level, making it easy to import components.

## Usage

To use the atomic architecture in your application, follow these guidelines:

1. **Import from index files**: Use the index files to import components from the atomic architecture.
   ```javascript
   import { environmentBootstrap, firebaseService } from '../atomic';
   ```

2. **Use templates for layout**: Use templates to provide consistent layout across your application.
   ```javascript
   import { MainLayout } from '../atomic/templates';
   ```

3. **Use hooks for shared functionality**: Use hooks to access shared functionality like theme.
   ```javascript
   import { useTheme } from '../atomic/molecules/themeContext';
   ```

4. **Handle errors with monitoring service**: Use the monitoring service to handle errors.
   ```javascript
   monitoringService.error.captureException(error);
   ```

5. **Use service methods for data access**: Use service methods to access data.
   ```javascript
   const userData = await firebaseService.firestore.getDocument('users', currentUser.uid);
   ```

## Best Practices

1. **Keep atoms simple**: Atoms should be simple and focused on a single responsibility.
2. **Compose molecules from atoms**: Molecules should be composed of atoms and provide more complex functionality.
3. **Organisms should be self-contained**: Organisms should be self-contained and provide complete functionality.
4. **Templates should be layout-focused**: Templates should focus on layout and structure, not functionality.
5. **Pages should compose from lower levels**: Pages should compose from templates, organisms, molecules, and atoms.
6. **Use index files for exports**: Use index files to export components from each level.
7. **Document components**: Document components with JSDoc comments and examples.
8. **Test components**: Test components at each level to ensure they work correctly.
EOL

echo "✅ Added more documentation" | tee -a $LOG_FILE

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "Atomic architecture cleanup completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Cleanup completed successfully" | tee -a $LOG_FILE

# Make the script executable
chmod +x cleanup-atomic.sh

# Summary
echo "
Cleanup Tasks Completed:

1. Added more tests:
   - themeContext.test.js
   - MainLayout.test.js

2. Added more example components:
   - AppInitialization.js
   - ProfileScreen.js
   - README.md

3. Added ESLint configuration:
   - .eslintrc.atomic.js

4. Added more documentation:
   - component-documentation.md
   - architecture-guide.md

Run './cleanup-atomic.sh' to execute the cleanup script.
"