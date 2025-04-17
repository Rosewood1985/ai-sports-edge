import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { StackNavigationProp } from "@react-navigation/stack";
import { useI18n } from "../../contexts/I18nContext";
import { getAuth } from "firebase/auth";
import ThemeToggle from "../../components/ThemeToggle";

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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get translations
  const { t } = useI18n();
  
  const handleSignUp = async (): Promise<void> => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("signup.errors.emailRequired") || "Email is required");
      return;
    }
    
    if (!password.trim()) {
      Alert.alert(t("common.error"), t("signup.errors.passwordRequired") || "Password is required");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("signup.errors.passwordsDoNotMatch") || "Passwords do not match");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("common.error"), t("signup.errors.invalidEmail") || "Invalid email format");
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      Alert.alert(t("common.error"), t("signup.errors.passwordTooShort") || "Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get auth instance directly
      const auth = getAuth();
      
      // Create user with Firebase
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert(
        t("signup.features.signUp") || "Sign Up", 
        t("signup.alerts.accountCreated") || "Account created successfully!"
      );
      
      // Navigate to main screen
      navigation.replace("Main");
    } catch (error: any) {
      // Sanitize error messages to avoid exposing sensitive information
      let errorMessage = t("signup.errors.signUpFailed") || "Failed to create account";
      
      // Only show specific error messages for known error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t("signup.errors.emailInUse") || "Email is already in use";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t("signup.errors.weakPassword") || "Password is too weak";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t("signup.errors.invalidEmail") || "Invalid email format";
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = t("signup.errors.apiKeyInvalid") || "API key is not valid";
        console.error('API Key validation failed:', error);
      }
      
      Alert.alert(t("common.error") || "Error", errorMessage);
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("signup.title") || "Create Account"}</Text>
        <Text style={styles.subtitle}>{t("signup.subtitle") || "Join AI Sports Edge for premium betting insights"}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t("signup.email") || "Email"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="signup-email-input"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t("signup.password") || "Password"}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          testID="signup-password-input"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t("signup.confirmPassword") || "Confirm Password"}
          value={confirmPassword}
          secureTextEntry
          onChangeText={setConfirmPassword}
          testID="signup-confirm-password-input"
        />
        
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={handleSignUp}
          disabled={isLoading}
          testID="signup-button"
        >
          <Text style={styles.signupButtonText}>
            {isLoading ? (t("signup.signingUp") || "Creating Account...") : (t("signup.signUp") || "Sign Up")}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.loginContainer}>
          <Text style={styles.alreadyHaveAccount}>
            {t("signup.alreadyHaveAccount") || "Already have an account?"}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>{t("signup.login") || "Log In"}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            {t("signup.termsText") || "By signing up, you agree to our"}
          </Text>
          <TouchableOpacity>
            <Text style={styles.termsLink}>
              {t("signup.termsLink") || "Terms of Service and Privacy Policy"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "90%",
    padding: 15,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  signupButton: {
    width: "90%",
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  signupButtonText: {
    color: "#121212",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 25,
    alignItems: "center",
  },
  alreadyHaveAccount: {
    color: "#CCCCCC",
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 14,
  },
  termsContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  termsText: {
    color: "#CCCCCC",
    fontSize: 12,
  },
  termsLink: {
    color: "#FFD700",
    fontSize: 12,
    marginTop: 5,
  }
});