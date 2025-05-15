# AI Sports Edge: Onboarding Verification Flow

## Overview

This document provides a comprehensive overview of the verification flow that users must complete during the onboarding process for the AI Sports Edge app. This flow is designed to ensure legal compliance, promote responsible gambling, and provide appropriate disclaimers and waivers for sports betting activities.

## Complete Verification Flow

The onboarding process for AI Sports Edge includes the following verification steps, which must be completed in sequence:

1. **Age Verification**
2. **Self-Exclusion Check**
3. **Responsible Gambling Acknowledgment**
4. **Liability Waiver**

Each step serves a specific legal and ethical purpose, and users must complete all steps before they can access the app's main functionality.

## Verification Screens

### 1. Age Verification Screen

**Purpose**: Ensures users are of legal age to participate in sports betting activities.

**Key Features**:
- Checkbox to confirm the user is at least 18 years old (or the legal age in their jurisdiction)
- Clear explanation of the legal requirement
- Disabled continue button until confirmation is provided

**User Flow**:
- User reads the age requirement
- User checks the confirmation checkbox
- User taps "Continue" to proceed
- If user does not confirm, they cannot proceed

**Implementation**: See `docs/age-verification-screen.md` for detailed implementation guidelines.

### 2. Self-Exclusion Check Screen

**Purpose**: Verifies that users are not on any self-exclusion lists that would prohibit them from participating in sports betting.

**Key Features**:
- Clear question about self-exclusion lists
- Yes/No response options
- Explanation of what self-exclusion means

**User Flow**:
- User reads the self-exclusion question
- User selects "Yes" or "No"
- If "Yes" (on a self-exclusion list), user is prevented from proceeding
- If "No" (not on a self-exclusion list), user proceeds to the next screen

**Implementation**: See `docs/responsible-gambling-screens.md` for detailed implementation guidelines.

### 3. Responsible Gambling Acknowledgment Screen

**Purpose**: Ensures users understand the risks associated with gambling and commit to gambling responsibly.

**Key Features**:
- Checkbox to acknowledge responsible gambling principles
- Educational content about responsible gambling practices
- Helpline information for problem gambling

**User Flow**:
- User reads the responsible gambling information
- User checks the acknowledgment checkbox
- User taps "Continue" to proceed
- If user does not acknowledge, they cannot proceed

**Implementation**: See `docs/responsible-gambling-screens.md` for detailed implementation guidelines.

### 4. Liability Waiver Screen

**Purpose**: Provides legal protection for the app by having users acknowledge and accept a comprehensive liability waiver.

**Key Features**:
- Scrollable waiver text
- Scroll tracking to ensure users read the entire waiver
- Checkbox to acknowledge acceptance
- Accept/Decline buttons

**User Flow**:
- User scrolls through the entire waiver text
- User checks the acknowledgment checkbox
- User taps "I Agree" to accept the waiver and proceed
- If user declines, they cannot proceed

**Implementation**: See `docs/liability-waiver.md` and `docs/liability-waiver-implementation-plan.md` for detailed implementation guidelines.

## Data Storage

All user responses and acknowledgments should be stored in the user's profile for compliance and legal purposes:

```javascript
// User profile schema
{
  // Basic user information
  uid: string,
  email: string,
  displayName: string,
  
  // Verification data
  ageVerification: {
    confirmed: boolean,
    timestamp: string
  },
  selfExclusionCheck: {
    response: boolean, // false = not on self-exclusion list
    timestamp: string
  },
  responsibleGamblingAcknowledgment: {
    acknowledged: boolean,
    timestamp: string
  },
  waiverAcceptance: {
    accepted: boolean,
    timestamp: string,
    version: string
  }
}
```

## Navigation Flow

The complete onboarding navigation flow should be implemented as follows:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
import AgeVerificationScreen from '../screens/Onboarding/AgeVerificationScreen';
import SelfExclusionScreen from '../screens/Onboarding/SelfExclusionScreen';
import ResponsibleGamblingScreen from '../screens/Onboarding/ResponsibleGamblingScreen';
import LiabilityWaiverScreen from '../screens/Onboarding/LiabilityWaiverScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
      <Stack.Screen name="SelfExclusion" component={SelfExclusionScreen} />
      <Stack.Screen name="ResponsibleGambling" component={ResponsibleGamblingScreen} />
      <Stack.Screen name="LiabilityWaiver" component={LiabilityWaiverScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
```

## Implementation Priority

The verification screens should be implemented in the following order:

1. Age Verification Screen
2. Self-Exclusion Check Screen
3. Responsible Gambling Screen
4. Liability Waiver Screen

This order ensures that the most critical legal requirements are addressed first.

## Legal Considerations

### Jurisdictional Variations

Different jurisdictions may have different requirements for sports betting apps. The implementation should be flexible enough to accommodate these variations:

- **Age Requirements**: May vary from 18 to 21+ depending on jurisdiction
- **Self-Exclusion Programs**: May have different names or structures in different regions
- **Responsible Gambling Requirements**: May have specific language required by regulators
- **Liability Waivers**: May need to be tailored to specific jurisdictional requirements

### Record Keeping

All user responses and acknowledgments should be securely stored and easily retrievable for compliance and audit purposes. The implementation should include:

- Timestamps for all user actions
- Version tracking for legal documents
- Secure storage of user responses
- Audit logging for compliance purposes

## User Experience Considerations

While legal compliance is critical, the verification flow should also provide a good user experience:

- **Clear Language**: All legal text should be clear and understandable
- **Progressive Disclosure**: Information should be presented in manageable chunks
- **Visual Design**: Screens should be visually appealing and consistent with the app's design
- **Accessibility**: All screens should be accessible to users with disabilities

## Testing Requirements

The verification flow should be thoroughly tested to ensure both legal compliance and a good user experience:

- **Functional Testing**: Verify all screens work as expected
- **User Testing**: Test with real users to ensure clarity and usability
- **Legal Review**: Have legal counsel review the implementation
- **Accessibility Testing**: Ensure all screens are accessible
- **Cross-Platform Testing**: Test on both iOS and Android

## Conclusion

The onboarding verification flow is a critical component of the AI Sports Edge app, ensuring legal compliance, promoting responsible gambling, and providing appropriate disclaimers and waivers for sports betting activities. By implementing this flow as described in this document, the app will meet its legal obligations while providing a clear and straightforward user experience.

The detailed implementation guidelines for each screen are provided in the referenced documents, and the development team should follow these guidelines closely to ensure a compliant and user-friendly implementation.