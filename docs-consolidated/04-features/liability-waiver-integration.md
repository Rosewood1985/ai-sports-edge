# Liability Waiver Integration Plan

## Overview

This document outlines the integration of the liability waiver component into the AI Sports Edge app architecture. The liability waiver is a critical legal requirement that must be presented to users at the end of the onboarding process, requiring explicit acknowledgment before they can proceed to use the app.

## Integration with App Architecture

Based on the provided app architecture, here's how the liability waiver should be integrated:

```
ai-sports-edge/
├── src/
│   ├── components/
│   │   └── LiabilityWaiver.tsx       // New component
│   ├── screens/
│   │   └── Onboarding/
│   │       ├── WelcomeScreen.js
│   │       ├── ProfileSetupScreen.js
│   │       ├── PreferencesScreen.js
│   │       └── LiabilityWaiverScreen.js  // New screen
│   ├── context/
│   │   └── OnboardingContext.js      // Track onboarding progress
│   ├── services/
│   │   └── userService.js            // Store waiver acceptance
│   └── utils/
│       └── waiverUtils.js            // Waiver-related utilities
```

## Component Implementation

### 1. LiabilityWaiver Component

Create a reusable component in `src/components/LiabilityWaiver.tsx` as detailed in the [liability waiver documentation](./liability-waiver.md).

### 2. LiabilityWaiverScreen

Create a dedicated screen in `src/screens/Onboarding/LiabilityWaiverScreen.js`:

```jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LiabilityWaiver from '../../components/LiabilityWaiver';
import { saveWaiverAcceptance } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

const LiabilityWaiverScreen = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();
  
  const handleAccept = async () => {
    // Record waiver acceptance
    const waiverData = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
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
  };
  
  const handleDecline = () => {
    // Show warning dialog
    Alert.alert(
      'Waiver Required',
      'You must accept the liability waiver to use AI Sports Edge.',
      [
        { text: 'Review Again', onPress: () => {} },
        { text: 'Exit', onPress: () => BackHandler.exitApp() }
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

## Service Implementation

### User Service

Update `src/services/userService.js` to include waiver-related functions:

```javascript
import firebase from '../firebase';
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

// Get the version of the waiver the user accepted
export const getAcceptedWaiverVersion = async (userId) => {
  try {
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    return userData?.waiverAcceptance?.version || null;
  } catch (error) {
    console.error('Error getting waiver version:', error);
    return null;
  }
};
```

## Navigation Integration

### Update Navigation Flow

Modify `src/navigation/AuthNavigator.js` to include the liability waiver screen:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
import LiabilityWaiverScreen from '../screens/Onboarding/LiabilityWaiverScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="LiabilityWaiver" component={LiabilityWaiverScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
```

## Context Integration

### Onboarding Context

Create or update `src/context/OnboardingContext.js` to track onboarding progress:

```javascript
import React, { createContext, useState, useContext } from 'react';

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState({
    welcomeCompleted: false,
    profileCompleted: false,
    preferencesCompleted: false,
    waiverAccepted: false,
    currentStep: 'welcome'
  });
  
  const updateOnboardingState = (updates) => {
    setOnboardingState(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  const markWaiverAccepted = () => {
    updateOnboardingState({
      waiverAccepted: true,
      onboardingCompleted: true
    });
  };
  
  return (
    <OnboardingContext.Provider
      value={{
        onboardingState,
        updateOnboardingState,
        markWaiverAccepted
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
```

## Translation Integration

### Add Translation Keys

Update translation files in `src/translations/` to include waiver-related text:

**English (en.json):**
```json
{
  "liability": {
    "title": "Liability Waiver",
    "content": "By using AI Sports Edge, you acknowledge and agree to the following:\n\n## Betting Advice Disclaimer\n\nThe predictions, odds, and betting recommendations provided by AI Sports Edge are for informational and entertainment purposes only. While we use advanced algorithms and data analysis to generate these recommendations, we cannot guarantee their accuracy or success.\n\n## No Guarantee of Winnings\n\nSports betting involves risk, and there is no guarantee of winnings. AI Sports Edge does not guarantee that you will make money from following our recommendations. You should never bet more than you can afford to lose.\n\n## User Responsibility\n\nYou are solely responsible for your betting decisions and any resulting financial losses. AI Sports Edge, its owners, employees, and affiliates will not be liable for any losses incurred as a result of following our recommendations or using our services.\n\n## Legal Compliance\n\nYou are responsible for ensuring that your use of AI Sports Edge complies with all applicable laws and regulations in your jurisdiction. Sports betting may be illegal in some jurisdictions, and we do not encourage illegal gambling.\n\n## Responsible Gambling\n\nAI Sports Edge promotes responsible gambling. If you believe you may have a gambling problem, we encourage you to seek help from a professional organization such as the National Council on Problem Gambling.\n\n## Acknowledgment\n\nBy clicking \"I Agree\" below, you acknowledge that you have read, understood, and agree to this liability waiver. If you do not agree, you should not use AI Sports Edge.",
    "scroll_to_continue": "Please scroll to the bottom to continue",
    "acknowledgment": "I have read and agree to the terms of the liability waiver",
    "accept": "I Agree",
    "decline": "Decline",
    "required_alert_title": "Waiver Required",
    "required_alert_message": "You must accept the liability waiver to use AI Sports Edge.",
    "review_again": "Review Again",
    "exit": "Exit"
  }
}
```

**Spanish (es.json):**
```json
{
  "liability": {
    "title": "Exención de Responsabilidad",
    "content": "Al usar AI Sports Edge, reconoces y aceptas lo siguiente:\n\n## Descargo de Responsabilidad sobre Consejos de Apuestas\n\nLas predicciones, cuotas y recomendaciones de apuestas proporcionadas por AI Sports Edge son solo para fines informativos y de entretenimiento. Aunque utilizamos algoritmos avanzados y análisis de datos para generar estas recomendaciones, no podemos garantizar su precisión o éxito.\n\n## Sin Garantía de Ganancias\n\nLas apuestas deportivas implican riesgo, y no hay garantía de ganancias. AI Sports Edge no garantiza que ganarás dinero siguiendo nuestras recomendaciones. Nunca debes apostar más de lo que puedes permitirte perder.\n\n## Responsabilidad del Usuario\n\nEres el único responsable de tus decisiones de apuestas y de cualquier pérdida financiera resultante. AI Sports Edge, sus propietarios, empleados y afiliados no serán responsables de ninguna pérdida incurrida como resultado de seguir nuestras recomendaciones o usar nuestros servicios.\n\n## Cumplimiento Legal\n\nEres responsable de asegurarte de que tu uso de AI Sports Edge cumple con todas las leyes y regulaciones aplicables en tu jurisdicción. Las apuestas deportivas pueden ser ilegales en algunas jurisdicciones, y no fomentamos el juego ilegal.\n\n## Juego Responsable\n\nAI Sports Edge promueve el juego responsable. Si crees que puedes tener un problema con el juego, te animamos a buscar ayuda de una organización profesional.\n\n## Reconocimiento\n\nAl hacer clic en \"Acepto\" a continuación, reconoces que has leído, entendido y aceptas esta exención de responsabilidad. Si no estás de acuerdo, no debes usar AI Sports Edge.",
    "scroll_to_continue": "Por favor, desplázate hasta el final para continuar",
    "acknowledgment": "He leído y acepto los términos de la exención de responsabilidad",
    "accept": "Acepto",
    "decline": "Rechazar",
    "required_alert_title": "Exención Requerida",
    "required_alert_message": "Debes aceptar la exención de responsabilidad para usar AI Sports Edge.",
    "review_again": "Revisar de Nuevo",
    "exit": "Salir"
  }
}
```

## Testing Strategy

### Unit Tests

Create unit tests for the liability waiver component in `__tests__/components/LiabilityWaiver.test.js`:

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LiabilityWaiver from '../../src/components/LiabilityWaiver';

describe('LiabilityWaiver', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly', () => {
    const { getByText } = render(
      <LiabilityWaiver 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    
    expect(getByText('Liability Waiver')).toBeTruthy();
    expect(getByText('Please scroll to the bottom to continue')).toBeTruthy();
  });
  
  it('disables accept button until scrolled and acknowledged', () => {
    const { getByText } = render(
      <LiabilityWaiver 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    
    const acceptButton = getByText('I Agree');
    fireEvent.press(acceptButton);
    
    expect(mockOnAccept).not.toHaveBeenCalled();
  });
  
  it('enables accept button after scrolling and acknowledging', () => {
    const { getByText } = render(
      <LiabilityWaiver 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    
    // Simulate scrolling to bottom
    // This is a simplified example - actual implementation would be more complex
    const scrollView = getByTestId('waiver-scroll-view');
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 1000 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 100 }
      }
    });
    
    // Toggle acknowledgment
    const checkbox = getByTestId('waiver-checkbox');
    fireEvent.press(checkbox);
    
    // Press accept button
    const acceptButton = getByText('I Agree');
    fireEvent.press(acceptButton);
    
    expect(mockOnAccept).toHaveBeenCalled();
  });
  
  it('calls onDecline when decline button is pressed', () => {
    const { getByText } = render(
      <LiabilityWaiver 
        onAccept={mockOnAccept} 
        onDecline={mockOnDecline} 
      />
    );
    
    const declineButton = getByText('Decline');
    fireEvent.press(declineButton);
    
    expect(mockOnDecline).toHaveBeenCalled();
  });
});
```

### Integration Tests

Create integration tests in `__tests__/screens/LiabilityWaiverScreen.test.js`:

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LiabilityWaiverScreen from '../../src/screens/Onboarding/LiabilityWaiverScreen';
import { saveWaiverAcceptance } from '../../src/services/userService';
import { useAuth } from '../../src/hooks/useAuth';

// Mock dependencies
jest.mock('../../src/services/userService');
jest.mock('../../src/hooks/useAuth');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: jest.fn()
  })
}));

describe('LiabilityWaiverScreen', () => {
  beforeEach(() => {
    // Mock implementation
    useAuth.mockReturnValue({
      user: { uid: 'test-user-id' },
      updateUserProfile: jest.fn().mockResolvedValue(true)
    });
    
    saveWaiverAcceptance.mockResolvedValue(true);
  });
  
  it('saves waiver acceptance and navigates on accept', async () => {
    const { getByText, getByTestId } = render(<LiabilityWaiverScreen />);
    
    // Simulate scrolling and acknowledging
    const scrollView = getByTestId('waiver-scroll-view');
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 1000 },
        contentSize: { height: 1000 },
        layoutMeasurement: { height: 100 }
      }
    });
    
    const checkbox = getByTestId('waiver-checkbox');
    fireEvent.press(checkbox);
    
    // Accept the waiver
    const acceptButton = getByText('I Agree');
    fireEvent.press(acceptButton);
    
    await waitFor(() => {
      expect(useAuth().updateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          waiverAccepted: expect.objectContaining({
            accepted: true,
            version: '1.0'
          })
        })
      );
      
      expect(saveWaiverAcceptance).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          accepted: true,
          version: '1.0'
        })
      );
    });
  });
});
```

## Deployment Considerations

### Version Control

The liability waiver should be versioned to track changes over time:

1. Store the current version in a configuration file
2. Update the version when the waiver text changes
3. Consider prompting existing users to accept new versions of the waiver when significant changes are made

### Analytics

Track waiver-related events:

1. Waiver viewed
2. Waiver accepted
3. Waiver declined
4. Time spent on waiver screen

### Legal Review

Before deploying:

1. Have legal counsel review the final waiver text
2. Ensure compliance with regulations in all target jurisdictions
3. Document the review process for audit purposes

## Conclusion

By integrating the liability waiver as outlined in this document, AI Sports Edge will have a robust legal protection mechanism that is seamlessly integrated into the user onboarding flow. This implementation follows best practices for both legal compliance and user experience, ensuring that users are properly informed about the risks while maintaining a smooth onboarding process.