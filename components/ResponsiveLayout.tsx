import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

import {
  DeviceType,
  grid,
  responsiveSpacing,
  useResponsiveDimensions,
} from '../utils/responsiveUtils';

interface RowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gutter?: number;
}

interface ColumnProps {
  children: React.ReactNode;
  size?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fluid?: boolean;
}

/**
 * Responsive container component that adapts to screen size
 */
export const Container: React.FC<ContainerProps> = ({ children, style, fluid = false }) => {
  const { deviceType } = useResponsiveDimensions();
  const isTablet = deviceType === DeviceType.TABLET;

  return (
    <View
      style={[
        styles.container,
        fluid ? styles.containerFluid : null,
        isTablet ? styles.containerTablet : styles.containerPhone,
        style,
      ]}
    >
      {children}
    </View>
  );
};

/**
 * Responsive row component for grid layout
 */
export const Row: React.FC<RowProps> = ({ children, style, gutter = 16 }) => {
  return (
    <View
      style={[
        styles.row,
        {
          marginHorizontal: -gutter / 2,
        },
        style,
      ]}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            gutter,
          });
        }
        return child;
      })}
    </View>
  );
};

/**
 * Responsive column component for grid layout
 */
export const Column: React.FC<ColumnProps> = ({
  children,
  size = 1,
  offset = 0,
  style,
  ...props
}) => {
  // @ts-ignore - gutter is passed from Row
  const gutter = props.gutter || 16;
  const totalColumns = grid.getColumns();

  // Ensure size doesn't exceed total columns
  const safeSize = Math.min(size, totalColumns);
  const safeOffset = Math.min(offset, totalColumns - safeSize);

  // Calculate width percentage
  const widthPercent = (safeSize / totalColumns) * 100;
  const marginLeftPercent = offset > 0 ? (safeOffset / totalColumns) * 100 : undefined;

  return (
    <View
      style={[
        styles.column,
        {
          width: `${widthPercent}%`,
          marginLeft: marginLeftPercent ? `${marginLeftPercent}%` : undefined,
          paddingHorizontal: gutter / 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/**
 * Responsive grid component that automatically arranges items in a grid
 */
interface GridProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  numColumns?: number;
  columnGap?: number;
  rowGap?: number;
  style?: StyleProp<ViewStyle>;
}
export const Grid: React.FC<GridProps> = ({
  data,
  renderItem,
  numColumns,
  columnGap = 16,
  rowGap = 16,
  style,
}) => {
  const { deviceType } = useResponsiveDimensions();
  const isTablet = deviceType === DeviceType.TABLET;
  const defaultColumns = isTablet ? 3 : 2;
  const cols = numColumns || defaultColumns;

  // Group items into rows
  const rows = [];
  for (let i = 0; i < data.length; i += cols) {
    rows.push(data.slice(i, i + cols));
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.gridRow,
            {
              marginBottom: rowIndex < rows.length - 1 ? rowGap : 0,
              marginHorizontal: -columnGap / 2,
            },
          ]}
        >
          {row.map((item, colIndex) => (
            <View
              key={`col-${rowIndex}-${colIndex}`}
              style={[
                styles.gridColumn,
                {
                  width: `${100 / cols}%`,
                  paddingHorizontal: columnGap / 2,
                },
              ]}
            >
              {renderItem(item, rowIndex * cols + colIndex)}
            </View>
          ))}

          {/* Add empty columns to fill the row */}
          {row.length < cols &&
            Array(cols - row.length)
              .fill(null)
              .map((_, index) => (
                <View
                  key={`empty-${rowIndex}-${index}`}
                  style={[
                    styles.gridColumn,
                    { width: `${100 / cols}%`, paddingHorizontal: columnGap / 2 },
                  ]}
                />
              ))}
        </View>
      ))}
    </View>
  );
};

/**
 * Responsive section component with adaptive padding
 */
interface SectionProps {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export const Section: React.FC<SectionProps> = ({ children, title, style }) => {
  const { deviceType } = useResponsiveDimensions();
  const isTablet = deviceType === DeviceType.TABLET;

  return (
    <View style={[styles.section, isTablet ? styles.sectionTablet : styles.sectionPhone, style]}>
      {title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  containerFluid: {
    paddingHorizontal: 0,
  },
  containerPhone: {
    paddingHorizontal: responsiveSpacing(16),
  },
  containerTablet: {
    paddingHorizontal: responsiveSpacing(24),
    maxWidth: 1024,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  column: {
    flexDirection: 'column',
  },
  grid: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  gridColumn: {
    flexDirection: 'column',
  },
  section: {
    marginBottom: responsiveSpacing(24),
  },
  sectionPhone: {
    paddingHorizontal: 0,
  },
  sectionTablet: {
    paddingHorizontal: responsiveSpacing(8),
  },
  sectionHeader: {
    marginBottom: responsiveSpacing(16),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionContent: {
    width: '100%',
  },
});
