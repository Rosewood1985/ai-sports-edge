# Accessibility Implementation

This document outlines the accessibility features implemented in AI Sports Edge to ensure the app is usable by people with various disabilities and preferences.

## Architecture Overview

The accessibility system consists of the following components:

1. **Accessibility Service**

   - `accessibilityService.ts`: Core service for managing accessibility preferences
   - Integration with system accessibility settings
   - Custom accessibility preferences

2. **Accessibility Components**

   - `AccessibleView.tsx`: Component for creating accessible views
   - `AccessibilitySettingsScreen.tsx`: Screen for configuring accessibility preferences

3. **Integration Points**
   - Theme system integration
   - Navigation integration
   - Component-level accessibility enhancements

## Accessibility Service

The `accessibilityService.ts` provides core functionality for managing accessibility preferences:

### Features

- **Preference Management**: Store and retrieve user accessibility preferences
- **System Integration**: Detect and respond to system accessibility settings
- **Event Notifications**: Notify subscribers of accessibility preference changes
- **Accessibility Helpers**: Utility functions for accessibility properties

### Preference Types

The service manages the following preferences:

- **Large Text**: Increase text size for better readability
- **High Contrast**: Increase contrast for better visibility
- **Reduce Motion**: Minimize animations and motion effects
- **Screen Reader Hints**: Provide additional hints for screen readers
- **Bold Text**: Make text bold for better visibility
- **Grayscale**: Display content in grayscale
- **Invert Colors**: Invert screen colors for better contrast

### System Integration

The service integrates with the following system accessibility settings:

- **Screen Reader**: VoiceOver (iOS) and TalkBack (Android)
- **Bold Text**: System bold text setting (iOS)
- **Reduce Motion**: System reduce motion setting (iOS and Android)
- **Invert Colors**: System invert colors setting (iOS)
- **Grayscale**: System grayscale setting (iOS)
- **Reduce Transparency**: System reduce transparency setting (iOS)

## Accessible Components

### AccessibleView

The `AccessibleView` component provides a foundation for creating accessible views:

```typescript
<AccessibleView
  accessibilityLabel="Example View"
  accessibilityHint="This is an example view"
  accessibilityRole="button"
  accessibilityState={{ selected: true }}
  applyHighContrast={true}
  applyReducedMotion={true}
  highContrastStyle={{ borderWidth: 2 }}
>
  {/* Content */}
</AccessibleView>
```

Features:

- **Accessibility Properties**: Automatically apply accessibility properties
- **High Contrast**: Apply high contrast styles when needed
- **Reduced Motion**: Adapt animations based on reduce motion preference
- **Dynamic Adaptation**: Respond to changes in accessibility preferences

### Accessibility Settings Screen

The `AccessibilitySettingsScreen` component provides a user interface for configuring accessibility preferences:

```typescript
<AccessibilitySettingsScreen />
```

Features:

- **Preference Configuration**: Toggle accessibility preferences
- **System Integration**: Show status of system accessibility settings
- **Reset Options**: Reset preferences to default values
- **Help Information**: Provide help information for accessibility features

## Accessibility Guidelines Implementation

The app implements the following accessibility guidelines:

### Text and Typography

- **Scalable Text**: All text scales according to system and user preferences
- **Minimum Text Size**: Base text size is at least 16px
- **Line Height**: Line height is at least 1.5 times the font size
- **Font Choices**: Sans-serif fonts for better readability
- **Text Contrast**: Text meets WCAG AA contrast requirements (4.5:1)

### Color and Contrast

- **Color Independence**: Information is not conveyed by color alone
- **Contrast Ratios**: UI elements meet WCAG AA contrast requirements
- **High Contrast Mode**: Enhanced contrast mode for users with low vision
- **Focus Indicators**: Clear focus indicators for keyboard navigation

### Touch Targets

- **Minimum Size**: Touch targets are at least 44x44 points
- **Spacing**: Adequate spacing between touch targets
- **Hit Slop**: Extended hit areas for small elements

### Screen Reader Support

- **Meaningful Labels**: All interactive elements have meaningful accessibility labels
- **Hints**: Additional hints for complex interactions
- **Semantic Roles**: Appropriate accessibility roles for elements
- **Focus Order**: Logical focus order for screen reader navigation
- **Image Descriptions**: Alt text for all informative images

### Motion and Animation

- **Reduced Motion**: Option to reduce or eliminate animations
- **No Auto-Play**: No auto-playing content without user control
- **Pause/Stop Controls**: Controls to pause or stop animations
- **No Flashing Content**: No content that flashes more than 3 times per second

## Implementation Details

### Screen-Specific Implementations

#### Payment Screen

The `PaymentScreen.tsx` has been enhanced with accessibility features:

- **Semantic Structure**: Proper heading hierarchy with h1 for the title and h2 for sections
- **Accessible Components**:
  - Replaced Text with AccessibleThemedText
  - Replaced View with AccessibleThemedView
  - Replaced TouchableOpacity with AccessibleTouchableOpacity
- **Payment Form Accessibility**:
  - Added accessibility properties to the Stripe CardField component
  - Enhanced screen reader experience for payment form elements
  - Made validation errors and loading states accessible
- **Interactive Elements**:
  - Added appropriate accessibility labels, roles, and hints
  - Ensured proper focus order through the payment flow
  - Added accessibility states for disabled buttons
- **Loading States**:
  - Made loading indicators accessible to screen readers
  - Added appropriate accessibility roles for progress indicators

### Accessibility Service Implementation

The accessibility service uses React Native's AccessibilityInfo API:

```typescript
// Subscribe to screen reader changes
AccessibilityInfo.addEventListener('screenReaderChanged', isEnabled => {
  this.isScreenReaderEnabled = isEnabled;
  this.notifyListeners();
});
```

### Accessible Text Implementation

The accessible text implementation adapts to user preferences:

```typescript
export const getAccessibleTextStyle = (props: AccessibleTextStyleProps): StyleProp<TextStyle> => {
  const { style, highContrastStyle, largeTextStyle, boldTextStyle } = props;

  // Get preferences
  const isHighContrast =
    accessibilityService.isHighContrastActive() ||
    accessibilityService.getPreferences().highContrast;

  const isLargeText = accessibilityService.getPreferences().largeText;

  const isBoldText =
    accessibilityService.isBoldTextActive() || accessibilityService.getPreferences().boldText;

  // Apply styles based on preferences
  return [
    style,
    isHighContrast && [styles.highContrastText, highContrastStyle],
    isLargeText && [styles.largeText, largeTextStyle],
    isBoldText && [styles.boldText, boldTextStyle],
  ];
};
```

### Animation Adaptation

Animations adapt to the reduce motion preference:

```typescript
export const getAccessibleAnimationConfig = (defaultConfig: any): any => {
  const isReduceMotion =
    accessibilityService.isReduceMotionActive() ||
    accessibilityService.getPreferences().reduceMotion;

  if (isReduceMotion) {
    // Reduce animation duration or disable animation
    return {
      ...defaultConfig,
      duration: 0, // Disable animation
    };
  }

  return defaultConfig;
};
```

## Testing and Validation

The accessibility features have been tested in various scenarios:

- **Screen Reader Testing**: Testing with VoiceOver (iOS) and TalkBack (Android)
- **Contrast Testing**: Testing with contrast analyzers
- **Text Size Testing**: Testing with various text size settings
- **Motion Testing**: Testing with reduce motion enabled
- **Keyboard Testing**: Testing with keyboard navigation (web)
- **Automated Testing**: Using accessibility linting tools

## Future Enhancements

Planned enhancements for the accessibility system:

- **Voice Control**: Enhanced voice control integration
- **Keyboard Shortcuts**: Additional keyboard shortcuts for web
- **Accessibility Profiles**: Save and load accessibility profiles
- **Automated Testing**: More comprehensive automated accessibility testing
- **Localization**: Localized accessibility instructions and hints

## Resources

- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [iOS Accessibility](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)

## Conclusion

The accessibility implementation provides a robust foundation for ensuring AI Sports Edge is usable by people with various disabilities and preferences. By following accessibility best practices and providing customization options, the app delivers an inclusive experience for all users.
