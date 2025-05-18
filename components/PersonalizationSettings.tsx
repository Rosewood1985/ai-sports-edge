import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { AVAILABLE_SPORTS } from './SportSelector';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';

interface PersonalizationSettingsProps {
  onClose?: () => void;
}

const PersonalizationSettings: React.FC<PersonalizationSettingsProps> = ({ onClose }) => {
  const { preferences, isLoading, setDefaultSport, setDefaultSportsbook, resetPreferences } = usePersonalization();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  
  // Local state for UI
  const [activeTab, setActiveTab] = useState<'general' | 'sportsbooks' | 'notifications'>('general');
  
  // Track settings view
  React.useEffect(() => {
    analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'personalization_settings_viewed'
    });
  }, []);
  
  // Handle sport selection
  const handleSportSelection = async (sport: string) => {
    await setDefaultSport(sport);
    
    // Show confirmation
    Alert.alert(
      t('personalization.alerts.defaultSportUpdated'),
      t('personalization.alerts.defaultSportUpdatedMessage', { sport: AVAILABLE_SPORTS.find(s => s.key === sport)?.name || sport }),
      [{ text: t('personalization.alerts.ok') }]
    );
  };
  
  // Handle sportsbook selection
  const handleSportsbookSelection = async (sportsbook: 'draftkings' | 'fanduel' | null) => {
    await setDefaultSportsbook(sportsbook);
    
    // Show confirmation
    Alert.alert(
      t('personalization.alerts.defaultSportsbookUpdated'),
      sportsbook
        ? t('personalization.alerts.defaultSportsbookUpdatedMessage', {
            sportsbook: sportsbook === 'draftkings' ? 'DraftKings' : 'FanDuel'
          })
        : t('personalization.alerts.defaultSportsbookCleared'),
      [{ text: t('personalization.alerts.ok') }]
    );
  };
  
  // Handle reset preferences
  const handleResetPreferences = () => {
    Alert.alert(
      t('personalization.alerts.resetPreferences'),
      t('personalization.alerts.resetPreferencesMessage'),
      [
        {
          text: t('personalization.alerts.cancel'),
          style: 'cancel'
        },
        {
          text: t('personalization.alerts.reset'),
          style: 'destructive',
          onPress: async () => {
            await resetPreferences();
            
            // Show confirmation
            Alert.alert(
              t('personalization.alerts.preferencesReset'),
              t('personalization.alerts.preferencesResetMessage'),
              [{ text: t('personalization.alerts.ok') }]
            );
          }
        }
      ]
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('personalization.loading')}</Text>
      </View>
    );
  }
  
  // Render general settings tab
  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('personalization.general.defaultSport')}</Text>
      <Text style={[styles.sectionDescription, { color: colors.text }]}>
        {t('personalization.general.defaultSportDescription')}
      </Text>
      
      <ScrollView style={styles.optionsList}>
        {AVAILABLE_SPORTS.map(sport => (
          <TouchableOpacity
            key={sport.key}
            style={[
              styles.optionItem,
              preferences.defaultSport === sport.key && styles.selectedOption,
              {
                backgroundColor: preferences.defaultSport === sport.key
                  ? colors.primary + '20'
                  : colors.background
              }
            ]}
            onPress={() => handleSportSelection(sport.key)}
          >
            <Text style={[
              styles.optionText,
              { color: colors.text }
            ]}>
              {sport.name}
            </Text>
            {preferences.defaultSport === sport.key && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  // Render sportsbooks tab
  const renderSportsbooksTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('personalization.sportsbooks.defaultSportsbook')}</Text>
      <Text style={[styles.sectionDescription, { color: colors.text }]}>
        {t('personalization.sportsbooks.defaultSportsbookDescription')}
      </Text>
      
      <View style={styles.optionsList}>
        <TouchableOpacity
          style={[
            styles.optionItem,
            preferences.defaultSportsbook === 'draftkings' && styles.selectedOption,
            {
              backgroundColor: preferences.defaultSportsbook === 'draftkings'
                ? colors.primary + '20'
                : colors.background
            }
          ]}
          onPress={() => handleSportsbookSelection('draftkings')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>DraftKings</Text>
          {preferences.defaultSportsbook === 'draftkings' && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionItem,
            preferences.defaultSportsbook === 'fanduel' && styles.selectedOption,
            {
              backgroundColor: preferences.defaultSportsbook === 'fanduel'
                ? colors.primary + '20'
                : colors.background
            }
          ]}
          onPress={() => handleSportsbookSelection('fanduel')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>FanDuel</Text>
          {preferences.defaultSportsbook === 'fanduel' && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionItem,
            preferences.defaultSportsbook === null && styles.selectedOption,
            {
              backgroundColor: preferences.defaultSportsbook === null
                ? colors.primary + '20'
                : colors.background
            }
          ]}
          onPress={() => handleSportsbookSelection(null)}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.sportsbooks.noPreference')}</Text>
          {preferences.defaultSportsbook === null && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render notifications tab
  const renderNotificationsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('personalization.notifications.title')}</Text>
      <Text style={[styles.sectionDescription, { color: colors.text }]}>
        {t('personalization.notifications.description')}
      </Text>
      
      <View style={styles.optionsList}>
        <View style={styles.switchOption}>
          <Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.notifications.oddsMovements')}</Text>
          <Switch
            value={preferences.notificationPreferences?.oddsMovements ?? true}
            onValueChange={value => {
              usePersonalization().setNotificationPreferences({
                oddsMovements: value
              });
            }}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={
              preferences.notificationPreferences?.oddsMovements
                ? colors.primary
                : '#f4f3f4'
            }
          />
        </View>
        
        <View style={styles.switchOption}>
          <Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.notifications.gameStart')}</Text>
          <Switch
            value={preferences.notificationPreferences?.gameStart ?? true}
            onValueChange={value => {
              usePersonalization().setNotificationPreferences({
                gameStart: value
              });
            }}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={
              preferences.notificationPreferences?.gameStart
                ? colors.primary
                : '#f4f3f4'
            }
          />
        </View>
        
        <View style={styles.switchOption}>
          <Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.notifications.gameEnd')}</Text>
          <Switch
            value={preferences.notificationPreferences?.gameEnd ?? true}
            onValueChange={value => {
              usePersonalization().setNotificationPreferences({
                gameEnd: value
              });
            }}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={
              preferences.notificationPreferences?.gameEnd
                ? colors.primary
                : '#f4f3f4'
            }
          />
        </View>
        
        <View style={styles.switchOption}>
          <Text style={[styles.optionText, { color: colors.text }]}>{t('personalization.notifications.specialOffers')}</Text>
          <Switch
            value={preferences.notificationPreferences?.specialOffers ?? true}
            onValueChange={value => {
              usePersonalization().setNotificationPreferences({
                specialOffers: value
              });
            }}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={
              preferences.notificationPreferences?.specialOffers
                ? colors.primary
                : '#f4f3f4'
            }
          />
        </View>
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('personalization.title')}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' && styles.activeTab,
            {
              borderBottomColor: activeTab === 'general' ? colors.primary : 'transparent'
            }
          ]}
          onPress={() => setActiveTab('general')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'general' ? colors.primary : colors.text
              }
            ]}
          >
            {t('personalization.tabs.general')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sportsbooks' && styles.activeTab,
            {
              borderBottomColor: activeTab === 'sportsbooks' ? colors.primary : 'transparent'
            }
          ]}
          onPress={() => setActiveTab('sportsbooks')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'sportsbooks' ? colors.primary : colors.text
              }
            ]}
          >
            {t('personalization.tabs.sportsbooks')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'notifications' && styles.activeTab,
            {
              borderBottomColor: activeTab === 'notifications' ? colors.primary : 'transparent'
            }
          ]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'notifications' ? colors.primary : colors.text
              }
            ]}
          >
            {t('personalization.tabs.notifications')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'general' && renderGeneralTab()}
      {activeTab === 'sportsbooks' && renderSportsbooksTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      
      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: '#ff6b6b' }]}
        onPress={handleResetPreferences}
      >
        <Text style={styles.resetButtonText}>{t('personalization.resetButton')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 8
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomWidth: 2
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500'
  },
  tabContent: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7
  },
  optionsList: {
    marginBottom: 16
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: 'transparent'
  },
  optionText: {
    fontSize: 16
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  resetButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default PersonalizationSettings;