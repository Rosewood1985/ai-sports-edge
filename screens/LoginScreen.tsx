import { StackNavigationProp } from '@react-navigation/stack';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import ThemeToggle from '../atomic/molecules/theme/ThemeToggle';
import LegalAcceptanceCheckbox from '../components/LegalAcceptanceCheckbox';
import MobileAppDownload from '../components/MobileAppDownload';
import { useI18n } from '../contexts/I18nContext';
import { appDownloadService } from '../services/appDownloadService';

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
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [legalAccepted, setLegalAccepted] = useState<boolean>(false);
  const [isSignupMode, setIsSignupMode] = useState<boolean>(false);

  // Get Firebase auth instance
  const auth: Auth = getAuth();

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
      Alert.alert(t('common.error'), t('login.errors.emailRequired'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('login.errors.passwordRequired'));
      return;
    }

    // Check if legal agreement is accepted
    if (!legalAccepted) {
      Alert.alert(t('common.error'), t('auth.agreement_required'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('login.errors.invalidEmail'));
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert(t('login.features.signUp'), t('login.alerts.accountCreated'));
      setIsNewUser(true);

      // We'll navigate after the user has seen the download prompt
      // or immediately if the prompt isn't shown
      const userId = auth.currentUser?.uid;
      if (userId) {
        if (!(await appDownloadService.shouldShowDownloadPrompt(userId))) {
          navigation.replace('Main');
        }
      } else {
        // If for some reason we don't have a user ID, navigate anyway
        navigation.replace('Main');
      }
    } catch (error: any) {
      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t('login.errors.signUpFailed');

      // Only show specific error messages for known error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('login.errors.emailInUse');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('login.errors.weakPassword');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('login.errors.invalidEmail');
      }

      Alert.alert(t('common.error'), errorMessage);
      console.error('Sign up error:', error);
    }
  };

  const handleLogin = async (): Promise<void> => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('login.errors.emailRequired'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('login.errors.passwordRequired'));
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert(t('common.success'), t('login.alerts.loggedIn'));
      navigation.replace('Main');
    } catch (error: any) {
      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t('login.errors.loginFailed');

      // Only show specific error messages for known error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('login.errors.invalidCredentials');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('login.errors.invalidEmail');
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = t('login.errors.accountDisabled');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('login.errors.tooManyAttempts');
      }

      Alert.alert(t('common.error'), errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <AccessibleThemedView
      style={styles.container}
      accessibilityLabel={t('login.screenTitle')}
      accessibilityRole="none"
    >
      {/* Show download prompt if needed */}
      {showDownloadPrompt && (
        <MobileAppDownload
          onClose={() => {
            handleCloseDownloadPrompt();
            navigation.replace('Main');
          }}
          appStoreUrl={appStoreUrl}
          playStoreUrl={playStoreUrl}
          webAppUrl={webAppUrl}
        />
      )}

      <AccessibleThemedText style={styles.title} type="h1" accessibilityRole="header">
        {t('login.title')}
      </AccessibleThemedText>

      <AccessibleThemedText
        style={styles.subtitle}
        type="bodyStd"
        accessibilityLabel={t('login.subtitle')}
      >
        {t('login.subtitle')}
      </AccessibleThemedText>

      <TextInput
        style={styles.input}
        placeholder={t('login.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel={t('login.email')}
        accessibilityHint={t('login.emailHint')}
        accessibilityRole="text"
      />

      <TextInput
        style={styles.input}
        placeholder={t('login.password')}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        accessibilityLabel={t('login.password')}
        accessibilityHint={t('login.passwordHint')}
        accessibilityRole="text"
      />

      {/* Show legal acceptance checkbox in signup mode */}
      {isSignupMode && (
        <LegalAcceptanceCheckbox
          isAccepted={legalAccepted}
          onAcceptanceChange={setLegalAccepted}
          showNavigationLinks
        />
      )}

      {/* Primary action button (changes based on mode) */}
      <AccessibleTouchableOpacity
        accessibilityLabel={isSignupMode ? t('login.signUp') : t('login.signIn')}
        accessibilityRole="button"
        accessibilityHint={isSignupMode ? t('login.signUpHint') : t('login.signInHint')}
        onPress={isSignupMode ? handleSignUp : handleLogin}
        style={[styles.button, styles.primaryButton]}
      >
        <AccessibleThemedText style={styles.buttonText} type="button">
          {isSignupMode ? t('login.signUp') : t('login.signIn')}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>

      {/* Mode toggle button */}
      <AccessibleTouchableOpacity
        accessibilityLabel={
          isSignupMode ? t('auth.already_have_account') : t('auth.dont_have_account')
        }
        accessibilityRole="button"
        onPress={() => {
          setIsSignupMode(!isSignupMode);
          setLegalAccepted(false); // Reset legal acceptance when switching modes
        }}
        style={styles.modeToggleButton}
      >
        <AccessibleThemedText style={styles.modeToggleText}>
          {isSignupMode ? t('auth.already_have_account') : t('auth.dont_have_account')}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>

      {/* Only show forgot password in login mode */}
      {!isSignupMode && (
        <AccessibleTouchableOpacity
          accessibilityLabel={t('login.forgotPassword')}
          accessibilityRole="link"
          accessibilityHint={t('login.forgotPasswordHint')}
          onPress={() => {
            /* Handle forgot password */
          }}
        >
          <AccessibleThemedText style={styles.forgotPassword}>
            {t('login.forgotPassword')}
          </AccessibleThemedText>
        </AccessibleTouchableOpacity>
      )}

      {/* Theme Toggle */}
      <ThemeToggle />
    </AccessibleThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    padding: 10,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    width: '80%',
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modeToggleButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  modeToggleText: {
    color: '#FFD700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    color: '#FFD700',
    marginTop: 15,
    fontSize: 14,
  },
});
