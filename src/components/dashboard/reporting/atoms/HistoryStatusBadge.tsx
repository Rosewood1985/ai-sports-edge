import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import React from 'react';

interface HistoryStatusBadgeProps {
  status: 'success' | 'failed';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Badge component for displaying report history status
 */
export const HistoryStatusBadge: React.FC<HistoryStatusBadgeProps> = ({
  status,
  className,
  showTooltip = true,
}) => {
  const getStatusConfig = (): {
    label: string;
    color: ChipProps['color'];
    icon: React.ReactElement;
    tooltip: string;
  } => {
    switch (status) {
      case 'success':
        return {
          label: 'Success',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />,
          tooltip: 'Report generated successfully',
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'error',
          icon: <ErrorIcon fontSize="small" />,
          tooltip: 'Report generation failed',
        };
      default:
        return {
          label: status,
          color: 'default',
          icon: <CheckCircleIcon fontSize="small" />,
          tooltip: 'Unknown status',
        };
    }
  };

  const { label, color, icon, tooltip } = getStatusConfig();

  const chipComponent = (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={icon as React.ReactElement}
      className={className}
      sx={{
        fontWeight: 'medium',
        textTransform: 'capitalize',
      }}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {chipComponent}
      </Tooltip>
    );
  }

  return chipComponent;
};
