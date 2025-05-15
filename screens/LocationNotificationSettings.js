import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import { View, Text, StyleSheet, Switch, Slider, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserPreferences, updatePreference } from '../services/userPreferencesService';
import { getLocalTeams } from '../services/geolocationService';
import { auth } from '../config/firebase';
import LoadingIndicator from '../components/LoadingIndicator';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Location Notification Settings Screen
 * Allows users to configure location-based notification preferences
 */
const LocationNotificationSettings = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [localTeams, setLocalTeams] = useState([]);
  
  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          navigation.navigate('Login');
          return;
        }
        
        const userPrefs = await getUserPreferences(userId);
        setPreferences(userPrefs);
        
        // Get local teams
        try {
          const teams = await getLocalTeams();
          setLocalTeams(teams);
        } catch (error) {
          console.error('Error getting local teams:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading preferences:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load preferences. Please try again.');
      }
    };
    
    loadPreferences();
  }, [navigation]);
  
  // Update a preference
  const updatePref = async (path, value) => {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        navigation.navigate('Login');
        return;
      }
      
      // Update local state
      const newPreferences = { ...preferences };
      setNestedValue(newPreferences, path, value);
      setPreferences(newPreferences);
      
      // Update in database
      await updatePreference(userId, path, value);
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };
  
  // Set a nested value in an object
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  };
  
  if (loading || !preferences) {
    return <LoadingIndicator />;
  }
  
  const locationPrefs = preferences.notifications.locationBased || {
    enabled: true,
    localTeams: true,
    localGames: true,
    localOdds: true,
    radius: 50
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Location-Based Notifications</ThemedText>
          
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Enable Location Notifications</ThemedText>
            <Switch
              value={locationPrefs.enabled}
              onValueChange={(value) => updatePref('notifications.locationBased.enabled', value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={locationPrefs.enabled ? colors.switchThumbOn : colors.switchThumbOff}
            />
          </View>
          
          <ThemedText style={styles.description}>
            Receive personalized notifications based on your location, including local teams, games, and betting opportunities.
          </ThemedText>
        </View>
        
        <View style={[styles.section, !locationPrefs.enabled && styles.disabled]}>
          <ThemedText style={styles.sectionTitle}>Notification Types</ThemedText>
          
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Local Team Alerts</ThemedText>
            <Switch
              value={locationPrefs.localTeams}
              onValueChange={(value) => updatePref('notifications.locationBased.localTeams', value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={locationPrefs.localTeams ? colors.switchThumbOn : colors.switchThumbOff}
              disabled={!locationPrefs.enabled}
            />
          </View>
          
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Local Game Alerts</ThemedText>
            <Switch
              value={locationPrefs.localGames}
              onValueChange={(value) => updatePref('notifications.locationBased.localGames', value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={locationPrefs.localGames ? colors.switchThumbOn : colors.switchThumbOff}
              disabled={!locationPrefs.enabled}
            />
          </View>
          
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Local Betting Opportunities</ThemedText>
            <Switch
              value={locationPrefs.localOdds}
              onValueChange={(value) => updatePref('notifications.locationBased.localOdds', value)}
              trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
              thumbColor={locationPrefs.localOdds ? colors.switchThumbOn : colors.switchThumbOff}
              disabled={!locationPrefs.enabled}
            />
          </View>
        </View>
        
        <View style={[styles.section, !locationPrefs.enabled && styles.disabled]}>
          <ThemedText style={styles.sectionTitle}>Location Radius</ThemedText>
          
          <ThemedText style={styles.description}>
            Set the radius for location-based notifications (in kilometers)
          </ThemedText>
          
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={200}
              step={10}
              value={locationPrefs.radius}
              onValueChange={(value) => updatePref('notifications.locationBased.radius', value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              disabled={!locationPrefs.enabled}
            />
            <View style={styles.sliderLabels}>
              <ThemedText>{locationPrefs.radius} km</ThemedText>
            </View>
          </View>
        </View>
        
        {localTeams.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Local Teams</ThemedText>
            <ThemedText style={styles.description}>
              We've detected these teams in your area:
            </ThemedText>
            
            {localTeams.map((team, index) => (
              <ThemedText key={index} style={styles.teamItem}>
                • {team}
              </ThemedText>
            ))}
          </View>
        )}
        
        <View style={styles.section}>
          <ThemedText style={styles.privacyNote}>
            Your location data is only used to provide personalized notifications and is never shared with third parties. You can disable location-based notifications at any time.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    flex: 1,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  teamItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  privacyNote: {
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default LocationNotificationSettings;