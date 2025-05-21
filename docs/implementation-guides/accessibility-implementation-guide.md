# Accessibility Implementation Guide

## Overview

This guide provides detailed instructions for implementing accessibility features in the AI Sports Edge application. Following these guidelines will ensure that the app is usable by people with disabilities and complies with accessibility standards.

## Core Accessible Components

AI Sports Edge uses a set of accessible atomic components that extend the standard React Native components with additional accessibility features. These components should be used instead of their standard counterparts whenever possible.

### AccessibleThemedText

Use `AccessibleThemedText` instead of `Text` or `ThemedText`:

```tsx
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';

// Instead of:
<Text style={styles.title}>Screen Title</Text>

// Use:
<AccessibleThemedText
  style={styles.title}
  type="h1"
  accessibilityLabel="Screen Title"
>
  Screen Title
</AccessibleThemedText>
```

#### Key Props:

- `type`: Defines the semantic role of the text. Options include:

  - `h1`, `h2`, `h3`, `h4`: Heading levels
  - `bodyStd`: Standard body text
  - `bodySmall`: Smaller body text
  - `label`: Form labels
  - `button`: Button text
  - `small`: Small text
  - `defaultSemiBold`: Semi-bold text

- `accessibilityLabel`: Provides a description for screen readers
- `accessibilityHint`: Provides additional context about the element
- `accessibilityRole`: Defines the role of the element (automatically set based on `type`)

### AccessibleThemedView

Use `AccessibleThemedView` instead of `View` or `ThemedView`:

```tsx
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';

// Instead of:
<View style={styles.container}>
  {children}
</View>

// Use:
<AccessibleThemedView
  style={styles.container}
  accessibilityLabel="Main content container"
>
  {children}
</AccessibleThemedView>
```

#### Key Props:

- `accessibilityLabel`: Provides a description for screen readers
- `accessibilityRole`: Defines the role of the view (e.g., "none", "button", "header")
- `accessibilityHint`: Provides additional context about the view

### AccessibleTouchableOpacity

Use `AccessibleTouchableOpacity` instead of `TouchableOpacity`:

```tsx
import { AccessibleTouchableOpacity } from '../atomic/atoms/AccessibleTouchableOpacity';

// Instead of:
<TouchableOpacity onPress={handlePress}>
  <Text>Submit</Text>
</TouchableOpacity>

// Use:
<AccessibleTouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
  accessibilityHint="Submits the form and proceeds to the next screen"
>
  <AccessibleThemedText type="button">Submit</AccessibleThemedText>
</AccessibleTouchableOpacity>
```

#### Key Props:

- `accessibilityLabel`: Provides a description for screen readers
- `accessibilityRole`: Defines the role of the touchable element (default: "button")
- `accessibilityHint`: Provides additional context about the action
- `accessibilityState`: Indicates the current state (e.g., `{ disabled: true, selected: false }`)

## Accessibility Best Practices

### Proper Heading Hierarchy

Maintain a proper heading hierarchy using the `type` prop on `AccessibleThemedText`:

```tsx
<AccessibleThemedText type="h1">Screen Title</AccessibleThemedText>
<AccessibleThemedText type="h2">Section Title</AccessibleThemedText>
<AccessibleThemedText type="h3">Subsection Title</AccessibleThemedText>
```

- Each screen should have exactly one `h1` heading
- Headings should be properly nested (h1 > h2 > h3)
- Don't skip heading levels

### Interactive Elements

For interactive elements like buttons, checkboxes, and links:

1. Always use `accessibilityRole` to define the element's role
2. Provide a descriptive `accessibilityLabel`
3. Use `accessibilityState` for elements with states (e.g., checked, disabled)
4. Add `accessibilityHint` when additional context is helpful

Example for a checkbox:

```tsx
<AccessibleTouchableOpacity
  onPress={() => setChecked(!checked)}
  accessibilityLabel="Accept terms and conditions"
  accessibilityRole="checkbox"
  accessibilityState={{ checked }}
  accessibilityHint="Toggle acceptance of terms and conditions"
>
  {/* Checkbox UI */}
</AccessibleTouchableOpacity>
```

### Images and Icons

Always provide descriptive labels for images and icons:

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

### Form Elements

For form elements, ensure proper labeling:

```tsx
<AccessibleThemedText
  type="label"
  accessibilityRole="text"
>
  Email Address
</AccessibleThemedText>
<TextInput
  value={email}
  onChangeText={setEmail}
  accessible={true}
  accessibilityLabel="Email address input field"
  accessibilityHint="Enter your email address"
/>
```

### Expandable/Collapsible Content

For expandable content like accordions or dropdown menus:

```tsx
<AccessibleTouchableOpacity
  onPress={() => setExpanded(!expanded)}
  accessibilityRole="button"
  accessibilityLabel="Show more details"
  accessibilityState={{ expanded }}
  accessibilityHint="Expands to show additional information"
>
  <AccessibleThemedText type="bodyStd">Details</AccessibleThemedText>
  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} />
</AccessibleTouchableOpacity>;

{
  expanded && (
    <AccessibleThemedView accessibilityLabel="Additional details">
      {/* Expanded content */}
    </AccessibleThemedView>
  );
}
```

## Screen Implementation Examples

### Basic Screen Structure

```tsx
const MyScreen = () => {
  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel="My screen">
      <AccessibleThemedText style={styles.title} type="h1" accessibilityLabel="Screen title">
        Screen Title
      </AccessibleThemedText>

      <AccessibleThemedView style={styles.section} accessibilityLabel="Main content section">
        <AccessibleThemedText
          style={styles.sectionTitle}
          type="h2"
          accessibilityLabel="Section title"
        >
          Section Title
        </AccessibleThemedText>

        <AccessibleThemedText
          style={styles.content}
          type="bodyStd"
          accessibilityLabel="Section content"
        >
          Content goes here
        </AccessibleThemedText>
      </AccessibleThemedView>

      <AccessibleTouchableOpacity
        style={styles.button}
        onPress={handlePress}
        accessibilityLabel="Continue"
        accessibilityRole="button"
        accessibilityHint="Proceeds to the next screen"
      >
        <AccessibleThemedText style={styles.buttonText} type="button">
          Continue
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>
    </AccessibleThemedView>
  );
};
```

### List Items

```tsx
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => (
    <AccessibleTouchableOpacity
      style={styles.item}
      onPress={() => handleItemPress(item)}
      accessibilityLabel={item.title}
      accessibilityRole="button"
      accessibilityHint={`View details for ${item.title}`}
    >
      <AccessibleThemedText style={styles.itemTitle} type="h3">
        {item.title}
      </AccessibleThemedText>
      <AccessibleThemedText style={styles.itemDescription} type="bodyStd">
        {item.description}
      </AccessibleThemedText>
    </AccessibleTouchableOpacity>
  )}
/>
```

## Testing Accessibility

### Manual Testing

1. **Screen Reader Testing**:

   - Test with VoiceOver on iOS
   - Test with TalkBack on Android
   - Ensure all elements are properly announced
   - Verify proper navigation order

2. **Keyboard Navigation** (Web):

   - Test tab order
   - Ensure focus indicators are visible
   - Verify all interactive elements can be activated with keyboard

3. **Display Settings**:
   - Test with large text
   - Test with high contrast
   - Test with bold text

### Automated Testing

Use the accessibility testing script to check for common issues:

```bash
node scripts/accessibility-test.js
```

Add the script to your CI/CD pipeline:

```yaml
# In .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Run accessibility tests
        run: node scripts/accessibility-test.js --report=accessibility-report.json
      - name: Upload accessibility report
        uses: actions/upload-artifact@v2
        with:
          name: accessibility-report
          path: accessibility-report.html
```

## Common Accessibility Issues and Solutions

### Issue: Missing Accessibility Labels

**Problem**: Screen readers can't properly announce elements without labels.

**Solution**: Add `accessibilityLabel` to all components:

```tsx
<AccessibleThemedText accessibilityLabel="Welcome to AI Sports Edge">
  Welcome to AI Sports Edge
</AccessibleThemedText>
```

### Issue: Improper Heading Hierarchy

**Problem**: Screen readers rely on proper heading hierarchy for navigation.

**Solution**: Use the correct heading levels:

```tsx
// Correct
<AccessibleThemedText type="h1">Screen Title</AccessibleThemedText>
<AccessibleThemedText type="h2">Section Title</AccessibleThemedText>

// Incorrect
<AccessibleThemedText type="h3">Screen Title</AccessibleThemedText>
<AccessibleThemedText type="h2">Section Title</AccessibleThemedText>
```

### Issue: Touchable Elements Without Proper Roles

**Problem**: Screen readers don't know how to announce interactive elements.

**Solution**: Add `accessibilityRole` and `accessibilityState`:

```tsx
<AccessibleTouchableOpacity
  accessibilityRole="button"
  accessibilityState={{ disabled: isDisabled }}
>
  {/* Button content */}
</AccessibleTouchableOpacity>
```

### Issue: Color Contrast Issues

**Problem**: Text with low contrast is difficult to read.

**Solution**: Ensure sufficient contrast between text and background:

```tsx
// Good contrast
<AccessibleThemedText style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>
  High contrast text
</AccessibleThemedText>

// Poor contrast
<AccessibleThemedText style={{ color: '#AAAAAA', backgroundColor: '#CCCCCC' }}>
  Low contrast text
</AccessibleThemedText>
```

## Resources

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Mobile Accessibility Best Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Mobile_accessibility_checklist)
- [iOS Accessibility](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
