# Age Verification Screen

## Overview

This document outlines the age verification screen that must be included in the onboarding process for the AI Sports Edge app. This screen is a critical legal requirement to ensure that users are of legal age to participate in sports betting activities, which is typically 18 years or older in most jurisdictions (and 21+ in some US states).

## Purpose

The age verification screen serves several important purposes:

1. **Legal Compliance**: Ensures the app complies with age restrictions for gambling and sports betting
2. **User Verification**: Confirms that users meet the minimum age requirement
3. **Liability Protection**: Provides legal protection for the app by requiring explicit age confirmation
4. **Responsible Gambling**: Supports responsible gambling practices by preventing underage users

## Design

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               AI Sports Edge                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │           Age Verification              │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  To use AI Sports Edge, you must be at least    │
│  18 years of age (21+ in some jurisdictions).   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ □ I confirm that I am at least 18       │    │
│  │   years of age (or the minimum legal    │    │
│  │   age for sports betting in my          │    │
│  │   jurisdiction).                        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Sports betting is only legal for adults.       │
│  We are required by law to verify your age      │
│  before you can use our services.               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Continue                        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  By continuing, you also agree that we may      │
│  request additional age verification if needed. │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Functionality

- The user must check the age confirmation checkbox to proceed
- The "Continue" button should be disabled until the checkbox is checked
- The user's confirmation should be recorded in their profile for compliance purposes
- If the user does not confirm they are of legal age, they should not be allowed to proceed

## Placement in Onboarding Flow

The age verification screen should be the **first verification screen** in the onboarding flow, appearing before the self-exclusion check, responsible gambling acknowledgment, and liability waiver. The updated onboarding sequence should be:

1. Welcome Screen
2. Profile Setup
3. Preferences
4. **Age Verification** (new)
5. Self-Exclusion Check
6. Responsible Gambling Acknowledgment
7. Liability Waiver
8. Main App

## Implementation

### AgeVerificationScreen Component

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { Ionicons } from '@expo/vector-icons';

const AgeVerificationScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  const handleContinue = async () => {
    if (!ageConfirmed) {
      Alert.alert(
        t('age_verification.alert_title'),
        t('age_verification.alert_message'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    try {
      // Save age confirmation to user profile
      await updateUserProfile({
        ageVerification: {
          confirmed: true,
          timestamp: new Date().toISOString()
        }
      });
      
      // Navigate to next screen (Self-Exclusion)
      navigation.navigate('SelfExclusion');
    } catch (error) {
      console.error('Error saving age verification:', error);
      Alert.alert(
        t('common.error'),
        t('age_verification.save_error'),
        [{ text: t('common.ok') }]
      );
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {t('age_verification.title')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('age_verification.description')}
        </ThemedText>
        
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgeConfirmed(!ageConfirmed)}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.text }
          ]}>
            {ageConfirmed && (
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.primary}
              />
            )}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            {t('age_verification.confirmation')}
          </ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.legalText}>
          {t('age_verification.legal_text')}
        </ThemedText>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: ageConfirmed ? 1 : 0.5
            }
          ]}
          onPress={handleContinue}
          disabled={!ageConfirmed}
        >
          <Text style={styles.continueButtonText}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.disclaimer}>
          {t('age_verification.disclaimer')}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
  },
  legalText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AgeVerificationScreen;
```

### Navigation Updates

Update the navigation in `src/navigation/AuthNavigator.js` to include the age verification screen:

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

### Data Storage

Update the user profile schema to include the age verification field:

```javascript
// User profile schema
{
  // Existing fields
  uid: string,
  email: string,
  displayName: string,
  // New fields
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

### Translation Keys

Add the following translation keys to the language files:

```json
{
  "age_verification": {
    "title": "Age Verification",
    "description": "To use AI Sports Edge, you must be at least 18 years of age (21+ in some jurisdictions).",
    "confirmation": "I confirm that I am at least 18 years of age (or the minimum legal age for sports betting in my jurisdiction).",
    "legal_text": "Sports betting is only legal for adults. We are required by law to verify your age before you can use our services.",
    "disclaimer": "By continuing, you also agree that we may request additional age verification if needed.",
    "alert_title": "Age Confirmation Required",
    "alert_message": "You must confirm that you are of legal age to use AI Sports Edge.",
    "save_error": "There was an error saving your age verification. Please try again."
  }
}
```

## Legal Considerations

### Jurisdictional Variations

It's important to note that the legal gambling age varies by jurisdiction:

- In most countries, the minimum age is 18
- In some US states, the minimum age is 21
- Some jurisdictions may have different age requirements for different types of gambling

The app should be configured to display the appropriate age requirement based on the user's location, if possible. Alternatively, the app can use the highest common age requirement (21+) to ensure compliance in all jurisdictions.

### Additional Verification

In some jurisdictions, self-declaration of age may not be sufficient. The app may need to implement additional age verification methods, such as:

- ID verification
- Credit card verification
- Third-party age verification services

The implementation should be flexible enough to accommodate these additional verification methods if required.

## Testing Strategy

### Unit Tests

Create unit tests for the age verification screen:

- Test rendering in different states
- Verify checkbox functionality
- Test navigation flow
- Test error handling

### Integration Tests

Test the integration of the age verification screen with the rest of the onboarding flow:

- Verify data is properly saved to the user profile
- Test navigation between screens
- Ensure the screen appears in the correct order

### User Testing

Conduct user testing to ensure the screen is clear and understandable:

- Verify users understand the age requirement
- Ensure the checkbox is easy to use
- Test with users from different jurisdictions

## Conclusion

The age verification screen is a critical component of the onboarding process for AI Sports Edge. By implementing this screen as the first verification step, the app ensures that users are of legal age to participate in sports betting activities, which is essential for legal compliance and responsible gambling practices.

The screen should be designed to be clear and straightforward, with a simple checkbox for users to confirm their age. The implementation should be flexible enough to accommodate different age requirements based on the user's jurisdiction and to support additional verification methods if required.