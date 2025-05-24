/**
 * TemplateStatusBadge Component
 *
 * An atomic component that displays a badge indicating the template type/status.
 */

import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { ReportType } from '../../../../types/reporting';

interface TemplateStatusBadgeProps {
  type: ReportType;
  className?: string;
}

/**
 * Component for displaying a template status badge
 */
const TemplateStatusBadge: React.FC<TemplateStatusBadgeProps> = ({ type, className = '' }) => {
  // Determine color based on type
  let color: ChipProps['color'] = 'default';

  switch (type) {
    case ReportType.ANALYTICS:
      color = 'primary';
      break;
    case ReportType.PERFORMANCE:
      color = 'secondary';
      break;
    case ReportType.CUSTOM:
      color = 'info';
      break;
    default:
      color = 'default';
  }

  return <Chip label={type} size="small" color={color} className={className} />;
};

export default TemplateStatusBadge;
