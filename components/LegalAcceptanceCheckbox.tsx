/**
 * Legal Acceptance Checkbox Component
 *
 * This component provides a checkbox for users to accept Terms of Service
 * and Privacy Policy during signup, with links to view the full documents.
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTranslation } from '../hooks/useTranslation';

interface LegalAcceptanceCheckboxProps {
  isAccepted: boolean;
  onAcceptanceChange: (accepted: boolean) => void;
  showNavigationLinks?: boolean;
}

const LegalAcceptanceCheckbox: React.FC<LegalAcceptanceCheckboxProps> = ({
  isAccepted,
  onAcceptanceChange,
  showNavigationLinks = true,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const linkColor = useThemeColor({}, 'link');

  const handleCheckboxPress = () => {
    onAcceptanceChange(!isAccepted);
  };

  const handlePrivacyPolicyPress = () => {
    if (showNavigationLinks) {
      navigation.navigate('PrivacyPolicy');
    } else {
      // Fallback to external link if navigation is not available
      Linking.openURL('https://aisportsedge.com/privacy-policy');
    }
  };

  const handleTermsPress = () => {
    if (showNavigationLinks) {
      navigation.navigate('TermsOfService');
    } else {
      // Fallback to external link if navigation is not available
      Linking.openURL('https://aisportsedge.com/terms-of-service');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={handleCheckboxPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isAccepted }}
        accessibilityLabel={t('auth.agree_to_terms')}
      >
        <View style={[
          styles.checkbox, 
          { borderColor: primaryColor },
          isAccepted && { backgroundColor: primaryColor }
        ]}>
          {isAccepted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.agreementText, { color: textColor }]}>
            {t('auth.by_signing_up')}{' '}
          </Text>
          
          <TouchableOpacity 
            onPress={handleTermsPress}
            accessibilityRole="link"
            accessibilityLabel={t('auth.terms_and_conditions')}
          >
            <Text style={[styles.linkText, { color: linkColor }]}>
              {t('auth.terms_and_conditions')}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.agreementText, { color: textColor }]}>
            {' '}{t('auth.and')}{' '}
          </Text>
          
          <TouchableOpacity 
            onPress={handlePrivacyPolicyPress}
            accessibilityRole="link"
            accessibilityLabel={t('auth.privacy_policy')}
          >
            <Text style={[styles.linkText, { color: linkColor }]}>
              {t('auth.privacy_policy')}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.agreementText, { color: textColor }]}>
            .
          </Text>
        </View>
      </TouchableOpacity>
      
      {!isAccepted && (
        <Text style={styles.requirementText}>
          {t('auth.agreement_required')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  requirementText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
    marginLeft: 32,
    fontStyle: 'italic',
  },
});

export default LegalAcceptanceCheckbox;