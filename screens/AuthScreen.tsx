import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import LegalLinks from '../components/LegalLinks';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError,
  Auth,
  getAuth,
} from 'firebase/auth';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';
import { FirebaseError } from 'firebase/app';

// Password validation function
const validatePassword = (
  password: string,
  username: string = '',
  email: string = ''
): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }

  if (!/[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]/.test(password)) {
    return 'Password must include at least one special character.';
  }

  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return 'Password cannot contain your username.';
  }

  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    return 'Password cannot contain your email address.';
  }

  return null; // No error
};

// Username validation function
const validateUsername = (username: string): string | null => {
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;

  if (!usernameRegex.test(username)) {
    return 'Username must be 3-20 characters and can only contain letters, numbers, underscores, and periods.';
  }

  return null; // No error
};

const AuthScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength < 3) setPasswordStrength('weak');
    else if (strength < 5) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);
  // Validate form
  const validateForm = () => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Email validation
    if (!email) {
      errors.email = t('auth.email_required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('auth.invalid_email_format');
    }

    // Password validation
    if (!password) {
      errors.password = t('auth.password_required');
    } else {
      const passwordError = validatePassword(password, username, email);
      if (passwordError) {
        errors.password = passwordError;
      }
    }

    // For sign up only
    if (!isLogin) {
      // Username validation
      if (!username) {
        errors.username = t('auth.username_required');
      } else {
        const usernameError = validateUsername(username);
        if (usernameError) {
          errors.username = usernameError;
        }
      }

      // Confirm password validation
      if (!confirmPassword) {
        errors.confirmPassword = t('auth.confirm_password_required');
      } else if (password !== confirmPassword) {
        errors.confirmPassword = t('auth.passwords_do_not_match');
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle authentication
  const handleAuth = async () => {
    console.log('AuthScreen: Starting authentication process');
    info(LogCategory.AUTH, 'Authentication process started', { isLogin });

    if (!validateForm()) {
      console.log('AuthScreen: Form validation failed');
      info(LogCategory.AUTH, 'Authentication form validation failed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        `AuthScreen: Attempting to ${isLogin ? 'sign in' : 'sign up'} user with email: ${email}`
      );
      info(LogCategory.AUTH, `Attempting to ${isLogin ? 'sign in' : 'sign up'} user`, { email });

      const auth = getAuth();

      if (isLogin) {
        // Sign in
        console.log('AuthScreen: Signing in user');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('AuthScreen: User signed in successfully');
        info(LogCategory.AUTH, 'User signed in successfully', { email });
      } else {
        // Sign up
        console.log('AuthScreen: Creating new user account');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        console.log('AuthScreen: User account created, updating profile with username');
        info(LogCategory.AUTH, 'User account created', {
          email,
          userId: userCredential.user.uid,
        });

        // Update profile with username
        await updateProfile(userCredential.user, {
          displayName: username,
        });

        console.log('AuthScreen: User profile updated with username');
        info(LogCategory.AUTH, 'User profile updated with username', {
          username,
        });
      }

      console.log(
        'AuthScreen: Authentication successful, navigation will be handled by auth state listener'
      );
      info(LogCategory.AUTH, 'Authentication successful', { isLogin });

      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error: any) {
      console.error('AuthScreen: Authentication error:', error);

      // Log the error with our logging service
      if (error instanceof FirebaseError) {
        console.error(`AuthScreen: Firebase error code: ${error.code}`);
        logError(
          LogCategory.AUTH,
          `Authentication failed with Firebase error (${error.code})`,
          error
        );
      } else {
        logError(LogCategory.AUTH, 'Authentication failed with unknown error', error);
      }

      // Track the error with our error tracking service
      safeErrorCapture(error);

      // Handle specific error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        console.log('AuthScreen: Invalid credentials');
        setError(t('auth.invalid_credentials'));
      } else if (error.code === 'auth/email-already-in-use') {
        console.log('AuthScreen: Email already in use');
        setError(t('auth.email_already_in_use'));
      } else if (error.code === 'auth/weak-password') {
        console.log('AuthScreen: Weak password');
        setError(t('auth.weak_password'));
      } else if (error.code === 'auth/invalid-email') {
        console.log('AuthScreen: Invalid email');
        setError(t('auth.invalid_email'));
      } else {
        console.log('AuthScreen: Authentication failed with unknown error');
        setError(t('auth.authentication_failed'));
      }
    } finally {
      setLoading(false);
      console.log('AuthScreen: Authentication process completed');
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    console.log('AuthScreen: Handling forgot password request');
    info(LogCategory.AUTH, 'Forgot password request initiated');

    if (!email) {
      console.log('AuthScreen: No email provided for password reset');
      logError(
        LogCategory.AUTH,
        'Password reset attempted without email',
        new Error('Email required for password reset')
      );

      Alert.alert(t('auth.email_required'), t('auth.please_enter_email_for_reset'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    console.log(`AuthScreen: Processing password reset for email: ${email}`);
    info(LogCategory.AUTH, 'Password reset email requested', { email });

    try {
      // In a real app, this would send a password reset email using Firebase
      // For example: await sendPasswordResetEmail(getAuth(), email);

      console.log(`AuthScreen: Password reset email would be sent to: ${email}`);
      info(LogCategory.AUTH, 'Password reset email would be sent', { email });

      Alert.alert(t('auth.password_reset'), t('auth.password_reset_email_sent'), [
        { text: t('common.ok') },
      ]);
    } catch (error) {
      console.error('AuthScreen: Error sending password reset email:', error);

      // Log the error with our logging service
      if (error instanceof FirebaseError) {
        console.error(`AuthScreen: Firebase error code: ${error.code}`);
        logError(
          LogCategory.AUTH,
          `Password reset failed with Firebase error (${error.code})`,
          error
        );
      } else {
        logError(LogCategory.AUTH, 'Password reset failed with unknown error', error as Error);
      }

      // Track the error with our error tracking service
      safeErrorCapture(error as Error);

      Alert.alert(t('auth.password_reset_failed'), t('auth.password_reset_error'), [
        { text: t('common.ok') },
      ]);
    }
  };

  return (
    <AccessibleThemedView
      style={styles.container}
      accessibilityLabel={isLogin ? t('auth.sign_in_screen') : t('auth.sign_up_screen')}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel={isLogin ? t('auth.sign_in_form') : t('auth.sign_up_form')}
        >
          <View style={styles.logoContainer} accessibilityLabel={t('auth.app_logo')}>
            <Ionicons
              name="basketball"
              size={64}
              color={colors.primary}
              accessibilityLabel={t('auth.basketball_icon')}
            />
            <AccessibleThemedText
              style={styles.appName}
              type="h1"
              accessibilityLabel={t('auth.app_name')}
            >
              AI Sports Edge
            </AccessibleThemedText>
          </View>

          <View
            style={styles.formContainer}
            accessibilityLabel={isLogin ? t('auth.login_form') : t('auth.signup_form')}
          >
            <AccessibleThemedText style={styles.title} type="h2" accessibilityRole="header">
              {isLogin ? t('auth.sign_in') : t('auth.sign_up')}
            </AccessibleThemedText>

            {error && (
              <View
                style={[styles.errorContainer, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}
                accessibilityLabel={t('auth.error_message')}
              >
                <AccessibleThemedText
                  style={[styles.errorText, { color: 'red' }]}
                  accessibilityRole="alert"
                >
                  {error}
                </AccessibleThemedText>
              </View>
            )}

            {!isLogin && (
              <View
                style={styles.inputContainer}
                accessibilityLabel={t('auth.username_input_container')}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.text}
                  style={styles.inputIcon}
                  accessibilityLabel={t('auth.person_icon')}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderBottomColor: validationErrors.username ? 'red' : colors.border,
                    },
                  ]}
                  placeholder={t('auth.username') + ' (3-20 characters)'}
                  placeholderTextColor={colors.text + '80'}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel={t('auth.username_input')}
                  accessibilityHint={t('auth.username_input_hint')}
                />
              </View>
            )}

            {validationErrors.username && (
              <AccessibleThemedText style={styles.errorText} accessibilityRole="alert">
                {validationErrors.username}
              </AccessibleThemedText>
            )}

            <View
              style={styles.inputContainer}
              accessibilityLabel={t('auth.email_input_container')}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.text}
                style={styles.inputIcon}
                accessibilityLabel={t('auth.mail_icon')}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: validationErrors.email ? 'red' : colors.border,
                  },
                ]}
                placeholder={t('auth.email')}
                placeholderTextColor={colors.text + '80'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessible={true}
                accessibilityLabel={t('auth.email_input')}
                accessibilityHint={t('auth.email_input_hint')}
              />
            </View>

            {validationErrors.email && (
              <AccessibleThemedText style={styles.errorText} accessibilityRole="alert">
                {validationErrors.email}
              </AccessibleThemedText>
            )}

            <View
              style={styles.inputContainer}
              accessibilityLabel={t('auth.password_input_container')}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.text}
                style={styles.inputIcon}
                accessibilityLabel={t('auth.lock_icon')}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: validationErrors.password ? 'red' : colors.border,
                  },
                ]}
                placeholder={t('auth.password') + ' (min. 8 characters)'}
                placeholderTextColor={colors.text + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessible={true}
                accessibilityLabel={t('auth.password_input')}
                accessibilityHint={t('auth.password_input_hint')}
              />
            </View>

            {validationErrors.password && (
              <AccessibleThemedText style={styles.errorText} accessibilityRole="alert">
                {validationErrors.password}
              </AccessibleThemedText>
            )}

            {!isLogin && password.length > 0 && (
              <>
                {' '}
                {/* Keep fragment in replacement for structure */}
                {/* Strength Meter */}
                <View style={styles.passwordInfoContainer}>
                  {' '}
                  {/* Corrected style name */}
                  <AccessibleThemedText
                    style={styles.passwordInfoLabel}
                    accessibilityLabel={t('auth.password_strength_label')}
                  >
                    {t('auth.password_strength')}:
                  </AccessibleThemedText>
                  {/* Corrected style name */}
                  <View style={styles.passwordStrengthMeter}>
                    <View
                      style={[
                        styles.passwordStrengthIndicator,
                        {
                          width:
                            passwordStrength === 'weak'
                              ? '33%'
                              : passwordStrength === 'medium'
                              ? '66%'
                              : '100%',
                          backgroundColor:
                            passwordStrength === 'weak'
                              ? '#FF3B30'
                              : passwordStrength === 'medium'
                              ? '#FFCC00'
                              : '#34C759',
                        },
                      ]}
                    />
                  </View>
                  <AccessibleThemedText
                    style={[
                      styles.passwordStrengthText,
                      {
                        color:
                          passwordStrength === 'weak'
                            ? '#FF3B30'
                            : passwordStrength === 'medium'
                            ? '#FFCC00'
                            : '#34C759',
                      },
                    ]}
                    accessibilityLabel={
                      passwordStrength === 'weak'
                        ? t('auth.password_strength_weak')
                        : passwordStrength === 'medium'
                        ? t('auth.password_strength_medium')
                        : t('auth.password_strength_strong')
                    }
                  >
                    {passwordStrength === 'weak'
                      ? t('auth.weak')
                      : passwordStrength === 'medium'
                      ? t('auth.medium')
                      : t('auth.strong')}
                  </AccessibleThemedText>
                </View>
              </>
            )}

            {!isLogin && (
              <>
                <View
                  style={styles.inputContainer}
                  accessibilityLabel={t('auth.confirm_password_input_container')}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.text}
                    style={styles.inputIcon}
                    accessibilityLabel={t('auth.lock_icon')}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderBottomColor: validationErrors.confirmPassword ? 'red' : colors.border,
                      },
                    ]}
                    placeholder={t('auth.confirm_password')}
                    placeholderTextColor={colors.text + '80'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    accessible={true}
                    accessibilityLabel={t('auth.confirm_password_input')}
                    accessibilityHint={t('auth.confirm_password_input_hint')}
                  />
                </View>

                {validationErrors.confirmPassword && (
                  <AccessibleThemedText style={styles.errorText} accessibilityRole="alert">
                    {validationErrors.confirmPassword}
                  </AccessibleThemedText>
                )}

                {password.length > 0 && (
                  <View
                    style={styles.passwordRequirementsContainer}
                    accessibilityLabel={t('auth.password_requirements_container')}
                  >
                    <AccessibleThemedText
                      style={styles.passwordRequirementsTitle}
                      type="h3"
                      accessibilityLabel={t('auth.password_requirements_title')}
                    >
                      {t('auth.password_requirements')}:
                    </AccessibleThemedText>
                    <View style={styles.passwordRequirementRow}>
                      <Ionicons
                        name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={password.length >= 8 ? '#34C759' : colors.text}
                      />
                      <AccessibleThemedText
                        style={styles.passwordRequirementText}
                        accessibilityLabel={t('auth.min_8_chars')}
                      >
                        {t('auth.min_8_chars')}
                      </AccessibleThemedText>
                    </View>
                    <View style={styles.passwordRequirementRow}>
                      <Ionicons
                        name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[A-Z]/.test(password) ? '#34C759' : colors.text}
                      />
                      <AccessibleThemedText
                        style={styles.passwordRequirementText}
                        accessibilityLabel={t('auth.uppercase_letter')}
                      >
                        {t('auth.uppercase_letter')}
                      </AccessibleThemedText>
                    </View>
                    <View style={styles.passwordRequirementRow}>
                      <Ionicons
                        name={/[a-z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[a-z]/.test(password) ? '#34C759' : colors.text}
                      />
                      <AccessibleThemedText
                        style={styles.passwordRequirementText}
                        accessibilityLabel={t('auth.lowercase_letter')}
                      >
                        {t('auth.lowercase_letter')}
                      </AccessibleThemedText>
                    </View>
                    <View style={styles.passwordRequirementRow}>
                      <Ionicons
                        name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={/[0-9]/.test(password) ? '#34C759' : colors.text}
                      />
                      <AccessibleThemedText
                        style={styles.passwordRequirementText}
                        accessibilityLabel={t('auth.number')}
                      >
                        {t('auth.number')}
                      </AccessibleThemedText>
                    </View>
                    <View style={styles.passwordRequirementRow}>
                      <Ionicons
                        name={
                          /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]/.test(password)
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={16}
                        color={
                          /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]/.test(password)
                            ? '#34C759'
                            : colors.text
                        }
                      />
                      <AccessibleThemedText
                        style={styles.passwordRequirementText}
                        accessibilityLabel={t('auth.special_char')}
                      >
                        {t('auth.special_char')}
                      </AccessibleThemedText>
                    </View>
                  </View>
                )}
              </>
            )}

            {isLogin && (
              <AccessibleTouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
                accessibilityLabel={t('auth.forgot_password')}
                accessibilityRole="button"
                accessibilityHint={t('auth.forgot_password_hint')}
              >
                <AccessibleThemedText
                  style={[styles.forgotPasswordText, { color: colors.primary }]}
                  type="button"
                >
                  {t('auth.forgot_password')}
                </AccessibleThemedText>
              </AccessibleTouchableOpacity>
            )}

            <AccessibleTouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={handleAuth}
              disabled={loading}
              accessibilityLabel={isLogin ? t('auth.sign_in_button') : t('auth.sign_up_button')}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
              accessibilityHint={isLogin ? t('auth.sign_in_hint') : t('auth.sign_up_hint')}
            >
              {loading ? (
                <ActivityIndicator
                  color="white"
                  size="small"
                  accessibilityLabel={t('auth.loading')}
                />
              ) : (
                <AccessibleThemedText style={styles.authButtonText} type="button">
                  {isLogin ? t('auth.sign_in') : t('auth.sign_up')}
                </AccessibleThemedText>
              )}
            </AccessibleTouchableOpacity>

            <AccessibleTouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setIsLogin(!isLogin)}
              accessibilityLabel={isLogin ? t('auth.switch_to_signup') : t('auth.switch_to_signin')}
              accessibilityRole="button"
              accessibilityHint={
                isLogin ? t('auth.switch_to_signup_hint') : t('auth.switch_to_signin_hint')
              }
            >
              <AccessibleThemedText style={styles.toggleText}>
                {isLogin ? t('auth.dont_have_account') : t('auth.already_have_account')}
              </AccessibleThemedText>
              <AccessibleThemedText
                style={[styles.toggleAction, { color: colors.primary }]}
                type="button"
              >
                {isLogin ? t('auth.sign_up') : t('auth.sign_in')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>

            {/* Legal links - show title only on sign up screen */}
            <View style={styles.legalLinksContainer} accessibilityLabel={t('auth.legal_links')}>
              <LegalLinks showTitle={!isLogin} horizontal={true} textSize="small" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AccessibleThemedView>
  );
};

const SPACING_UNIT = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING_UNIT * 3, // 24
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING_UNIT * 5, // 40 - Increased spacing
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: SPACING_UNIT * 2, // 16
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT * 3, // 24
    textAlign: 'left', // Left align title
  },
  errorContainer: {
    flexDirection: 'row', // Add icon next to text
    alignItems: 'center',
    padding: SPACING_UNIT * 1.5, // 12
    borderRadius: 8,
    marginBottom: SPACING_UNIT * 2, // 16
    // Background color set dynamically
  },
  errorIcon: {
    marginRight: SPACING_UNIT, // 8
  },
  errorText: {
    fontSize: 14,
    flexShrink: 1, // Allow text to wrap
    // Color set dynamically
  },
  inputWrapper: {
    marginBottom: SPACING_UNIT * 2, // 16 - Add margin below each input group
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5, // Slightly thicker border
    // borderBottomColor set dynamically based on validation
    paddingBottom: SPACING_UNIT, // 8 - Add padding below input line
  },
  inputIcon: {
    marginRight: SPACING_UNIT * 1.5, // 12
    opacity: 0.7, // Dim icon slightly
  },
  input: {
    flex: 1,
    height: 48, // Ensure consistent height
    fontSize: 16,
    borderBottomWidth: 0, // Remove individual input border
    paddingVertical: 0, // Remove default padding if any
  },
  validationErrorText: {
    fontSize: 12,
    marginTop: SPACING_UNIT * 0.5, // 4
    paddingLeft: SPACING_UNIT * 4, // Indent validation message
    // Color set dynamically
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: SPACING_UNIT * 3, // 24
    paddingVertical: SPACING_UNIT * 0.5, // Add touch area
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    // Color set dynamically
  },
  authButton: {
    height: 52, // Slightly taller button
    borderRadius: 12, // More rounded
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING_UNIT * 2, // 16
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    // Background color set dynamically
  },
  authButtonText: {
    color: '#FFFFFF', // Ensure high contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Vertically align text
    marginTop: SPACING_UNIT * 2, // 16
    padding: SPACING_UNIT, // Add padding for touch area
  },
  toggleText: {
    fontSize: 14,
    marginRight: SPACING_UNIT * 0.5, // 4
    opacity: 0.8, // Slightly dim non-action text
  },
  toggleAction: {
    fontSize: 14,
    fontWeight: 'bold',
    // Color set dynamically
  },
  legalLinksContainer: {
    marginTop: SPACING_UNIT * 4, // 32 - More space above legal links
    alignItems: 'center',
  },
  // Password strength & requirements styles
  passwordInfoContainer: {
    marginBottom: SPACING_UNIT * 2, // 16
    marginTop: SPACING_UNIT, // 8 - Add space above
  },
  passwordInfoLabel: {
    fontSize: 14,
    marginBottom: SPACING_UNIT * 0.5, // 4
    opacity: 0.8,
    textAlign: 'left',
  },
  passwordStrengthMeter: {
    height: 8,
    backgroundColor: '#E0E0E0', // Use a neutral background
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING_UNIT * 0.5, // 4
  },
  passwordStrengthIndicator: {
    height: '100%',
    borderRadius: 4,
    // Background color set dynamically
  },
  passwordStrengthText: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
    // Color set dynamically
  },
  passwordRequirementsContainer: {
    padding: SPACING_UNIT * 1.5, // 12
    borderRadius: 8,
    marginTop: SPACING_UNIT * 1.5, // 12
    // Background color set dynamically
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT, // 8
    textAlign: 'left',
  },
  passwordRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING_UNIT * 0.75, // 6
  },
  passwordRequirementText: {
    fontSize: 12,
    marginLeft: SPACING_UNIT, // 8
    // Color set dynamically
  },
});

export default AuthScreen;
