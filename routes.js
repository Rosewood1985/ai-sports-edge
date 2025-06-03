import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

// Import atomic architecture pages
import { HomePage, SignupPage, ForgotPasswordPage, LoginScreen } from './atomic/pages';

// Import other screens
import { ProfileScreen, BettingScreen, SettingsScreen } from './screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupPage} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
    </Stack.Navigator>
  );
}

// Main tab navigator
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Betting" component={BettingScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Root navigator
export default function RootNavigator() {
  const isLoggedIn = false; // Replace with actual auth logic

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
