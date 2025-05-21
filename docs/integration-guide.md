# Integration Guide for New Components

This guide explains how to integrate the newly created components into the AI Sports Edge application:

1. **ThemeToggle Component**: A standardized dark mode toggle component
2. **Enhanced API Service**: An API service with caching capabilities

## Integration Process

The integration process consists of three steps:

1. **Identify Integration Points**: Run a script to scan the codebase and identify where the components should be integrated
2. **Generate Integration Snippets**: Generate code snippets for each integration point
3. **Implement Integration**: Use the generated snippets to integrate the components into the codebase

## Step 1: Identify Integration Points

Run the `identify-integration-points.js` script to scan the codebase and identify potential integration points:

```bash
node scripts/identify-integration-points.js
```

This script will:

- Scan the codebase for potential integration points for the ThemeToggle component
- Scan the codebase for potential integration points for the enhanced API service
- Generate a report (`integration-points-report.md`) with the findings

The report will include:

- Potential screens for adding the ThemeToggle component
- Components using theme-related styling that could benefit from the ThemeToggle component
- Direct API calls that could be replaced with the enhanced API service
- Existing API services that could be updated to use the enhanced API service

## Step 2: Generate Integration Snippets

Run the `generate-integration-snippets.js` script to generate code snippets for each integration point:

```bash
node scripts/generate-integration-snippets.js
```

This script will:

- Parse the integration points report
- Generate code snippets for each integration point
- Create a markdown file (`integration-snippets.md`) with the snippets

The snippets will include:

- Code for adding the ThemeToggle component to settings screens
- Code for updating components to use the theme context
- Code for replacing direct API calls with the enhanced API service
- Code for updating existing API services to use the enhanced API service
- Code for adding cache invalidation after data mutations

## Step 3: Implement Integration

Use the generated snippets to integrate the components into the codebase. The recommended approach is:

1. Start with high-impact, low-risk changes
2. Test each integration thoroughly before moving to the next
3. Consider creating a separate branch for each integration
4. Update tests to reflect the new implementations
5. Document any issues or edge cases encountered during integration

### ThemeToggle Integration

The ThemeToggle component can be integrated in several ways:

#### Settings Screen Integration

Add the ThemeToggle component to the settings screen:

```jsx
// Import the ThemeToggle component
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your settings section in the render method
<View style={styles.settingItem}>
  <Text style={styles.settingLabel}>Dark Mode</Text>
  <ThemeToggle variant="switch" />
</View>;
```

#### Theme Context Integration

Update components to use the theme context:

```jsx
// Import the useTheme hook
import { useTheme } from 'atomic/molecules/themeContext';

// Inside your component
const { effectiveTheme } = useTheme();
const isDarkMode = effectiveTheme === 'dark';

// Update your styles to use the theme
const dynamicStyles = {
  container: {
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
  },
  text: {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
};
```

#### Navigation Header Integration

Add the ThemeToggle component to the navigation header:

```jsx
// In your navigation configuration
import { ThemeToggle } from 'atomic/molecules/theme';

// Add this to your header right component
headerRight: () => (
  <ThemeToggle
    variant="icon"
    style={{
      marginRight: 16,
      backgroundColor: 'transparent',
    }}
  />
),
```

### Enhanced API Service Integration

The enhanced API service can be integrated in several ways:

#### Direct API Calls Integration

Replace direct API calls with the enhanced apiService:

```jsx
// Before:
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchData = async () => {
  try {
    // The apiService will automatically use cache if available
    const data = await apiService.makeRequest('/endpoint');
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
```

#### Existing API Services Integration

Update existing API services to use the enhanced apiService:

```jsx
// Before:
import { OddsService } from 'services/OddsService';

const fetchOdds = async () => {
  try {
    const odds = await OddsService.getOdds(gameId);
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};

// After:
import { apiService } from 'atomic/organisms';

const fetchOdds = async () => {
  try {
    // The apiService will automatically use cache if available
    const odds = await apiService.makeRequest('/odds', { gameId });
    setOdds(odds);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
};
```

#### Cache Invalidation

Add cache invalidation after data mutations:

```jsx
// After a data mutation (POST, PUT, DELETE), invalidate the cache
import { apiService } from 'atomic/organisms';

const updateData = async () => {
  try {
    // Make the update request
    await apiService.makeRequest('/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Invalidate the cache for this endpoint
    await apiService.clearCache('/endpoint');

    // Optionally, refetch the data
    const updatedData = await apiService.makeRequest('/endpoint');
    setData(updatedData);
  } catch (error) {
    console.error('Error updating data:', error);
  }
};
```

## Testing Integration

After integrating the components, it's important to test them thoroughly:

### ThemeToggle Testing

1. Verify that the ThemeToggle component correctly toggles between light and dark themes
2. Verify that all components respond correctly to theme changes
3. Verify that the theme state is persisted across app restarts
4. Test the ThemeToggle component with different variants (button, switch, icon)
5. Test the ThemeToggle component with different screen sizes and orientations

### Enhanced API Service Testing

1. Verify that API calls are correctly cached
2. Verify that cached data is returned when available
3. Verify that cache is invalidated after data mutations
4. Test the API service with different network conditions (online, offline, slow)
5. Verify that the API service correctly handles errors

## Documentation

For more detailed information about the components, refer to:

- [Dark Mode Toggle Documentation](./implementation-guides/dark-mode-toggle.md)
- [API Caching Documentation](./implementation-guides/api-caching.md)

## Component Examples

For examples of how to use the components, refer to:

- [ThemeToggleExample.tsx](../examples/ThemeToggleExample.tsx)
- [ApiCachingExample.tsx](../examples/ApiCachingExample.tsx)
