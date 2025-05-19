# Accessibility Implementation Guide

This guide explains how to implement accessibility features in the AI Sports Edge app using our enhanced atomic components.

## Overview

We've enhanced our atomic components with accessibility features to ensure that the app is usable by people with disabilities. The enhancements include:

- Support for screen readers
- High contrast mode
- Large text mode
- Bold text mode
- Reduced motion mode

## Enhanced Components

### AccessibleThemedText

The `AccessibleThemedText` component extends the functionality of `ThemedText` with accessibility features. It automatically adapts to the user's accessibility preferences and provides proper accessibility attributes for screen readers.

#### Usage

```tsx
import { AccessibleThemedText } from '../atomic/atoms';

// Basic usage
<AccessibleThemedText>Hello World</AccessibleThemedText>

// With type and color
<AccessibleThemedText type="h1" color="primary">
  Hello World
</AccessibleThemedText>

// With accessibility props
<AccessibleThemedText
  accessibilityLabel="Greeting"
  accessibilityHint="This is a greeting message"
  type="h1"
  color="primary"
>
  Hello World
</AccessibleThemedText>

// With accessibility style overrides
<AccessibleThemedText
  applyHighContrast={true}
  applyLargeText={true}
  applyBoldText={true}
  highContrastStyle={{ color: '#000', backgroundColor: '#fff' }}
  largeTextStyle={{ fontSize: 24 }}
  boldTextStyle={{ fontWeight: '900' }}
>
  Hello World
</AccessibleThemedText>
```

### AccessibleThemedView

The `AccessibleThemedView` component extends the functionality of `ThemedView` with accessibility features. It automatically adapts to the user's accessibility preferences and provides proper accessibility attributes for screen readers.

#### Usage

```tsx
import { AccessibleThemedView } from '../atomic/atoms';

// Basic usage
<AccessibleThemedView>
  <Text>Hello World</Text>
</AccessibleThemedView>

// With background
<AccessibleThemedView background="primary">
  <Text>Hello World</Text>
</AccessibleThemedView>

// With accessibility props
<AccessibleThemedView
  accessibilityLabel="Greeting Container"
  accessibilityHint="This container holds a greeting message"
  background="primary"
>
  <Text>Hello World</Text>
</AccessibleThemedView>

// With accessibility style overrides
<AccessibleThemedView
  applyHighContrast={true}
  applyReducedMotion={true}
  highContrastStyle={{ borderWidth: 2, borderColor: '#000' }}
>
  <Text>Hello World</Text>
</AccessibleThemedView>
```

## Accessibility Service

The `accessibilityService` is a singleton service that manages accessibility preferences and provides utilities for working with accessibility features. It's used internally by the enhanced components, but you can also use it directly in your code.

### Usage

```tsx
import accessibilityService from '../services/accessibilityService';

// Get current preferences
const preferences = accessibilityService.getPreferences();

// Check if screen reader is active
const isScreenReaderActive = accessibilityService.isScreenReaderActive();

// Check if bold text is active
const isBoldTextActive = accessibilityService.isBoldTextActive();

// Check if reduce motion is active
const isReduceMotionActive = accessibilityService.isReduceMotionActive();

// Check if high contrast is active
const isHighContrastActive = accessibilityService.isHighContrastActive();

// Get accessibility props for a component
const accessibilityProps = accessibilityService.getAccessibilityProps('Label', 'Hint', 'button', {
  disabled: false,
});

// Subscribe to preference changes
const unsubscribe = accessibilityService.addListener(newPreferences => {
  // Handle preference changes
});

// Unsubscribe when component unmounts
useEffect(() => {
  return () => {
    unsubscribe();
  };
}, []);
```

## Best Practices

1. **Use Enhanced Components**: Prefer using `AccessibleThemedText` and `AccessibleThemedView` over `ThemedText` and `ThemedView` for all new components.

2. **Provide Accessibility Labels**: Always provide meaningful accessibility labels for interactive elements.

3. **Provide Accessibility Hints**: Provide accessibility hints for complex interactions or when the purpose of an element might not be clear from its label.

4. **Test with Screen Readers**: Test your components with screen readers to ensure they are properly announced.

5. **Test with Different Preferences**: Test your components with different accessibility preferences to ensure they adapt properly.

6. **Avoid Animations for Users with Reduced Motion**: Use the `isReduceMotionActive` method to check if the user has enabled reduced motion mode, and avoid animations for these users.

7. **Provide High Contrast Alternatives**: Use the `isHighContrastActive` method to check if the user has enabled high contrast mode, and provide high contrast alternatives for these users.

## Migration Guide

### Migrating from ThemedText to AccessibleThemedText

```tsx
// Before
import { ThemedText } from '../atomic/atoms';

<ThemedText type="h1" color="primary">
  Hello World
</ThemedText>;

// After
import { AccessibleThemedText } from '../atomic/atoms';

<AccessibleThemedText type="h1" color="primary" accessibilityLabel="Hello World">
  Hello World
</AccessibleThemedText>;
```

### Migrating from ThemedView to AccessibleThemedView

```tsx
// Before
import { ThemedView } from '../atomic/atoms';

<ThemedView background="primary">
  <Text>Hello World</Text>
</ThemedView>;

// After
import { AccessibleThemedView } from '../atomic/atoms';

<AccessibleThemedView background="primary" accessibilityLabel="Greeting Container">
  <Text>Hello World</Text>
</AccessibleThemedView>;
```

## Conclusion

By using these enhanced components and following the best practices outlined in this guide, you can ensure that the AI Sports Edge app is accessible to all users, including those with disabilities.
