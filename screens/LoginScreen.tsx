import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { StackNavigationProp } from "@react-navigation/stack";
import MobileAppDownload from "../components/MobileAppDownload";
import { appDownloadService } from "../services/appDownloadService";

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
  
  // Get app store URLs
  const { appStoreUrl, playStoreUrl, webAppUrl } = appDownloadService.getAppStoreUrls();
  
  // Check if we should show the download prompt after registration
  useEffect(() => {
    if (isNewUser && auth.currentUser) {
      const checkDownloadPrompt = async () => {
        const shouldShow = await appDownloadService.shouldShowDownloadPrompt(auth.currentUser!.uid);
        setShowDownloadPrompt(shouldShow);
      };
      
      checkDownloadPrompt();
    }
  }, [isNewUser]);
  
  // Handle closing the download prompt
  const handleCloseDownloadPrompt = async () => {
    if (auth.currentUser) {
      await appDownloadService.markDownloadPromptAsShown(auth.currentUser.uid);
    }
    setShowDownloadPrompt(false);
  };

  const handleSignUp = async (): Promise<void> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created!");
      setIsNewUser(true);
      // We'll navigate after the user has seen the download prompt
      // or immediately if the prompt isn't shown
      if (!(await appDownloadService.shouldShowDownloadPrompt(auth.currentUser!.uid))) {
        navigation.replace("Main");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLogin = async (): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in!");
      navigation.replace("Main");
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
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
      
      <Text style={styles.title}>AI Sports Edge</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={handleSignUp} />
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
    marginBottom: 20,
  },
  input: {
    width: "80%",
    padding: 10,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 5,
    marginBottom: 10,
  },
});