import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

interface HeaderProps {
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
}

/**
 * Header component with title and refresh button
 * @param {HeaderProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const Header = ({ title, onRefresh, isLoading }: HeaderProps): JSX.Element => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    <Button 
      title="Refresh Odds" 
      onPress={onRefresh} 
      disabled={isLoading} 
    />
  </View>
);

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
});

export default Header;