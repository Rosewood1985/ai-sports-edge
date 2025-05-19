import React from 'react';
import { View, Text, StyleSheet, ViewProps, ViewStyle, TextStyle } from 'react-native';
import { ResponsiveText } from '../atomic/atoms/ResponsiveText';
import { useResponsiveDimensions, DeviceType, Orientation } from '../utils/responsiveUtils';

/**
 * Example of a responsive card component that adapts to different device sizes and orientations.
 * This example demonstrates various approaches to responsive design in the application.
 */

// Example of a responsive card component using hooks directly
export const ResponsiveCardExample = () => {
  // Get responsive dimensions
  const dimensions = useResponsiveDimensions();
  const { deviceType, orientation, width, height, isTablet, fontScale } = dimensions;

  // Calculate responsive styles based on device type and orientation
  const cardStyle = React.useMemo(() => {
    // Base styles
    const style: ViewStyle = {
      borderRadius: 8,
      padding: 16,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      margin: 16,
    };

    // Apply device-specific styles
    if (deviceType <= DeviceType.SMALL_PHONE) {
      style.padding = 8;
      style.margin = 8;
      style.borderRadius = 4;
    } else if (deviceType <= DeviceType.PHONE) {
      style.padding = 12;
      style.margin = 12;
    } else if (deviceType <= DeviceType.LARGE_PHONE) {
      style.padding = 16;
      style.margin = 16;
    } else if (deviceType <= DeviceType.SMALL_TABLET) {
      style.padding = 20;
      style.margin = 20;
    } else if (deviceType <= DeviceType.TABLET) {
      style.padding = 24;
      style.margin = 24;
    } else {
      style.padding = 32;
      style.margin = 32;
    }

    // Apply orientation-specific styles
    if (orientation === Orientation.LANDSCAPE) {
      style.marginHorizontal = 24;
      style.maxWidth = 600;
      style.alignSelf = 'center';
    } else {
      style.marginHorizontal = 16;
    }

    return style;
  }, [deviceType, orientation]);

  // Calculate title container styles
  const titleContainerStyle = React.useMemo(() => {
    // Base margin bottom value
    let marginBottomValue = 12;

    // Adjust based on device type
    if (deviceType <= DeviceType.PHONE) {
      marginBottomValue = 8;
    } else if (deviceType >= DeviceType.TABLET) {
      marginBottomValue = 16;
    }

    // Adjust based on font scale
    if (fontScale > 1.3) {
      marginBottomValue = marginBottomValue * 1.5;
    }

    // Create the style object
    const style: ViewStyle = {
      marginBottom: marginBottomValue,
      // Add orientation-specific styles
      flexDirection: orientation === Orientation.LANDSCAPE ? 'row' : 'column',
      alignItems: orientation === Orientation.LANDSCAPE ? 'center' : 'flex-start',
    };

    return style;
  }, [deviceType, orientation, fontScale]);

  // Render the responsive card
  return (
    <View style={cardStyle}>
      <View style={[titleContainerStyle, styles.importantTitle]}>
        <ResponsiveText
          type="h2"
          color="primary"
          style={styles.title}
          minFontSize={16}
          maxFontSize={28}
        >
          Responsive Card Example
        </ResponsiveText>

        <ResponsiveText type="bodySmall" color="secondary" style={styles.subtitle}>
          Demonstrates responsive design
        </ResponsiveText>
      </View>

      <ResponsiveText style={styles.content}>
        This card automatically adapts to different device sizes and orientations. It uses the
        responsive design system to provide an optimal user experience across all devices, from
        small phones to large tablets.
      </ResponsiveText>

      <View style={styles.footer}>
        <ResponsiveText type="small" color="tertiary" style={styles.footerText}>
          Last updated: May 19, 2025
        </ResponsiveText>
      </View>
    </View>
  );
};

// Regular styles (non-responsive parts)
const styles = StyleSheet.create({
  importantTitle: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    paddingLeft: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  content: {
    marginBottom: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  footerText: {
    textAlign: 'right',
  },
});

export default ResponsiveCardExample;
