# Liability Waiver Implementation Plan

## Overview

This document provides a step-by-step implementation plan for the Code mode to follow when implementing the liability waiver component and integrating it into the AI Sports Edge app. This plan is based on the architecture and design outlined in the liability waiver documentation.

## Implementation Steps

### Phase 1: Component Development

#### Step 1: Create the LiabilityWaiver Component

1. Create the file `components/LiabilityWaiver.tsx`
2. Implement the component based on the design in `docs/liability-waiver.md`
3. Include:
   - Scrollable content area
   - Scroll tracking to detect when user reaches the bottom
   - Acknowledgment checkbox
   - Accept and decline buttons
   - Proper styling and theming

#### Step 2: Add Translation Keys

1. Update `translations/en.json` to add the liability section:
   ```json
   "liability": {
     "title": "Liability Waiver",
     "content": "By using AI Sports Edge, you acknowledge and agree to the following...",
     "scroll_to_continue": "Please scroll to the bottom to continue",
     "acknowledgment": "I have read and agree to the terms of the liability waiver",
     "accept": "I Agree",
     "decline": "Decline",
     "required_alert_title": "Waiver Required",
     "required_alert_message": "You must accept the liability waiver to use AI Sports Edge.",
     "review_again": "Review Again",
     "exit": "Exit"
   }
   ```

2. Update `translations/es.json` with the Spanish translations

#### Step 3: Create the LiabilityWaiverScreen

1. Create the file `screens/Onboarding/LiabilityWaiverScreen.tsx`
2. Implement the screen that uses the LiabilityWaiver component
3. Add navigation handling for accept/decline actions
4. Implement Firebase integration to store waiver acceptance

### Phase 2: Service Layer Integration

#### Step 4: Update User Service

1. Open `services/userService.ts`
2. Add functions for waiver acceptance:
   - `saveWaiverAcceptance(userId, waiverData)`
   - `hasAcceptedWaiver(userId)`
   - `getAcceptedWaiverVersion(userId)`

#### Step 5: Update Authentication Flow

1. Modify the authentication flow to check for waiver acceptance
2. Redirect users to the waiver screen if they haven't accepted it
3. Implement version checking to prompt for re-acceptance when the waiver is updated

### Phase 3: Navigation Integration

#### Step 6: Update Navigation

1. Open `navigation/AppNavigator.tsx`
2. Add the LiabilityWaiverScreen to the navigation stack
3. Update the RootStackParamList type to include the new screen

#### Step 7: Update Onboarding Flow

1. Modify the onboarding sequence to include the liability waiver as the final step
2. Ensure users cannot skip the waiver screen
3. Implement proper navigation after waiver acceptance

### Phase 4: Testing

#### Step 8: Create Unit Tests

1. Create `__tests__/components/LiabilityWaiver.test.tsx`
2. Test all component functionality:
   - Initial render state
   - Scroll detection
   - Checkbox functionality
   - Button states (enabled/disabled)
   - Accept/decline actions

#### Step 9: Create Integration Tests

1. Create `__tests__/screens/LiabilityWaiverScreen.test.tsx`
2. Test the screen's integration with:
   - Navigation
   - Firebase
   - User service

#### Step 10: Manual Testing

1. Test the complete onboarding flow
2. Verify waiver data is properly stored in Firebase
3. Test on multiple device sizes and orientations
4. Verify accessibility compliance

## Code Snippets

### LiabilityWaiver Component (Simplified)

```tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Switch
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';

interface LiabilityWaiverProps {
  onAccept: () => void;
  onDecline: () => void;
}

const LiabilityWaiver: React.FC<LiabilityWaiverProps> = ({ 
  onAccept, 
  onDecline 
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= 
        contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('liability.title')}
      </Text>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        testID="waiver-scroll-view"
      >
        <Text style={[styles.content, { color: colors.text }]}>
          {t('liability.content')}
        </Text>
      </ScrollView>
      
      {!hasScrolledToBottom && (
        <Text style={[styles.scrollPrompt, { color: colors.primary }]}>
          {t('liability.scroll_to_continue')}
        </Text>
      )}
      
      <View style={styles.acknowledgmentContainer}>
        <Switch
          value={hasAcknowledged}
          onValueChange={setHasAcknowledged}
          disabled={!hasScrolledToBottom}
          testID="waiver-checkbox"
        />
        <Text 
          style={[
            styles.acknowledgmentText, 
            { color: hasScrolledToBottom ? colors.text : colors.text + '80' }
          ]}
        >
          {t('liability.acknowledgment')}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.declineButton, { borderColor: colors.border }]}
          onPress={onDecline}
        >
          <Text style={{ color: colors.text }}>
            {t('liability.decline')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.acceptButton, 
            { 
              backgroundColor: colors.primary,
              opacity: hasScrolledToBottom && hasAcknowledged ? 1 : 0.5 
            }
          ]}
          onPress={onAccept}
          disabled={!hasScrolledToBottom || !hasAcknowledged}
        >
          <Text style={{ color: 'white' }}>
            {t('liability.accept')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: '60%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  scrollPrompt: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  acknowledgmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  acknowledgmentText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  acceptButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
});

export default LiabilityWaiver;
```

### LiabilityWaiverScreen (Simplified)

```tsx
import React from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LiabilityWaiver from '../../components/LiabilityWaiver';
import { saveWaiverAcceptance } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

const LiabilityWaiverScreen = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  
  const handleAccept = async () => {
    // Record waiver acceptance
    const waiverData = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    try {
      // Save to user profile
      await updateUserProfile({
        waiverAccepted: waiverData
      });
      
      // Save to backend
      await saveWaiverAcceptance(user.uid, waiverData);
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainNavigator' }]
      });
    } catch (error) {
      console.error('Error saving waiver acceptance:', error);
      Alert.alert(
        t('common.error'),
        t('liability.save_error'),
        [{ text: t('common.ok') }]
      );
    }
  };
  
  const handleDecline = () => {
    // Show warning dialog
    Alert.alert(
      t('liability.required_alert_title'),
      t('liability.required_alert_message'),
      [
        { text: t('liability.review_again'), onPress: () => {} },
        { text: t('liability.exit'), onPress: () => BackHandler.exitApp() }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <LiabilityWaiver
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});

export default LiabilityWaiverScreen;
```

### User Service Functions (Simplified)

```typescript
// services/userService.ts

import firebase from '../config/firebase';
import { firestore } from 'firebase';

// Save waiver acceptance to Firestore
export const saveWaiverAcceptance = async (userId, waiverData) => {
  try {
    const userRef = firebase.firestore().collection('users').doc(userId);
    
    // Update user document with waiver data
    await userRef.update({
      waiverAcceptance: waiverData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    // Also log to a separate collection for audit purposes
    await firebase.firestore().collection('waiverAcceptances').add({
      userId,
      ...waiverData,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving waiver acceptance:', error);
    throw error;
  }
};

// Check if user has accepted the waiver
export const hasAcceptedWaiver = async (userId) => {
  try {
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    return userData?.waiverAcceptance?.accepted === true;
  } catch (error) {
    console.error('Error checking waiver acceptance:', error);
    return false;
  }
};
```

## Testing Guidelines

### Unit Testing

- Test component rendering in different states
- Verify scroll detection logic works correctly
- Ensure checkbox and button states update properly
- Test accessibility features

### Integration Testing

- Verify navigation flow works correctly
- Test Firebase integration for storing waiver acceptance
- Ensure error handling works properly
- Test with different user scenarios (new user, returning user)

### Manual Testing

- Test on different device sizes and orientations
- Verify text is readable and properly formatted
- Test with screen readers for accessibility
- Verify color contrast meets accessibility standards

## Conclusion

By following this implementation plan, the Code mode will be able to efficiently implement the liability waiver component and integrate it into the AI Sports Edge app. The plan provides a clear step-by-step approach, along with code snippets and testing guidelines to ensure a high-quality implementation.

Once implemented, the liability waiver will provide critical legal protection for the app while maintaining a good user experience. The component is designed to be clear, accessible, and integrated seamlessly into the onboarding flow.