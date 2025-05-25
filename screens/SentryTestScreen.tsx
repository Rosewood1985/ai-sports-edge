/**
 * Sentry Test Screen
 * Screen wrapper for the Sentry Test Component
 * 
 * This screen provides a dedicated interface for testing Sentry integration
 * and can be easily added to your navigation for testing purposes.
 */

import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import SentryTestComponent from '../components/SentryTestComponent';

export const SentryTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#363062" />
      <View style={styles.content}>
        <SentryTestComponent />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});

export default SentryTestScreen;