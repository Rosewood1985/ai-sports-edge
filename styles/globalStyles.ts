import { StyleSheet, Platform, Dimensions } from 'react-native';

import { colors, spacing, borderRadius, typography } from './theme';
import { getResponsiveSpacing, scaleFontSize } from '../utils/deviceOptimization';

const { width, height } = Dimensions.get('window');

/**
 * Global styles for the app
 *
 * This file contains reusable styles that can be applied across the app
 */
const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  screenBackground: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: getResponsiveSpacing(spacing.md),
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Text styles
  neonHeading: {
    color: colors.neon.blue,
    fontSize: scaleFontSize(typography.fontSize.xxxl),
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: colors.neon.blue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: getResponsiveSpacing(spacing.lg),
    letterSpacing: 2,
  },
  heading: {
    color: colors.text.heading,
    fontSize: scaleFontSize(typography.fontSize.xl),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing(spacing.sm),
  },
  subheading: {
    color: colors.text.heading,
    fontSize: scaleFontSize(typography.fontSize.lg),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing(spacing.sm),
  },
  bodyText: {
    color: colors.text.primary,
    fontSize: scaleFontSize(typography.fontSize.md),
    lineHeight: typography.lineHeight.md,
  },
  captionText: {
    color: colors.text.secondary,
    fontSize: scaleFontSize(typography.fontSize.sm),
  },

  // Form styles
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    padding: getResponsiveSpacing(spacing.sm),
    marginBottom: getResponsiveSpacing(spacing.md),
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputFocused: {
    borderColor: colors.neon.blue,
    shadowColor: colors.neon.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },

  // Button styles
  button: {
    backgroundColor: colors.button.primary,
    borderRadius: borderRadius.md,
    paddingVertical: getResponsiveSpacing(spacing.sm),
    paddingHorizontal: getResponsiveSpacing(spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: getResponsiveSpacing(spacing.sm),
    shadowColor: colors.neon.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: scaleFontSize(typography.fontSize.md),
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.button.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Card styles
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: getResponsiveSpacing(spacing.md),
    marginVertical: getResponsiveSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardGlow: {
    shadowColor: colors.neon.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },

  // Icon styles
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: getResponsiveSpacing(spacing.lg),
    flexWrap: 'wrap',
  },
  iconWrapper: {
    alignItems: 'center',
    marginHorizontal: getResponsiveSpacing(spacing.sm),
    marginVertical: getResponsiveSpacing(spacing.sm),
  },
  iconText: {
    color: colors.text.primary,
    fontSize: scaleFontSize(typography.fontSize.sm),
    marginTop: getResponsiveSpacing(spacing.xs),
    textAlign: 'center',
  },

  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: getResponsiveSpacing(spacing.md),
  },

  // Status indicators
  statusSuccess: {
    color: colors.status.success,
  },
  statusWarning: {
    color: colors.status.warning,
  },
  statusError: {
    color: colors.status.error,
  },
  statusInfo: {
    color: colors.status.info,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: scaleFontSize(typography.fontSize.xs),
    fontWeight: '700',
  },

  // Responsive styles for different screen sizes
  smallScreenText: {
    fontSize:
      width < 360 ? scaleFontSize(typography.fontSize.sm) : scaleFontSize(typography.fontSize.md),
  },
  tabletContainer: {
    paddingHorizontal:
      width > 600 ? getResponsiveSpacing(spacing.xl) : getResponsiveSpacing(spacing.md),
  },
});

export default globalStyles;
