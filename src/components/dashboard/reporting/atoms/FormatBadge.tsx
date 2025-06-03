import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Chip, ChipProps } from '@mui/material';
import React from 'react';

import { ReportFormat } from '../../../../types/reporting';

interface FormatBadgeProps {
  format: ReportFormat;
  className?: string;
}

/**
 * Badge component for displaying report format
 */
export const FormatBadge: React.FC<FormatBadgeProps> = ({ format, className }) => {
  const getFormatConfig = (): {
    label: string;
    color: ChipProps['color'];
    icon: React.ReactElement;
  } => {
    switch (format) {
      case 'pdf':
        return {
          label: 'PDF',
          color: 'error',
          icon: <PictureAsPdfIcon fontSize="small" />,
        };
      case 'csv':
        return {
          label: 'CSV',
          color: 'success',
          icon: <TableChartIcon fontSize="small" />,
        };
      case 'xlsx':
        return {
          label: 'Excel',
          color: 'success',
          icon: <TableChartIcon fontSize="small" />,
        };
      case 'docx':
        return {
          label: 'Word',
          color: 'primary',
          icon: <DescriptionIcon fontSize="small" />,
        };
      case 'png':
      case 'jpg':
        return {
          label: format.toUpperCase(),
          color: 'secondary',
          icon: <ImageIcon fontSize="small" />,
        };
      default:
        return {
          label: format,
          color: 'default',
          icon: <DescriptionIcon fontSize="small" />,
        };
    }
  };

  const { label, color, icon } = getFormatConfig();

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={icon as React.ReactElement}
      className={className}
      sx={{
        fontWeight: 'medium',
        textTransform: 'uppercase',
      }}
    />
  );
};
