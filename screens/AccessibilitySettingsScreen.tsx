import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Switch, Platform } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { useThemeColor } from '../hooks/useThemeColor';
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';
import { trackEvent } from '../services/analyticsService';

/**
 * Screen for accessibility settings
 */
const AccessibilitySettingsScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );
  const [isScreenReaderActive, setIsScreenReaderActive] = useState<boolean>(
    accessibilityService.isScreenReaderActive()
  );

  // Theme colors
  const backgroundColor = useThemeColor({}, 'primaryBackground');
  const textColor = useThemeColor({}, 'primaryText');
  const primaryColor = '#0a7ea4';

  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener(newPreferences => {
      setPreferences(newPreferences);
      setIsScreenReaderActive(accessibilityService.isScreenReaderActive());
    });

    // Track screen view
    trackEvent('screen_view', { screen_name: 'AccessibilitySettings' });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Update a preference
   * @param key Preference key
   * @param value New value
   */
  const updatePreference = async (key: keyof AccessibilityPreferences, value: boolean) => {
    await accessibilityService.updatePreferences({ [key]: value });

    // Track event
    trackEvent('accessibility_setting_changed', {
      setting: key,
      value,
    });
  };

  /**
   * Reset preferences to default
   */
  const resetPreferences = async () => {
    await accessibilityService.resetPreferences();

    // Track event
    trackEvent('accessibility_settings_reset', {});
  };

  /**
   * Render a setting item
   * @param title Setting title
   * @param description Setting description
   * @param iconName Icon name
   * @param value Current value
   * @param onValueChange Value change handler
   * @param disabled Whether the setting is disabled
   */
  const renderSettingItem = (
    title: string,
    description: string,
    iconName: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled: boolean = false
  ) => {
    return (
      <AccessibleThemedView
        style={styles.settingItem}
        accessibilityLabel={`${title} setting`}
        accessibilityHint={description}
        accessibilityRole="switch"
      >
        <AccessibleThemedView
          style={styles.settingIconContainer}
          accessibilityLabel={`${title} icon`}
        >
          <Ionicons name={iconName as any} size={24} color={primaryColor} />
        </AccessibleThemedView>
        <AccessibleThemedView style={styles.settingContent}>
          <AccessibleThemedText style={styles.settingTitle} type="h4" accessibilityLabel={title}>
            {title}
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.settingDescription}
            type="bodySmall"
            accessibilityLabel={description}
          >
            {description}
          </AccessibleThemedText>
        </AccessibleThemedView>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: '#767577', true: primaryColor }}
          thumbColor={Platform.OS === 'ios' ? '#ffffff' : value ? '#ffffff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          accessibilityLabel={`${title} switch`}
          accessibilityState={{ checked: value, disabled }}
          accessibilityRole="switch"
          accessibilityHint={`Double tap to ${value ? 'disable' : 'enable'} ${title.toLowerCase()}`}
        />
      </AccessibleThemedView>
    );
  };

  return (
    <AccessibleThemedView
      style={styles.container}
      accessibilityLabel="Accessibility Settings Screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel="Accessibility settings options"
        accessibilityHint="Scroll to view all accessibility settings"
      >
        <AccessibleThemedView style={styles.section} accessibilityLabel="Text Settings Section">
          <AccessibleThemedText
            style={styles.sectionTitle}
            type="h2"
            accessibilityRole="header"
            accessibilityLabel="Text Settings"
          >
            Text Settings
          </AccessibleThemedText>

          {renderSettingItem(
            'Larger Text',
            'Increase the text size for better readability',
            'text',
            preferences.largeText,
            value => updatePreference('largeText', value)
          )}

          {renderSettingItem(
            'Bold Text',
            'Make text bold for better visibility',
            'text-sharp',
            preferences.boldText || accessibilityService.isBoldTextActive(),
            value => updatePreference('boldText', value),
            accessibilityService.isBoldTextActive() && Platform.OS === 'ios'
          )}
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.section} accessibilityLabel="Display Settings Section">
          <AccessibleThemedText
            style={styles.sectionTitle}
            type="h2"
            accessibilityRole="header"
            accessibilityLabel="Display Settings"
          >
            Display Settings
          </AccessibleThemedText>

          {renderSettingItem(
            'High Contrast',
            'Increase contrast for better visibility',
            'contrast',
            preferences.highContrast || accessibilityService.isHighContrastActive(),
            value => updatePreference('highContrast', value),
            accessibilityService.isHighContrastActive() && Platform.OS === 'ios'
          )}

          {renderSettingItem(
            'Reduce Motion',
            'Minimize animations and motion effects',
            'eye',
            preferences.reduceMotion || accessibilityService.isReduceMotionActive(),
            value => updatePreference('reduceMotion', value),
            accessibilityService.isReduceMotionActive()
          )}

          {renderSettingItem(
            'Grayscale',
            'Display content in grayscale',
            'color-filter',
            preferences.grayscale || accessibilityService.isGrayscaleActive(),
            value => updatePreference('grayscale', value),
            accessibilityService.isGrayscaleActive() && Platform.OS === 'ios'
          )}

          {renderSettingItem(
            'Invert Colors',
            'Invert screen colors for better contrast',
            'invert-mode',
            preferences.invertColors || accessibilityService.isInvertColorsActive(),
            value => updatePreference('invertColors', value),
            accessibilityService.isInvertColorsActive() && Platform.OS === 'ios'
          )}
        </AccessibleThemedView>

        <AccessibleThemedView
          style={styles.section}
          accessibilityLabel="Screen Reader Settings Section"
        >
          <AccessibleThemedText
            style={styles.sectionTitle}
            type="h2"
            accessibilityRole="header"
            accessibilityLabel="Screen Reader Settings"
          >
            Screen Reader Settings
          </AccessibleThemedText>

          {renderSettingItem(
            'Screen Reader Hints',
            'Provide additional hints for screen readers',
            'information-circle',
            preferences.screenReaderHints,
            value => updatePreference('screenReaderHints', value)
          )}

          <AccessibleThemedView
            style={styles.infoBox}
            accessibilityLabel="Screen reader status information"
          >
            <Ionicons name="information-circle" size={24} color={primaryColor} />
            <AccessibleThemedText
              style={styles.infoText}
              type="bodySmall"
              accessibilityLabel={
                isScreenReaderActive
                  ? 'Screen reader is currently active on your device.'
                  : 'Screen reader is currently inactive on your device. You can enable it in your device settings.'
              }
            >
              {isScreenReaderActive
                ? 'Screen reader is currently active on your device.'
                : 'Screen reader is currently inactive on your device. You can enable it in your device settings.'}
            </AccessibleThemedText>
          </AccessibleThemedView>
        </AccessibleThemedView>

        <AccessibleThemedView
          style={styles.resetContainer}
          accessibilityLabel="Reset settings section"
        >
          <AccessibleTouchableOpacity
            onPress={resetPreferences}
            accessibilityLabel="Reset to Default Settings"
            accessibilityRole="button"
            accessibilityHint="Double tap to reset all accessibility settings to their default values"
          >
            <AccessibleThemedText style={styles.resetText} type="button" color="statusLow">
              Reset to Default Settings
            </AccessibleThemedText>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.helpSection} accessibilityLabel="Help section">
          <AccessibleThemedText
            style={styles.helpTitle}
            type="h3"
            accessibilityRole="header"
            accessibilityLabel="Need Help?"
          >
            Need Help?
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.helpText}
            type="bodySmall"
            accessibilityLabel="If you need assistance with accessibility features, please contact our support team at support@aisportsedge.app"
          >
            If you need assistance with accessibility features, please contact our support team at
            support@aisportsedge.app
          </AccessibleThemedText>
        </AccessibleThemedView>
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  resetContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  resetText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
  },
  helpSection: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AccessibilitySettingsScreen;
