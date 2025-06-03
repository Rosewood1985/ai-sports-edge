import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';

import { AccessibleThemedText } from '../../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../../atomic/atoms/AccessibleTouchableOpacity';
import accessibilityService from '../../services/accessibilityService';

/**
 * Example component demonstrating voice control integration
 * This component shows how to register voice commands and respond to them
 */
const VoiceControlExample: React.FC = () => {
  const [voiceControlEnabled, setVoiceControlEnabled] = useState<boolean>(
    accessibilityService.isVoiceControlEnabled()
  );
  const [voiceRecognitionActive, setVoiceRecognitionActive] = useState<boolean>(false);
  const [commands, setCommands] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();

  // Listen for voice control preference changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener(preferences => {
      setVoiceControlEnabled(preferences.voiceControl);
    });

    // Listen for voice recognition state changes
    const unsubscribeVoice = accessibilityService.addVoiceRecognitionListener(isActive => {
      setVoiceRecognitionActive(isActive);
    });

    return () => {
      unsubscribe();
      unsubscribeVoice();
    };
  }, []);

  // Register voice commands
  useEffect(() => {
    // Only register commands if voice control is enabled
    if (!voiceControlEnabled) return;

    // Command to scroll down
    const scrollDownCommand = accessibilityService.registerVoiceCommand({
      command: 'scroll down',
      handler: () => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 200, animated: true });
          addCommand('Executed: scroll down');
        }
      },
      description: 'Scrolls the content down',
    });

    // Command to scroll up
    const scrollUpCommand = accessibilityService.registerVoiceCommand({
      command: 'scroll up',
      handler: () => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
          addCommand('Executed: scroll up');
        }
      },
      description: 'Scrolls the content up',
    });

    // Command to show alert
    const showAlertCommand = accessibilityService.registerVoiceCommand({
      command: 'show alert',
      handler: () => {
        Alert.alert('Voice Command', 'This alert was triggered by a voice command!');
        addCommand('Executed: show alert');
      },
      description: 'Shows an alert dialog',
    });

    // Command to go back
    const goBackCommand = accessibilityService.registerVoiceCommand({
      command: 'go back',
      handler: () => {
        navigation.goBack();
        addCommand('Executed: go back');
      },
      description: 'Navigates back to the previous screen',
    });

    // Clean up on unmount
    return () => {
      scrollDownCommand();
      scrollUpCommand();
      showAlertCommand();
      goBackCommand();
    };
  }, [voiceControlEnabled, navigation]);

  // Add a command to the list of executed commands
  const addCommand = (command: string) => {
    setCommands(prevCommands => [command, ...prevCommands.slice(0, 9)]);
  };

  // Toggle voice control
  const toggleVoiceControl = async () => {
    await accessibilityService.setVoiceControlEnabled(!voiceControlEnabled);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel="Voice control example screen"
    >
      <AccessibleThemedText
        style={styles.title}
        type="h1"
        accessibilityRole="header"
        accessibilityLabel="Voice Control Example"
      >
        Voice Control Example
      </AccessibleThemedText>

      <AccessibleThemedView style={styles.statusContainer}>
        <AccessibleThemedText
          style={styles.statusLabel}
          type="bodyStd"
          accessibilityLabel="Voice control status"
        >
          Voice Control:
        </AccessibleThemedText>
        <AccessibleThemedText
          style={[styles.statusValue, { color: voiceControlEnabled ? '#39FF14' : '#FF3B30' }]}
          type="bodyStd"
          accessibilityLabel={`Voice control is ${voiceControlEnabled ? 'enabled' : 'disabled'}`}
        >
          {voiceControlEnabled ? 'Enabled' : 'Disabled'}
        </AccessibleThemedText>
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.statusContainer}>
        <AccessibleThemedText
          style={styles.statusLabel}
          type="bodyStd"
          accessibilityLabel="Voice recognition status"
        >
          Voice Recognition:
        </AccessibleThemedText>
        <AccessibleThemedText
          style={[styles.statusValue, { color: voiceRecognitionActive ? '#39FF14' : '#FF3B30' }]}
          type="bodyStd"
          accessibilityLabel={`Voice recognition is ${
            voiceRecognitionActive ? 'active' : 'inactive'
          }`}
        >
          {voiceRecognitionActive ? 'Active' : 'Inactive'}
        </AccessibleThemedText>
      </AccessibleThemedView>

      <AccessibleTouchableOpacity
        style={[
          styles.toggleButton,
          { backgroundColor: voiceControlEnabled ? '#FF3B30' : '#39FF14' },
        ]}
        onPress={toggleVoiceControl}
        accessibilityLabel={`${voiceControlEnabled ? 'Disable' : 'Enable'} voice control`}
        accessibilityRole="button"
        accessibilityHint="Toggles voice control on or off"
      >
        <AccessibleThemedText style={styles.buttonText} type="button">
          {voiceControlEnabled ? 'Disable Voice Control' : 'Enable Voice Control'}
        </AccessibleThemedText>
      </AccessibleTouchableOpacity>

      <AccessibleThemedView style={styles.instructionsContainer}>
        <AccessibleThemedText
          style={styles.instructionsTitle}
          type="h2"
          accessibilityRole="header"
          accessibilityLabel="Available voice commands"
        >
          Available Voice Commands:
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.instruction}
          type="bodyStd"
          accessibilityLabel="Say scroll down to scroll down"
        >
          • Say "scroll down" to scroll down
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.instruction}
          type="bodyStd"
          accessibilityLabel="Say scroll up to scroll up"
        >
          • Say "scroll up" to scroll up
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.instruction}
          type="bodyStd"
          accessibilityLabel="Say show alert to display an alert"
        >
          • Say "show alert" to display an alert
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.instruction}
          type="bodyStd"
          accessibilityLabel="Say go back to navigate back"
        >
          • Say "go back" to navigate back
        </AccessibleThemedText>
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.commandLogContainer}>
        <AccessibleThemedText
          style={styles.commandLogTitle}
          type="h2"
          accessibilityRole="header"
          accessibilityLabel="Command log"
        >
          Command Log:
        </AccessibleThemedText>
        {commands.length === 0 ? (
          <AccessibleThemedText
            style={styles.noCommands}
            type="bodyStd"
            accessibilityLabel="No commands executed yet"
          >
            No commands executed yet
          </AccessibleThemedText>
        ) : (
          commands.map((command, index) => (
            <AccessibleThemedText
              key={`${command}-${index}`}
              style={styles.commandLogEntry}
              type="bodyStd"
              accessibilityLabel={command}
            >
              {command}
            </AccessibleThemedText>
          ))
        )}
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  instruction: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    paddingLeft: 10,
  },
  commandLogContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  commandLogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  noCommands: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  commandLogEntry: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#3498db',
    paddingVertical: 3,
  },
  spacer: {
    height: 100,
  },
});

export default VoiceControlExample;
