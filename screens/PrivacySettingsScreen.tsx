/**
 * Privacy Settings Screen
 *
 * This screen provides a user interface for managing privacy settings,
 * including consent preferences, data access, and data deletion requests.
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { PrivacySettingsScreen } from '../atomic/organisms/privacy';

/**
 * Screen component that wraps the PrivacySettingsScreen organism
 */
const PrivacySettingsScreenWrapper: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <PrivacySettingsScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PrivacySettingsScreenWrapper;
