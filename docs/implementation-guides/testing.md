# Testing

This guide provides an overview of testing strategies and practices for the AI Sports Edge application. It covers unit testing, integration testing, end-to-end testing, and performance testing.

## Testing Philosophy

Testing is a critical part of the development process for AI Sports Edge. Our testing philosophy is based on the following principles:

1. **Test-Driven Development**: Write tests before implementing features.
2. **Comprehensive Coverage**: Aim for high test coverage across the codebase.
3. **Automated Testing**: Automate tests to run on every commit.
4. **Fast Feedback**: Tests should provide fast feedback to developers.
5. **Realistic Testing**: Tests should simulate real-world usage.

## Testing Pyramid

We follow the testing pyramid approach, which suggests having:

- **Many Unit Tests**: Fast, focused tests for individual components and functions.
- **Some Integration Tests**: Tests that verify interactions between components.
- **Few End-to-End Tests**: Tests that simulate user interactions with the entire application.

## Testing Tools

### Unit and Integration Testing

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native
- **@testing-library/react-hooks**: Testing utilities for React hooks
- **jest-mock-axios**: Mock Axios for testing API calls
- **jest-native**: Custom Jest matchers for React Native

### End-to-End Testing

- **Detox**: End-to-end testing framework for React Native
- **Appium**: Mobile app automation testing framework

### Performance Testing

- **React Native Performance Monitor**: Performance monitoring for React Native
- **Lighthouse**: Performance testing for web applications

## Testing Structure

Tests are organized in a parallel structure to the source code:

```
__tests__/
  atomic/
    atoms/
      Button.test.js
    molecules/
      FormField.test.js
    organisms/
      LoginForm.test.js
    templates/
      MainLayout.test.js
    pages/
      ProfilePage.test.js
  components/
    Component1.test.js
    Component2.test.js
  hooks/
    useAuth.test.js
    useProfile.test.js
  services/
    authService.test.js
    profileService.test.js
  utils/
    formatters.test.js
    validators.test.js
```

## Unit Testing

Unit tests focus on testing individual components, functions, and hooks in isolation.

### Testing Components

```javascript
// __tests__/atomic/atoms/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../atomic/atoms';
import { ThemeProvider } from '../../../atomic/organisms';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button text="Test Button" onPress={() => {}} />
      </ThemeProvider>
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <Button text="Test Button" onPress={onPress} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('applies variant styles correctly', () => {
    const { getByText, rerender } = render(
      <ThemeProvider>
        <Button text="Test Button" onPress={() => {}} variant="primary" />
      </ThemeProvider>
    );

    // Test primary variant
    let button = getByText('Test Button').parent;
    expect(button.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );

    // Test secondary variant
    rerender(
      <ThemeProvider>
        <Button text="Test Button" onPress={() => {}} variant="secondary" />
      </ThemeProvider>
    );

    button = getByText('Test Button').parent;
    expect(button.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );

    // Test tertiary variant
    rerender(
      <ThemeProvider>
        <Button text="Test Button" onPress={() => {}} variant="tertiary" />
      </ThemeProvider>
    );

    button = getByText('Test Button').parent;
    expect(button.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: 'transparent',
      })
    );
  });
});
```

### Testing Hooks

```javascript
// __tests__/hooks/useAuth.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../atomic/organisms';

// Mock Firebase service
jest.mock('../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      onAuthStateChanged: jest.fn(),
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs in successfully', async () => {
    const user = { uid: '123', email: 'test@example.com' };
    firebaseService.auth.signInWithEmailAndPassword.mockResolvedValueOnce({ user });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(user);
    expect(result.current.error).toBe(null);
    expect(firebaseService.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
  });

  it('handles sign in error', async () => {
    const error = new Error('Invalid credentials');
    firebaseService.auth.signInWithEmailAndPassword.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe('Invalid credentials');
    expect(firebaseService.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      'test@example.com',
      'password'
    );
  });

  it('signs out successfully', async () => {
    firebaseService.auth.signOut.mockResolvedValueOnce();

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    // Set initial state
    act(() => {
      result.current.setUser({ uid: '123', email: 'test@example.com' });
    });

    act(() => {
      result.current.signOut();
    });

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
    expect(firebaseService.auth.signOut).toHaveBeenCalled();
  });
});
```

### Testing Services

```javascript
// __tests__/services/profileService.test.js
import { profileService } from '../../services/profileService';
import { firebaseService } from '../../atomic/organisms';

// Mock Firebase service
jest.mock('../../atomic/organisms', () => ({
  firebaseService: {
    firestore: {
      getDocument: jest.fn(),
      setDocument: jest.fn(),
    },
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets profile successfully', async () => {
    const profile = { id: '123', name: 'Test User', email: 'test@example.com' };
    firebaseService.firestore.getDocument.mockResolvedValueOnce(profile);

    const result = await profileService.getProfile('123');

    expect(result).toEqual(profile);
    expect(firebaseService.firestore.getDocument).toHaveBeenCalledWith('profiles', '123');
  });

  it('handles get profile error', async () => {
    const error = new Error('Document not found');
    firebaseService.firestore.getDocument.mockRejectedValueOnce(error);

    await expect(profileService.getProfile('123')).rejects.toThrow('Document not found');
    expect(firebaseService.firestore.getDocument).toHaveBeenCalledWith('profiles', '123');
  });

  it('updates profile successfully', async () => {
    const profile = { name: 'Test User', email: 'test@example.com' };
    firebaseService.firestore.setDocument.mockResolvedValueOnce();

    await profileService.updateProfile('123', profile);

    expect(firebaseService.firestore.setDocument).toHaveBeenCalledWith('profiles', '123', profile);
  });

  it('handles update profile error', async () => {
    const profile = { name: 'Test User', email: 'test@example.com' };
    const error = new Error('Permission denied');
    firebaseService.firestore.setDocument.mockRejectedValueOnce(error);

    await expect(profileService.updateProfile('123', profile)).rejects.toThrow('Permission denied');
    expect(firebaseService.firestore.setDocument).toHaveBeenCalledWith('profiles', '123', profile);
  });
});
```

### Testing Utilities

```javascript
// __tests__/utils/validators.test.js
import { validators } from '../../utils/validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
      expect(validators.isValidEmail('test.user@example.co.uk')).toBe(true);
      expect(validators.isValidEmail('test+user@example.com')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(validators.isValidEmail('')).toBe(false);
      expect(validators.isValidEmail('test')).toBe(false);
      expect(validators.isValidEmail('test@')).toBe(false);
      expect(validators.isValidEmail('test@example')).toBe(false);
      expect(validators.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns true for valid passwords', () => {
      expect(validators.isValidPassword('password123')).toBe(true);
      expect(validators.isValidPassword('Password123!')).toBe(true);
    });

    it('returns false for invalid passwords', () => {
      expect(validators.isValidPassword('')).toBe(false);
      expect(validators.isValidPassword('pass')).toBe(false);
      expect(validators.isValidPassword('12345')).toBe(false);
    });
  });
});
```

## Integration Testing

Integration tests focus on testing interactions between components.

```javascript
// __tests__/atomic/organisms/LoginForm.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '../../../atomic/organisms';
import { ThemeProvider } from '../../../atomic/organisms';
import { useAuth } from '../../../hooks/useAuth';

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form with valid inputs', async () => {
    const signIn = jest.fn().mockResolvedValueOnce();
    useAuth.mockReturnValueOnce({
      signIn,
      loading: false,
      error: null,
    });

    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <LoginForm onSuccess={onSuccess} />
      </ThemeProvider>
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('displays validation errors for invalid inputs', async () => {
    const signIn = jest.fn();
    useAuth.mockReturnValueOnce({
      signIn,
      loading: false,
      error: null,
    });

    const onSuccess = jest.fn();
    const { getByText, queryByText } = render(
      <ThemeProvider>
        <LoginForm onSuccess={onSuccess} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
      expect(signIn).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('displays error message from auth service', async () => {
    const signIn = jest.fn().mockRejectedValueOnce(new Error('Invalid credentials'));
    useAuth.mockReturnValueOnce({
      signIn,
      loading: false,
      error: 'Invalid credentials',
    });

    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider>
        <LoginForm onSuccess={onSuccess} />
      </ThemeProvider>
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
```

## End-to-End Testing

End-to-end tests simulate user interactions with the entire application.

```javascript
// e2e/login.spec.js
describe('Login Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully with valid credentials', async () => {
    // Navigate to login screen
    await element(by.text('Login')).tap();

    // Enter credentials
    await element(by.placeholder('Enter your email')).typeText('test@example.com');
    await element(by.placeholder('Enter your password')).typeText('password123');

    // Submit form
    await element(by.text('Sign In')).tap();

    // Verify navigation to home screen
    await expect(element(by.text('Welcome to AI Sports Edge'))).toBeVisible();
  });

  it('should show validation errors with invalid credentials', async () => {
    // Navigate to login screen
    await element(by.text('Login')).tap();

    // Submit form without entering credentials
    await element(by.text('Sign In')).tap();

    // Verify validation errors
    await expect(element(by.text('Email is required'))).toBeVisible();
    await expect(element(by.text('Password is required'))).toBeVisible();
  });

  it('should show error message with incorrect credentials', async () => {
    // Navigate to login screen
    await element(by.text('Login')).tap();

    // Enter incorrect credentials
    await element(by.placeholder('Enter your email')).typeText('test@example.com');
    await element(by.placeholder('Enter your password')).typeText('wrongpassword');

    // Submit form
    await element(by.text('Sign In')).tap();

    // Verify error message
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

## Performance Testing

Performance tests focus on measuring the performance of the application.

```javascript
// __tests__/performance/rendering.test.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { PerformanceMonitor } from 'react-native-performance-monitor';
import { HomeScreen } from '../../screens/HomeScreen';

describe('HomeScreen Performance', () => {
  it('renders within performance budget', async () => {
    const monitor = new PerformanceMonitor();

    // Start monitoring
    monitor.start();

    // Render component
    render(<HomeScreen />);

    // Stop monitoring
    const metrics = monitor.stop();

    // Assert performance metrics
    expect(metrics.renderTime).toBeLessThan(100); // 100ms render time budget
    expect(metrics.jsHeapSize).toBeLessThan(10 * 1024 * 1024); // 10MB heap size budget
  });
});
```

## Test Coverage

We aim for high test coverage across the codebase. We use Jest's coverage reporting to track coverage:

```bash
npm test -- --coverage
```

Coverage reports are generated in the `coverage` directory.

## Continuous Integration

Tests are run automatically on every commit using GitHub Actions. The CI pipeline includes:

1. **Linting**: ESLint to check code style
2. **Unit Tests**: Jest to run unit tests
3. **Integration Tests**: Jest to run integration tests
4. **End-to-End Tests**: Detox to run end-to-end tests
5. **Performance Tests**: Custom performance tests

## Best Practices

### Writing Testable Code

1. **Separation of Concerns**: Keep components focused on a single responsibility
2. **Dependency Injection**: Use dependency injection to make code testable
3. **Pure Functions**: Use pure functions for business logic
4. **Avoid Side Effects**: Minimize side effects in components
5. **Use Hooks**: Extract complex logic into custom hooks

### Writing Good Tests

1. **Test Behavior, Not Implementation**: Focus on testing behavior, not implementation details
2. **Use Descriptive Test Names**: Use descriptive test names that explain what the test is checking
3. **Arrange-Act-Assert**: Follow the Arrange-Act-Assert pattern
4. **Keep Tests Simple**: Keep tests simple and focused on a single behavior
5. **Don't Test Third-Party Code**: Don't test third-party code, focus on your own code

### Test Doubles

1. **Mocks**: Use mocks to replace dependencies with test doubles
2. **Stubs**: Use stubs to provide canned answers to calls
3. **Spies**: Use spies to record calls to functions
4. **Fakes**: Use fakes to provide simplified implementations of dependencies
5. **Dummies**: Use dummies to satisfy parameter requirements

## Related Documentation

- [Atomic Architecture](../core-concepts/atomic-architecture.md)
- [Developer Workflows](developer-workflows.md)
- [Component Guidelines](component-guidelines.md)
