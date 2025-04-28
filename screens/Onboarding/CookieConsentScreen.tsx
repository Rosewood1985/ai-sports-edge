import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';

type CookieConsentScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'CookieConsent'
>;

const CookieConsentScreen = () => {
  const navigation = useNavigation<CookieConsentScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Cookie consent options
  const [essentialCookies, setEssentialCookies] = useState(true); // Always required
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [marketingCookies, setMarketingCookies] = useState(false);
  const [preferenceCookies, setPreferenceCookies] = useState(false);
  
  const handleContinue = async () => {
    if (!user) {
      Alert.alert(
        t('common.error'),
        t('common.not_authenticated'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    try {
      // Save cookie consent to user profile
      await saveVerificationData(user.uid, 'cookieConsent', {
        essentialCookies,
        analyticsCookies,
        marketingCookies,
        preferenceCookies,
        timestamp: new Date().toISOString()
      });
      
      // Navigate to next screen (Age Verification)
      navigation.navigate('AgeVerification');
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      Alert.alert(
        t('common.error'),
        t('cookie.save_error'),
        [{ text: t('common.ok') }]
      );
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            {t('cookie.title')}
          </ThemedText>
          
          <ThemedText style={styles.description}>
            {t('cookie.description')}
          </ThemedText>
          
          {/* Essential Cookies - Always required */}
          <View style={styles.cookieSection}>
            <View style={styles.cookieHeader}>
              <ThemedText style={styles.cookieTitle}>
                {t('cookie.essential_title')}
              </ThemedText>
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                }
              ]}>
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            </View>
            
            <ThemedText style={styles.cookieDescription}>
              {t('cookie.essential_description')}
            </ThemedText>
          </View>
          
          {/* Analytics Cookies */}
          <TouchableOpacity 
            style={styles.cookieSection}
            onPress={() => setAnalyticsCookies(!analyticsCookies)}
            accessible={true}
            accessibilityLabel={t('cookie.analytics_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: analyticsCookies }}
          >
            <View style={styles.cookieHeader}>
              <ThemedText style={styles.cookieTitle}>
                {t('cookie.analytics_title')}
              </ThemedText>
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: analyticsCookies ? colors.primary : 'transparent',
                  borderColor: colors.primary
                }
              ]}>
                {analyticsCookies && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>
            
            <ThemedText style={styles.cookieDescription}>
              {t('cookie.analytics_description')}
            </ThemedText>
          </TouchableOpacity>
          
          {/* Marketing Cookies */}
          <TouchableOpacity 
            style={styles.cookieSection}
            onPress={() => setMarketingCookies(!marketingCookies)}
            accessible={true}
            accessibilityLabel={t('cookie.marketing_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingCookies }}
          >
            <View style={styles.cookieHeader}>
              <ThemedText style={styles.cookieTitle}>
                {t('cookie.marketing_title')}
              </ThemedText>
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: marketingCookies ? colors.primary : 'transparent',
                  borderColor: colors.primary
                }
              ]}>
                {marketingCookies && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>
            
            <ThemedText style={styles.cookieDescription}>
              {t('cookie.marketing_description')}
            </ThemedText>
          </TouchableOpacity>
          
          {/* Preference Cookies */}
          <TouchableOpacity 
            style={styles.cookieSection}
            onPress={() => setPreferenceCookies(!preferenceCookies)}
            accessible={true}
            accessibilityLabel={t('cookie.preference_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: preferenceCookies }}
          >
            <View style={styles.cookieHeader}>
              <ThemedText style={styles.cookieTitle}>
                {t('cookie.preference_title')}
              </ThemedText>
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: preferenceCookies ? colors.primary : 'transparent',
                  borderColor: colors.primary
                }
              ]}>
                {preferenceCookies && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>
            
            <ThemedText style={styles.cookieDescription}>
              {t('cookie.preference_description')}
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.cookieNote}>
            {t('cookie.note')}
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.acceptSelectedButton, { borderColor: colors.border }]}
              onPress={handleContinue}
              accessible={true}
              accessibilityLabel={t('cookie.accept_selected')}
              accessibilityRole="button"
            >
              <ThemedText style={styles.acceptSelectedButtonText}>
                {t('cookie.accept_selected')}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.acceptAllButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setAnalyticsCookies(true);
                setMarketingCookies(true);
                setPreferenceCookies(true);
                setTimeout(handleContinue, 300);
              }}
              accessible={true}
              accessibilityLabel={t('cookie.accept_all')}
              accessibilityRole="button"
            >
              <Text style={styles.acceptAllButtonText}>
                {t('cookie.accept_all')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.cookiePolicyLink}
            onPress={() => {
              // Navigate to cookie policy
              navigation.navigate('Legal', { type: 'privacy-policy' });
            }}
            accessible={true}
            accessibilityLabel={t('cookie.view_policy')}
            accessibilityRole="link"
          >
            <ThemedText style={[styles.cookiePolicyLinkText, { color: colors.primary }]}>
              {t('cookie.view_policy')}
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  content: {
    padding: 24,
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
  cookieSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cookieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cookieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cookieDescription: {
    fontSize: 14,
  },
  cookieNote: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  acceptSelectedButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  acceptSelectedButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptAllButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cookiePolicyLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cookiePolicyLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default CookieConsentScreen;