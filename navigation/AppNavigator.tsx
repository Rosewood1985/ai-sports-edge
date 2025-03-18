import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GiftSubscriptionScreen from '../screens/GiftSubscriptionScreen';
import RedeemGiftScreen from '../screens/RedeemGiftScreen';
import PaymentScreen from '../screens/PaymentScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionManagementScreen from '../screens/SubscriptionManagementScreen';
import LocationNotificationSettings from '../screens/LocationNotificationSettings';

// Import components
import ProtectedRoute from '../components/ProtectedRoute';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          // Use type assertion to fix TypeScript error
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4080ff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Auth screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        
        {/* Main app screens */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        
        {/* Subscription screens */}
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ title: 'Subscription Plans' }}
        />
        <Stack.Screen
          name="SubscriptionManagement"
          component={SubscriptionManagementScreen}
          options={{ title: 'Manage Subscription' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{ title: 'Payment' }}
        />
        
        {/* Gift subscription screens */}
        <Stack.Screen
          name="GiftSubscription"
          component={GiftSubscriptionScreen}
          options={{ title: 'Gift a Subscription' }}
        />
        <Stack.Screen
          name="RedeemGift"
          component={RedeemGiftScreen}
          options={{ title: 'Redeem Gift' }}
        />
        
        {/* Settings screens */}
        <Stack.Screen
          name="LocationNotificationSettings"
          component={LocationNotificationSettings}
          options={{ title: 'Location Notifications' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;