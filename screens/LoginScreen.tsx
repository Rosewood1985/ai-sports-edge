import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { StackNavigationProp } from "@react-navigation/stack";
import MobileAppDownload from "../components/MobileAppDownload";
import { appDownloadService } from "../services/appDownloadService";
import { useI18n } from "../../atomic/organisms/i18n/I18nContext";
import ThemeToggle from "../components/ThemeToggle";

// Define the navigation prop type
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props): JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showDownloadPrompt, setShowDownloadPrompt] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  
  // Get translations
  const { t } = useI18n();
  
  // Get app store URLs
  const { appStoreUrl, playStoreUrl, webAppUrl } = appDownloadService.getAppStoreUrls();
  
  // Check if we should show the download prompt after registration
  useEffect(() => {
    if (isNewUser && auth.currentUser) {
      const checkDownloadPrompt = async () => {
        // Fix: Remove non-null assertion and add proper null check
        const userId = auth.currentUser?.uid;
        if (userId) {
          const shouldShow = await appDownloadService.shouldShowDownloadPrompt(userId);
          setShowDownloadPrompt(shouldShow);
        }
      };
      
      checkDownloadPrompt();
    }
  }, [isNewUser]);
  
  // Handle closing the download prompt
  const handleCloseDownloadPrompt = async () => {
    // Fix: Add proper null check and error handling
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        await appDownloadService.markDownloadPromptAsShown(userId);
      } catch (error) {
        console.error('Error marking download prompt as shown:', error);
      }
    }
    setShowDownloadPrompt(false);
  };

  const handleSignUp = async (): Promise<void> => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("login.errors.emailRequired"));
      return;
    }
    
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("login.errors.passwordRequired"));
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("common.error"), t("login.errors.invalidEmail"));
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert(t("login.features.signUp"), t("login.alerts.accountCreated"));
      setIsNewUser(true);
      
      // We'll navigate after the user has seen the download prompt
      // or immediately if the prompt isn't shown
      const userId = auth.currentUser?.uid;
      if (userId) {
        if (!(await appDownloadService.shouldShowDownloadPrompt(userId))) {
          navigation.replace("Main");
        }
      } else {
        // If for some reason we don't have a user ID, navigate anyway
        navigation.replace("Main");
      }
    } catch (error: any) {
      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t("login.errors.signUpFailed");
      
      // Only show specific error messages for known error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t("login.errors.emailInUse");
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t("login.errors.weakPassword");
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t("login.errors.invalidEmail");
      }
      
      Alert.alert(t("common.error"), errorMessage);
      console.error('Sign up error:', error);
    }
  };

  const handleLogin = async (): Promise<void> => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("login.errors.emailRequired"));
      return;
    }
    
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("login.errors.passwordRequired"));
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert(t("common.success"), t("login.alerts.loggedIn"));
      navigation.replace("Main");
    } catch (error: any) {
      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t("login.errors.loginFailed");
      
      // Only show specific error messages for known error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t("login.errors.invalidCredentials");
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t("login.errors.invalidEmail");
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = t("login.errors.accountDisabled");
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t("login.errors.tooManyAttempts");
      }
      
      Alert.alert(t("common.error"), errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Show download prompt if needed */}
      {showDownloadPrompt && (
        <MobileAppDownload
          onClose={() => {
            handleCloseDownloadPrompt();
            navigation.replace("Main");
          }}
          appStoreUrl={appStoreUrl}
          playStoreUrl={playStoreUrl}
          webAppUrl={webAppUrl}
        />
      )}
      
      <Text style={styles.title}>{t("login.title")}</Text>
      <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("login.email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={t("login.password")}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title={t("login.signIn")} onPress={handleLogin} />
      <Button title={t("login.signUp")} onPress={handleSignUp} />
      <Text style={styles.forgotPassword}>{t("login.forgotPassword")}</Text>
      <Text style={styles.dontHaveAccount}>{t("login.dontHaveAccount")} <Text style={styles.signUpLink}>{t("login.signUp")}</Text></Text>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "80%",
    padding: 10,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 5,
    marginBottom: 10,
  },
  forgotPassword: {
    color: "#FFD700",
    marginTop: 15,
    fontSize: 14,
  },
  dontHaveAccount: {
    color: "#CCCCCC",
    marginTop: 20,
    fontSize: 14,
  },
  signUpLink: {
    color: "#FFD700",
    fontWeight: "bold",
  }
});