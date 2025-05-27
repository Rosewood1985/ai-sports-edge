/**
 * Atomic Molecule: PieChart
 * Reusable pie chart component with division by zero protection
 * Location: /atomic/molecules/charts/PieChart.tsx
 */
import React, { memo, useMemo } from 'react';

export interface PieChartItem {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: PieChartItem[];
  className?: string;
  showLegend?: boolean;
  colors?: string[];
}

export const PieChart = memo<PieChartProps>(({
  data,
  className = '',
  showLegend = true,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
}: PieChartProps) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`pie-chart ${className}`}>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Memoize calculations for performance
  const { total, segments } = useMemo(() => {
    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

    // Calculate segments
    let cumulativePercentage = 0;
    const segments = data.map((item, index) => {
      // Prevent division by zero
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const startAngle = cumulativePercentage;
      cumulativePercentage += percentage;
      const endAngle = cumulativePercentage;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        color: colors[index % colors.length],
      };
    });

    return { total, segments };
  }, [data, colors]);

  // Handle case where total is zero
  if (total === 0) {
    return (
      <div className={`pie-chart ${className}`}>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No values to display
        </div>
      </div>
    );
  }

  // Memoize SVG path generation
  const segmentPaths = useMemo(() => {
    return segments.map((segment) => {
      // Convert angles to radians
      const startRad = (segment.startAngle / 100) * 2 * Math.PI - Math.PI / 2;
      const endRad = (segment.endAngle / 100) * 2 * Math.PI - Math.PI / 2;

      // Calculate coordinates
      const radius = 50;
      const centerX = 50;
      const centerY = 50;

      const startX = centerX + radius * Math.cos(startRad);
      const startY = centerY + radius * Math.sin(startRad);
      const endX = centerX + radius * Math.cos(endRad);
      const endY = centerY + radius * Math.sin(endRad);

      // Create arc flag
      const largeArcFlag = segment.endAngle - segment.startAngle > 50 ? 1 : 0;

      // Create SVG path
      const path = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z',
      ].join(' ');

      return { path, color: segment.color };
    });
  }, [segments]);

  return (
    <div className={`pie-chart ${className}`}>
      <div className="flex flex-col md:flex-row items-center">
        <div className="pie-container w-48 h-48 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {segmentPaths.map((segment, index) => (
              <path
                key={`segment-${index}`}
                d={segment.path}
                fill={segment.color}
                stroke="#fff"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        {showLegend && (
          <div className="legend ml-0 md:ml-6 mt-4 md:mt-0">
            {segments.map((segment, index) => (
              <div key={`legend-${index}`} className="legend-item flex items-center mb-2">
                <div
                  className="legend-color w-4 h-4 rounded-sm mr-2"
                  style={{ backgroundColor: segment.color }}
                ></div>
                <div className="legend-text">
                  <span className="text-sm font-medium">{segment.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {segment.percentage.toFixed(1)}% ({segment.value})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.showLegend === nextProps.showLegend &&
    JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors)
  );
});