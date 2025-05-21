import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Switch, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { ThemedView } from '../atomic/atoms/ThemedView';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { colors } from '../styles/theme';
import { ThemeToggle } from 'atomic/molecules/theme';

/**
 * Personalization Screen
 * Allows users to customize their app experience
 */
const PersonalizationScreen = () => {
  const navigation = useNavigation();
  const { preferences, updatePreferences, userProfile } = usePersonalization();

  // Local state for form values
  const [localPreferences, setLocalPreferences] = useState({ ...preferences });

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
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
    </View>
  );

  // Render toggle option
  const renderToggleOption = (
    key: string,
    title: string,
    description: string,
    value: boolean,
    isPremium: boolean = false
  ) => (
    <View style={styles.optionContainer}>
      <View style={styles.optionTextContainer}>
        <View style={styles.optionTitleContainer}>
          <ThemedText style={styles.optionTitle}>{title}</ThemedText>
          {isPremium && userProfile?.subscriptionTier !== 'elite' && (
            <View style={styles.premiumBadge}>
              <ThemedText style={styles.premiumBadgeText}>ELITE</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.optionDescription}>{description}</ThemedText>
      </View>
      <Switch
        value={
          isPremium && userProfile?.subscriptionTier !== 'elite'
            ? false
            : (localPreferences[key as keyof typeof localPreferences] as boolean)
        }
        onValueChange={value => handleToggle(key, value)}
        trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
        thumbColor={colors.background.primary}
        disabled={isPremium && userProfile?.subscriptionTier !== 'elite'}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Theme Preferences */}
        {renderSectionHeader('APPEARANCE')}

        {/* Use the new ThemeToggle component for dark mode */}
        <View style={styles.optionContainer}>
          <View style={styles.optionTextContainer}>
            <View style={styles.optionTitleContainer}>
              <ThemedText style={styles.optionTitle}>Dark Mode</ThemedText>
            </View>
            <ThemedText style={styles.optionDescription}>
              Use dark theme throughout the app
            </ThemedText>
          </View>
          <ThemeToggle variant="switch" />
        </View>

        {/* Content Preferences */}
        {renderSectionHeader('CONTENT')}
        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('FavoriteSports' as never)}
        >
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Favorite Sports</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Customize which sports appear in your feed
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('FavoriteTeams' as never)}
        >
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Favorite Teams</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Select teams to follow for updates and predictions
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </TouchableOpacity>

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
        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('RiskToleranceSettings' as never)}
        >
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Risk Tolerance</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Set your preferred level of risk for betting recommendations
            </ThemedText>
          </View>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueText}>
              {localPreferences.riskTolerance.charAt(0).toUpperCase() +
                localPreferences.riskTolerance.slice(1)}
            </ThemedText>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('OddsFormatSettings' as never)}
        >
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Odds Format</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Choose how odds are displayed throughout the app
            </ThemedText>
          </View>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueText}>
              {localPreferences.preferredOddsFormat.charAt(0).toUpperCase() +
                localPreferences.preferredOddsFormat.slice(1)}
            </ThemedText>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>

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
        <TouchableOpacity style={styles.saveButton} onPress={handleSavePreferences}>
          <ThemedText style={styles.saveButtonText}>SAVE PREFERENCES</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
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
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neon.blue,
    letterSpacing: 1,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
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
    color: colors.text.secondary,
  },
  premiumBadge: {
    backgroundColor: colors.neon.yellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: colors.neon.blue,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PersonalizationScreen;
