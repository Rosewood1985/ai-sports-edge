# AI Sports Edge Liability Waiver

## Overview

This document outlines the implementation of a liability waiver that must be presented to users at the end of the onboarding process. The waiver requires explicit user acknowledgment before they can proceed to use the app.

## Purpose

The liability waiver serves several important purposes:

1. **Legal Protection**: Limits the company's liability regarding sports betting decisions made by users
2. **User Awareness**: Ensures users understand that predictions are not guarantees
3. **Responsible Gambling**: Promotes responsible gambling practices
4. **Regulatory Compliance**: Helps meet legal requirements in jurisdictions where sports betting is regulated

## Waiver Content

The liability waiver should include the following text:

```
# AI Sports Edge Liability Waiver

By using AI Sports Edge, you acknowledge and agree to the following:

## Betting Advice Disclaimer

The predictions, odds, and betting recommendations provided by AI Sports Edge are for informational and entertainment purposes only. While we use advanced algorithms and data analysis to generate these recommendations, we cannot guarantee their accuracy or success.

## No Guarantee of Winnings

Sports betting involves risk, and there is no guarantee of winnings. AI Sports Edge does not guarantee that you will make money from following our recommendations. You should never bet more than you can afford to lose.

## User Responsibility

You are solely responsible for your betting decisions and any resulting financial losses. AI Sports Edge, its owners, employees, and affiliates will not be liable for any losses incurred as a result of following our recommendations or using our services.

## Legal Compliance

You are responsible for ensuring that your use of AI Sports Edge complies with all applicable laws and regulations in your jurisdiction. Sports betting may be illegal in some jurisdictions, and we do not encourage illegal gambling.

## Responsible Gambling

AI Sports Edge promotes responsible gambling. If you believe you may have a gambling problem, we encourage you to seek help from a professional organization such as the National Council on Problem Gambling.

## Acknowledgment

By clicking "I Agree" below, you acknowledge that you have read, understood, and agree to this liability waiver. If you do not agree, you should not use AI Sports Edge.
```

## Implementation Requirements

### Component Design

Create a `LiabilityWaiver` component with the following features:

1. **Scrollable Content**: The waiver text should be displayed in a scrollable container to ensure users can read the entire document
2. **Checkbox**: A checkbox requiring users to acknowledge they have read and agree to the terms
3. **Continue Button**: A button to proceed, which should only be enabled after the user has scrolled to the bottom of the waiver and checked the acknowledgment checkbox
4. **Visual Indicators**: Clear visual cues showing that the user must scroll to the bottom

### Integration Points

The liability waiver should be integrated at the following points:

1. **End of Onboarding**: As the final step in the user onboarding process
2. **Account Creation**: When users create a new account
3. **Major Updates**: When significant app updates change the terms or features related to betting

### User Flow

1. User completes initial onboarding steps (profile setup, preferences, etc.)
2. Liability waiver is presented
3. User must scroll to the bottom of the waiver
4. User must check the acknowledgment checkbox
5. User taps "I Agree" to proceed to the main app
6. If user declines, they should be returned to the previous screen or given the option to exit the app

### Data Storage

1. Store the user's acceptance of the waiver in the user's profile
2. Include timestamp and version of the waiver that was accepted
3. Maintain this record for legal compliance purposes

## Technical Implementation

### Component Structure

```tsx
// LiabilityWaiver.tsx
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

### Integration in Onboarding Flow

```tsx
// OnboardingScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LiabilityWaiver from '../components/LiabilityWaiver';
import { saveWaiverAcceptance } from '../services/userService';

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Steps in the onboarding process
  const steps = [
    'Welcome',
    'ProfileSetup',
    'Preferences',
    'LiabilityWaiver'
  ];
  
  const handleWaiverAccept = async () => {
    // Save waiver acceptance to user profile
    await saveWaiverAcceptance({
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
    
    // Navigate to main app
    navigation.navigate('Main');
  };
  
  const handleWaiverDecline = () => {
    // Show warning or exit app
    Alert.alert(
      'Waiver Required',
      'You must accept the liability waiver to use AI Sports Edge.',
      [
        { text: 'Review Again', onPress: () => {} },
        { text: 'Exit', onPress: () => BackHandler.exitApp() }
      ]
    );
  };
  
  // Render current step
  const renderStep = () => {
    switch (steps[currentStep]) {
      case 'Welcome':
        return <WelcomeStep onNext={() => setCurrentStep(1)} />;
      case 'ProfileSetup':
        return <ProfileSetupStep onNext={() => setCurrentStep(2)} />;
      case 'Preferences':
        return <PreferencesStep onNext={() => setCurrentStep(3)} />;
      case 'LiabilityWaiver':
        return (
          <LiabilityWaiver
            onAccept={handleWaiverAccept}
            onDecline={handleWaiverDecline}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      {renderStep()}
    </View>
  );
};
```

### Translation Keys

Add the following translation keys to the language files:

```json
{
  "liability": {
    "title": "Liability Waiver",
    "content": "By using AI Sports Edge, you acknowledge and agree to the following...",
    "scroll_to_continue": "Please scroll to the bottom to continue",
    "acknowledgment": "I have read and agree to the terms of the liability waiver",
    "accept": "I Agree",
    "decline": "Decline"
  }
}
```

## Legal Considerations

1. **Consult Legal Counsel**: Have the waiver text reviewed by legal counsel familiar with sports betting regulations
2. **Jurisdiction-Specific Requirements**: Modify the waiver as needed to comply with specific jurisdictional requirements
3. **Record Keeping**: Maintain records of user acceptance for legal compliance
4. **Accessibility**: Ensure the waiver is accessible to users with disabilities

## Testing Requirements

1. **Functional Testing**: Verify that the waiver displays correctly and the continue button is only enabled after scrolling and acknowledgment
2. **User Testing**: Conduct user testing to ensure the waiver is clear and understandable
3. **Accessibility Testing**: Test with screen readers and other accessibility tools
4. **Cross-Platform Testing**: Verify functionality on both iOS and Android

## Conclusion

The liability waiver is a critical component for legal protection and user awareness. By implementing it as described above, AI Sports Edge can help protect itself legally while ensuring users understand the risks associated with sports betting.