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
