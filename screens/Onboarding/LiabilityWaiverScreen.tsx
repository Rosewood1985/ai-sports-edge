import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { useLanguage } from '../../../atomic/organisms/i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { safeErrorCapture } from '../../services/errorUtils';
import { info, error as logError, LogCategory } from '../../services/loggingService';
import { markOnboardingCompleted } from '../../services/onboardingService';
import { saveVerificationData } from '../../services/userService';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';

type LiabilityWaiverScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'LiabilityWaiver'
>;

const LiabilityWaiverScreen = () => {
  const navigation = useNavigation<LiabilityWaiverScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    console.log('LiabilityWaiverScreen: handleAccept called');

    if (!user) {
      console.log('LiabilityWaiverScreen: No user found');
      Alert.alert(t('common.error'), t('common.not_authenticated'), [{ text: t('common.ok') }]);
      return;
    }

    if (!hasScrolledToBottom || !hasAcknowledged) {
      console.log('LiabilityWaiverScreen: User has not scrolled to bottom or acknowledged');
      Alert.alert(t('liability.alert_title'), t('liability.alert_message'), [
        { text: t('common.ok') },
      ]);
      return;
    }

    try {
      console.log('LiabilityWaiverScreen: Saving waiver acceptance');

      // Save waiver acceptance to user profile
      await saveVerificationData(user.uid, 'waiverAcceptance', {
        accepted: true,
        version: '1.0',
      });

      // Mark onboarding as completed
      console.log('LiabilityWaiverScreen: Marking onboarding as completed');
      await markOnboardingCompleted();
      info(LogCategory.APP, 'Onboarding completed by user');

      // Navigate to main app
      // In a real app, this would navigate to the main app
      // For now, we'll just show an alert
      console.log('LiabilityWaiverScreen: Showing completion alert');
      Alert.alert(t('onboarding.complete_title'), t('onboarding.complete_message'), [
        {
          text: t('common.ok'),
          onPress: () => {
            console.log('LiabilityWaiverScreen: Navigating to Main app');
            // Reset navigation to main app
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }], // This would be 'Main' in a real app
            });
          },
        },
      ]);
    } catch (error) {
      console.error('LiabilityWaiverScreen: Error during acceptance process:', error);
      logError(LogCategory.APP, 'Error during liability waiver acceptance', error as Error);
      safeErrorCapture(error as Error);

      Alert.alert(t('common.error'), t('liability.save_error'), [{ text: t('common.ok') }]);
    }
  };

  const handleDecline = () => {
    Alert.alert(t('liability.decline_title'), t('liability.decline_message'), [
      {
        text: t('liability.review_again'),
        onPress: () => {
          // Scroll back to top
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        },
      },
      {
        text: t('liability.exit'),
        style: 'cancel',
        onPress: () => {
          // Navigate back to welcome screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>{t('liability.title')}</ThemedText>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          accessible
          accessibilityLabel={t('liability.content')}
          accessibilityRole="text"
          testID="waiver-scroll-view"
        >
          <ThemedText style={styles.content}>{t('liability.content')}</ThemedText>
        </ScrollView>

        {!hasScrolledToBottom && (
          <ThemedText style={[styles.scrollPrompt, { color: colors.primary }]}>
            {t('liability.scroll_to_continue')}
          </ThemedText>
        )}

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setHasAcknowledged(!hasAcknowledged)}
          disabled={!hasScrolledToBottom}
          accessible
          accessibilityLabel={t('liability.acknowledgment')}
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: hasAcknowledged,
            disabled: !hasScrolledToBottom,
          }}
          testID="waiver-checkbox"
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: colors.text,
                opacity: hasScrolledToBottom ? 1 : 0.5,
              },
            ]}
          >
            {hasAcknowledged && <Ionicons name="checkmark" size={18} color={colors.primary} />}
          </View>
          <ThemedText style={[styles.checkboxLabel, { opacity: hasScrolledToBottom ? 1 : 0.5 }]}>
            {t('liability.acknowledgment')}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.border }]}
            onPress={handleDecline}
            accessible
            accessibilityLabel={t('liability.decline')}
            accessibilityRole="button"
          >
            <ThemedText style={styles.declineButtonText}>{t('liability.decline')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              {
                backgroundColor: colors.primary,
                opacity: hasScrolledToBottom && hasAcknowledged ? 1 : 0.5,
              },
            ]}
            onPress={handleAccept}
            disabled={!hasScrolledToBottom || !hasAcknowledged}
            accessible
            accessibilityLabel={t('liability.accept')}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !hasScrolledToBottom || !hasAcknowledged,
            }}
          >
            <Text style={styles.acceptButtonText}>{t('liability.accept')}</Text>
          </TouchableOpacity>
        </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: '50%',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  waiverText: {
    fontSize: 14,
    lineHeight: 20,
  },
  scrollPrompt: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
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
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LiabilityWaiverScreen;
