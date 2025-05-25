import React from 'react';
import { Chip, Tooltip, Avatar } from '@mui/material';
import { ReportRecipient } from '../../../../types/reporting';
import PersonIcon from '@mui/icons-material/Person';

interface RecipientChipProps {
  recipient: ReportRecipient;
  onDelete?: () => void;
  className?: string;
}

/**
 * Chip component for displaying a report recipient
 */
export const RecipientChip: React.FC<RecipientChipProps> = ({ recipient, onDelete, className }) => {
  const { email, name } = recipient;
  const displayName = name || email;
  const initials = name
    ? name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : email.substring(0, 2).toUpperCase();

  return (
    <Tooltip title={email} arrow>
      <Chip
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {initials || <PersonIcon fontSize="small" />}
          </Avatar>
        }
        label={displayName}
        onDelete={onDelete}
        className={className}
        sx={{
          maxWidth: '200px',
          '& .MuiChip-label': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
      />
    </Tooltip>
  );
};
