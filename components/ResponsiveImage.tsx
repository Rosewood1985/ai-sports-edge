import React, { useState, useEffect } from 'react';
import { Image, ImageProps, StyleSheet, View, ActivityIndicator } from 'react-native';

import {
  getResponsiveImageSource,
  getResponsiveDimensions,
  ResponsiveImageProps,
} from '../utils/responsiveImageLoader';

/**
 * ResponsiveImage component that automatically loads the appropriate image
 * based on device resolution and screen size
 */
const ResponsiveImage: React.FC<ResponsiveImageProps & Omit<ImageProps, 'source'>> = ({
  basePath,
  extension = 'png',
  width,
  height,
  baseWidth = 375,
  baseHeight = 812,
  style,
  fallbackBasePath,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Get responsive image source
  const source =
    useFallback && fallbackBasePath
      ? getResponsiveImageSource(fallbackBasePath, extension)
      : getResponsiveImageSource(basePath, extension);

  // Calculate responsive dimensions if width and height are provided
  const dimensions =
    width && height ? getResponsiveDimensions(width, height, baseWidth, baseHeight) : undefined;

  // Combine calculated dimensions with provided style
  const combinedStyle = dimensions ? [dimensions, style] : style;

  const handleError = () => {
    if (!useFallback && fallbackBasePath) {
      // Try fallback image
      setUseFallback(true);
      setLoading(true);
    } else {
      // No fallback or fallback also failed
      setError(true);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: source }}
        style={combinedStyle}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
        {...props}
      />

      {loading && (
        <View style={[styles.loaderContainer, dimensions]}>
          <ActivityIndicator size="small" color="#3498db" />
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, dimensions]}>
          <Image source={require('../assets/images/image-error.png')} style={styles.errorIcon} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  errorIcon: {
    width: 30,
    height: 30,
    tintColor: '#999',
  },
});

export default ResponsiveImage;
