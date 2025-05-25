import React, { useState } from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

/**
 * Date range picker component for selecting start and end dates
 * Uses simple text inputs with date format validation
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  className,
}) => {
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  const validateDate = (dateString: string): boolean => {
    // Simple date validation for YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setStartError(null);

    if (newDate && !validateDate(newDate)) {
      setStartError('Invalid date format (YYYY-MM-DD)');
      onStartDateChange(newDate);
      return;
    }

    if (newDate && endDate && newDate > endDate) {
      setStartError('Start date cannot be after end date');
    }

    onStartDateChange(newDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setEndError(null);

    if (newDate && !validateDate(newDate)) {
      setEndError('Invalid date format (YYYY-MM-DD)');
      onEndDateChange(newDate);
      return;
    }

    if (newDate && startDate && newDate < startDate) {
      setEndError('End date cannot be before start date');
    }

    onEndDateChange(newDate);
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: 'center',
      }}
    >
      <TextField
        label="Start Date"
        value={startDate}
        onChange={handleStartDateChange}
        error={!!startError}
        helperText={startError || 'YYYY-MM-DD'}
        inputProps={{
          min: minDate,
          max: maxDate || endDate,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarTodayIcon />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ typography: 'body1', mx: 1, display: { xs: 'none', sm: 'block' } }}>to</Box>
      <TextField
        label="End Date"
        value={endDate}
        onChange={handleEndDateChange}
        error={!!endError}
        helperText={endError || 'YYYY-MM-DD'}
        inputProps={{
          min: minDate || startDate,
          max: maxDate,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarTodayIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};
