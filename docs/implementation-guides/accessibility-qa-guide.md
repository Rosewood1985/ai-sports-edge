# Accessibility QA Testing Guide

## Overview

This guide provides instructions for manually testing the accessibility features of AI Sports Edge. It is designed for QA testers to verify that the app meets accessibility requirements and provides a good experience for users with disabilities.

## Prerequisites

- iOS or Android device with screen reader enabled (VoiceOver for iOS, TalkBack for Android)
- Basic familiarity with screen reader gestures
- Access to the latest build of AI Sports Edge

## Testing Checklist

### 1. Screen Reader Navigation

#### Test Procedure

1. Enable the screen reader on your device:

   - iOS: Settings > Accessibility > VoiceOver > Turn on VoiceOver
   - Android: Settings > Accessibility > TalkBack > Turn on TalkBack

2. Launch AI Sports Edge

3. Navigate through each screen using the screen reader:

   - Swipe right to move to the next element
   - Swipe left to move to the previous element
   - Double-tap to activate the selected element

4. Verify the following for each screen:

| Test Case                              | Expected Result                                                                     | Pass/Fail |
| -------------------------------------- | ----------------------------------------------------------------------------------- | --------- |
| All interactive elements are announced | Screen reader announces each button, link, and input field with a descriptive label |           |
| Navigation order is logical            | Elements are announced in a logical order (typically top-to-bottom, left-to-right)  |           |
| Headings are properly announced        | Screen reader identifies headings (e.g., "Heading: Settings")                       |           |
| Custom actions are accessible          | Custom actions (e.g., swipe actions) are announced and can be activated             |           |
| Dynamic content updates are announced  | When content changes, screen reader announces the changes                           |           |

#### Screens to Test

- HomeScreen
- ProfileScreen
- SettingsScreen
- GameDetailsScreen
- BettingAnalyticsScreen
- ParlayScreen
- LoginScreen
- UFCScreen
- LegalScreen
- FAQScreen

### 2. Text Scaling

#### Test Procedure

1. Enable large text on your device:

   - iOS: Settings > Accessibility > Display & Text Size > Larger Text
   - Android: Settings > Accessibility > Font Size > Drag slider to largest setting

2. Launch AI Sports Edge

3. Navigate through each screen and verify:

| Test Case                    | Expected Result                               | Pass/Fail |
| ---------------------------- | --------------------------------------------- | --------- |
| Text scales appropriately    | All text increases in size without truncation |           |
| Layout adapts to larger text | UI elements reflow to accommodate larger text |           |
| No text overlaps             | Text doesn't overlap other UI elements        |           |
| Controls remain usable       | Buttons and other controls remain functional  |           |

### 3. Color Contrast

#### Test Procedure

1. Verify color contrast using the built-in accessibility testing tool:

   - Navigate to Settings > Accessibility > Color Contrast Test
   - Run the test on each screen

2. Alternatively, use a color contrast analyzer tool to check screenshots

3. Verify the following:

| Test Case                                 | Expected Result                                     | Pass/Fail |
| ----------------------------------------- | --------------------------------------------------- | --------- |
| Text meets AA contrast requirements       | Normal text has contrast ratio of at least 4.5:1    |           |
| Large text meets AA contrast requirements | Large text has contrast ratio of at least 3:1       |           |
| UI controls meet AA contrast requirements | UI controls have contrast ratio of at least 3:1     |           |
| High contrast mode works                  | When enabled, high contrast mode increases contrast |           |

### 4. Keyboard/Switch Control Accessibility

#### Test Procedure

1. Connect a Bluetooth keyboard to your device (or enable Switch Control)

2. Navigate through the app using Tab key (or Switch Control)

3. Verify the following:

| Test Case                              | Expected Result                                       | Pass/Fail |
| -------------------------------------- | ----------------------------------------------------- | --------- |
| All interactive elements are focusable | Can reach all buttons, links, and inputs with Tab key |           |
| Focus indicator is visible             | Current focus is clearly indicated visually           |           |
| Focus order is logical                 | Elements are focused in a logical order               |           |
| All actions can be performed           | Can activate all elements with Enter/Space key        |           |

### 5. Accessibility Features

#### Test Procedure

1. Navigate to Settings > Accessibility

2. Test each accessibility feature:

| Test Case           | Expected Result                                | Pass/Fail |
| ------------------- | ---------------------------------------------- | --------- |
| High Contrast mode  | Increases contrast between text and background |           |
| Large Text mode     | Increases text size throughout the app         |           |
| Bold Text mode      | Makes text bold throughout the app             |           |
| Reduce Motion       | Reduces or eliminates animations               |           |
| Screen Reader Hints | Provides additional context for screen readers |           |

### 6. Form Inputs and Validation

#### Test Procedure

1. Navigate to screens with form inputs (e.g., LoginScreen, ProfileScreen)

2. Test form completion with screen reader:

| Test Case                                | Expected Result                                        | Pass/Fail |
| ---------------------------------------- | ------------------------------------------------------ | --------- |
| Input fields are properly labeled        | Screen reader announces input purpose                  |           |
| Required fields are indicated            | Screen reader announces if field is required           |           |
| Error messages are announced             | Screen reader announces validation errors              |           |
| Form can be completed with screen reader | Can fill out and submit forms using only screen reader |           |

### 7. Gestures and Touch Targets

#### Test Procedure

1. Test touch targets throughout the app:

| Test Case                      | Expected Result                                | Pass/Fail |
| ------------------------------ | ---------------------------------------------- | --------- |
| Touch targets are large enough | Buttons and controls are at least 44x44 points |           |
| Touch targets don't overlap    | Can accurately tap adjacent controls           |           |
| Custom gestures are accessible | Any custom gestures have alternative methods   |           |

### 8. Media and Graphics

#### Test Procedure

1. Test media content throughout the app:

| Test Case                        | Expected Result                            | Pass/Fail |
| -------------------------------- | ------------------------------------------ | --------- |
| Images have alt text             | Screen reader announces image descriptions |           |
| Videos have captions             | Videos include captions or transcripts     |           |
| Infographics are accessible      | Complex graphics have text alternatives    |           |
| Charts and graphs are accessible | Data visualizations have text summaries    |           |

## Reporting Issues

When reporting accessibility issues, include the following information:

1. Device and OS version
2. Screen where the issue occurred
3. Steps to reproduce
4. Expected vs. actual behavior
5. Screenshot or screen recording if possible
6. Severity assessment:
   - Critical: Prevents users with disabilities from using core features
   - Major: Significantly impairs usability for users with disabilities
   - Minor: Causes inconvenience but doesn't prevent use

## Accessibility Compliance Standards

AI Sports Edge aims to comply with:

- WCAG 2.1 Level AA
- iOS and Android accessibility guidelines

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
