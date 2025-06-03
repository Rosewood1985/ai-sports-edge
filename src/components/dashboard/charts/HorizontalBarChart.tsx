import React from 'react';

export interface BarChartItem {
  name: string;
  value: number;
}

export interface HorizontalBarChartProps {
  data: BarChartItem[];
  showValues?: boolean;
  maxValue?: number;
  className?: string;
}

export function HorizontalBarChart({
  data,
  showValues = true,
  maxValue,
  className = '',
}: HorizontalBarChartProps) {
  // Calculate the maximum value for scaling
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value)) * 1.1;

  return (
    <div className={`horizontal-bar-chart ${className}`}>
      {data.map((item, index) => {
        const percentage = (item.value / calculatedMaxValue) * 100;

        return (
          <div key={`${item.name}-${index}`} className="bar-item mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              {showValues && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{item.value}</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
