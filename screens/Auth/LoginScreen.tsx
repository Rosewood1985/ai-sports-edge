import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { useUITheme } from "../../components/UIThemeProvider";
import ThemeToggle from "../../components/ThemeToggle";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const { theme } = useUITheme();

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("Home" as never); // or 'Dashboard', etc.
    } catch (err: any) {
      setError(err.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSize.h1,
      fontWeight: theme.typography.fontWeight.bold as '700',
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.heading,
      marginBottom: theme.spacing.lg,
    },
    input: {
      width: "100%",
      backgroundColor: theme.colors.surfaceBackground,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.bodyStd,
    },
    button: {
      width: "100%",
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: "center",
    },
    buttonText: { 
      color: theme.colors.onPrimary, 
      fontWeight: theme.typography.fontWeight.semiBold as '600', 
      fontSize: theme.typography.fontSize.button 
    },
    link: { 
      marginTop: theme.spacing.md, 
      color: theme.colors.textSecondary, 
      textDecorationLine: "underline",
      fontSize: theme.typography.fontSize.bodyStd,
    },
    error: {
      color: theme.colors.error,
      marginBottom: theme.spacing.sm,
      fontSize: theme.typography.fontSize.small,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Sports Edge</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.textTertiary}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup" as never)}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword" as never)}
      >
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </View>
  );
};

export default LoginScreen;
