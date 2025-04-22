/**
 * Login Screen
 * 
 * A page component for user authentication using the atomic architecture.
 */

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Import atomic components
import { MainLayout } from "../templates";
import { useTheme } from "../molecules/themeContext";
import { firebaseService } from "../organisms";
import { monitoringService } from "../organisms";
import { appDownloadService } from "../organisms";
import { useI18n } from "../molecules/i18nContext";

/**
 * Login Screen component
 * @returns {React.ReactNode} Rendered component
 */
const LoginScreen = () => {
  // Get theme from context
  const { colors } = useTheme();
  
  // Navigation
  const navigation = useNavigation();
  
  // Get translations
  const { t } = useI18n();
  
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get app store URLs
  const { appStoreUrl, playStoreUrl, webAppUrl } = appDownloadService.getAppStoreUrls();
  
  // Check if we should show the download prompt after registration
  useEffect(() => {
    if (isNewUser && firebaseService.auth.getCurrentUser()) {
      const checkDownloadPrompt = async () => {
        const userId = firebaseService.auth.getCurrentUser()?.uid;
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
    const userId = firebaseService.auth.getCurrentUser()?.uid;
    if (userId) {
      try {
        await appDownloadService.markDownloadPromptAsShown(userId);
      } catch (error) {
        monitoringService.error.captureException(error);
      }
    }
    setShowDownloadPrompt(false);
    navigation.replace("Main");
  };

  /**
   * Handle sign up form submission
   */
  const handleSignUp = async () => {
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
      setLoading(true);
      await firebaseService.auth.createUserWithEmailAndPassword(email, password);
      Alert.alert(t("login.features.signUp"), t("login.alerts.accountCreated"));
      setIsNewUser(true);
      
      // We'll navigate after the user has seen the download prompt
      // or immediately if the prompt isn't shown
      const userId = firebaseService.auth.getCurrentUser()?.uid;
      if (userId) {
        if (!(await appDownloadService.shouldShowDownloadPrompt(userId))) {
          navigation.replace("Main");
        }
      } else {
        // If for some reason we don't have a user ID, navigate anyway
        navigation.replace("Main");
      }
    } catch (error) {
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
      monitoringService.error.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async () => {
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
      setLoading(true);
      await firebaseService.auth.signInWithEmailAndPassword(email, password);
      Alert.alert(t("common.success"), t("login.alerts.loggedIn"));
      navigation.replace("Main");
    } catch (error) {
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
      monitoringService.error.captureException(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Content component
  const Content = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Show download prompt if needed */}
      {showDownloadPrompt && (
        <View style={styles.downloadPrompt}>
          <Text style={[styles.downloadTitle, { color: colors.text }]}>
            {t("download.title")}
          </Text>
          <Text style={[styles.downloadSubtitle, { color: colors.textSecondary }]}>
            {t("download.subtitle")}
          </Text>
          <View style={styles.downloadButtons}>
            <TouchableOpacity 
              style={[styles.storeButton, { backgroundColor: colors.primary }]}
              onPress={() => appDownloadService.openAppStore(appStoreUrl)}
            >
              <Text style={[styles.storeButtonText, { color: colors.onPrimary }]}>
                {t("download.appStore")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.storeButton, { backgroundColor: colors.primary }]}
              onPress={() => appDownloadService.openPlayStore(playStoreUrl)}
            >
              <Text style={[styles.storeButtonText, { color: colors.onPrimary }]}>
                {t("download.playStore")}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseDownloadPrompt}
          >
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>
              {t("common.close")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={[styles.title, { color: colors.primary }]}>
        {t("login.title")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("login.subtitle")}
      </Text>
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border
        }]}
        placeholder={t("login.email")}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border
        }]}
        placeholder={t("login.password")}
        placeholderTextColor={colors.textSecondary}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading ? t("common.loading") : t("login.signIn")}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.secondary }]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.onSecondary }]}>
          {loading ? t("common.loading") : t("login.signUp")}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={[styles.forgotPassword, { color: colors.primary }]}>
          {t("login.forgotPassword")}
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.dontHaveAccount, { color: colors.textSecondary }]}>
        {t("login.dontHaveAccount")} 
        <Text 
          style={[styles.signUpLink, { color: colors.primary }]}
          onPress={handleSignUp}
        >
          {t("login.signUp")}
        </Text>
      </Text>
    </View>
  );
  
  // Render page using MainLayout template
  return (
    <MainLayout
      scrollable={true}
      safeArea={true}
    >
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "80%",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    width: "80%",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 15,
    fontSize: 14,
  },
  dontHaveAccount: {
    marginTop: 20,
    fontSize: 14,
  },
  signUpLink: {
    fontWeight: "bold",
  },
  downloadPrompt: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 10,
    padding: 20,
  },
  downloadTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  downloadSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  downloadButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  storeButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "45%",
  },
  storeButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;