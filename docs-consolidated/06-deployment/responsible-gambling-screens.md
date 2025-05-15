# Responsible Gambling Screens

## Overview

This document outlines two additional screens that must be added to the onboarding process before the user signs the liability waiver. These screens focus on responsible gambling practices and are designed to ensure users acknowledge the risks associated with sports betting and confirm they are not on any self-exclusion lists.

## Screen 1: Self-Exclusion Check

### Purpose

The self-exclusion check screen verifies that users are not on any state or national self-exclusion lists that would prohibit them from participating in sports betting. Self-exclusion programs allow individuals to voluntarily ban themselves from gambling activities, and it's important to respect these programs by preventing such users from accessing the app.

### Design

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               AI Sports Edge                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │         Self-Exclusion Check            │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Before you continue, we need to confirm        │
│  your eligibility to use our app.               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  Are you currently on any state or      │    │
│  │  national self-exclusion lists that     │    │
│  │  prohibit you from participating in     │    │
│  │  sports betting?                        │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────┐                  ┌─────────┐       │
│  │   Yes   │                  │   No    │       │
│  └─────────┘                  └─────────┘       │
│                                                 │
│  By selecting "No", you confirm that you are    │
│  not on any self-exclusion lists.               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Functionality

- If the user selects "Yes", they should be shown a message explaining that they cannot use the app while on a self-exclusion list, and the app should prevent them from proceeding further.
- If the user selects "No", they can proceed to the next screen.
- The user's response should be recorded in their profile for compliance purposes.

### Implementation Notes

- The screen should be simple and clear, with a prominent question and yes/no buttons.
- The "No" button should be the primary action, as it allows the user to proceed.
- The screen should include explanatory text about what self-exclusion means.
- Consider adding a link to more information about self-exclusion programs.

## Screen 2: Responsible Gambling Acknowledgment

### Purpose

The responsible gambling acknowledgment screen ensures that users understand the risks associated with gambling and commit to gambling responsibly. This screen serves both as an educational tool and as a legal protection for the app.

### Design

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               AI Sports Edge                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │    Responsible Gambling Commitment      │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  At AI Sports Edge, we promote responsible      │
│  gambling. Please read and acknowledge the      │
│  following statement:                           │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ □ I acknowledge that sports betting     │    │
│  │   should be conducted responsibly and   │    │
│  │   that I am aware of the risks          │    │
│  │   associated with gambling.             │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Responsible gambling means:                    │
│  • Setting time and money limits               │
│  • Never chasing losses                        │
│  • Not gambling when upset or stressed         │
│  • Balancing gambling with other activities    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Continue                        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Need help? Call 1-800-GAMBLER                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Functionality

- The user must check the acknowledgment checkbox to proceed.
- The "Continue" button should be disabled until the checkbox is checked.
- The user's acknowledgment should be recorded in their profile for compliance purposes.
- The screen should include a helpline number for problem gambling.

### Implementation Notes

- The checkbox should be prominent and clearly labeled.
- Include brief educational content about responsible gambling practices.
- Consider adding a link to more detailed responsible gambling resources.
- The helpline number should be accurate for the user's jurisdiction.

## Integration into Onboarding Flow

### Updated Onboarding Sequence

The onboarding flow should now include the following steps:

1. Welcome Screen
2. Profile Setup
3. Preferences
4. **Self-Exclusion Check** (new)
5. **Responsible Gambling Acknowledgment** (new)
6. Liability Waiver
7. Main App

### Navigation Updates

Update the navigation in `src/navigation/AuthNavigator.js`:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
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
      <Stack.Screen name="SelfExclusion" component={SelfExclusionScreen} />
      <Stack.Screen name="ResponsibleGambling" component={ResponsibleGamblingScreen} />
      <Stack.Screen name="LiabilityWaiver" component={LiabilityWaiverScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
```

### Data Storage

Update the user profile schema to include the new fields:

```javascript
// User profile schema
{
  // Existing fields
  uid: string,
  email: string,
  displayName: string,
  // New fields
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

## Component Implementation

### SelfExclusionScreen

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView, ThemedText } from '../../components/ThemedComponents';

const SelfExclusionScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAuth();
  
  const handleResponse = async (isOnSelfExclusionList) => {
    if (isOnSelfExclusionList) {
      // User is on a self-exclusion list
      Alert.alert(
        t('self_exclusion.alert_title'),
        t('self_exclusion.alert_message'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate('Welcome') }]
      );
    } else {
      // User is not on a self-exclusion list
      try {
        // Save response to user profile
        await updateUserProfile({
          selfExclusionCheck: {
            response: false,
            timestamp: new Date().toISOString()
          }
        });
        
        // Navigate to next screen
        navigation.navigate('ResponsibleGambling');
      } catch (error) {
        console.error('Error saving self-exclusion response:', error);
        Alert.alert(
          t('common.error'),
          t('self_exclusion.save_error'),
          [{ text: t('common.ok') }]
        );
      }
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {t('self_exclusion.title')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('self_exclusion.description')}
        </ThemedText>
        
        <View style={styles.questionContainer}>
          <ThemedText style={styles.question}>
            {t('self_exclusion.question')}
          </ThemedText>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { borderColor: colors.border }]}
            onPress={() => handleResponse(true)}
          >
            <ThemedText style={styles.buttonText}>
              {t('common.yes')}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => handleResponse(false)}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>
              {t('common.no')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ThemedText style={styles.disclaimer}>
          {t('self_exclusion.disclaimer')}
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
  questionContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default SelfExclusionScreen;
```

### ResponsibleGamblingScreen

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { Ionicons } from '@expo/vector-icons';

const ResponsibleGamblingScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);
  
  const handleContinue = async () => {
    if (!acknowledged) {
      Alert.alert(
        t('responsible_gambling.alert_title'),
        t('responsible_gambling.alert_message'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    try {
      // Save acknowledgment to user profile
      await updateUserProfile({
        responsibleGamblingAcknowledgment: {
          acknowledged: true,
          timestamp: new Date().toISOString()
        }
      });
      
      // Navigate to next screen
      navigation.navigate('LiabilityWaiver');
    } catch (error) {
      console.error('Error saving responsible gambling acknowledgment:', error);
      Alert.alert(
        t('common.error'),
        t('responsible_gambling.save_error'),
        [{ text: t('common.ok') }]
      );
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {t('responsible_gambling.title')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('responsible_gambling.description')}
        </ThemedText>
        
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAcknowledged(!acknowledged)}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.text }
          ]}>
            {acknowledged && (
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.primary}
              />
            )}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            {t('responsible_gambling.acknowledgment')}
          </ThemedText>
        </TouchableOpacity>
        
        <View style={styles.tipsContainer}>
          <ThemedText style={styles.tipsTitle}>
            {t('responsible_gambling.tips_title')}
          </ThemedText>
          
          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>
              {t('responsible_gambling.tip_1')}
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="trending-down-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>
              {t('responsible_gambling.tip_2')}
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="happy-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>
              {t('responsible_gambling.tip_3')}
            </ThemedText>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>
              {t('responsible_gambling.tip_4')}
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: acknowledged ? 1 : 0.5
            }
          ]}
          onPress={handleContinue}
          disabled={!acknowledged}
        >
          <Text style={styles.continueButtonText}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.helpline}>
          {t('responsible_gambling.helpline')}
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
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
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
  helpline: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ResponsibleGamblingScreen;
```

## Translation Keys

Add the following translation keys to the language files:

```json
{
  "self_exclusion": {
    "title": "Self-Exclusion Check",
    "description": "Before you continue, we need to confirm your eligibility to use our app.",
    "question": "Are you currently on any state or national self-exclusion lists that prohibit you from participating in sports betting?",
    "disclaimer": "By selecting \"No\", you confirm that you are not on any self-exclusion lists.",
    "alert_title": "Unable to Proceed",
    "alert_message": "If you are on a self-exclusion list, you cannot use AI Sports Edge at this time. Please respect the self-exclusion program and seek help if needed.",
    "save_error": "There was an error saving your response. Please try again."
  },
  "responsible_gambling": {
    "title": "Responsible Gambling Commitment",
    "description": "At AI Sports Edge, we promote responsible gambling. Please read and acknowledge the following statement:",
    "acknowledgment": "I acknowledge that sports betting should be conducted responsibly and that I am aware of the risks associated with gambling.",
    "tips_title": "Responsible gambling means:",
    "tip_1": "Setting time and money limits",
    "tip_2": "Never chasing losses",
    "tip_3": "Not gambling when upset or stressed",
    "tip_4": "Balancing gambling with other activities",
    "helpline": "Need help? Call 1-800-GAMBLER",
    "alert_title": "Acknowledgment Required",
    "alert_message": "Please acknowledge the responsible gambling statement to continue.",
    "save_error": "There was an error saving your acknowledgment. Please try again."
  }
}
```

## Testing Strategy

### Unit Tests

Create unit tests for both screens:

- Test rendering in different states
- Verify checkbox and button functionality
- Test navigation flow
- Test error handling

### Integration Tests

Test the integration of these screens with the rest of the onboarding flow:

- Verify data is properly saved to the user profile
- Test navigation between screens
- Ensure the screens appear in the correct order

### User Testing

Conduct user testing to ensure the screens are clear and understandable:

- Verify users understand what self-exclusion means
- Ensure the responsible gambling tips are helpful
- Test with users who have different levels of gambling experience

## Conclusion

By adding these two screens to the onboarding process, AI Sports Edge demonstrates a commitment to responsible gambling and compliance with self-exclusion programs. These screens serve both as educational tools for users and as legal protection for the app.

The self-exclusion check and responsible gambling acknowledgment should be presented before the liability waiver, creating a comprehensive legal framework that ensures users are fully informed about the risks associated with sports betting and have confirmed their eligibility to use the app.