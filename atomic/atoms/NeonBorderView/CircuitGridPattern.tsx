import React, { useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

import { useNeonPulse } from '../../../utils/animationUtils';

/**
 * Interface for a line in the circuit pattern
 */
interface Line {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interface for a node in the circuit pattern
 */
interface Node {
  x: number;
  y: number;
}

/**
 * Props for the CircuitGridPattern component
 */
export interface CircuitGridPatternProps {
  /**
   * Width of the container
   */
  width: number;

  /**
   * Height of the container
   */
  height: number;

  /**
   * Color of the grid lines and nodes
   */
  color: string;

  /**
   * Density of the grid pattern
   */
  density: 'low' | 'medium' | 'high';

  /**
   * Duration of the flash animation cycle
   */
  flashDuration: number;

  /**
   * Performance optimization level
   */
  optimizationLevel: 'high' | 'medium' | 'low';
}

/**
 * Generate a circuit pattern based on container dimensions, density, and optimization level
 */
const generateCircuitPattern = (
  width: number,
  height: number,
  density: 'low' | 'medium' | 'high',
  optimizationLevel: 'high' | 'medium' | 'low'
): { lines: Line[]; nodes: Node[] } => {
  // Determine number of lines and nodes based on density and optimization level
  const lineCount = {
    low: { low: 4, medium: 6, high: 8 },
    medium: { low: 6, medium: 10, high: 14 },
    high: { low: 8, medium: 16, high: 24 },
  }[density][optimizationLevel];

  const nodeCount = {
    low: { low: 3, medium: 5, high: 8 },
    medium: { low: 5, medium: 8, high: 12 },
    high: { low: 8, medium: 12, high: 18 },
  }[density][optimizationLevel];

  // Generate lines
  const lines: Line[] = [];
  const lineThickness = 1;

  // Create horizontal lines
  for (let i = 0; i < Math.floor(lineCount / 2); i++) {
    const y = Math.floor((height / (Math.floor(lineCount / 2) + 1)) * (i + 1));
    lines.push({
      x: 0,
      y,
      width,
      height: lineThickness,
    });
  }

  // Create vertical lines
  for (let i = 0; i < Math.ceil(lineCount / 2); i++) {
    const x = Math.floor((width / (Math.ceil(lineCount / 2) + 1)) * (i + 1));
    lines.push({
      x,
      y: 0,
      width: lineThickness,
      height,
    });
  }

  // Generate nodes at line intersections
  const nodes: Node[] = [];
  const horizontalLines = lines.filter(line => line.width > line.height);
  const verticalLines = lines.filter(line => line.height > line.width);

  // Create nodes at intersections
  for (let i = 0; i < Math.min(nodeCount, horizontalLines.length * verticalLines.length); i++) {
    const hIndex = i % horizontalLines.length;
    const vIndex = Math.floor(i / horizontalLines.length) % verticalLines.length;

    const hLine = horizontalLines[hIndex];
    const vLine = verticalLines[vIndex];

    if (hLine && vLine) {
      nodes.push({
        x: vLine.x - 2, // Offset to center the node on the intersection
        y: hLine.y - 2, // Offset to center the node on the intersection
      });
    }
  }

  return { lines, nodes };
};

/**
 * CircuitGridPattern component renders a simplified circuit board pattern with straight lines and nodes
 */
const CircuitGridPattern: React.FC<CircuitGridPatternProps> = React.memo(
  ({ width, height, color, density, flashDuration, optimizationLevel }) => {
    // Generate grid pattern based on density and optimization level
    const { lines, nodes } = useMemo(() => {
      return generateCircuitPattern(width, height, density, optimizationLevel);
    }, [width, height, density, optimizationLevel]);

    // Create pulsing animation for nodes
    const pulseAnim = useNeonPulse(
      flashDuration,
      0.3, // min opacity
      1.0 // max opacity
    );

    return (
      <View style={styles.gridContainer}>
        {/* Render lines */}
        {lines.map((line, index) => (
          <View
            key={`line-${index}`}
            style={[
              styles.line,
              {
                backgroundColor: color,
                width: line.width,
                height: line.height,
                left: line.x,
                top: line.y,
                opacity: 0.6,
              },
            ]}
          />
        ))}

        {/* Render nodes with pulsing animation */}
        {nodes.map((node, index) => (
          <Animated.View
            key={`node-${index}`}
            style={[
              styles.node,
              {
                backgroundColor: color,
                left: node.x,
                top: node.y,
                opacity: pulseAnim.interpolate({
                  inputRange: [0.3, 0.6, 1.0],
                  outputRange: [0.3, 0.8, 1.0],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      prevProps.color === nextProps.color &&
      prevProps.density === nextProps.density &&
      prevProps.optimizationLevel === nextProps.optimizationLevel
    );
  }
);

const styles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
  },
  node: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default CircuitGridPattern;
