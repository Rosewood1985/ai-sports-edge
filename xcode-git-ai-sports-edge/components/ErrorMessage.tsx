import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Optional style overrides
   */
  style?: object;
}

/**
 * ErrorMessage component displays an error message
 * @param {ErrorMessageProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ErrorMessage = ({ message, style }: ErrorMessageProps): JSX.Element => {
  return (
    <Text style={[styles.error, style]}>
      {message}
    </Text>
  );
};

const styles = StyleSheet.create({
  error: {
    color: 'red',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ErrorMessage;