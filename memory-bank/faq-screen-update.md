# FAQ Screen Accessibility Update

## Overview

This document outlines the accessibility enhancements made to the FAQ Screen in the AI Sports Edge application. The goal was to make the screen more accessible to users with disabilities, particularly those using screen readers, and to comply with accessibility guidelines.

## Changes Made

### Component Replacements

1. **Text Components**

   - Replaced standard `Text` components with `AccessibleThemedText`
   - Added semantic type props (h1, h2, bodyStd) for proper heading hierarchy
   - Added appropriate accessibility labels for screen readers

2. **View Components**

   - Replaced standard `View` components with `AccessibleThemedView`
   - Added appropriate accessibility labels for screen readers

3. **TouchableOpacity Components**
   - Replaced standard `TouchableOpacity` components with `AccessibleTouchableOpacity`
   - Added appropriate accessibility roles, labels, hints, and states

### Accessibility Enhancements

1. **Semantic Structure**

   - Used `type="h1"` for the main title
   - Used `type="h2"` for FAQ questions
   - Used `type="bodyStd"` for regular text content

2. **Screen Reader Support**

   - Added `accessibilityLabel` props to all components
   - Added `accessibilityRole` props to interactive elements
   - Added `accessibilityState` props to indicate expanded/collapsed state
   - Added `accessibilityHint` props to provide additional context

3. **Link Enhancements**
   - Improved accessibility of links to Privacy Policy and Terms of Service
   - Added appropriate accessibility roles and labels for links

## Implementation Details

### FAQ Item Structure

Each FAQ item was enhanced with the following structure:

```tsx
<AccessibleThemedView
  key={index}
  style={styles.faqItem}
  accessibilityLabel={`${t('faq.accessibility.faq_item')}: ${item.question}`}
>
  <AccessibleTouchableOpacity
    style={styles.questionContainer}
    onPress={() => toggleExpand(index)}
    accessibilityRole="button"
    accessibilityLabel={item.question}
    accessibilityHint={t('faq.accessibility.questionHint')}
    accessibilityState={{ expanded: expandedIndex === index }}
  >
    <AccessibleThemedText style={styles.question} type="h2" accessibilityLabel={item.question}>
      {item.question}
    </AccessibleThemedText>
    <AccessibleThemedText
      style={styles.expandIcon}
      type="bodyStd"
      accessibilityLabel={
        expandedIndex === index ? t('faq.accessibility.collapse') : t('faq.accessibility.expand')
      }
    >
      {expandedIndex === index ? '−' : '+'}
    </AccessibleThemedText>
  </AccessibleTouchableOpacity>

  {expandedIndex === index && (
    <AccessibleThemedView
      style={styles.answerContainer}
      accessibilityRole="text"
      accessibilityLabel={`${t('faq.accessibility.answer')}: ${item.answer}`}
    >
      <AccessibleThemedText style={styles.answer} type="bodyStd" accessibilityLabel={item.answer}>
        {item.answer}
      </AccessibleThemedText>
    </AccessibleThemedView>
  )}
</AccessibleThemedView>
```

### Link Rendering

The link rendering function was updated to use `AccessibleThemedText` with appropriate accessibility attributes:

```tsx
<AccessibleThemedText
  key={`privacy-${i}`}
  style={styles.link}
  type="bodyStd"
  onPress={() => navigation.navigate('LegalScreen', { type: 'privacy-policy' })}
  accessible={true}
  accessibilityRole="link"
  accessibilityLabel={t('legal.privacy_policy')}
  accessibilityHint={t('faq.accessibility.linkHint')}
>
  Privacy Policy
</AccessibleThemedText>
```

## Testing Considerations

The enhanced FAQ screen should be tested with:

1. **Screen Readers**

   - VoiceOver on iOS
   - TalkBack on Android

2. **Accessibility Features**

   - Large text
   - High contrast
   - Bold text

3. **User Interactions**
   - Expanding/collapsing FAQ items
   - Navigating between items
   - Following links to legal screens

## Next Steps

1. **Translation Updates**

   - Ensure all new accessibility labels and hints are properly translated
   - Add new translation keys for accessibility-specific text

2. **Automated Testing**

   - Add accessibility tests for the FAQ screen
   - Verify proper heading hierarchy

3. **Documentation**
   - Update component documentation to reflect accessibility enhancements
   - Add examples of accessible FAQ items to the component library
