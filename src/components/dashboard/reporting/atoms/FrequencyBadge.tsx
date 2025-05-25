import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import { ReportFrequency } from '../../../../types/reporting';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';

interface FrequencyBadgeProps {
  frequency: ReportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  className?: string;
}

/**
 * Badge component for displaying report frequency
 */
export const FrequencyBadge: React.FC<FrequencyBadgeProps> = ({
  frequency,
  dayOfWeek,
  dayOfMonth,
  className,
}) => {
  const getFrequencyConfig = (): {
    label: string;
    color: ChipProps['color'];
    icon: React.ReactNode;
    tooltip: string;
  } => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    switch (frequency) {
      case 'daily':
        return {
          label: 'Daily',
          color: 'primary',
          icon: <CalendarTodayIcon fontSize="small" />,
          tooltip: 'Runs every day',
        };
      case 'weekly':
        return {
          label: 'Weekly',
          color: 'secondary',
          icon: <DateRangeIcon fontSize="small" />,
          tooltip: dayOfWeek !== undefined ? `Runs every ${days[dayOfWeek]}` : 'Runs weekly',
        };
      case 'monthly':
        return {
          label: 'Monthly',
          color: 'info',
          icon: <EventIcon fontSize="small" />,
          tooltip:
            dayOfMonth !== undefined ? `Runs on day ${dayOfMonth} of each month` : 'Runs monthly',
        };
      default:
        return {
          label: frequency,
          color: 'default',
          icon: <CalendarTodayIcon fontSize="small" />,
          tooltip: 'Custom schedule',
        };
    }
  };

  const { label, color, icon, tooltip } = getFrequencyConfig();

  return (
    <Tooltip title={tooltip} arrow>
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
    </Tooltip>
  );
};
