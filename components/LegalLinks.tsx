import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../atomic/organisms/i18n/LanguageContext';
import { ThemedText } from '../atomic/atoms/ThemedText';

interface LegalLinksProps {
  showTitle?: boolean;
  horizontal?: boolean;
  textSize?: 'small' | 'medium' | 'large';
}

/**
 * A component that displays links to the Privacy Policy and Terms of Service.
 * This can be used in various places in the app, such as the registration screen,
 * settings screen, or footer of the app.
 */
const LegalLinks: React.FC<LegalLinksProps> = ({
  showTitle = true,
  horizontal = false,
  textSize = 'medium'
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  // Font size based on the textSize prop
  const fontSize = {
    small: 12,
    medium: 14,
    large: 16
  }[textSize];

  // Open the Privacy Policy
  const openPrivacyPolicy = () => {
    // Navigate to the Legal screen with privacy-policy type
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Legal', { type: 'privacy-policy' });
  };

  // Open the Terms of Service
  const openTermsOfService = () => {
    // Navigate to the Legal screen with terms-of-service type
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Legal', { type: 'terms-of-service' });
  };

  return (
    <View style={[styles.container, horizontal ? styles.horizontal : styles.vertical]}>
      {showTitle && (
        <ThemedText style={[styles.title, { fontSize: fontSize + 2 }]}>
          {t('legal.legal_information')}
        </ThemedText>
      )}
      
      <View style={horizontal ? styles.linksHorizontal : styles.linksVertical}>
        <TouchableOpacity onPress={openPrivacyPolicy}>
          <ThemedText style={[styles.link, { color: colors.primary, fontSize }]}>
            {t('legal.privacy_policy')}
          </ThemedText>
        </TouchableOpacity>
        
        {horizontal && <ThemedText style={{ fontSize }}>•</ThemedText>}
        
        <TouchableOpacity onPress={openTermsOfService}>
          <ThemedText style={[styles.link, { color: colors.primary, fontSize }]}>
            {t('legal.terms_of_service')}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <ThemedText style={[styles.disclaimer, { fontSize: fontSize - 2 }]}>
        {t('legal.by_using_app')}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  horizontal: {
    alignItems: 'center',
  },
  vertical: {
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linksHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linksVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  link: {
    fontWeight: '500',
  },
  disclaimer: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  }
});

export default LegalLinks;