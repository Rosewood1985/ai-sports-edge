import { registerRootComponent } from "expo";
import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PersonalizationProvider } from "./contexts/PersonalizationContext";
import { BettingAffiliateProvider } from "./contexts/BettingAffiliateContext";
import { StatusBar, useColorScheme } from "react-native";
import StripeProvider from "./components/StripeProvider";
import OneSignalProvider from "./components/OneSignalProvider";
import NeonLoginScreen from "./screens/NeonLoginScreen";
import NeonOddsScreen from "./screens/NeonOddsScreen";
import RewardsScreen from "./screens/RewardsScreen";
import ReferralLeaderboardScreen from "./screens/ReferralLeaderboardScreen";
import FAQScreen from "./screens/FAQScreen";
import GiftRedemptionScreen from "./screens/GiftRedemptionScreen";
import SubscriptionAnalyticsScreen from "./screens/SubscriptionAnalyticsScreen";
import SportsNewsScreen from "./screens/SportsNewsScreen";
import Formula1Screen from "./screens/Formula1Screen";
import PlayerStatsScreen from "./screens/PlayerStatsScreen";
import AdvancedPlayerStatsScreen from "./screens/AdvancedPlayerStatsScreen";
import NcaaBasketballScreen from "./screens/NcaaBasketballScreen";
import PersonalizationScreen from "./screens/PersonalizationScreen";
import PersonalizedHomeScreen from "./screens/PersonalizedHomeScreen";
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen";
import { colors } from "./styles/theme";

// Define the type for the navigation stack parameters
type RootStackParamList = {
  Login: undefined;
  Odds: undefined;
  Rewards: undefined;
  ReferralLeaderboard: undefined;
  FAQ: undefined;
  GiftRedemption: undefined;
  SubscriptionAnalytics: undefined;
  SportsNews: undefined;
  Formula1: undefined;
  PlayerStats: { gameId: string; gameTitle?: string };
  AdvancedPlayerStats: { gameId: string; gameTitle?: string };
  NcaaBasketball: { gender?: 'mens' | 'womens' };
  Personalization: undefined;
  FavoriteSports: undefined;
  FavoriteTeams: undefined;
  RiskToleranceSettings: undefined;
  OddsFormatSettings: undefined;
  PersonalizedHome: undefined;
  NotificationSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Custom navigation theme
const NeonTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.neon.blue,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.status.error,
  },
};

/**
 * Main App component with neon UI design
 * @returns {JSX.Element} - Rendered component
 */
function App(): JSX.Element {
  return (
    <ThemeProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <PersonalizationProvider>
        <BettingAffiliateProvider>
          <StripeProvider>
            <OneSignalProvider>
              <NavigationContainer theme={NeonTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background.secondary,
                elevation: 0, // Remove shadow on Android
                shadowOpacity: 0, // Remove shadow on iOS
                borderBottomWidth: 1,
                borderBottomColor: colors.neon.blue,
              },
              headerTintColor: colors.neon.blue,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              cardStyle: { backgroundColor: colors.background.primary }
            }}
          >
            <Stack.Screen
              name="Login"
              component={NeonLoginScreen}
              options={{
                title: "AI SPORTS EDGE",
                headerShown: false, // Hide header for login screen
              }}
            />
            <Stack.Screen
              name="PersonalizedHome"
              component={PersonalizedHomeScreen}
              options={{
                title: "AI SPORTS EDGE",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="Odds"
              component={NeonOddsScreen}
              options={{
                title: "LIVE BETTING ODDS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="Rewards"
              component={RewardsScreen}
              options={{
                title: "REWARDS & ACHIEVEMENTS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="ReferralLeaderboard"
              component={ReferralLeaderboardScreen}
              options={{
                title: "REFERRAL LEADERBOARD",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="FAQ"
              component={FAQScreen}
              options={{
                title: "FREQUENTLY ASKED QUESTIONS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="GiftRedemption"
              component={GiftRedemptionScreen}
              options={{
                title: "REDEEM GIFT",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="SubscriptionAnalytics"
              component={SubscriptionAnalyticsScreen}
              options={{
                title: "SUBSCRIPTION ANALYTICS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="SportsNews"
              component={SportsNewsScreen}
              options={{
                title: "AI SPORTS NEWS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="Formula1"
              component={Formula1Screen}
              options={{
                title: "FORMULA 1",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="PlayerStats"
              component={PlayerStatsScreen}
              options={{
                title: "PLAYER STATISTICS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="AdvancedPlayerStats"
              component={AdvancedPlayerStatsScreen}
              options={{
                title: "ADVANCED METRICS",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="NcaaBasketball"
              component={NcaaBasketballScreen}
              options={{
                title: "NCAA BASKETBALL",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="Personalization"
              component={PersonalizationScreen}
              options={{
                title: "PERSONALIZATION",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{
                title: "NOTIFICATION SETTINGS",
                headerBackTitle: "Back"
              }}
            />
          </Stack.Navigator>
              </NavigationContainer>
            </OneSignalProvider>
          </StripeProvider>
        </BettingAffiliateProvider>
      </PersonalizationProvider>
    </ThemeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;