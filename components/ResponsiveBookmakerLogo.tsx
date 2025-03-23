import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Define size types
type LogoSize = 'small' | 'medium' | 'large';

// Define size dimensions in pixels
const LOGO_SIZES = {
  small: 24,
  medium: 32,
  large: 48
};

interface ResponsiveBookmakerLogoProps {
  bookmaker: string;
  size?: LogoSize | number;
  style?: any;
}

const ResponsiveBookmakerLogo: React.FC<ResponsiveBookmakerLogoProps> = ({
  bookmaker,
  size = 'medium',
  style
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
  
  // Get the appropriate logo path
  const getLogoPath = () => {
    const resolution = getImageResolution();
    const theme = isDark ? 'dark' : 'light';
    
    // Try to load the appropriate logo
    try {
      // Use dynamic require based on bookmaker name
      switch (bookmaker.toLowerCase()) {
        case 'draftkings':
          return isDark 
            ? require(`../assets/images/sportsbooks/draftkings_${theme}${resolution}.png`) 
            : require(`../assets/images/sportsbooks/draftkings_${theme}${resolution}.png`);
        case 'fanduel':
          return isDark 
            ? require(`../assets/images/sportsbooks/fanduel_${theme}${resolution}.png`) 
            : require(`../assets/images/sportsbooks/fanduel_${theme}${resolution}.png`);
        case 'caesars':
          return isDark 
            ? require(`../assets/images/sportsbooks/caesars_${theme}${resolution}.png`) 
            : require(`../assets/images/sportsbooks/caesars_${theme}${resolution}.png`);
        case 'betmgm':
          return isDark 
            ? require(`../assets/images/sportsbooks/betmgm_${theme}${resolution}.png`) 
            : require(`../assets/images/sportsbooks/betmgm_${theme}${resolution}.png`);
        default:
          // Fallback to a generic logo
          return require(`../assets/images/sportsbooks/generic_${theme}${resolution}.png`);
      }
    } catch (error) {
      console.warn(`Failed to load logo for ${bookmaker}:`, error);
      // Return a fallback logo
      return require('../assets/images/sportsbooks/generic.png');
    }
  };
  
  // Handle image loading error
  const handleError = () => {
    console.warn(`Error loading logo for ${bookmaker}`);
    setImageError(true);
  };
  
  // Get the logo source
  const logoSource = imageError 
    ? require('../assets/images/sportsbooks/generic.png') 
    : getLogoPath();
  
  return (
    <View style={[styles.container, { width: actualSize, height: actualSize }, style]}>
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
        onError={handleError}
        accessibilityLabel={`${bookmaker} logo`}
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
  }
});

export default ResponsiveBookmakerLogo;