# GDPR Consent Screen Update Documentation

**Date:** May 19, 2025  
**Author:** Roo  
**Component:** GDPRConsentScreen.tsx

## Overview

This document records the updates made to the GDPRConsentScreen.tsx component to enhance the onboarding flow with Terms of Service references and acceptance requirements.

## Changes Made

1. **Added Terms of Service Checkbox**

   - Added a new state variable `termsAccepted` to track Terms of Service acceptance
   - Added a checkbox UI component that users must check to proceed
   - Added validation in the `handleContinue` function to ensure the Terms of Service checkbox is checked
   - Added an error alert if the user tries to proceed without accepting the Terms of Service

2. **Added Terms of Service Link**

   - Added a Terms of Service link alongside the existing Privacy Policy link
   - Ensured the Terms of Service link navigates to the LegalScreen with the 'terms-of-service' parameter
   - Reorganized the legal links into a container with horizontal layout for better UI

3. **Updated Data Storage**

   - Added the `termsAccepted` field to the GDPR consent data saved to the user profile
   - This ensures that the user's acceptance of the Terms of Service is properly recorded

4. **Fixed Import Paths**
   - Updated import paths for LanguageContext, ThemedView, and ThemedText to match the project structure
   - Changed from relative paths to the correct paths in the project hierarchy

## Implementation Details

The updated GDPR consent screen follows best practices for legal compliance:

1. **Explicit Consent**

   - The Terms of Service checkbox requires explicit action from the user
   - The checkbox is unchecked by default, requiring a deliberate opt-in

2. **Clear Information**

   - The checkbox label clearly indicates what the user is agreeing to
   - Links to both the Privacy Policy and Terms of Service are provided for reference

3. **Accessibility Considerations**
   - All interactive elements have proper accessibility attributes
   - The checkbox and links are properly labeled for screen readers

## UI Changes

1. **Terms of Service Checkbox**

   - Added a new checkbox with label below the privacy note
   - Styled consistently with other checkboxes in the screen
   - Positioned prominently before the continue button

2. **Legal Links Layout**
   - Reorganized the Privacy Policy and Terms of Service links into a horizontal layout
   - Both links are styled consistently with the app's design language
   - Links are positioned at the bottom of the screen for easy access

## Related Components

- **LegalScreen.tsx** - Displays the Privacy Policy and Terms of Service content
- **LanguageContext.tsx** - Provides translation functionality used in the GDPR screen

## Future Considerations

1. **Localization**

   - Ensure all new text strings are properly translated in the language files
   - Test the UI layout with longer text strings that may result from translation

2. **Analytics**

   - Consider tracking acceptance rates for Terms of Service to identify potential issues
   - Monitor if users are abandoning the onboarding flow at this step

3. **Legal Updates**
   - Implement a version tracking system for Terms of Service acceptance
   - Consider a mechanism to prompt users to review updated Terms of Service
