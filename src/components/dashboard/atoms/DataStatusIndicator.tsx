import React from 'react';

interface DataStatusIndicatorProps {
  isRealTime: boolean;
  lastUpdated?: string;
  connectionStatus?: boolean;
  className?: string;
}

export const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({
  isRealTime,
  lastUpdated,
  connectionStatus = true,
  className = '',
}) => {
  const getStatusColor = () => {
    if (!connectionStatus) return 'bg-red-500';
    if (isRealTime) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!connectionStatus) return 'Disconnected';
    if (isRealTime) return 'Live Data';
    return 'Fallback Data';
  };

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-gray-600 dark:text-gray-400">{getStatusText()}</span>
      </div>
      {lastUpdated && (
        <span className="text-gray-500 dark:text-gray-500">
          • Updated {formatLastUpdated(lastUpdated)}
        </span>
      )}
      {isRealTime && (
        <div className="flex items-center gap-1">
          <div className="animate-pulse w-1 h-1 bg-green-500 rounded-full" />
          <span className="text-green-600 dark:text-green-400">Real-time</span>
        </div>
      )}
    </div>
  );
};

export default DataStatusIndicator;
