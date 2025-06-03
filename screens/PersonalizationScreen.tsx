import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeToggle } from 'atomic/molecules/theme';
import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Switch, Alert } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { Colors } from '../constants/Colors';
import { usePersonalization } from '../contexts/PersonalizationContext';

// Use the dark theme colors
const colors = Colors.dark;

/**
 * Personalization Screen
 * Allows users to customize their app experience
 */
const PersonalizationScreen = () => {
  const navigation = useNavigation();
  const { preferences, updatePreferences } = usePersonalization();

  // Local state for form values
  const [localPreferences, setLocalPreferences] = useState({
    enablePushNotifications: true,
    notifyBeforeGames: true,
    notifyForFavoriteTeams: true,
    notifyForBettingOpportunities: false,
    showLiveScores: true,
    showPredictionConfidence: true,
    showBettingHistory: true,
    shareDataForBetterPredictions: true,
    anonymousUsageStats: true,
    riskTolerance: 'medium',
    preferredOddsFormat: 'american',
    ...preferences,
  });

  // Handle toggle change
  const handleToggle = (key: string, value: boolean) => {
    setLocalPreferences({
      ...localPreferences,
      [key]: value,
    });
  };

  // Handle save preferences
  const handleSavePreferences = async () => {
    try {
      await updatePreferences(localPreferences);
      Alert.alert('Success', 'Your preferences have been saved.');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  // Render section header
  const renderSectionHeader = (title: string) => (
    <AccessibleThemedView style={styles.sectionHeader} accessibilityRole="header">
      <AccessibleThemedText
        style={styles.sectionHeaderText}
        type="h2"
        accessibilityLabel={`${title} section`}
      >
        {title}
      </AccessibleThemedText>
    </AccessibleThemedView>
  );

  // Render toggle option
  const renderToggleOption = (
    key: string,
    title: string,
    description: string,
    value: boolean,
    isPremium: boolean = false
  ) => (
    <AccessibleThemedView
      style={styles.optionContainer}
      accessibilityState={{
        checked: isPremium
          ? false
          : (localPreferences[key as keyof typeof localPreferences] as boolean),
        disabled: isPremium,
      }}
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <AccessibleThemedView style={styles.optionTextContainer}>
        <AccessibleThemedView style={styles.optionTitleContainer}>
          <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
            {title}
          </AccessibleThemedText>
          {isPremium && (
            <AccessibleThemedView style={styles.premiumBadge} accessibilityLabel="Elite feature">
              <AccessibleThemedText style={styles.premiumBadgeText} type="small">
                ELITE
              </AccessibleThemedText>
            </AccessibleThemedView>
          )}
        </AccessibleThemedView>
        <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
          {description}
        </AccessibleThemedText>
      </AccessibleThemedView>
      <Switch
        value={
          isPremium ? false : (localPreferences[key as keyof typeof localPreferences] as boolean)
        }
        onValueChange={value => handleToggle(key, value)}
        trackColor={{ false: colors.surfaceBackground, true: colors.primaryAction }}
        thumbColor={colors.primaryBackground}
        disabled={isPremium}
        accessibilityLabel={title}
        accessibilityHint={`Toggle ${description.toLowerCase()}`}
      />
    </AccessibleThemedView>
  );

  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel="Personalization Screen">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 20 }}
        accessibilityLabel="Personalization options"
        accessibilityHint="Scroll to view all personalization options"
      >
        {/* Theme Preferences */}
        {renderSectionHeader('APPEARANCE')}

        {/* Use the new ThemeToggle component for dark mode */}
        <AccessibleThemedView
          style={styles.optionContainer}
          accessibilityRole="switch"
          accessibilityLabel="Dark Mode"
          accessibilityHint="Toggle dark theme throughout the app"
        >
          <AccessibleThemedView style={styles.optionTextContainer}>
            <AccessibleThemedView style={styles.optionTitleContainer}>
              <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
                Dark Mode
              </AccessibleThemedText>
            </AccessibleThemedView>
            <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
              Use dark theme throughout the app
            </AccessibleThemedText>
          </AccessibleThemedView>
          <ThemeToggle variant="switch" />
        </AccessibleThemedView>

        {/* Content Preferences */}
        {renderSectionHeader('CONTENT')}
        <AccessibleTouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('FavoriteSports' as never)}
          accessibilityRole="button"
          accessibilityLabel="Favorite Sports"
          accessibilityHint="Customize which sports appear in your feed"
        >
          <AccessibleThemedView style={styles.optionTextContainer}>
            <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
              Favorite Sports
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
              Customize which sports appear in your feed
            </AccessibleThemedText>
          </AccessibleThemedView>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </AccessibleTouchableOpacity>

        <AccessibleTouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('FavoriteTeams' as never)}
          accessibilityRole="button"
          accessibilityLabel="Favorite Teams"
          accessibilityHint="Select teams to follow for updates and predictions"
        >
          <AccessibleThemedView style={styles.optionTextContainer}>
            <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
              Favorite Teams
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
              Select teams to follow for updates and predictions
            </AccessibleThemedText>
          </AccessibleThemedView>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </AccessibleTouchableOpacity>

        {/* Notification Preferences */}
        {renderSectionHeader('NOTIFICATIONS')}
        {renderToggleOption(
          'enablePushNotifications',
          'Push Notifications',
          'Receive notifications on your device',
          localPreferences.enablePushNotifications
        )}

        {renderToggleOption(
          'notifyBeforeGames',
          'Game Reminders',
          'Get notified before games start',
          localPreferences.notifyBeforeGames
        )}

        {renderToggleOption(
          'notifyForFavoriteTeams',
          'Favorite Team Updates',
          'Get notified about your favorite teams',
          localPreferences.notifyForFavoriteTeams
        )}

        {renderToggleOption(
          'notifyForBettingOpportunities',
          'Betting Opportunities',
          'Get notified about high-value betting opportunities',
          localPreferences.notifyForBettingOpportunities,
          true
        )}

        {/* Betting Preferences */}
        {renderSectionHeader('BETTING PREFERENCES')}
        <AccessibleTouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('RiskToleranceSettings' as never)}
          accessibilityRole="button"
          accessibilityLabel="Risk Tolerance"
          accessibilityHint="Set your preferred level of risk for betting recommendations"
        >
          <AccessibleThemedView style={styles.optionTextContainer}>
            <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
              Risk Tolerance
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
              Set your preferred level of risk for betting recommendations
            </AccessibleThemedText>
          </AccessibleThemedView>
          <AccessibleThemedView style={styles.valueContainer}>
            <AccessibleThemedText style={styles.valueText} type="bodySmall">
              {localPreferences.riskTolerance.charAt(0).toUpperCase() +
                localPreferences.riskTolerance.slice(1)}
            </AccessibleThemedText>
            <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
          </AccessibleThemedView>
        </AccessibleTouchableOpacity>

        <AccessibleTouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('OddsFormatSettings' as never)}
          accessibilityRole="button"
          accessibilityLabel="Odds Format"
          accessibilityHint="Choose how odds are displayed throughout the app"
        >
          <AccessibleThemedView style={styles.optionTextContainer}>
            <AccessibleThemedText style={styles.optionTitle} type="bodyStd">
              Odds Format
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.optionDescription} type="bodySmall">
              Choose how odds are displayed throughout the app
            </AccessibleThemedText>
          </AccessibleThemedView>
          <AccessibleThemedView style={styles.valueContainer}>
            <AccessibleThemedText style={styles.valueText} type="bodySmall">
              {localPreferences.preferredOddsFormat.charAt(0).toUpperCase() +
                localPreferences.preferredOddsFormat.slice(1)}
            </AccessibleThemedText>
            <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
          </AccessibleThemedView>
        </AccessibleTouchableOpacity>

        {/* Display Preferences */}
        {renderSectionHeader('DISPLAY')}
        {renderToggleOption(
          'showLiveScores',
          'Live Scores',
          'Show live scores on the home screen',
          localPreferences.showLiveScores
        )}

        {renderToggleOption(
          'showPredictionConfidence',
          'Prediction Confidence',
          'Show confidence level for AI predictions',
          localPreferences.showPredictionConfidence
        )}

        {renderToggleOption(
          'showBettingHistory',
          'Betting History',
          'Show your betting history on the profile screen',
          localPreferences.showBettingHistory
        )}

        {/* Privacy Preferences */}
        {renderSectionHeader('PRIVACY')}
        {renderToggleOption(
          'shareDataForBetterPredictions',
          'Share Data for Better Predictions',
          'Allow us to use your betting history to improve predictions',
          localPreferences.shareDataForBetterPredictions
        )}

        {renderToggleOption(
          'anonymousUsageStats',
          'Anonymous Usage Statistics',
          'Help us improve by sharing anonymous usage data',
          localPreferences.anonymousUsageStats
        )}

        {/* Save Button */}
        <AccessibleTouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePreferences}
          accessibilityRole="button"
          accessibilityLabel="Save Preferences"
          accessibilityHint="Save all your personalization preferences"
        >
          <AccessibleThemedText style={styles.saveButtonText} type="button">
            SAVE PREFERENCES
          </AccessibleThemedText>
        </AccessibleTouchableOpacity>
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.tertiaryText,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryAction,
    letterSpacing: 1,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.tertiaryText,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  premiumBadge: {
    backgroundColor: Colors.status.mediumConfidence,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primaryBackground,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: colors.secondaryText,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: colors.primaryAction,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.primaryBackground,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PersonalizationScreen;
