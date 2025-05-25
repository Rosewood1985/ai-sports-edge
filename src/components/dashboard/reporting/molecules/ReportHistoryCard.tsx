import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ReportHistory } from '../../../../types/reporting';
import { HistoryStatusBadge, FormatBadge, RecipientChip } from '../atoms';

interface ReportHistoryCardProps {
  history: ReportHistory;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  className?: string;
}

/**
 * Card component for displaying a report history item
 */
export const ReportHistoryCard: React.FC<ReportHistoryCardProps> = ({
  history,
  onDownload,
  onView,
  className,
}) => {
  const { id, name, templateName, runAt, runBy, status, format, recipients, error } = history;

  const hasRecipients = recipients && recipients.length > 0;
  const isSuccess = status === 'success';

  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {name}
          </Typography>
          <HistoryStatusBadge status={status} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Template:
          </Typography>
          <Typography variant="body2">{templateName}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Format:
          </Typography>
          <FormatBadge format={format} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Run by:
          </Typography>
          <Typography variant="body2">{runBy}</Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.dark">
              Error: {error}
            </Typography>
          </Box>
        )}

        {hasRecipients && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Recipients:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {recipients.map((recipient, index) => (
                <RecipientChip key={index} recipient={recipient} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Generated on:
        </Typography>
        <Typography variant="body2">{new Date(runAt).toLocaleString()}</Typography>
      </Box>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        {isSuccess && (
          <>
            <Tooltip title="View report">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onView(id)}
                aria-label="View report"
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download report">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onDownload(id)}
                aria-label="Download report"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardActions>
    </Card>
  );
};
