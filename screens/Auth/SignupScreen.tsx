import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  getAuth,
} from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { useI18n } from '../../../atomic/organisms/i18n/I18nContext';
import ThemeToggle from '../../atomic/molecules/theme/ThemeToggle';
import { useTheme } from '../../screens/Onboarding/Context/ThemeContext';

// Define the navigation prop type
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

export default function SignupScreen({ navigation }: Props): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [socialLoginLoading, setSocialLoginLoading] = useState<boolean>(false);

  // Get translations and theme
  const { t } = useI18n();
  const { theme } = useTheme();

  // Calculate password strength whenever password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Contains number
    if (/\d/.test(password)) strength += 1;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  // Validate email
  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError(t('signup.errors.emailRequired') || 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('signup.errors.invalidEmail') || 'Invalid email format');
      return false;
    }

    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = (): boolean => {
    if (!password.trim()) {
      setPasswordError(t('signup.errors.passwordRequired') || 'Password is required');
      return false;
    }

    if (password.length < 8) {
      setPasswordError(
        t('signup.errors.passwordTooShort') || 'Password must be at least 8 characters'
      );
      return false;
    }

    if (passwordStrength < 3) {
      setPasswordError(t('signup.errors.weakPassword') || 'Password is too weak');
      return false;
    }

    setPasswordError('');
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = (): boolean => {
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('signup.errors.passwordsDoNotMatch') || 'Passwords do not match');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  // Handle Google sign in
  const handleGoogleSignIn = async (): Promise<void> => {
    setSocialLoginLoading(true);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // On web, use signInWithPopup
      if (Platform.OS === 'web') {
        await signInWithPopup(auth, provider);
        navigation.replace('Main');
      } else {
        // For mobile, we would use Expo AuthSession
        // This is a placeholder - in a real app, you'd implement Expo AuthSession
        Alert.alert(
          t('common.info') || 'Info',
          t('signup.alerts.googleSignInMobile') ||
            'Google Sign In on mobile requires Expo AuthSession implementation'
        );
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('signup.errors.googleSignInFailed') || 'Google sign in failed'
      );
    } finally {
      setSocialLoginLoading(false);
    }
  };

  // Handle Apple sign in
  const handleAppleSignIn = async (): Promise<void> => {
    setSocialLoginLoading(true);

    try {
      const auth = getAuth();
      const provider = new OAuthProvider('apple.com');

      // On web, use signInWithPopup
      if (Platform.OS === 'web') {
        await signInWithPopup(auth, provider);
        navigation.replace('Main');
      } else {
        // For mobile, we would use Expo AuthSession
        // This is a placeholder - in a real app, you'd implement Expo AuthSession
        Alert.alert(
          t('common.info') || 'Info',
          t('signup.alerts.appleSignInMobile') ||
            'Apple Sign In on mobile requires Expo AuthSession implementation'
        );
      }
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('signup.errors.appleSignInFailed') || 'Apple sign in failed'
      );
    } finally {
      setSocialLoginLoading(false);
    }
  };

  const handleSignUp = async (): Promise<void> => {
    // Validate all inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Get auth instance directly
      const auth = getAuth();

      // Log Firebase configuration for debugging
      console.log('Firebase Auth Configuration:', {
        apiKey: process.env.FIREBASE_API_KEY ? 'Present (masked)' : 'Missing',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        environment: process.env.NODE_ENV || 'Not set',
      });

      // Create user with Firebase
      console.log('Attempting to create user with Firebase...');
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully');
      Alert.alert(
        t('signup.features.signUp') || 'Sign Up',
        t('signup.alerts.accountCreated') || 'Account created successfully!'
      );

      // Navigate to main screen
      navigation.replace('Main');
    } catch (error: any) {
      // Log detailed error information for debugging
      console.error('Sign up error details:', {
        code: error.code,
        message: error.message,
        fullError: JSON.stringify(error, null, 2),
      });

      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t('signup.errors.signUpFailed') || 'Failed to create account';

      // Only show specific error messages for known error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('signup.errors.emailInUse') || 'Email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('signup.errors.weakPassword') || 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('signup.errors.invalidEmail') || 'Invalid email format';
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = t('signup.errors.apiKeyInvalid') || 'API key is not valid';
        console.error('API Key validation failed:', error);
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage =
          t('signup.errors.operationNotAllowed') || 'Email/password accounts are not enabled';
        console.error('Firebase auth not properly configured:', error);
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('signup.errors.networkFailed') || 'Network request failed';
        console.error('Network request failed:', error);
      }

      Alert.alert(t('common.error') || 'Error', errorMessage);
      console.error('Sign up error:', error.code, error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
          style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5' }]}
        >
          <Text style={[styles.title, { color: theme === 'dark' ? '#FFD700' : '#0066FF' }]}>
            {t('signup.title') || 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme === 'dark' ? '#CCCCCC' : '#555555' }]}>
            {t('signup.subtitle') || 'Join AI Sports Edge for premium betting insights'}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'dark' ? '#333' : '#FFFFFF',
                  color: theme === 'dark' ? '#fff' : '#000',
                  borderColor: emailError ? '#FF3B30' : 'transparent',
                  borderWidth: emailError ? 1 : 0,
                },
              ]}
              placeholder={t('signup.email') || 'Email'}
              placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (emailError) validateEmail();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="signup-email-input"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'dark' ? '#333' : '#FFFFFF',
                  color: theme === 'dark' ? '#fff' : '#000',
                  borderColor: passwordError ? '#FF3B30' : 'transparent',
                  borderWidth: passwordError ? 1 : 0,
                },
              ]}
              placeholder={t('signup.password') || 'Password'}
              placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
              value={password}
              secureTextEntry
              onChangeText={text => {
                setPassword(text);
                if (passwordError) validatePassword();
              }}
              testID="signup-password-input"
            />
            {password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthMeterContainer}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <View
                      key={level}
                      style={[
                        styles.strengthMeter,
                        {
                          backgroundColor:
                            passwordStrength >= level
                              ? level <= 2
                                ? '#FF3B30'
                                : level <= 4
                                  ? '#FFCC00'
                                  : '#34C759'
                              : theme === 'dark'
                                ? '#444'
                                : '#DDD',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[styles.strengthText, { color: theme === 'dark' ? '#CCCCCC' : '#555555' }]}
                >
                  {passwordStrength === 0 && (t('signup.passwordStrength.tooWeak') || 'Too Weak')}
                  {passwordStrength === 1 && (t('signup.passwordStrength.weak') || 'Weak')}
                  {passwordStrength === 2 && (t('signup.passwordStrength.fair') || 'Fair')}
                  {passwordStrength === 3 && (t('signup.passwordStrength.good') || 'Good')}
                  {passwordStrength === 4 && (t('signup.passwordStrength.strong') || 'Strong')}
                  {passwordStrength === 5 &&
                    (t('signup.passwordStrength.veryStrong') || 'Very Strong')}
                </Text>
              </View>
            )}
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme === 'dark' ? '#333' : '#FFFFFF',
                  color: theme === 'dark' ? '#fff' : '#000',
                  borderColor: confirmPasswordError ? '#FF3B30' : 'transparent',
                  borderWidth: confirmPasswordError ? 1 : 0,
                },
              ]}
              placeholder={t('signup.confirmPassword') || 'Confirm Password'}
              placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
              value={confirmPassword}
              secureTextEntry
              onChangeText={text => {
                setConfirmPassword(text);
                if (confirmPasswordError) validateConfirmPassword();
              }}
              testID="signup-confirm-password-input"
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: theme === 'dark' ? '#FFD700' : '#0066FF' },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
            testID="signup-button"
          >
            {isLoading ? (
              <ActivityIndicator color={theme === 'dark' ? '#121212' : '#FFFFFF'} />
            ) : (
              <Text
                style={[
                  styles.signupButtonText,
                  { color: theme === 'dark' ? '#121212' : '#FFFFFF' },
                ]}
              >
                {t('signup.signUp') || 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View
              style={[styles.divider, { backgroundColor: theme === 'dark' ? '#444' : '#DDD' }]}
            />
            <Text style={[styles.orText, { color: theme === 'dark' ? '#CCCCCC' : '#555555' }]}>
              {t('signup.or') || 'OR'}
            </Text>
            <View
              style={[styles.divider, { backgroundColor: theme === 'dark' ? '#444' : '#DDD' }]}
            />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#DB4437' }]}
              onPress={handleGoogleSignIn}
              disabled={socialLoginLoading}
            >
              <Ionicons name="logo-google" size={24} color="#FFFFFF" />
              <Text style={styles.socialButtonText}>{t('signup.googleSignIn') || 'Google'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000000' }]}
              onPress={handleAppleSignIn}
              disabled={socialLoginLoading}
            >
              <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              <Text style={styles.socialButtonText}>{t('signup.appleSignIn') || 'Apple'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text
              style={[
                styles.alreadyHaveAccount,
                { color: theme === 'dark' ? '#CCCCCC' : '#555555' },
              ]}
            >
              {t('signup.alreadyHaveAccount') || 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme === 'dark' ? '#FFD700' : '#0066FF' }]}>
                {t('signup.login') || 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: theme === 'dark' ? '#CCCCCC' : '#555555' }]}>
              {t('signup.termsText') || 'By signing up, you agree to our'}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.termsLink, { color: theme === 'dark' ? '#FFD700' : '#0066FF' }]}>
                {t('signup.termsLink') || 'Terms of Service and Privacy Policy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme Toggle */}
          <View style={styles.themeToggleContainer}>
            <ThemeToggle />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 0,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthMeterContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    marginBottom: 5,
    overflow: 'hidden',
  },
  strengthMeter: {
    flex: 1,
    height: 6,
    marginHorizontal: 1,
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'right',
  },
  signupButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  socialButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 25,
    alignItems: 'center',
  },
  alreadyHaveAccount: {
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  termsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
  },
  termsLink: {
    fontSize: 12,
    marginTop: 5,
  },
  themeToggleContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
});
