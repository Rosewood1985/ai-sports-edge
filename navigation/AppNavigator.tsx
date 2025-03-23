import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import { HomeScreen, SearchScreen, ProfileScreen, SettingsScreen } from '../screens';
import ParlayOddsScreen from '../screens/ParlayOddsScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import LocalTeamOddsScreen from '../screens/LocalTeamOddsScreen';
import NearbyVenuesScreen from '../screens/NearbyVenuesScreen';
import BettingAnalyticsScreen from '../screens/BettingAnalyticsScreen';
import OddsComparisonScreen from '../screens/OddsComparisonScreen';
import FraudDetectionDashboardScreen from '../screens/FraudDetectionDashboardScreen';
import FraudAlertDetailsScreen from '../screens/FraudAlertDetailsScreen';
import EnhancedAnalyticsDashboardScreen from '../screens/EnhancedAnalyticsDashboardScreen';
import BettingSlipImportScreen from '../screens/BettingSlipImportScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Location stack navigator
const LocationStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LocationHome"
      component={LocalTeamOddsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="NearbyVenues"
      component={NearbyVenuesScreen}
      options={{
        title: 'Nearby Venues',
        headerTintColor: '#007bff',
      }}
    />
  </Stack.Navigator>
);

// Stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ParlayOdds"
      component={ParlayOddsScreen}
      options={{
        title: 'Parlay Builder',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="AnalyticsDashboard"
      component={AnalyticsDashboardScreen}
      options={{
        title: 'Analytics Dashboard',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="LocalTeamOdds"
      component={LocalTeamOddsScreen}
      options={{
        title: 'Local Team Odds',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="NearbyVenues"
      component={NearbyVenuesScreen}
      options={{
        title: 'Nearby Venues',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="BettingAnalytics"
      component={BettingAnalyticsScreen}
      options={{
        title: 'Betting Analytics',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="OddsComparison"
      component={OddsComparisonScreen}
      options={{
        title: 'Odds Comparison',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="FraudDetectionDashboard"
      component={FraudDetectionDashboardScreen}
      options={{
        title: 'Fraud Detection',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="FraudAlertDetails"
      component={FraudAlertDetailsScreen}
      options={{
        title: 'Alert Details',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="EnhancedAnalyticsDashboard"
      component={EnhancedAnalyticsDashboardScreen}
      options={{
        title: 'Enhanced Analytics',
        headerTintColor: '#007bff',
      }}
    />
    <Stack.Screen
      name="BettingSlipImport"
      component={BettingSlipImportScreen}
      options={{
        title: 'Betting Slip Import',
        headerTintColor: '#007bff',
      }}
    />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Search" 
      component={SearchScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Main tab navigator
const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'LocationTab') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="LocationTab"
        component={LocationStack}
        options={{ tabBarLabel: 'Nearby' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;