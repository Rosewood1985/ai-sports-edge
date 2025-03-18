import React, { useState } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NeonText, NeonButton, NeonContainer, NeonCard } from "../components/ui";
import { colors, spacing, borderRadius } from "../styles/theme";
import { useHoverEffect, useGlowHoverEffect, useFadeIn, useSlideIn } from "../utils/animationUtils";

const { width } = Dimensions.get('window');

const NeonLoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Animation hooks
  const titleOpacity = useFadeIn(800, 300);
  const formAnimation = useSlideIn(800, 600, 'bottom', 50);
  const iconsAnimation = useSlideIn(800, 900, 'bottom', 50);

  // Create animated icon components with hover effects
  const renderAnimatedIcon = (
    name: string,
    iconComponent: 'FontAwesome5' | 'Ionicons',
    label: string,
    onPress?: () => void
  ) => {
    const { animatedStyle, onPressIn, onPressOut } = useHoverEffect(1.1);
    const { glowOpacity, glowRadius, onPressIn: glowIn, onPressOut: glowOut } = useGlowHoverEffect('low', 'high');

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
      >
        <Animated.View style={[
          styles.iconInner,
          animatedStyle,
          {
            shadowOpacity: glowOpacity,
            shadowRadius: glowRadius,
            shadowColor: colors.neon.blue,
            shadowOffset: { width: 0, height: 0 },
          }
        ]}>
          {iconComponent === 'FontAwesome5' ? (
            <FontAwesome5 name={name as any} size={32} color={colors.neon.blue} />
          ) : (
            <Ionicons name={name as any} size={32} color={colors.neon.blue} />
          )}
        </Animated.View>
        <NeonText type="caption" color={colors.text.primary} style={styles.iconText}>
          {label}
        </NeonText>
      </TouchableOpacity>
    );
  };

  const handleSignIn = () => {
    // In a real app, this would validate credentials
    navigation.navigate('PersonalizedHome' as never);
  };

  return (
    <NeonContainer gradient={true} gradientColors={[colors.background.primary, '#0D0D0D']}>
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
            <NeonText 
              type="heading" 
              glow={true} 
              intensity="high" 
              style={styles.title}
            >
              AI SPORTS EDGE
            </NeonText>
            <NeonText 
              type="caption" 
              color={colors.neon.cyan} 
              glow={true} 
              style={styles.subtitle}
            >
              POWERED BY ADVANCED AI
            </NeonText>
          </Animated.View>

          {/* Login Form */}
          <Animated.View style={[styles.formContainer, formAnimation]}>
            <NeonCard 
              borderColor={colors.border.default}
              glowIntensity="low"
              gradient={true}
              gradientColors={[colors.background.secondary, colors.background.tertiary]}
              style={styles.formCard}
            >
              <NeonText type="subheading" glow={true} style={styles.formTitle}>
                SIGN IN
              </NeonText>
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email" 
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              <NeonButton
                title="SIGN IN"
                onPress={handleSignIn}
                type="primary"
                style={styles.signInButton}
              />
              
              <TouchableOpacity style={styles.forgotPassword}>
                <NeonText type="caption" color={colors.text.secondary}>
                  Forgot Password?
                </NeonText>
              </TouchableOpacity>
            </NeonCard>
          </Animated.View>

          {/* Feature Icons Row */}
          <Animated.View style={[styles.iconContainer, iconsAnimation]}>
            {renderAnimatedIcon("robot", "FontAwesome5", "AI Picks")}
            {renderAnimatedIcon("chart-line", "FontAwesome5", "Track Bets")}
            {renderAnimatedIcon("trophy", "FontAwesome5", "Rewards", () => navigation.navigate("Rewards" as never))}
            {renderAnimatedIcon("bullseye", "FontAwesome5", "Pro Analysis")}
            {renderAnimatedIcon("help-circle", "Ionicons", "Help & FAQ", () => navigation.navigate("FAQ" as never))}
          </Animated.View>
          
          {/* Create Account Link */}
          <TouchableOpacity style={styles.createAccount}>
            <NeonText type="body" color={colors.text.secondary}>
              Don't have an account?{" "}
              <NeonText type="body" color={colors.neon.blue} glow={true}>
                Sign Up
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
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    textAlign: "center",
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: "center",
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: spacing.xl,
  },
  formCard: {
    padding: spacing.md,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  signInButton: {
    marginTop: spacing.sm,
  },
  forgotPassword: {
    alignSelf: "center",
    marginTop: spacing.md,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  iconWrapper: {
    alignItems: "center",
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
    textAlign: "center",
    marginTop: spacing.xs,
  },
  createAccount: {
    marginTop: spacing.md,
  },
});

export default NeonLoginScreen;