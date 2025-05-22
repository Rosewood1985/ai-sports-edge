import { StyleSheet } from 'react-native';

/**
 * Styles for the NeonBorderView component
 */
export const createStyles = () => {
  return StyleSheet.create({
    container: {
      position: 'relative',
      overflow: 'hidden',
    },
    border: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: 2,
      borderRadius: 8,
      overflow: 'hidden',
    },
    content: {
      padding: 12,
      zIndex: 1,
    },
    // Shadow styles for the glow effect
    glowEffect: {
      shadowColor: '#00BFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 5,
    },
  });
};

export default createStyles;
