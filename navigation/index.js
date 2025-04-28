/**
 * Navigation Component
 * This is a placeholder navigation component for the AI Sports Edge app.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Navigation = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Sports Edge</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Navigation;