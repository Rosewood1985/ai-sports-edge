import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { useNavigationState } from '../contexts/NavigationStateContext';
import ThemeToggle from '../components/ThemeToggle';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GamesScreen from '../screens/GamesScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import LegalScreen from '../screens/LegalScreen';
import KnowledgeEdgeScreen from '../screens/KnowledgeEdgeScreen';

// Import navigators
import OnboardingNavigator from './OnboardingNavigator';
import BettingNavigator from './BettingNavigator';

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Onboarding: undefined;
  GameDetails: { gameId: string };
  Subscription: undefined;
  PurchaseHistory: undefined;
  Settings: undefined;
  LanguageSettings: undefined;
  Legal: { type: 'privacy-policy' | 'terms-of-service' };
  KnowledgeEdge: undefined;
  ArticleDetail: { articleId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Games: undefined;
  BetSlip: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator
const MainTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Games') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'BetSlip') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          borderTopColor: colors.border,
        },
        headerShown: true,
        headerRight: () => (
          <View style={{ marginRight: 15 }}>
            <ThemeToggle />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen
        name="BetSlip"
        component={BettingNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          tabBarLabel: 'Bet Slip',
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root stack navigator
const AppNavigator = () => {
  // Use the navigation state context to determine the initial route
  const { initialRoute, isLoading, error } = useNavigationState();

  // Add logging for navigation initialization
  console.log(`AppNavigator: Initializing navigation with route "${initialRoute}"`);

  // Show loading indicator while determining the initial route
  if (isLoading) {
    console.log('AppNavigator: Still loading navigation state');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // Show error message if there was an error determining the initial route
  if (error) {
    console.error('AppNavigator: Error in navigation state:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', marginBottom: 10 }}>Navigation Error</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>{error.message}</Text>
        <Button title="Retry" onPress={() => window.location.reload()} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="GameDetails" component={GameDetailsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="KnowledgeEdge" component={KnowledgeEdgeScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
