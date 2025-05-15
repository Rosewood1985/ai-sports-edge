import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  /**
   * Message to display
   */
  message: string;
  
  /**
   * Optional icon component to display above the message
   */
  icon?: React.ReactNode;
  
  /**
   * Optional style overrides
   */
  style?: object;
}

/**
 * EmptyState component displays a message when there's no data to show
 * @param {EmptyStateProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const EmptyState = ({ 
  message, 
  icon, 
  style 
}: EmptyStateProps): JSX.Element => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
  },
});

export default EmptyState;