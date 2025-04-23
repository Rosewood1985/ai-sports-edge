// External imports
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';



// Internal imports
import { MainLayout } from '../templates';
import { appDownloadService } from '../organisms';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';
import { useTheme } from '../molecules/themeContext';








































                {t('download.appStore')}
                {t('download.playStore')}
              </Text>
              </Text>
              <Text style={[styles.storeButtonText, { color: colors.onPrimary }]}>
              <Text style={[styles.storeButtonText, { color: colors.onPrimary }]}>
              onPress={() => appDownloadService.openAppStore(appStoreUrl)}
              onPress={() => appDownloadService.openPlayStore(playStoreUrl)}
              style={[styles.storeButton, { backgroundColor: colors.primary }]}
              style={[styles.storeButton, { backgroundColor: colors.primary }]}
              {t('common.close')}
            </Text>
            </TouchableOpacity>
            </TouchableOpacity>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>
            <TouchableOpacity
            <TouchableOpacity
            >
            >
            backgroundColor: colors.surface,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderColor: colors.border,
            color: colors.text,
            color: colors.text,
            {t('download.subtitle')}
          </Text>
          </TouchableOpacity>
          </View>
          <Text style={[styles.downloadSubtitle, { color: colors.textSecondary }]}>
          <Text style={[styles.downloadTitle, { color: colors.text }]}>{t('download.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseDownloadPrompt}>
          <View style={styles.downloadButtons}>
          const shouldShow = await appDownloadService.shouldShowDownloadPrompt(userId);
          navigation.replace('Main');
          setShowDownloadPrompt(shouldShow);
          styles.input,
          styles.input,
          {
          {
          {loading ? t('common.loading') : t('login.signIn')}
          {loading ? t('common.loading') : t('login.signUp')}
          {t('login.forgotPassword')}
          {t('login.signUp')}
          },
          },
        // If for some reason we don't have a user ID, navigate anyway
        </Text>
        </Text>
        </Text>
        </Text>
        </View>
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
        <Text style={[styles.buttonText, { color: colors.onSecondary }]}>
        <Text style={[styles.forgotPassword, { color: colors.primary }]}>
        <Text style={[styles.signUpLink, { color: colors.primary }]} onPress={handleSignUp}>
        <View style={styles.downloadPrompt}>
        ]}
        ]}
        autoCapitalize="none"
        await appDownloadService.markDownloadPromptAsShown(userId);
        const userId = firebaseService.auth.getCurrentUser()?.uid;
        disabled={loading}
        disabled={loading}
        errorMessage = t('login.errors.accountDisabled');
        errorMessage = t('login.errors.emailInUse');
        errorMessage = t('login.errors.invalidCredentials');
        errorMessage = t('login.errors.invalidEmail');
        errorMessage = t('login.errors.invalidEmail');
        errorMessage = t('login.errors.tooManyAttempts');
        errorMessage = t('login.errors.weakPassword');
        if (!(await appDownloadService.shouldShowDownloadPrompt(userId))) {
        if (userId) {
        keyboardType="email-address"
        monitoringService.error.captureException(error);
        navigation.replace('Main');
        onChangeText={setEmail}
        onChangeText={setPassword}
        onPress={handleLogin}
        onPress={handleSignUp}
        placeholder={t('login.email')}
        placeholder={t('login.password')}
        placeholderTextColor={colors.textSecondary}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        style={[
        style={[
        style={[styles.button, { backgroundColor: colors.primary }]}
        style={[styles.button, { backgroundColor: colors.secondary }]}
        value={email}
        value={password}
        {t('login.dontHaveAccount')}
        }
        }
      )}
      // Only show specific error messages for known error codes
      // Only show specific error messages for known error codes
      // Sanitize error messages to avoid exposing sensitive information
      // Sanitize error messages to avoid exposing sensitive information
      // We'll navigate after the user has seen the download prompt
      // or immediately if the prompt isn't shown
      />
      />
      </Text>
      </TouchableOpacity>
      </TouchableOpacity>
      </TouchableOpacity>
      <Content />
      <Text style={[styles.dontHaveAccount, { color: colors.textSecondary }]}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('login.subtitle')}</Text>
      <Text style={[styles.title, { color: colors.primary }]}>{t('login.title')}</Text>
      <TextInput
      <TextInput
      <TouchableOpacity
      <TouchableOpacity
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
      >
      >
      Alert.alert(t('common.error'), errorMessage);
      Alert.alert(t('common.error'), errorMessage);
      Alert.alert(t('common.error'), t('login.errors.emailRequired'));
      Alert.alert(t('common.error'), t('login.errors.emailRequired'));
      Alert.alert(t('common.error'), t('login.errors.invalidEmail'));
      Alert.alert(t('common.error'), t('login.errors.passwordRequired'));
      Alert.alert(t('common.error'), t('login.errors.passwordRequired'));
      Alert.alert(t('common.success'), t('login.alerts.loggedIn'));
      Alert.alert(t('login.features.signUp'), t('login.alerts.accountCreated'));
      await firebaseService.auth.createUserWithEmailAndPassword(email, password);
      await firebaseService.auth.signInWithEmailAndPassword(email, password);
      checkDownloadPrompt();
      const checkDownloadPrompt = async () => {
      const userId = firebaseService.auth.getCurrentUser()?.uid;
      if (error.code === 'auth/email-already-in-use') {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      if (userId) {
      let errorMessage = t('login.errors.loginFailed');
      let errorMessage = t('login.errors.signUpFailed');
      monitoringService.error.captureException(error);
      monitoringService.error.captureException(error);
      navigation.replace('Main');
      return;
      return;
      return;
      return;
      return;
      setIsNewUser(true);
      setLoading(false);
      setLoading(false);
      setLoading(true);
      setLoading(true);
      try {
      {/* Show download prompt if needed */}
      {showDownloadPrompt && (
      }
      }
      }
      }
      } catch (error) {
      } else if (error.code === 'auth/invalid-email') {
      } else if (error.code === 'auth/invalid-email') {
      } else if (error.code === 'auth/too-many-requests') {
      } else if (error.code === 'auth/user-disabled') {
      } else if (error.code === 'auth/weak-password') {
      } else {
      };
    // Basic email validation
    // Validate inputs
    // Validate inputs
    </MainLayout>
    </View>
    <MainLayout scrollable={true} safeArea={true}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 5,
    borderRadius: 5,
    borderRadius: 5,
    borderWidth: 1,
    bottom: 0,
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const userId = firebaseService.auth.getCurrentUser()?.uid;
    flex: 1,
    flexDirection: 'row',
    fontSize: 14,
    fontSize: 14,
    fontSize: 14,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 24,
    fontSize: 24,
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    if (!email.trim()) {
    if (!email.trim()) {
    if (!emailRegex.test(email)) {
    if (!password.trim()) {
    if (!password.trim()) {
    if (isNewUser && firebaseService.auth.getCurrentUser()) {
    if (userId) {
    justifyContent: 'center',
    justifyContent: 'center',
    justifyContent: 'space-around',
    left: 0,
    marginBottom: 10,
    marginBottom: 10,
    marginBottom: 10,
    marginBottom: 20,
    marginBottom: 20,
    marginBottom: 20,
    marginTop: 10,
    marginTop: 15,
    marginTop: 20,
    marginTop: 20,
    navigation.replace('Main');
    padding: 10,
    padding: 12,
    padding: 12,
    padding: 20,
    padding: 20,
    position: 'absolute',
    right: 0,
    setShowDownloadPrompt(false);
    textAlign: 'center',
    textAlign: 'center',
    textAlign: 'center',
    top: 0,
    try {
    try {
    width: '100%',
    width: '45%',
    width: '80%',
    width: '80%',
    zIndex: 10,
    }
    }
    }
    }
    }
    }
    }
    }
    }
    } catch (error) {
    } catch (error) {
    } finally {
    } finally {
   * Handle login form submission
   * Handle sign up form submission
   */
   */
  );
  );
  /**
  /**
  // Check if we should show the download prompt after registration
  // Content component
  // Get app store URLs
  // Get theme from context
  // Get translations
  // Handle closing the download prompt
  // Navigation
  // Render page using MainLayout template
  // State
  button: {
  buttonText: {
  closeButton: {
  closeButtonText: {
  const Content = () => (
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const handleCloseDownloadPrompt = async () => {
  const handleLogin = async () => {
  const handleSignUp = async () => {
  const navigation = useNavigation();
  const { appStoreUrl, playStoreUrl, webAppUrl } = appDownloadService.getAppStoreUrls();
  const { colors } = useTheme();
  const { t } = useI18n();
  container: {
  dontHaveAccount: {
  downloadButtons: {
  downloadPrompt: {
  downloadSubtitle: {
  downloadTitle: {
  forgotPassword: {
  input: {
  return (
  signUpLink: {
  storeButton: {
  storeButtonText: {
  subtitle: {
  title: {
  useEffect(() => {
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  }, [isNewUser]);
  };
  };
  };
 *
 * @returns {React.ReactNode} Rendered component
 * A page component for user authentication using the atomic architecture.
 * Login Screen
 * Login Screen component
 */
 */
/**
/**
// External imports
// Import atomic components
// Internal imports
// Styles
const LoginScreen = () => {
const styles = StyleSheet.create({
export default memo(LoginScreen);
});
};

