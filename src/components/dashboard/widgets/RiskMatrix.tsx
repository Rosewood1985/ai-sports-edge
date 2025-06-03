import React from 'react';

export interface RiskMatrixItem {
  churnLikelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  count: number;
}

export interface RiskMatrixProps {
  data: RiskMatrixItem[];
  className?: string;
}

export function RiskMatrix({ data, className = '' }: RiskMatrixProps) {
  // Create a map for easy lookup
  const matrixMap = new Map<string, number>();
  data.forEach(item => {
    matrixMap.set(`${item.churnLikelihood}-${item.impact}`, item.count);
  });

  // Get count for a specific cell
  const getCount = (likelihood: string, impact: string): number => {
    return matrixMap.get(`${likelihood}-${impact}`) || 0;
  };

  // Get color class based on likelihood and impact
  const getCellColorClass = (likelihood: string, impact: string): string => {
    if (likelihood === 'high' && impact === 'high')
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    if (likelihood === 'high' || impact === 'high')
      return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200';
    if (likelihood === 'medium' && impact === 'medium')
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
    return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
  };

  return (
    <div className={`risk-matrix ${className}`}>
      <div className="grid grid-cols-4 gap-1">
        {/* Header row */}
        <div className="p-2 font-medium text-center" />
        <div className="p-2 font-medium text-center">Low Impact</div>
        <div className="p-2 font-medium text-center">Medium Impact</div>
        <div className="p-2 font-medium text-center">High Impact</div>

        {/* High likelihood row */}
        <div className="p-2 font-medium text-right">High Likelihood</div>
        <div className={`p-3 text-center rounded ${getCellColorClass('high', 'low')}`}>
          {getCount('high', 'low')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('high', 'medium')}`}>
          {getCount('high', 'medium')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('high', 'high')}`}>
          {getCount('high', 'high')}
        </div>

        {/* Medium likelihood row */}
        <div className="p-2 font-medium text-right">Medium Likelihood</div>
        <div className={`p-3 text-center rounded ${getCellColorClass('medium', 'low')}`}>
          {getCount('medium', 'low')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('medium', 'medium')}`}>
          {getCount('medium', 'medium')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('medium', 'high')}`}>
          {getCount('medium', 'high')}
        </div>

        {/* Low likelihood row */}
        <div className="p-2 font-medium text-right">Low Likelihood</div>
        <div className={`p-3 text-center rounded ${getCellColorClass('low', 'low')}`}>
          {getCount('low', 'low')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('low', 'medium')}`}>
          {getCount('low', 'medium')}
        </div>
        <div className={`p-3 text-center rounded ${getCellColorClass('low', 'high')}`}>
          {getCount('low', 'high')}
        </div>
      </div>
    </div>
  );
}
