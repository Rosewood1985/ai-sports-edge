import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import ResponsiveTeamLogo from './ResponsiveTeamLogo';
import { Game } from '../types/odds';

interface ResponsiveGameInfoProps {
  game: Game | null;
  sportKey: string;
  style?: any;
}

const ResponsiveGameInfo: React.FC<ResponsiveGameInfoProps> = ({
  game,
  sportKey,
  style
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  
  // Get screen dimensions for responsive sizing
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375; // iPhone SE or similar small device
  
  // Determine logo size based on screen size
  const logoSize = isSmallScreen ? 32 : 40;
  
  // Format date and time
  const formatGameDateTime = (date: string, time: string) => {
    try {
      return t('oddsComparison.gameDate', { date, time });
    } catch (error) {
      return `${date} at ${time}`;
    }
  };
  
  // If no game is selected, show placeholder
  if (!game) {
    return (
      <View style={[styles.container, style, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
        <Text style={[styles.noGameText, { color: colors.text }]}>
          {t('oddsComparison.noGameSelected')}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style, { backgroundColor: isDark ? '#222' : '#f5f5f5' }]}>
      <View style={styles.teamsContainer}>
        <View style={styles.teamContainer}>
          <ResponsiveTeamLogo
            teamId={game.away_team}
            teamName={game.away_team}
            sport={sportKey}
            size={logoSize}
          />
          <Text 
            style={[styles.teamName, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {game.away_team}
          </Text>
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, { color: colors.text }]}>
            {t('oddsComparison.versus')}
          </Text>
        </View>
        
        <View style={styles.teamContainer}>
          <ResponsiveTeamLogo
            teamId={game.home_team}
            teamName={game.home_team}
            sport={sportKey}
            size={logoSize}
          />
          <Text 
            style={[styles.teamName, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {game.home_team}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.gameTime, { color: colors.text }]}>
        {formatGameDateTime(
          new Date(game.commence_time).toLocaleDateString(),
          new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameTime: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  noGameText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  }
});

export default ResponsiveGameInfo;