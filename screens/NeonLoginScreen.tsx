import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { NeonText, NeonButton, NeonCard, NeonContainer } from '../atomic/atoms';
import { auth } from '../config/firebase';
import { ROUTES } from '../constants/navigation';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import { useHoverEffect, useGlowHoverEffect, useFadeIn, useSlideIn } from '../utils/animationUtils';

const { width } = Dimensions.get('window');

const NeonLoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, language } = useI18n();

  // Animation hooks
  const titleOpacity = useFadeIn(800, 300);
  const formAnimation = useSlideIn(800, 600, 'bottom', 50);
  const iconsAnimation = useSlideIn(800, 900, 'bottom', 50);

  // Create animated icon components with hover effects
  const renderAnimatedIcon = (
    name: string,
    iconComponent: 'FontAwesome5' | 'Ionicons',
    labelKey: string,
    onPress?: () => void
  ) => {
    const { animatedStyle, onPressIn, onPressOut } = useHoverEffect(1.1);
    const {
      glowOpacity,
      glowRadius,
      onPressIn: glowIn,
      onPressOut: glowOut,
    } = useGlowHoverEffect('low', 'high');

    const handlePressIn = () => {
      onPressIn();
      glowIn();
    };

    const handlePressOut = () => {
      onPressOut();
      glowOut();
    };

    return (
      <TouchableOpacity
        style={styles.iconWrapper}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t(`login.features.${labelKey}`)}
        accessibilityHint={t(`login.features.${labelKey}`)}
      >
        <Animated.View
          style={[
            styles.iconInner,
            animatedStyle,
            {
              shadowOpacity: glowOpacity,
              shadowRadius: glowRadius,
              shadowColor: colors.neon.blue,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          {iconComponent === 'FontAwesome5' ? (
            <FontAwesome5 name={name as any} size={32} color={colors.neon.blue} />
          ) : (
            <Ionicons name={name as any} size={32} color={colors.neon.blue} />
          )}
        </Animated.View>
        <NeonText type="caption" color={colors.text.primary} style={styles.iconText}>
          {t(`login.features.${labelKey}`)}
        </NeonText>
      </TouchableOpacity>
    );
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError(t('login.errors.emailRequired'));
      return false;
    }

    if (!password.trim()) {
      setError(t('login.errors.passwordRequired'));
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('login.errors.invalidEmail'));
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      Alert.alert(t('common.success'), t('login.alerts.loggedIn'));
      navigation.navigate(ROUTES.HOME as never);
    } catch (error: any) {
      setIsLoading(false);

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

      setError(errorMessage);
      console.error('Login error:', error);
    }
  };

  const handleSignUp = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      Alert.alert(t('login.features.signUp'), t('login.alerts.accountCreated'));
      navigation.navigate(ROUTES.HOME as never);
    } catch (error: any) {
      setIsLoading(false);

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

      setError(errorMessage);
      console.error('Sign up error:', error);
    }
  };

  return (
    <NeonContainer gradient gradientColors={[colors.background.primary, '#0D0D0D']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* App Title */}
          <Animated.View style={{ opacity: titleOpacity, marginBottom: spacing.xl }}>
            <NeonText type="heading" glow intensity="high" style={styles.title}>
              {t('login.title')}
            </NeonText>
            <NeonText type="caption" color={colors.neon.cyan} glow style={styles.subtitle}>
              {t('login.subtitle')}
            </NeonText>
          </Animated.View>

          {/* Login Form */}
          <Animated.View style={[styles.formContainer, formAnimation]}>
            <NeonCard
              borderColor={colors.border.default}
              glowIntensity="low"
              gradient
              gradientColors={[colors.background.secondary, colors.background.tertiary]}
              style={styles.formCard}
            >
              <NeonText type="subheading" glow style={styles.formTitle}>
                {t('login.signIn')}
              </NeonText>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.email')}
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.password')}
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <NeonText type="caption" color={colors.status.error} style={styles.errorText}>
                    {error}
                  </NeonText>
                </View>
              ) : null}

              <View style={styles.buttonContainer}>
                <NeonButton
                  title={isLoading ? '...' : t('login.signIn')}
                  onPress={handleSignIn}
                  type="primary"
                  style={styles.signInButton}
                  disabled={isLoading}
                />

                <NeonButton
                  title={isLoading ? '...' : t('login.signUp')}
                  onPress={handleSignUp}
                  type="secondary"
                  style={styles.signUpButton}
                  disabled={isLoading}
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <NeonText type="caption" color={colors.text.secondary}>
                  {t('login.forgotPassword')}
                </NeonText>
              </TouchableOpacity>
            </NeonCard>
          </Animated.View>

          {/* Feature Icons Row */}
          <Animated.View style={[styles.iconContainer, iconsAnimation]}>
            {renderAnimatedIcon('robot', 'FontAwesome5', 'aiPicks')}
            {renderAnimatedIcon('chart-line', 'FontAwesome5', 'trackBets')}
            {renderAnimatedIcon('trophy', 'FontAwesome5', 'rewards', () =>
              navigation.navigate(ROUTES.REWARDS as never)
            )}
            {renderAnimatedIcon('bullseye', 'FontAwesome5', 'proAnalysis')}
            {renderAnimatedIcon('help-circle', 'Ionicons', 'helpFaq', () =>
              navigation.navigate(ROUTES.FAQ as never)
            )}
          </Animated.View>

          {/* Create Account Link */}
          <TouchableOpacity
            style={styles.createAccount}
            onPress={handleSignUp}
            accessibilityLabel={t('login.signUp')}
            accessibilityHint={t('login.signUp')}
          >
            <NeonText type="body" color={colors.text.secondary}>
              {t('login.dontHaveAccount')}{' '}
              <NeonText type="body" color={colors.neon.blue} glow>
                {t('login.signUp')}
              </NeonText>
            </NeonText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </NeonContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: spacing.xl,
  },
  formCard: {
    padding: spacing.md,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.sm,
  },
  signInButton: {
    flex: 1,
    marginRight: spacing.xs,
  },
  signUpButton: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  iconWrapper: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    width: width / 5,
  },
  iconInner: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  iconText: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  createAccount: {
    marginTop: spacing.md,
  },
  errorContainer: {
    marginBottom: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
  },
});

export default NeonLoginScreen;
