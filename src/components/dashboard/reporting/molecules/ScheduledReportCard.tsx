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
  Chip,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ScheduledReport } from '../../../../types/reporting';
import { ScheduleStatusBadge, FrequencyBadge, RecipientChip } from '../atoms';

interface ScheduledReportCardProps {
  report: ScheduledReport;
  onRun: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  className?: string;
}

/**
 * Card component for displaying a scheduled report
 */
export const ScheduledReportCard: React.FC<ScheduledReportCardProps> = ({
  report,
  onRun,
  onPause,
  onResume,
  onDelete,
  onEdit,
  className,
}) => {
  const { id, name, description, status, schedule, recipients, templateName, lastRun, nextRun } =
    report;

  const isActive = status === 'active';

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
          <ScheduleStatusBadge status={status} />
        </Box>

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Template:
          </Typography>
          <Chip label={templateName} size="small" color="primary" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Frequency:
          </Typography>
          <FrequencyBadge
            frequency={schedule.frequency}
            dayOfWeek={schedule.dayOfWeek}
            dayOfMonth={schedule.dayOfMonth}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Recipients:
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {recipients.map((recipient, index) => (
            <RecipientChip key={index} recipient={recipient} />
          ))}
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Last run:
            </Typography>
            <Typography variant="body2">
              {lastRun ? new Date(lastRun).toLocaleString() : 'Never'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Next run:
            </Typography>
            <Typography variant="body2">
              {nextRun ? new Date(nextRun).toLocaleString() : 'Not scheduled'}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Tooltip title="Run now">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onRun(id)}
            aria-label="Run report now"
          >
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>

        {isActive ? (
          <Tooltip title="Pause">
            <IconButton
              size="small"
              color="warning"
              onClick={() => onPause(id)}
              aria-label="Pause report schedule"
            >
              <PauseIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Resume">
            <IconButton
              size="small"
              color="success"
              onClick={() => onResume(id)}
              aria-label="Resume report schedule"
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Edit">
          <IconButton size="small" color="info" onClick={() => onEdit(id)} aria-label="Edit report">
            <EditIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(id)}
            aria-label="Delete report"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
