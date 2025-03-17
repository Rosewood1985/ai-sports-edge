import { registerRootComponent } from "expo";
import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StatusBar, useColorScheme } from "react-native";
import StripeProvider from "./components/StripeProvider";
import NeonLoginScreen from "./screens/NeonLoginScreen";
import NeonOddsScreen from "./screens/NeonOddsScreen";
import RewardsScreen from "./screens/RewardsScreen";
import ReferralLeaderboardScreen from "./screens/ReferralLeaderboardScreen";
import FAQScreen from "./screens/FAQScreen";
import GiftRedemptionScreen from "./screens/GiftRedemptionScreen";
import { colors } from "./styles/theme";

const Stack = createStackNavigator();

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
      <StripeProvider>
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
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </ThemeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;