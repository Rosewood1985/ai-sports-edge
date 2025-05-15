import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import ProfileSetupScreen from '../screens/Onboarding/ProfileSetupScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
import GDPRConsentScreen from '../screens/Onboarding/GDPRConsentScreen';
import CookieConsentScreen from '../screens/Onboarding/CookieConsentScreen';
import AgeVerificationScreen from '../screens/Onboarding/AgeVerificationScreen';
import SelfExclusionScreen from '../screens/Onboarding/SelfExclusionScreen';
import ResponsibleGamblingScreen from '../screens/Onboarding/ResponsibleGamblingScreen';
import LiabilityWaiverScreen from '../screens/Onboarding/LiabilityWaiverScreen';

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