# Dark Mode Toggle Implementation Guide

## Overview

This guide explains how to use the dark mode toggle component implemented in the AI Sports Edge application. The component follows the atomic architecture pattern and provides a consistent way to toggle between light and dark themes across the application.

## Architecture

The dark mode toggle system consists of the following components:

### Molecules

- **ThemeToggle** (`atomic/molecules/theme/ThemeToggle.tsx`): A flexible and reusable toggle component for switching between light and dark themes.

### Context

- **ThemeContext** (`atomic/molecules/themeContext.js`): Provides theme state and functionality, including a `toggleTheme` function.

## Key Features

1. **Multiple Variants**: The component supports three different variants:

   - Button variant: A standard button with text
   - Switch variant: A toggle switch
   - Icon variant: An icon button (sun/moon)

2. **Customization Options**: The component supports various customization options:

   - Custom labels
   - Custom styling for the container and text
   - Callback function for when the theme is toggled

3. **Accessibility**: The component includes accessibility features:

   - Proper accessibility labels for screen readers
   - Appropriate accessibility roles
   - High contrast between text and background

4. **TypeScript Support**: The component includes TypeScript type definitions:
   - Type definitions for props
   - Interface for theme colors
   - Type safety for all component props

## Usage

### Basic Usage

To use the ThemeToggle component with default settings (button variant):

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  return (
    <View>
      <ThemeToggle />
    </View>
  );
};

export default MyComponent;
```

### Switch Variant

To use the ThemeToggle component as a switch:

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  return (
    <View>
      <ThemeToggle variant="switch" />
    </View>
  );
};

export default MyComponent;
```

### Icon Variant

To use the ThemeToggle component as an icon button:

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  return (
    <View>
      <ThemeToggle variant="icon" />
    </View>
  );
};

export default MyComponent;
```

### Custom Label

To use the ThemeToggle component with a custom label:

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  return (
    <View>
      <ThemeToggle label="Toggle Dark Mode" />
    </View>
  );
};

export default MyComponent;
```

### Custom Styling

To use the ThemeToggle component with custom styling:

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  return (
    <View>
      <ThemeToggle
        style={{ backgroundColor: '#0066cc', borderRadius: 12 }}
        textStyle={{ color: '#ffffff', fontWeight: 'bold' }}
      />
    </View>
  );
};

export default MyComponent;
```

### Toggle Callback

To use the ThemeToggle component with a callback function:

```tsx
import React from 'react';
import { View } from 'react-native';
import { ThemeToggle } from 'atomic/molecules/theme';

const MyComponent = () => {
  const handleThemeToggle = newTheme => {
    console.log(`Theme changed to: ${newTheme}`);
    // Perform additional actions when theme changes
  };

  return (
    <View>
      <ThemeToggle onToggle={handleThemeToggle} />
    </View>
  );
};

export default MyComponent;
```

## Using Theme Context

The ThemeToggle component uses the ThemeContext to get and set the current theme. You can also use the ThemeContext directly in your components to access the current theme:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'atomic/molecules/themeContext';

// Define theme colors type for TypeScript
interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  [key: string]: string;
}

const MyComponent = () => {
  // Get theme context
  const { effectiveTheme, colors: themeColors } = useTheme();

  // Cast colors to our interface to fix TypeScript errors
  const colors = themeColors as ThemeColors;

  // Determine if dark mode is active
  const isDarkMode = effectiveTheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <Text style={[styles.text, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        Current Theme: {effectiveTheme}
      </Text>
      <Text style={[styles.text, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
        Primary Color: {colors.primary || 'Not defined'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default MyComponent;
```

## Props

The ThemeToggle component accepts the following props:

| Prop      | Type                           | Default   | Description                                     |
| --------- | ------------------------------ | --------- | ----------------------------------------------- |
| variant   | 'button' \| 'switch' \| 'icon' | 'button'  | The variant of the toggle component             |
| label     | string                         | undefined | Custom label for the toggle                     |
| style     | object                         | undefined | Additional styles for the container             |
| textStyle | object                         | undefined | Additional styles for the text                  |
| onToggle  | (newTheme: string) => void     | undefined | Callback function called after theme is toggled |

## Best Practices

1. **Consistent Placement**: Place the ThemeToggle component in a consistent location across the application, such as in the header or settings screen.

2. **Appropriate Variant**: Choose the appropriate variant based on the context:

   - Use the button variant for settings screens where clarity is important
   - Use the switch variant for compact settings lists
   - Use the icon variant for headers or navigation bars

3. **Accessibility**: Ensure that the ThemeToggle component is accessible to all users:

   - Provide clear labels
   - Ensure sufficient contrast
   - Test with screen readers

4. **Responsive Design**: Ensure that the ThemeToggle component works well on all screen sizes:

   - Adjust size and spacing based on screen size
   - Use responsive styling

5. **Theme Consistency**: Ensure that all components in the application respond correctly to theme changes:
   - Use the ThemeContext to get the current theme
   - Apply appropriate styles based on the theme

## Example

For a complete example of how to use the ThemeToggle component, see the `examples/ThemeToggleExample.tsx` file.
