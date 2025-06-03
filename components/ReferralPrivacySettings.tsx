import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';

import { useThemeColor } from '../hooks/useThemeColor';
import { rewardsService } from '../services/rewardsService';
import NeonButton from './ui/NeonButton';
import NeonCard from './ui/NeonCard';
import { LeaderboardPrivacy } from '../types/rewards';

interface ReferralPrivacySettingsProps {
  visible: boolean;
  onClose: () => void;
  onPrivacyChanged?: (privacy: LeaderboardPrivacy) => void;
}

/**
 * ReferralPrivacySettings component allows users to control how they appear on the leaderboard
 * @param {ReferralPrivacySettingsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralPrivacySettings: React.FC<ReferralPrivacySettingsProps> = ({
  visible,
  onClose,
  onPrivacyChanged,
}) => {
  const [currentPrivacy, setCurrentPrivacy] = useState<LeaderboardPrivacy>('public');
  const [loading, setLoading] = useState<boolean>(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (visible) {
      loadPrivacySettings();
    }
  }, [visible]);

  const loadPrivacySettings = async () => {
    try {
      // In a real app, this would fetch from the user's settings
      const userId = 'current-user-id'; // In a real app, get from auth
      const userRewards = await rewardsService.getUserRewards(userId);

      if (userRewards && userRewards.leaderboardPrivacy) {
        setCurrentPrivacy(userRewards.leaderboardPrivacy);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handlePrivacyChange = async (privacy: LeaderboardPrivacy) => {
    setCurrentPrivacy(privacy);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);

      // In a real app, this would update the user's settings
      const userId = 'current-user-id'; // In a real app, get from auth
      await rewardsService.updateLeaderboardPrivacy(userId, currentPrivacy);

      if (onPrivacyChanged) {
        onPrivacyChanged(currentPrivacy);
      }

      onClose();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <NeonCard style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Privacy Settings</Text>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDescription, { color: textColor }]}>
            Choose how you appear on the leaderboard:
          </Text>

          <TouchableOpacity
            style={[
              styles.privacyOption,
              currentPrivacy === 'public' && { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
            ]}
            onPress={() => handlePrivacyChange('public')}
          >
            <View style={styles.privacyOptionContent}>
              <Ionicons name="person" size={24} color={textColor} />
              <View style={styles.privacyOptionText}>
                <Text style={[styles.privacyOptionTitle, { color: textColor }]}>Public</Text>
                <Text style={[styles.privacyOptionDescription, { color: textColor }]}>
                  Show your name and referral count
                </Text>
              </View>
            </View>

            {currentPrivacy === 'public' && (
              <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyOption,
              currentPrivacy === 'anonymous' && { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
            ]}
            onPress={() => handlePrivacyChange('anonymous')}
          >
            <View style={styles.privacyOptionContent}>
              <Ionicons name="person-outline" size={24} color={textColor} />
              <View style={styles.privacyOptionText}>
                <Text style={[styles.privacyOptionTitle, { color: textColor }]}>Anonymous</Text>
                <Text style={[styles.privacyOptionDescription, { color: textColor }]}>
                  Hide your name but show referral count
                </Text>
              </View>
            </View>

            {currentPrivacy === 'anonymous' && (
              <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyOption,
              currentPrivacy === 'private' && { backgroundColor: 'rgba(52, 152, 219, 0.1)' },
            ]}
            onPress={() => handlePrivacyChange('private')}
          >
            <View style={styles.privacyOptionContent}>
              <Ionicons name="eye-off" size={24} color={textColor} />
              <View style={styles.privacyOptionText}>
                <Text style={[styles.privacyOptionTitle, { color: textColor }]}>Private</Text>
                <Text style={[styles.privacyOptionDescription, { color: textColor }]}>
                  Don't appear on the leaderboard at all
                </Text>
              </View>
            </View>

            {currentPrivacy === 'private' && (
              <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
            )}
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <NeonButton
              title="Cancel"
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
              textStyle={{ color: textColor }}
              type="outline"
            />

            <NeonButton
              title="Save Settings"
              onPress={handleSaveSettings}
              style={styles.button}
              loading={loading}
            />
          </View>
        </NeonCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  privacyOptionDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
});

export default ReferralPrivacySettings;
