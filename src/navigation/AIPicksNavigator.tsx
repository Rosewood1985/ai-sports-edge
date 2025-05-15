import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../i18n/mock';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import AIPickOfDayScreen from '../screens/AIPickOfDayScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

// Define navigator types
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Stack navigator for AI Pick of Day screen
 */
const AIPickOfDayStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="AIPickOfDay"
        component={AIPickOfDayScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

/**
 * Stack navigator for Leaderboard screen
 */
const LeaderboardStack = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

/**
 * Bottom tab navigator for AI Picks section
 */
const AIPicksNavigator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AIPickOfDayTab"
        component={AIPickOfDayStack}
        options={{
          tabBarLabel: t('Today\'s Pick'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="sports" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LeaderboardTab"
        component={LeaderboardStack}
        options={{
          tabBarLabel: t('Leaderboard'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="trophy" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AIPicksNavigator;