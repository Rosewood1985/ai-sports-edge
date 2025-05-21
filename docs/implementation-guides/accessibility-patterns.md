# Accessibility Patterns in AI Sports Edge

This guide documents the accessibility patterns and best practices implemented in the AI Sports Edge application to ensure compliance with accessibility standards and provide a better experience for users with disabilities.

## Core Accessibility Components

### AccessibleThemedText

`AccessibleThemedText` extends the standard `ThemedText` component with additional accessibility properties:

```tsx
<AccessibleThemedText
  style={styles.title}
  type="h1"
  accessibilityLabel="Screen title"
  accessibilityRole="header"
>
  Screen Title
</AccessibleThemedText>
```

Key features:

- **Semantic type props**: Use `type` prop to specify semantic roles (h1, h2, h3, bodyStd, etc.)
- **Accessibility labels**: Provide descriptive text for screen readers
- **Accessibility roles**: Define the role of the text element in the UI

### AccessibleThemedView

`AccessibleThemedView` extends the standard `ThemedView` component with additional accessibility properties:

```tsx
<AccessibleThemedView style={styles.container} accessibilityLabel="Main content container">
  {children}
</AccessibleThemedView>
```

Key features:

- **Accessibility labels**: Provide descriptive text for screen readers
- **Accessibility roles**: Define the role of the view in the UI

### AccessibleTouchableOpacity

`AccessibleTouchableOpacity` extends the standard `TouchableOpacity` component with additional accessibility properties:

```tsx
<AccessibleTouchableOpacity
  style={styles.button}
  onPress={handlePress}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
  accessibilityHint="Submits the form and proceeds to the next screen"
>
  <Text>Submit</Text>
</AccessibleTouchableOpacity>
```

Key features:

- **Accessibility labels**: Provide descriptive text for screen readers
- **Accessibility roles**: Define the role of the touchable element in the UI
- **Accessibility hints**: Provide additional context about the action

## Implementation Patterns

### Proper Heading Hierarchy

Maintain a proper heading hierarchy using the `type` prop on `AccessibleThemedText`:

```tsx
<AccessibleThemedText type="h1">Main Title</AccessibleThemedText>
<AccessibleThemedText type="h2">Section Title</AccessibleThemedText>
<AccessibleThemedText type="h3">Subsection Title</AccessibleThemedText>
<AccessibleThemedText type="bodyStd">Regular text content</AccessibleThemedText>
```

### Interactive Elements

For interactive elements like buttons, checkboxes, and links, always include:

1. `accessibilityRole` to define the element's role
2. `accessibilityLabel` to provide a descriptive label
3. `accessibilityState` for elements with states (e.g., checked, disabled)
4. `accessibilityHint` when additional context is helpful

Example for a checkbox:

```tsx
<TouchableOpacity
  onPress={() => setChecked(!checked)}
  accessible={true}
  accessibilityLabel="Accept terms and conditions"
  accessibilityRole="checkbox"
  accessibilityState={{ checked }}
  accessibilityHint="Toggle acceptance of terms and conditions"
>
  {/* Checkbox UI */}
</TouchableOpacity>
```

### Form Elements

For form elements, ensure proper labeling and state management:

```tsx
<TextInput
  value={value}
  onChangeText={setValue}
  accessible={true}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email address"
/>
```

### Images and Icons

For images and icons, provide descriptive labels:

```tsx
<Image
  source={require('../../assets/logo.png')}
  accessibilityLabel="AI Sports Edge logo"
/>

<Ionicons
  name="checkmark"
  size={18}
  color="white"
  accessibilityLabel="Selected"
/>
```

## Screen-Specific Patterns

### GDPR Consent Screen

The GDPR Consent Screen demonstrates several accessibility patterns:

1. **Screen container**: Use `AccessibleThemedView` with a descriptive label
2. **Heading hierarchy**: Use proper heading levels (h1 for screen title, h2 for section titles)
3. **Interactive checkboxes**: Include proper accessibility roles, states, and labels
4. **Legal links**: Include proper accessibility roles and labels

### Game Details Screen

The Game Details Screen demonstrates these patterns:

1. **Scoreboard**: Provide descriptive labels for team names, scores, and game status
2. **Interactive elements**: Ensure buttons and tabs have proper accessibility roles and labels
3. **Dynamic content**: Update accessibility labels based on content changes

## Testing Accessibility

To ensure accessibility compliance:

1. Use the React Native Accessibility Inspector
2. Test with screen readers (VoiceOver on iOS, TalkBack on Android)
3. Verify proper focus order and navigation
4. Check color contrast ratios
5. Ensure text can be resized without breaking layouts

## Resources

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Mobile Accessibility Best Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Mobile_accessibility_checklist)
