import React, { useState } from 'react';
import { Image, View, StyleSheet, Dimensions, Platform } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

// Define size types
type LogoSize = 'small' | 'medium' | 'large';

// Define size dimensions in pixels
const LOGO_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
};

interface ResponsiveTeamLogoProps {
  teamId: string;
  teamName: string;
  sport: string;
  size?: LogoSize | number;
  style?: any;
}

const ResponsiveTeamLogo: React.FC<ResponsiveTeamLogoProps> = ({
  teamId,
  teamName,
  sport,
  size = 'medium',
  style,
}) => {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Get device pixel ratio for responsive image loading
  const pixelRatio = Platform.OS === 'web' ? 1 : Dimensions.get('window').scale;

  // Determine actual size in pixels
  const actualSize = typeof size === 'string' ? LOGO_SIZES[size] : size;

  // Determine which image resolution to load based on pixel ratio
  const getImageResolution = () => {
    if (pixelRatio >= 3) return '@3x';
    if (pixelRatio >= 2) return '@2x';
    return '';
  };

  // Normalize team ID for image path
  const normalizeTeamId = (id: string) => {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Normalize sport for image path
  const normalizeSport = (sportName: string) => {
    if (sportName.includes('basketball')) return 'basketball';
    if (sportName.includes('football')) return 'football';
    if (sportName.includes('baseball')) return 'baseball';
    if (sportName.includes('hockey')) return 'hockey';
    if (sportName.includes('soccer')) return 'soccer';
    if (sportName.includes('mma') || sportName.includes('ufc')) return 'mma';
    return sportName.toLowerCase().split('_')[0];
  };

  // Get the appropriate logo path
  const getLogoPath = () => {
    const resolution = getImageResolution();
    const theme = isDark ? 'dark' : 'light';
    const normalizedTeamId = normalizeTeamId(teamId);
    const normalizedSport = normalizeSport(sport);

    try {
      // Try to load the team-specific logo
      return require(
        `../assets/images/teams/${normalizedSport}/${normalizedTeamId}_${theme}${resolution}.png`
      );
    } catch (error) {
      try {
        // Fallback to sport generic logo
        return require(`../assets/images/sports/${normalizedSport}_${theme}${resolution}.png`);
      } catch (fallbackError) {
        // Final fallback to generic logo
        return require('../assets/images/teams/generic.png');
      }
    }
  };

  // Handle image loading error
  const handleError = () => {
    console.warn(`Error loading logo for ${teamName}`);
    setImageError(true);
  };

  // Get the logo source
  const logoSource = imageError ? require('../assets/images/teams/generic.png') : getLogoPath();

  return (
    <View style={[styles.container, { width: actualSize, height: actualSize }, style]}>
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
        onError={handleError}
        accessibilityLabel={`${teamName} logo`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

export default ResponsiveTeamLogo;
