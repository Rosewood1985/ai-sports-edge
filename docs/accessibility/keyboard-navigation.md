# Keyboard Navigation Support

This document provides guidelines and examples for implementing keyboard navigation in the AI Sports Edge app.

## Overview

Keyboard navigation is an essential accessibility feature that allows users to navigate through interactive elements using a keyboard instead of touch or mouse interactions. This is particularly important for:

- Users with motor disabilities who rely on keyboard or switch controls
- Screen reader users who navigate via keyboard
- Power users who prefer keyboard shortcuts
- Web users accessing the app via a browser

## Implementation Status

- ✅ Core keyboard navigation infrastructure
- ✅ AccessibleTouchable component with keyboard support
- ✅ Focus management system
- ✅ Example implementation
- 🟡 Integration with screen readers
- 📋 Keyboard shortcuts for common actions
- 📋 Skip navigation links

## Components

### AccessibleTouchable

The `AccessibleTouchable` component extends React Native's `TouchableOpacity` with keyboard navigation support:

```tsx
import AccessibleTouchable from '../components/AccessibleTouchable';

<AccessibleTouchable
  accessibilityLabel="Submit Button"
  accessibilityHint="Press to submit the form"
  accessibilityRole="button"
  keyboardNavigationId="submit-button"
  nextElementId="cancel-button"
  prevElementId="email-input"
  onPress={handleSubmit}
  onFocus={handleFocus}
  onBlur={handleBlur}
>
  <Text>Submit</Text>
</AccessibleTouchable>;
```

#### Key Props

| Prop                   | Type     | Description                                                       |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `keyboardNavigationId` | string   | Unique ID for the element in the keyboard navigation system       |
| `nextElementId`        | string   | ID of the next element in the tab order                           |
| `prevElementId`        | string   | ID of the previous element in the tab order                       |
| `tabIndex`             | number   | Tab index for keyboard navigation (-1 to exclude from tab order)  |
| `autoFocus`            | boolean  | Whether this element should be focused when the screen is mounted |
| `onFocus`              | function | Callback when element receives focus                              |
| `onBlur`               | function | Callback when element loses focus                                 |

## Accessibility Service

The `accessibilityService` provides methods for managing keyboard navigation:

```tsx
import accessibilityService from '../services/accessibilityService';

// Check if keyboard navigation is enabled
const isEnabled = accessibilityService.isKeyboardNavigationEnabled();

// Focus a specific element
accessibilityService.focusElement('submit-button');

// Move to the next element
accessibilityService.focusNextElement();

// Move to the previous element
accessibilityService.focusPreviousElement();
```

## Example Implementation

See `components/examples/KeyboardNavigationExample.tsx` for a complete example of keyboard navigation implementation.

## Best Practices

1. **Logical Tab Order**: Ensure the tab order follows a logical flow, typically from top to bottom and left to right.

2. **Visual Focus Indicator**: Always provide a clear visual indication of which element has keyboard focus.

3. **Skip Navigation**: Implement "skip navigation" links to allow users to bypass repetitive navigation elements.

4. **Keyboard Shortcuts**: Provide keyboard shortcuts for common actions, but ensure they don't conflict with browser or screen reader shortcuts.

5. **Focus Management**: Manage focus appropriately when opening/closing modals or navigating between screens.

6. **Testing**: Test keyboard navigation with both keyboard-only users and screen reader users.

## Implementation Details

### Focus Indicators

Focus indicators are implemented using the following styles:

```tsx
const styles = StyleSheet.create({
  focused: {
    borderWidth: 2,
    borderColor: '#3B82F6', // Neon blue
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
});
```

### Keyboard Event Handling

Keyboard events are handled in the `AccessibleTouchable` component:

- Tab/Shift+Tab: Navigate to next/previous element
- Arrow keys: Navigate between elements
- Enter/Space: Activate the focused element

### Platform Considerations

- **Web**: Full keyboard navigation support using standard web keyboard interactions
- **iOS**: Limited keyboard support via external keyboards, focus primarily managed through VoiceOver
- **Android**: Limited keyboard support via external keyboards, focus primarily managed through TalkBack

## Future Improvements

1. Implement skip navigation links for web users
2. Add keyboard shortcuts for common actions
3. Improve focus management for modals and navigation
4. Enhance integration with screen readers
5. Add support for form field navigation

## Related Documentation

- [Accessibility Overview](./accessibility-overview.md)
- [Screen Reader Support](./screen-reader-support.md)
- [WCAG Compliance](./wcag-compliance.md)
