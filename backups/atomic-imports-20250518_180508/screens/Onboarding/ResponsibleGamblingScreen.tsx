import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';

type ResponsibleGamblingScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'ResponsibleGambling'
>;

const ResponsibleGamblingScreen = () => {
  const navigation = useNavigation<ResponsibleGamblingScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleContinue = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.not_authenticated'), [{ text: t('common.ok') }]);
      return;
    }

    if (!acknowledged) {
      Alert.alert(t('responsible_gambling.alert_title'), t('responsible_gambling.alert_message'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    try {
      // Save acknowledgment to user profile
      await saveVerificationData(user.uid, 'responsibleGamblingAcknowledgment', {
        acknowledged: true,
      });

      // Navigate to next screen
      navigation.navigate('LiabilityWaiver');
    } catch (error) {
      console.error('Error saving responsible gambling acknowledgment:', error);
      Alert.alert(t('common.error'), t('responsible_gambling.save_error'), [
        { text: t('common.ok') },
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>{t('responsible_gambling.title')}</ThemedText>

        <ThemedText style={styles.description}>{t('responsible_gambling.description')}</ThemedText>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAcknowledged(!acknowledged)}
          accessible
          accessibilityLabel={t('responsible_gambling.acknowledgment')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
        >
          <View style={[styles.checkbox, { borderColor: colors.text }]}>
            {acknowledged && <Ionicons name="checkmark" size={18} color={colors.primary} />}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            {t('responsible_gambling.acknowledgment')}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <ThemedText style={styles.tipsTitle}>{t('responsible_gambling.tips_title')}</ThemedText>

          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>{t('responsible_gambling.tip_1')}</ThemedText>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="trending-down-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>{t('responsible_gambling.tip_2')}</ThemedText>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="happy-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>{t('responsible_gambling.tip_3')}</ThemedText>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
            <ThemedText style={styles.tipText}>{t('responsible_gambling.tip_4')}</ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: acknowledged ? 1 : 0.5,
            },
          ]}
          onPress={handleContinue}
          disabled={!acknowledged}
          accessible
          accessibilityLabel={t('common.continue')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !acknowledged }}
        >
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
        </TouchableOpacity>

        <ThemedText style={styles.helpline}>{t('responsible_gambling.helpline')}</ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
  },
  continueButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpline: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ResponsibleGamblingScreen;
