import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import { useUITheme } from '../../../components/UIThemeProvider';
import { ThemedText, ThemedView } from '../../atoms';
import { useLanguage } from '../../organisms/i18n/LanguageContext';

interface LanguageOption {
  code: string;
  name: string;
  direction: string;
}

interface LanguageSelectorProps {
  showLabel?: boolean;
  style?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ showLabel = true, style }) => {
  const { colors } = useTheme();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Convert languages object to array for FlatList
  const languageOptions = Object.values(availableLanguages);

  // Get current language name
  const currentLanguageName =
    availableLanguages[language as keyof typeof availableLanguages]?.name || 'English';

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    try {
      setLoading(languageCode);
      await setLanguage(languageCode);
      setModalVisible(false);

      // Show success message
      Alert.alert(t('language.language_changed'), t('language.restart_required'), [
        { text: t('common.ok') },
      ]);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), 'Failed to change language. Please try again.', [
        { text: t('common.ok') },
      ]);
    } finally {
      setLoading(null);
    }
  };

  // Render language option
  const renderLanguageOption = ({ item }: { item: LanguageOption }) => {
    const isSelected = item.code === language;

    return (
      <AccessibleTouchableOpacity
        style={[
          styles.languageOption,
          isSelected && { backgroundColor: colors.primary + '20' },
          { borderBottomColor: colors.border },
        ]}
        onPress={() => handleLanguageChange(item.code)}
        disabled={loading !== null}
        accessibilityLabel={`${item.name} ${isSelected ? t('language.currently_selected') : ''}`}
        accessibilityHint={isSelected ? undefined : t('language.tap_to_select')}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
      >
        <ThemedText
          style={[
            styles.languageName,
            isSelected ? { fontWeight: 'bold', color: colors.primary } : {},
          ]}
        >
          {item.name}
        </ThemedText>

        {isSelected && <Ionicons name="checkmark" size={24} color={colors.primary} />}

        {loading === item.code && <ActivityIndicator size="small" color={colors.primary} />}
      </AccessibleTouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <AccessibleTouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={t('language.select_language')}
        accessibilityHint={t('language.tap_to_open_language_selector')}
        accessibilityRole="button"
      >
        <Ionicons name="language" size={24} color={colors.text} />

        {showLabel && <ThemedText style={styles.currentLanguage}>{currentLanguageName}</ThemedText>}

        <Ionicons name="chevron-down" size={16} color={colors.text} />
      </AccessibleTouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('language.select_language')}</ThemedText>

              <AccessibleTouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                accessibilityLabel={t('common.close')}
                accessibilityHint={t('language.close_language_selector')}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </AccessibleTouchableOpacity>
            </View>

            <FlatList
              data={languageOptions}
              renderItem={renderLanguageOption}
              keyExtractor={item => item.code}
              style={styles.languageList}
            />
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  currentLanguage: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    flexGrow: 0,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  languageName: {
    fontSize: 16,
  },
});

export default LanguageSelector;
