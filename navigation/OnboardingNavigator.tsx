import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

// Import screens
import AgeVerificationScreen from '../screens/Onboarding/AgeVerificationScreen';
import CookieConsentScreen from '../screens/Onboarding/CookieConsentScreen';
import GDPRConsentScreen from '../screens/Onboarding/GDPRConsentScreen';
import LiabilityWaiverScreen from '../screens/Onboarding/LiabilityWaiverScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import ResponsibleGamblingScreen from '../screens/Onboarding/ResponsibleGamblingScreen';
import SelfExclusionScreen from '../screens/Onboarding/SelfExclusionScreen';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';

// Define navigation types
export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  Preferences: undefined;
  GDPRConsent: undefined;
  CookieConsent: undefined;
  AgeVerification: undefined;
  SelfExclusion: undefined;
  ResponsibleGambling: undefined;
  LiabilityWaiver: undefined;
  Legal: { type: 'privacy-policy' | 'terms-of-service' };
};

const Stack = createStackNavigator<OnboardingStackParamList>();

/**
 * Navigator for the onboarding flow
 * Includes all screens required for user onboarding, including verification screens
 */
const OnboardingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="GDPRConsent" component={GDPRConsentScreen} />
      <Stack.Screen name="CookieConsent" component={CookieConsentScreen} />
      <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
      <Stack.Screen name="SelfExclusion" component={SelfExclusionScreen} />
      <Stack.Screen name="ResponsibleGambling" component={ResponsibleGamblingScreen} />
      <Stack.Screen name="LiabilityWaiver" component={LiabilityWaiverScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
