import React from 'react';
import { View, ViewStyle, Dimensions } from 'react-native';

import { useUITheme } from '../../providers/UIThemeProvider';

interface ResponsiveBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: keyof ResponsiveBreakpoints | number;
  fluid?: boolean;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  fluid = false,
  style,
}) => {
  const { theme } = useUITheme();
  const { width } = Dimensions.get('window');

  const getMaxWidth = () => {
    if (fluid) return '100%';
    if (typeof maxWidth === 'number') return maxWidth;
    return DEFAULT_BREAKPOINTS[maxWidth] || DEFAULT_BREAKPOINTS.lg;
  };

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: getMaxWidth(),
    marginHorizontal: 'auto',
    paddingHorizontal: theme.spacing.md,
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
};

interface RowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  wrap?: boolean;
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export const Row: React.FC<RowProps> = ({
  children,
  style,
  wrap = true,
  justify = 'flex-start',
  align = 'stretch',
}) => {
  const { theme } = useUITheme();

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    justifyContent: justify,
    alignItems: align,
    marginHorizontal: -theme.spacing.xs,
    ...style,
  };

  return <View style={rowStyle}>{children}</View>;
};

interface ColumnProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  style?: ViewStyle;
}

export const Column: React.FC<ColumnProps> = ({ children, xs = 12, sm, md, lg, xl, style }) => {
  const { theme } = useUITheme();
  const { width } = Dimensions.get('window');

  const getColumnWidth = () => {
    let cols = xs;

    if (xl && width >= DEFAULT_BREAKPOINTS.xl) cols = xl;
    else if (lg && width >= DEFAULT_BREAKPOINTS.lg) cols = lg;
    else if (md && width >= DEFAULT_BREAKPOINTS.md) cols = md;
    else if (sm && width >= DEFAULT_BREAKPOINTS.sm) cols = sm;

    return `${(cols / 12) * 100}%`;
  };

  const columnStyle: ViewStyle = {
    width: getColumnWidth(),
    paddingHorizontal: theme.spacing.xs,
    ...style,
  };

  return <View style={columnStyle}>{children}</View>;
};

interface GridProps {
  children: React.ReactNode;
  spacing?: keyof typeof theme.spacing;
  columns?: number;
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({ children, spacing = 'sm', columns = 2, style }) => {
  const { theme } = useUITheme();

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing[spacing] / 2,
    ...style,
  };

  const childStyle: ViewStyle = {
    width: `${100 / columns}%`,
    paddingHorizontal: theme.spacing[spacing] / 2,
    marginBottom: theme.spacing[spacing],
  };

  return (
    <View style={gridStyle}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={childStyle}>
          {child}
        </View>
      ))}
    </View>
  );
};

interface SectionProps {
  children: React.ReactNode;
  background?: 'primary' | 'secondary' | 'surface' | 'transparent';
  padding?: keyof typeof theme.spacing;
  style?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({
  children,
  background = 'transparent',
  padding = 'lg',
  style,
}) => {
  const { theme } = useUITheme();

  const getBackgroundColor = () => {
    switch (background) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'surface':
        return theme.colors.surfaceBackground;
      default:
        return 'transparent';
    }
  };

  const sectionStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    paddingVertical: theme.spacing[padding],
    paddingHorizontal: theme.spacing.md,
    ...style,
  };

  return <View style={sectionStyle}>{children}</View>;
};

// Export responsive hooks for custom components
export const useResponsive = () => {
  const { width } = Dimensions.get('window');

  return {
    isXs: width < DEFAULT_BREAKPOINTS.sm,
    isSm: width >= DEFAULT_BREAKPOINTS.sm && width < DEFAULT_BREAKPOINTS.md,
    isMd: width >= DEFAULT_BREAKPOINTS.md && width < DEFAULT_BREAKPOINTS.lg,
    isLg: width >= DEFAULT_BREAKPOINTS.lg && width < DEFAULT_BREAKPOINTS.xl,
    isXl: width >= DEFAULT_BREAKPOINTS.xl,
    width,
    breakpoints: DEFAULT_BREAKPOINTS,
  };
};

// Default export for backward compatibility
const ResponsiveLayout = {
  Container,
  Row,
  Column,
  Grid,
  Section,
  useResponsive,
};

export default ResponsiveLayout;
