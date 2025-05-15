# Testing Guide for AI Sports Edge

This document provides a comprehensive guide to testing the AI Sports Edge application, including unit testing, cross-platform testing, and offline testing.

## Overview

The AI Sports Edge application has a robust testing infrastructure to ensure reliability across platforms and network conditions. This guide covers the different types of tests, how to run them, and best practices for writing new tests.

## Test Types

### Unit Tests

Unit tests focus on testing individual components and functions in isolation. They are the foundation of our testing strategy and provide quick feedback on code changes.

```typescript
// Example unit test for OddsComparisonComponent
describe('OddsComparisonComponent', () => {
  it('should render correctly with default props', () => {
    const { getByText } = render(<OddsComparisonComponent isPremium={false} />);
    expect(getByText('Odds Comparison')).toBeTruthy();
  });

  it('should show premium features when isPremium is true', () => {
    const { getByText } = render(<OddsComparisonComponent isPremium={true} />);
    expect(getByText('Advanced Odds Analysis')).toBeTruthy();
  });
});
```

### Cross-Platform Tests

Cross-platform tests ensure that the application works correctly on different platforms (iOS, Android, web). They use platform-specific mocks and utilities to simulate different environments.

```typescript
// Example cross-platform test
describe('OddsComparisonComponent (Cross-Platform)', () => {
  beforeEach(() => {
    // Set up platform-specific mocks
    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'ios',
      select: jest.fn((obj) => obj.ios)
    }));
  });

  it('should render correctly on iOS', () => {
    const { getByTestId } = render(<OddsComparisonComponent />);
    expect(getByTestId('ios-specific-element')).toBeTruthy();
  });

  // Similar tests for Android and web
});
```

### Offline Tests

Offline tests verify that the application works correctly when the network is unavailable. They use network mocks to simulate offline conditions.

```typescript
// Example offline test
describe('OddsComparisonComponent (Offline)', () => {
  beforeEach(() => {
    // Mock network status
    jest.mock('../../services/networkService', () => ({
      isConnected: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
  });

  it('should show cached data when offline', async () => {
    // Set up cached data
    await AsyncStorage.setItem('cached_odds', JSON.stringify(mockOddsData));

    const { getByText } = render(<OddsComparisonComponent />);
    expect(getByText('Offline Mode - Showing Cached Data')).toBeTruthy();
    expect(getByText('Last Updated: ')).toBeTruthy();
  });
});
```

## Running Tests

### Running All Tests

To run all tests, use the following command:

```bash
npm test
```

### Running Specific Test Files

To run specific test files, use the following command:

```bash
npm test -- path/to/test/file.test.tsx
```

### Running Tests with Coverage

To run tests with coverage reporting, use the following command:

```bash
npm test -- --coverage
```

## Test Utilities

### Mock Data

We provide mock data for various parts of the application to make testing easier and more consistent.

```typescript
// Example mock data for odds
export const mockOddsData = {
  games: [
    {
      id: 'game1',
      home_team: 'Team A',
      away_team: 'Team B',
      start_time: '2025-03-21T19:00:00Z',
      odds: {
        draftkings: {
          home_team_odds: -110,
          away_team_odds: -110
        },
        fanduel: {
          home_team_odds: -105,
          away_team_odds: -115
        }
      }
    }
  ]
};
```

### Test Helpers

We provide various test helpers to make testing easier and more consistent.

```typescript
// Example test helper for rendering with providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <PersonalizationProvider>
        <I18nProvider>
          {ui}
        </I18nProvider>
      </PersonalizationProvider>
    </ThemeProvider>
  );
}
```

## Best Practices

### Writing Effective Tests

1. **Test Behavior, Not Implementation**: Focus on testing what the component does, not how it does it.
2. **Keep Tests Simple**: Each test should verify one specific behavior.
3. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.
4. **Avoid Test Interdependence**: Tests should not depend on the state from other tests.
5. **Mock External Dependencies**: Use mocks for external services, APIs, and other dependencies.

### Testing Asynchronous Code

When testing asynchronous code, use `async/await` and the appropriate Jest utilities:

```typescript
it('should load odds data asynchronously', async () => {
  // Mock API response
  jest.spyOn(oddsService, 'getOdds').mockResolvedValue(mockOddsData);

  const { getByText, findByText } = render(<OddsComparisonComponent />);
  
  // Initially shows loading state
  expect(getByText('Loading odds...')).toBeTruthy();
  
  // Wait for data to load
  const homeTeamElement = await findByText('Team A');
  expect(homeTeamElement).toBeTruthy();
});
```

### Testing User Interactions

When testing user interactions, use the `fireEvent` utility from `@testing-library/react-native`:

```typescript
it('should toggle sort option when button is pressed', () => {
  const { getByText } = render(<OddsComparisonComponent />);
  
  // Initially sorted by default
  expect(getByText('Sort: Default')).toBeTruthy();
  
  // Press the sort button
  fireEvent.press(getByText('Sort'));
  
  // Now sorted by DraftKings odds
  expect(getByText('Sort: DraftKings')).toBeTruthy();
});
```

## Performance Testing

### Memory Usage Testing

We use the memory management utilities to test memory usage and prevent memory leaks:

```typescript
it('should clean up resources when unmounted', () => {
  // Mock memory management
  const cleanupSpy = jest.spyOn(memoryManagement, 'cleanup');
  
  const { unmount } = render(<OddsComparisonComponent />);
  
  // Unmount the component
  unmount();
  
  // Verify cleanup was called
  expect(cleanupSpy).toHaveBeenCalled();
});
```

### Render Performance Testing

We use the React DevTools Profiler to test render performance:

```typescript
it('should render efficiently without unnecessary re-renders', () => {
  // Set up profiler
  const onRender = jest.fn();
  
  const { rerender } = render(
    <Profiler id="test" onRender={onRender}>
      <OddsComparisonComponent />
    </Profiler>
  );
  
  // First render
  expect(onRender).toHaveBeenCalledTimes(1);
  
  // Re-render with same props
  rerender(
    <Profiler id="test" onRender={onRender}>
      <OddsComparisonComponent />
    </Profiler>
  );
  
  // Should not re-render unnecessarily
  expect(onRender).toHaveBeenCalledTimes(1);
});
```

## Continuous Integration

We use GitHub Actions for continuous integration testing. The CI pipeline runs all tests on every pull request and push to the main branch.

### CI Configuration

The CI configuration is defined in `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16.x'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Conclusion

This testing guide provides a comprehensive overview of the testing infrastructure for the AI Sports Edge application. By following these guidelines, we can ensure that the application is reliable, performant, and works correctly across all platforms and network conditions.

For any questions or suggestions, please contact the development team.