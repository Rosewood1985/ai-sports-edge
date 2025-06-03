import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { Achievement } from '../types/rewards';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, onPress }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
          borderColor: achievement.isUnlocked ? '#4CAF50' : isDark ? '#555555' : '#DDDDDD',
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: achievement.isUnlocked ? '#4CAF50' : isDark ? '#555555' : '#DDDDDD',
            opacity: achievement.isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <Image
          source={{ uri: achievement.iconUrl }}
          style={styles.icon}
          defaultSource={require('../assets/images/default-achievement.png')}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: colors.text }]}>{achievement.name}</Text>

        <Text style={[styles.description, { color: isDark ? '#BBBBBB' : '#666666' }]}>
          {achievement.description}
        </Text>

        {achievement.isUnlocked && achievement.unlockedAt && (
          <Text style={[styles.unlockedText, { color: '#4CAF50' }]}>
            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
  unlockedText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AchievementBadge;
