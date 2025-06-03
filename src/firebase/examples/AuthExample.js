import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

import { auth, signIn, signInWithGoogle, createUser, logOut, onAuthChange } from '../auth';

/**
 * Example component demonstrating Firebase Authentication
 * This is for reference only and not intended for production use
 */
const AuthExample = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(user => {
      setUser(user);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle sign in
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { user, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Error', error.message);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { user, error } = await createUser(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Success', 'Account created successfully');
      setEmail('');
      setPassword('');
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { user, error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      Alert.alert('Google Sign In Error', error.message);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await logOut();
    setLoading(false);

    if (error) {
      Alert.alert('Sign Out Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Auth Example</Text>

      {user ? (
        // User is signed in
        <View style={styles.userContainer}>
          <Text style={styles.userInfo}>Signed in as:</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userId}>UID: {user.uid}</Text>

          <Button title="Sign Out" onPress={handleSignOut} disabled={loading} />
        </View>
      ) : (
        // User is not signed in
        <View style={styles.formContainer}>
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
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.buttonContainer}>
            <Button title="Sign In" onPress={handleSignIn} disabled={loading} />

            <Button title="Sign Up" onPress={handleSignUp} disabled={loading} />
          </View>

          <Button title="Sign In with Google" onPress={handleGoogleSignIn} disabled={loading} />
        </View>
      )}

      {loading && <Text style={styles.loading}>Loading...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  userContainer: {
    alignItems: 'center',
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  loading: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
});

export default AuthExample;
