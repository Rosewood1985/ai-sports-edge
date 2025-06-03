import React from 'react';

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

export function LineChart({
  data,
  className = '',
  height = 200,
  lineColor = '#3B82F6',
  areaColor = 'rgba(59, 130, 246, 0.2)',
  showPoints = true,
  showLabels = true,
}: LineChartProps) {
  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find min and max values for scaling
  const counts = sortedData.map(item => item.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const countRange = maxCount - minCount;

  // Handle case where all values are the same or range is 0
  const paddedMin =
    countRange > 0 ? Math.max(0, minCount - countRange * 0.1) : Math.max(0, minCount - 1);
  const paddedMax = countRange > 0 ? maxCount + countRange * 0.1 : maxCount + 1;
  const paddedRange = paddedMax - paddedMin;

  // Calculate points for the SVG path
  const getX = (index: number) => (index / (sortedData.length - 1)) * 100;
  const getY = (count: number) => 100 - ((count - paddedMin) / paddedRange) * 100;

  // Create SVG path
  const createLinePath = () => {
    return sortedData
      .map((item, index) => {
        const x = getX(index);
        const y = getY(item.count);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Create area path (for the filled area below the line)
  const createAreaPath = () => {
    const linePath = sortedData
      .map((item, index) => {
        const x = getX(index);
        const y = getY(item.count);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // Add points to close the path at the bottom
    const lastIndex = sortedData.length - 1;
    const lastX = getX(lastIndex);
    const firstX = getX(0);

    return `${linePath} L ${lastX} 100 L ${firstX} 100 Z`;
  };

  // Format date for labels
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Validate date before formatting
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

  const visibleLabelIndices = getVisibleLabels();

  return (
    <div className={`line-chart ${className}`} style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Area fill */}
        <path d={createAreaPath()} fill={areaColor} />

        {/* Line */}
        <path d={createLinePath()} fill="none" stroke={lineColor} strokeWidth="2" />

        {/* Data points */}
        {showPoints &&
          sortedData.map((item, index) => (
            <circle
              key={`point-${index}`}
              cx={getX(index)}
              cy={getY(item.count)}
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
}
