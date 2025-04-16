import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemedText, ThemedView } from '../components/ThemedComponents';
import { useTheme } from '@react-navigation/native';

interface LanguageOption {
  code: string;
  name: string;
  direction: string;
}

const LanguageSettingsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  // Convert languages object to array for FlatList
  const languageOptions = Object.values(availableLanguages);

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === language) {
      return; // No change needed
    }
    
    try {
      setLoading(languageCode);
      await setLanguage(languageCode);
      
      // Show success message
      Alert.alert(
        t('language.language_changed'),
        t('language.restart_required'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.',
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(null);
    }
  };

  // Render language option
  const renderLanguageOption = ({ item }: { item: LanguageOption }) => {
    const isSelected = item.code === language;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageOption,
          { borderBottomColor: colors.border }
        ]}
        onPress={() => handleLanguageChange(item.code)}
        disabled={loading !== null}
      >
        <View style={styles.languageInfo}>
          <ThemedText style={styles.languageName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.nativeLanguageName}>
            {getLanguageNativeName(item.code)}
          </ThemedText>
        </View>
        
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color={colors.text} />
        )}
        
        {loading === item.code && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        )}
      </TouchableOpacity>
    );
  };

  // Get native language name
  const getLanguageNativeName = (code: string): string => {
    switch (code) {
      case 'en': return 'English';
      case 'es': return 'Español';
      default: return '';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>
          {t('language.select_language')}
        </ThemedText>
        
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.content}>
        <ThemedText style={styles.description}>
          {t('language.current_language', { language: availableLanguages[language as keyof typeof availableLanguages]?.name })}
        </ThemedText>
        
        <FlatList
          data={languageOptions}
          renderItem={renderLanguageOption}
          keyExtractor={(item) => item.code}
          style={styles.languageList}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  languageList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nativeLanguageName: {
    fontSize: 14,
    opacity: 0.7,
  },
  loader: {
    position: 'absolute',
    right: 32,
  },
});

export default LanguageSettingsScreen;