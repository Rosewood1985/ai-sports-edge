/**
 * Atomic Molecule: LineChart
 * Reusable chart component with null safety and error handling
 * Location: /atomic/molecules/charts/LineChart.tsx
 */
import React, { memo, useMemo } from 'react';

export interface LineChartDataPoint {
  date: string;
  count: number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  className?: string;
  height?: number;
  lineColor?: string;
  areaColor?: string;
  showPoints?: boolean;
  showLabels?: boolean;
}

export const LineChart = memo<LineChartProps>(
  ({
    data,
    className = '',
    height = 200,
    lineColor = '#3B82F6',
    areaColor = 'rgba(59, 130, 246, 0.2)',
    showPoints = true,
    showLabels = true,
  }: LineChartProps) => {
    // Handle empty data
    if (!data || data.length === 0) {
      return (
        <div className={`line-chart ${className}`} style={{ height: `${height}px` }}>
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available
          </div>
        </div>
      );
    }

    // Memoize expensive calculations
    const { sortedData, paddedMin, paddedMax, paddedRange } = useMemo(() => {
      // Sort data by date
      const sorted = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Find min and max values for scaling
      const counts = sorted.map(item => item.count || 0);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      const countRange = maxCount - minCount;

      // Handle case where all values are the same or range is 0
      const paddedMin =
        countRange > 0 ? Math.max(0, minCount - countRange * 0.1) : Math.max(0, minCount - 1);
      const paddedMax = countRange > 0 ? maxCount + countRange * 0.1 : maxCount + 1;
      const paddedRange = paddedMax - paddedMin;

      return {
        sortedData: sorted,
        paddedMin,
        paddedMax,
        paddedRange,
      };
    }, [data]);

    // Memoize SVG paths for performance
    const { linePath, areaPath, visibleLabelIndices } = useMemo(() => {
      // Calculate points for the SVG path
      const getX = (index: number) => (index / (sortedData.length - 1)) * 100;
      const getY = (count: number) => 100 - ((count - paddedMin) / paddedRange) * 100;

      // Create SVG line path
      const linePath = sortedData
        .map((item, index) => {
          const x = getX(index);
          const y = getY(item.count);
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

      // Create area path (for the filled area below the line)
      const areaLinePath = sortedData
        .map((item, index) => {
          const x = getX(index);
          const y = getY(item.count);
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');

      // Add points to close the area path at the bottom
      const lastIndex = sortedData.length - 1;
      const lastX = getX(lastIndex);
      const firstX = getX(0);
      const areaPath = `${areaLinePath} L ${lastX} 100 L ${firstX} 100 Z`;

      // Determine which dates to show as labels (to avoid overcrowding)
      const getVisibleLabels = () => {
        const totalLabels = sortedData.length;
        const maxLabels = 7; // Maximum number of labels to show

        if (totalLabels <= maxLabels) {
          return sortedData.map((_, index) => index);
        }

        // Show labels at regular intervals
        const interval = Math.ceil(totalLabels / maxLabels);
        const indices: number[] = [];

        for (let i = 0; i < totalLabels; i += interval) {
          indices.push(i);
        }

        // Always include the last label
        if (indices[indices.length - 1] !== totalLabels - 1) {
          indices.push(totalLabels - 1);
        }

        return indices;
      };

      return {
        linePath,
        areaPath,
        visibleLabelIndices: getVisibleLabels(),
        getX,
        getY,
      };
    }, [sortedData, paddedMin, paddedRange]);

    // Memoize date formatting
    const formatDate = useMemo(() => {
      return (dateString: string) => {
        const date = new Date(dateString);
        // Validate date before formatting
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
    }, []);

    return (
      <div className={`line-chart ${className}`} style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Area fill */}
          <path d={areaPath} fill={areaColor} />

          {/* Line */}
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />

          {/* Data points - only render if showing points and dataset is reasonable size */}
          {showPoints &&
            sortedData.length <= 100 &&
            sortedData.map((item, index) => (
              <circle
                key={`point-${index}`}
                cx={(index / (sortedData.length - 1)) * 100}
                cy={100 - ((item.count - paddedMin) / paddedRange) * 100}
                r="1.5"
                fill={lineColor}
                stroke="#fff"
                strokeWidth="0.5"
              />
            ))}
        </svg>

        {/* X-axis labels */}
        {showLabels && (
          <div
            className="date-labels grid"
            style={{ gridTemplateColumns: `repeat(${sortedData.length}, 1fr)` }}
          >
            {sortedData.map((item, index) => (
              <div
                key={`label-${index}`}
                className={`text-center text-xs ${
                  visibleLabelIndices.includes(index) ? 'visible' : 'invisible'
                }`}
              >
                {formatDate(item.date)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.height === nextProps.height &&
      prevProps.lineColor === nextProps.lineColor &&
      prevProps.areaColor === nextProps.areaColor &&
      prevProps.showPoints === nextProps.showPoints &&
      prevProps.showLabels === nextProps.showLabels
    );
  }
);
