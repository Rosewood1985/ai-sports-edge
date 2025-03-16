import { registerRootComponent } from "expo";
import React from "react";
import AppNavigator from "./.expo/navigation/AppNavigator";
import StripeProvider from "./components/StripeProvider";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { StatusBar } from "react-native";

/**
 * App content component with theme context
 * @returns {JSX.Element} - Rendered component
 */
const AppContent = (): JSX.Element => {
  const { isDark } = useTheme();
  
  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <StripeProvider>
        <AppNavigator />
      </StripeProvider>
    </>
  );
};

/**
 * Main App component
 * @returns {JSX.Element} - Rendered component
 */
function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Register App
registerRootComponent(App);

export default App;