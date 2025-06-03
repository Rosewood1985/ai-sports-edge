import * as FileSystem from 'expo-file-system';
import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator, Platform, Text } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface CachedPlayerImageProps {
  playerId: string;
  playerName: string;
  sport: string;
  size?: number;
  style?: any;
  fallbackImageUrl?: string;
}

const CachedPlayerImage: React.FC<CachedPlayerImageProps> = ({
  playerId,
  playerName,
  sport,
  size = 100,
  style,
  fallbackImageUrl,
}) => {
  const { colors, isDark } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Base URLs for player images by sport
  const sportBaseUrls: Record<string, string> = {
    basketball_nba: 'https://cdn.nba.com/headshots/nba/latest/1040x760/',
    basketball_ncaab: 'https://cdn.ncaa.com/headshots/basketball/latest/1040x760/',
    football_nfl: 'https://static.www.nfl.com/image/private/t_player_profile_landscape/',
    hockey_nhl: 'https://cms.nhl.bamgrid.com/images/headshots/current/1024x1024/',
    baseball_mlb:
      'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/',
    soccer_epl: 'https://resources.premierleague.com/premierleague/photos/players/250x250/',
    soccer_mls: 'https://images.mlssoccer.com/image/private/t_q-best/prd-mlsdigital/headshots/',
    soccer_womens_nwsl:
      'https://images.nwslsoccer.com/image/private/t_q-best/prd-nwsldigital/headshots/',
    soccer_laliga: 'https://assets.laliga.com/squad/2023/t178/p',
    soccer_bundesliga: 'https://img.bundesliga.com/tachyon/sites/2/2019/08/',
    mma_ufc: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/',
  };

  // Get cache directory
  const cacheDirectory = `${FileSystem.cacheDirectory}player-images/`;

  // Generate a unique filename based on player ID and sport
  const generateCacheFilename = (id: string, sportKey: string) => {
    // Simple hash function for filenames
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    };

    return `${hashString(`${id}_${sportKey}`)}.jpg`;
  };

  // Ensure cache directory exists
  const ensureCacheDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
    }
  };

  // Get image from cache or download it
  const getImageFromCacheOrDownload = async () => {
    try {
      setIsLoading(true);
      setError(false);

      // Ensure cache directory exists
      await ensureCacheDirectory();

      // Generate cache filename
      const filename = generateCacheFilename(playerId, sport);
      const cacheFilePath = `${cacheDirectory}${filename}`;

      // Check if image exists in cache
      const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);

      if (fileInfo.exists) {
        // Use cached image
        setImageUri(cacheFilePath);
        setIsLoading(false);
        return;
      }

      // Get base URL for the sport
      const baseUrl = sportBaseUrls[sport] || '';
      if (!baseUrl) {
        throw new Error(`No base URL defined for sport: ${sport}`);
      }

      // Construct the remote URL
      const remoteUrl = `${baseUrl}${playerId}.jpg`;

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(remoteUrl, cacheFilePath);

      if (downloadResult.status === 200) {
        setImageUri(cacheFilePath);
      } else {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }
    } catch (err) {
      console.warn(`Error loading player image for ${playerName}:`, err);
      setError(true);

      // Try fallback image if provided
      if (fallbackImageUrl) {
        try {
          const filename = generateCacheFilename(`fallback_${playerId}`, sport);
          const fallbackCachePath = `${cacheDirectory}${filename}`;

          // Download fallback image
          const fallbackResult = await FileSystem.downloadAsync(
            fallbackImageUrl,
            fallbackCachePath
          );

          if (fallbackResult.status === 200) {
            setImageUri(fallbackCachePath);
          }
        } catch (fallbackErr) {
          console.warn('Error loading fallback image:', fallbackErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load image when component mounts or props change
  useEffect(() => {
    getImageFromCacheOrDownload();
  }, [playerId, sport, fallbackImageUrl]);

  // Generate player initials for fallback
  const getPlayerInitials = () => {
    return playerName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Render loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, backgroundColor: isDark ? '#333' : '#e0e0e0' },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Render image or fallback
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`${playerName} photo`}
        />
      ) : (
        <View style={[styles.fallbackContainer, { backgroundColor: isDark ? '#555' : '#ccc' }]}>
          <Text style={styles.initialsText}>{getPlayerInitials()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CachedPlayerImage;
