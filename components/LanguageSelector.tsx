import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../contexts/I18nContext';
import { ThemedText } from './ThemedText';
import { Language } from '../contexts/I18nContext';
import Colors from '../constants/Colors';

interface LanguageSelectorProps {
  style?: any;
  compact?: boolean;
}

/**
 * LanguageSelector component
 * 
 * This component allows users to switch between supported languages.
 * It displays language options as buttons and highlights the currently selected language.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  style,
  compact = false
}) => {
  const { language, setLanguage, t } = useI18n();
  
  // Available languages with their display names
  const languages: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'es', label: 'Spanish', nativeName: 'Español' },
  ];
  
  return (
    <View style={[styles.container, style]}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            compact && styles.compactButton,
            language === lang.code && styles.activeLanguage,
          ]}
          onPress={() => setLanguage(lang.code)}
          accessibilityLabel={`Switch to ${lang.label} language`}
          accessibilityRole="button"
        >
          <ThemedText
            style={[
              styles.languageText,
              compact && styles.compactText,
              language === lang.code && styles.activeLanguageText,
            ]}
          >
            {compact ? lang.code.toUpperCase() : lang.nativeName}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  compactButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  activeLanguage: {
    backgroundColor: Colors.neon.blue,
    borderColor: Colors.neon.blue,
  },
  languageText: {
    fontSize: 14,
  },
  compactText: {
    fontSize: 12,
  },
  activeLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LanguageSelector;