import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingIndicatorProps {
  /**
   * Message to display below the loading indicator
   */
  message?: string;
  
  /**
   * Size of the activity indicator
   */
  size?: 'small' | 'large';
  
  /**
   * Color of the activity indicator
   */
  color?: string;
}

/**
 * LoadingIndicator component displays a loading spinner with an optional message
 * @param {LoadingIndicatorProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const LoadingIndicator = ({
  message = 'Loading...',
  size = 'large',
  color = '#0000ff'
}: LoadingIndicatorProps): JSX.Element => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  message: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
    color: '#555',
  },
});

export default LoadingIndicator;