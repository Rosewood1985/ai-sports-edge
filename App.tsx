import { registerRootComponent } from "expo";
import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PersonalizationProvider } from "./contexts/PersonalizationContext";
import { BettingAffiliateProvider } from "./contexts/BettingAffiliateContext";
import { I18nProvider, useI18n } from "./contexts/I18nContext";
import { StatusBar, useColorScheme, View, Text } from "react-native";
import StripeProvider from "./components/StripeProvider";
import OneSignalProvider from "./components/OneSignalProvider";
import { LanguageRedirect } from "./components/LanguageRedirect";
import LanguageSelector from "./components/LanguageSelector";
import LanguageChangeListener from "./components/LanguageChangeListener";
import { ToastContainer } from "./components/Toast";
import NeonLoginScreen from "./screens/NeonLoginScreen";
import NeonOddsScreen from "./screens/NeonOddsScreen";
import RewardsScreen from "./screens/RewardsScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import FeatureTourScreen from "./screens/FeatureTourScreen";
import { isOnboardingCompleted } from "./services/onboardingService";
import featureTourService from "./services/featureTourService";
import ReferralLeaderboardScreen from "./screens/ReferralLeaderboardScreen";
import FAQScreen from "./screens/FAQScreen";
import GiftRedemptionScreen from "./screens/GiftRedemptionScreen";
import SubscriptionAnalyticsScreen from "./screens/SubscriptionAnalyticsScreen";
import SportsNewsScreen from "./screens/SportsNewsScreen";
import Formula1Screen from "./screens/Formula1Screen";
import PlayerStatsScreen from "./screens/PlayerStatsScreen";
import AdvancedPlayerStatsScreen from "./screens/AdvancedPlayerStatsScreen";
import PlayerHistoricalTrendsScreen from "./screens/PlayerHistoricalTrendsScreen";
import NcaaBasketballScreen from "./screens/NcaaBasketballScreen";
import PersonalizationScreen from "./screens/PersonalizationScreen";
import PersonalizedHomeScreen from "./screens/PersonalizedHomeScreen";
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen";
import { colors } from "./styles/theme";

// Define the type for the navigation stack parameters
type RootStackParamList = {
  Onboarding: undefined;
  FeatureTour: undefined;
  Main: undefined;
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
  PlayerHistoricalTrends: { gameId: string; playerId: string; playerName?: string };
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

// Language selector component for the header
const HeaderLanguageSelector = () => {
  return (
    <LanguageSelector compact={true} style={{ marginRight: 10 }} />
  );
};

// Main navigation component with i18n support
const AppNavigator = () => {
  const { t, language, setLanguage } = useI18n();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingCompleted();
        setOnboardingComplete(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to showing onboarding if there's an error
        setOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkOnboarding();
  }, []);
  
  // Show loading screen while checking onboarding status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <Text style={{ color: colors.text.primary }}>{t('common.loading')}</Text>
      </View>
    );
  }
  
  return (
    <>
      <LanguageRedirect currentLanguage={language} setLanguage={setLanguage} />
      <LanguageChangeListener />
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <ToastContainer />
      <NavigationContainer theme={NeonTheme}>
        <Stack.Navigator
          initialRouteName={onboardingComplete ? "Login" : "Onboarding"}
          screenOptions={({ navigation }) => ({
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
            cardStyle: { backgroundColor: colors.background.primary },
            // Add language selector to header right
            headerRight: () => <HeaderLanguageSelector />,
          })}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="FeatureTour"
            component={FeatureTourScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Login"
            component={NeonLoginScreen}
            options={{
              title: t("screens.login.title"),
              headerShown: false, // Hide header for login screen
            }}
          />
          <Stack.Screen
            name="PersonalizedHome"
            component={PersonalizedHomeScreen}
            options={{
              title: t("screens.home.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="Odds"
            component={NeonOddsScreen}
            options={{
              title: t("screens.odds.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="Rewards"
            component={RewardsScreen}
            options={{
              title: t("screens.rewards.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="ReferralLeaderboard"
            component={ReferralLeaderboardScreen}
            options={{
              title: t("screens.referralLeaderboard.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="FAQ"
            component={FAQScreen}
            options={{
              title: t("screens.faq.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="GiftRedemption"
            component={GiftRedemptionScreen}
            options={{
              title: t("screens.giftRedemption.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="SubscriptionAnalytics"
            component={SubscriptionAnalyticsScreen}
            options={{
              title: t("screens.subscriptionAnalytics.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="SportsNews"
            component={SportsNewsScreen}
            options={{
              title: t("screens.sportsNews.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="Formula1"
            component={Formula1Screen}
            options={{
              title: t("screens.formula1.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="PlayerStats"
            component={PlayerStatsScreen}
            options={{
              title: t("screens.playerStats.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="AdvancedPlayerStats"
            component={AdvancedPlayerStatsScreen}
            options={{
              title: t("screens.advancedPlayerStats.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="PlayerHistoricalTrends"
            component={PlayerHistoricalTrendsScreen}
            options={{
              title: t("screens.playerHistoricalTrends.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="NcaaBasketball"
            component={NcaaBasketballScreen}
            options={{
              title: t("screens.ncaaBasketball.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="Personalization"
            component={PersonalizationScreen}
            options={{
              title: t("screens.personalization.title"),
              headerBackTitle: t("common.back")
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              title: t("screens.notificationSettings.title"),
              headerBackTitle: t("common.back")
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

/**
 * Main App component with neon UI design and internationalization support
 * @returns {JSX.Element} - Rendered component
 */
function App(): JSX.Element {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PersonalizationProvider>
          <BettingAffiliateProvider>
            <StripeProvider>
              <OneSignalProvider>
                <AppNavigator />
              </OneSignalProvider>
            </StripeProvider>
          </BettingAffiliateProvider>
        </PersonalizationProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;