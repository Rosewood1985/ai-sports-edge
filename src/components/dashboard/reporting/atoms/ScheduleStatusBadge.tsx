import { Chip, ChipProps } from '@mui/material';
import React from 'react';

import { ReportStatus } from '../../../../types/reporting';

interface ScheduleStatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

/**
 * Badge component for displaying report schedule status
 */
export const ScheduleStatusBadge: React.FC<ScheduleStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (): { label: string; color: ChipProps['color'] } => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success' };
      case 'paused':
        return { label: 'Paused', color: 'warning' };
      case 'error':
        return { label: 'Error', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  const { label, color } = getStatusConfig();

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      className={className}
      sx={{
        fontWeight: 'medium',
        textTransform: 'capitalize',
      }}
    />
  );
};
