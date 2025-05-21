# Focus States Implementation Guide

This guide provides an overview of how to implement proper focus states for interactive elements in AI Sports Edge, ensuring accessibility for all users, including those who rely on keyboard navigation or assistive technologies.

## Overview

Focus states are visual indicators that show which element on the screen currently has focus. They are essential for:

- Keyboard navigation
- Screen reader compatibility
- Motor impairment accessibility
- Touch and gesture navigation

Properly implemented focus states help users understand where they are in the application and what element they are currently interacting with.

## Components and Utilities

AI Sports Edge provides several components and utilities to help implement proper focus states:

### 1. AccessibleTouchableOpacity

`AccessibleTouchableOpacity` is a wrapper around React Native's `TouchableOpacity` that adds proper focus state handling and accessibility attributes. It should be used in place of `TouchableOpacity` for all interactive elements.

```tsx
import { AccessibleTouchableOpacity } from '../atomic/atoms';

// Basic usage
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Press me"
  accessibilityRole="button"
  accessibilityHint="Performs an action when pressed"
>
  <Text>Press Me</Text>
</AccessibleTouchableOpacity>

// With focus state styling
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Press me"
  accessibilityRole="button"
  accessibilityHint="Performs an action when pressed"
  focusedStyle={{ borderWidth: 2, borderColor: '#0a7ea4' }}
  animateFocus={true}
>
  <Text>Press Me</Text>
</AccessibleTouchableOpacity>
```

### 2. Focus State Utilities

The `focusStateUtils.ts` file provides utilities for handling focus states:

```tsx
import {
  useFocusState,
  createFocusProps,
  getHighContrastFocusColor,
} from '../atomic/atoms/focusStateUtils';

// Using the useFocusState hook
const MyComponent = () => {
  const { isFocused, handleFocus, handleBlur, handlePressIn, handlePressOut, focusStyle } =
    useFocusState();

  return (
    <View style={[styles.container, isFocused && focusStyle]}>
      <Text>My Component</Text>
    </View>
  );
};

// Using createFocusProps
const MyComponent = ({ isFocused }) => {
  const focusProps = createFocusProps(isFocused);

  return (
    <View {...focusProps}>
      <Text>My Component</Text>
    </View>
  );
};

// Using getHighContrastFocusColor
const MyComponent = () => {
  const backgroundColor = '#333333';
  const focusColor = getHighContrastFocusColor(backgroundColor);

  return (
    <View style={[styles.container, isFocused && { borderColor: focusColor }]}>
      <Text>My Component</Text>
    </View>
  );
};
```

## Implementation Guidelines

### 1. Use AccessibleTouchableOpacity

Replace all instances of `TouchableOpacity` with `AccessibleTouchableOpacity`:

```tsx
// Before
import { TouchableOpacity } from 'react-native';

<TouchableOpacity onPress={handlePress}>
  <Text>Press Me</Text>
</TouchableOpacity>;

// After
import { AccessibleTouchableOpacity } from '../atomic/atoms';

<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Press me"
  accessibilityRole="button"
  accessibilityHint="Performs an action when pressed"
>
  <Text>Press Me</Text>
</AccessibleTouchableOpacity>;
```

### 2. Add Proper Accessibility Attributes

Always include the following accessibility attributes:

- `accessibilityLabel`: A description of the element
- `accessibilityRole`: The role of the element (e.g., button, link, checkbox)
- `accessibilityHint`: A hint about what will happen when the element is activated
- `accessibilityState`: The current state of the element (e.g., disabled, selected)

```tsx
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Settings"
  accessibilityRole="button"
  accessibilityHint="Opens the settings menu"
  accessibilityState={{ disabled: isDisabled }}
>
  <Text>Settings</Text>
</AccessibleTouchableOpacity>
```

### 3. Implement Focus Styles

Use the `focusedStyle` prop to add custom focus styles:

```tsx
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Settings"
  accessibilityRole="button"
  accessibilityHint="Opens the settings menu"
  focusedStyle={{
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  }}
>
  <Text>Settings</Text>
</AccessibleTouchableOpacity>
```

### 4. Animate Focus Changes

Use the `animateFocus` prop to animate focus changes:

```tsx
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Settings"
  accessibilityRole="button"
  accessibilityHint="Opens the settings menu"
  animateFocus={true}
  focusAnimationDuration={200}
>
  <Text>Settings</Text>
</AccessibleTouchableOpacity>
```

### 5. Handle External Focus State

For components that need to control the focus state externally:

```tsx
const [isFocused, setIsFocused] = useState(false);

<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Settings"
  accessibilityRole="button"
  accessibilityHint="Opens the settings menu"
  isFocused={isFocused}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
>
  <Text>Settings</Text>
</AccessibleTouchableOpacity>;
```

## Best Practices

1. **High Contrast**: Ensure focus indicators have sufficient contrast against the background.
2. **Size and Visibility**: Make focus indicators large enough to be visible.
3. **Consistency**: Use consistent focus styles throughout the application.
4. **Animation**: Use subtle animations to draw attention to focus changes.
5. **Keyboard Navigation**: Test focus states with keyboard navigation.
6. **Screen Reader Testing**: Test with screen readers to ensure proper focus management.
7. **Touch Target Size**: Ensure touch targets are at least 44x44 points.
8. **Focus Order**: Ensure focus moves in a logical order through the application.

## Testing Focus States

1. **Keyboard Navigation**: Test focus states by navigating through the application using the Tab key.
2. **Screen Reader Testing**: Test with VoiceOver (iOS) or TalkBack (Android) to ensure proper focus management.
3. **Automated Testing**: Use the accessibility testing utilities in the `__tests__/accessibility` directory.

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { simulateFocus, simulateBlur } from '../utils/accessibilityTestUtils';

test('Component shows focus state when focused', () => {
  const { getByTestId } = render(<MyComponent testID="my-component" />);
  const component = getByTestId('my-component');

  simulateFocus(component);
  expect(component.props.style).toContainEqual(expect.objectContaining({ borderWidth: 2 }));

  simulateBlur(component);
  expect(component.props.style).not.toContainEqual(expect.objectContaining({ borderWidth: 2 }));
});
```

## Conclusion

Implementing proper focus states is essential for creating an accessible application. By using the components and utilities provided by AI Sports Edge, you can ensure that your application is accessible to all users, including those who rely on keyboard navigation or assistive technologies.
