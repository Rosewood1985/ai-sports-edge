/**
 * WidgetChip Component
 *
 * An atomic component that displays a chip for a report widget.
 */

import { Chip, ChipProps } from '@mui/material';
import React from 'react';

// Widget name mapping
const WIDGET_NAMES: Record<string, string> = {
  'bet-slip-performance': 'Bet Slip Performance',
  'subscription-analytics': 'Subscription Analytics',
  'system-health': 'System Health',
  'conversion-funnel': 'Conversion Funnel',
  'user-engagement': 'User Engagement',
  'fraud-detection': 'Fraud Detection',
  'revenue-forecast': 'Revenue Forecast',
  'churn-prediction': 'Churn Prediction',
};

interface WidgetChipProps {
  widgetId: string;
  variant?: ChipProps['variant'];
  size?: ChipProps['size'];
  className?: string;
  onDelete?: () => void;
}

/**
 * Component for displaying a widget chip
 */
const WidgetChip: React.FC<WidgetChipProps> = ({
  widgetId,
  variant = 'outlined',
  size = 'small',
  className = '',
  onDelete,
}) => {
  // Get display name for widget
  const displayName = WIDGET_NAMES[widgetId] || widgetId;

  return (
    <Chip
      label={displayName}
      size={size}
      variant={variant}
      className={className}
      onDelete={onDelete}
    />
  );
};

export default WidgetChip;
