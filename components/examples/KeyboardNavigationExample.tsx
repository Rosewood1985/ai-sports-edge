import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AccessibleTouchable from '../AccessibleTouchable';
import AccessibleText from '../AccessibleText';
import accessibilityService from '../../services/accessibilityService';

/**
 * Example component demonstrating keyboard navigation
 */
const KeyboardNavigationExample: React.FC = () => {
  const [focusedButton, setFocusedButton] = useState<string | null>(null);

  // Handle button press
  const handleButtonPress = (buttonId: string) => {
    console.log(`Button ${buttonId} pressed`);
  };

  // Handle button focus
  const handleButtonFocus = (buttonId: string) => {
    setFocusedButton(buttonId);
    console.log(`Button ${buttonId} focused`);
  };

  // Handle button blur
  const handleButtonBlur = () => {
    setFocusedButton(null);
  };

  return (
    <View style={styles.container}>
      <AccessibleText
        style={styles.title}
        accessibilityRole="header"
        accessibilityLabel="Keyboard Navigation Example"
      >
        Keyboard Navigation Example
      </AccessibleText>

      <AccessibleText style={styles.instructions}>
        Use Tab key to navigate between buttons. Use Enter or Space to activate buttons. Arrow keys
        can also be used for navigation.
      </AccessibleText>

      <View style={styles.buttonRow}>
        <AccessibleTouchable
          style={[styles.button, focusedButton === 'button1' && styles.focusedButton]}
          accessibilityLabel="Button 1"
          accessibilityHint="Press to activate button 1"
          accessibilityRole="button"
          keyboardNavigationId="button1"
          nextElementId="button2"
          prevElementId="button4"
          autoFocus={true}
          onPress={() => handleButtonPress('button1')}
          onFocus={() => handleButtonFocus('button1')}
          onBlur={handleButtonBlur}
        >
          <AccessibleText style={styles.buttonText}>Button 1</AccessibleText>
        </AccessibleTouchable>

        <AccessibleTouchable
          style={[styles.button, focusedButton === 'button2' && styles.focusedButton]}
          accessibilityLabel="Button 2"
          accessibilityHint="Press to activate button 2"
          accessibilityRole="button"
          keyboardNavigationId="button2"
          nextElementId="button3"
          prevElementId="button1"
          onPress={() => handleButtonPress('button2')}
          onFocus={() => handleButtonFocus('button2')}
          onBlur={handleButtonBlur}
        >
          <AccessibleText style={styles.buttonText}>Button 2</AccessibleText>
        </AccessibleTouchable>
      </View>

      <View style={styles.buttonRow}>
        <AccessibleTouchable
          style={[styles.button, focusedButton === 'button3' && styles.focusedButton]}
          accessibilityLabel="Button 3"
          accessibilityHint="Press to activate button 3"
          accessibilityRole="button"
          keyboardNavigationId="button3"
          nextElementId="button4"
          prevElementId="button2"
          onPress={() => handleButtonPress('button3')}
          onFocus={() => handleButtonFocus('button3')}
          onBlur={handleButtonBlur}
        >
          <AccessibleText style={styles.buttonText}>Button 3</AccessibleText>
        </AccessibleTouchable>

        <AccessibleTouchable
          style={[styles.button, focusedButton === 'button4' && styles.focusedButton]}
          accessibilityLabel="Button 4"
          accessibilityHint="Press to activate button 4"
          accessibilityRole="button"
          keyboardNavigationId="button4"
          nextElementId="button1"
          prevElementId="button3"
          onPress={() => handleButtonPress('button4')}
          onFocus={() => handleButtonFocus('button4')}
          onBlur={handleButtonBlur}
        >
          <AccessibleText style={styles.buttonText}>Button 4</AccessibleText>
        </AccessibleTouchable>
      </View>

      <View style={styles.statusContainer}>
        <AccessibleText style={styles.statusText}>
          {focusedButton ? `Focused: ${focusedButton}` : 'No button focused'}
        </AccessibleText>

        <AccessibleText style={styles.statusText}>
          Keyboard Navigation:{' '}
          {accessibilityService.isKeyboardNavigationEnabled() ? 'Enabled' : 'Disabled'}
        </AccessibleText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 24,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  focusedButton: {
    borderWidth: 2,
    borderColor: '#3B82F6', // Neon blue
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  statusText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default KeyboardNavigationExample;
