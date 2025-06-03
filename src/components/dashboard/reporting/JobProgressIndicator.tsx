/**
 * JobProgressIndicator Component
 *
 * This component displays the progress of an asynchronous job, along with
 * its status and any error messages. It provides visual feedback to the user
 * about the status of their report generation or export job.
 */

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Box, CircularProgress, Typography, Button, Alert, Paper } from '@mui/material';
import React from 'react';

import { useJobTracking } from '../../../hooks/useJobQueue';
import { JobStatus } from '../../../types/jobs';

interface JobProgressIndicatorProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Component for displaying job progress
 */
const JobProgressIndicator: React.FC<JobProgressIndicatorProps> = ({
  jobId,
  onComplete,
  onCancel,
  onRetry,
  showDetails = false,
  className = '',
}) => {
  const {
    job,
    isLoading,
    error,
    progress,
    isComplete,
    isFailed,
    isCancelled,
    cancelJob,
    refreshJob,
  } = useJobTracking(jobId);

  // Call onComplete when job completes
  React.useEffect(() => {
    if (isComplete && job?.result && onComplete) {
      onComplete(job.result);
    }
  }, [isComplete, job, onComplete]);

  // Handle cancel button click
  const handleCancel = async () => {
    await cancelJob();
    if (onCancel) {
      onCancel();
    }
  };

  // Handle retry button click
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Render loading state
  if (isLoading && !job) {
    return (
      <Box className={className} display="flex" alignItems="center" justifyContent="center" p={2}>
        <CircularProgress size={24} />
        <Typography variant="body2" ml={1}>
          Loading job...
        </Typography>
      </Box>
    );
  }

  // Render error state if job not found
  if (!job) {
    return (
      <Alert severity="error" className={className}>
        Job not found or has been deleted.
      </Alert>
    );
  }

  // Determine status icon and color
  let statusIcon;
  let statusColor;
  let statusText;

  switch (job.status) {
    case JobStatus.COMPLETED:
      statusIcon = <CheckCircleIcon />;
      statusColor = 'success.main';
      statusText = 'Completed';
      break;
    case JobStatus.FAILED:
      statusIcon = <ErrorIcon />;
      statusColor = 'error.main';
      statusText = 'Failed';
      break;
    case JobStatus.CANCELLED:
      statusIcon = <CancelIcon />;
      statusColor = 'warning.main';
      statusText = 'Cancelled';
      break;
    case JobStatus.PENDING:
      statusIcon = <HourglassEmptyIcon />;
      statusColor = 'info.main';
      statusText = 'Pending';
      break;
    case JobStatus.PROCESSING:
    default:
      statusIcon = <CircularProgress size={20} />;
      statusColor = 'primary.main';
      statusText = 'Processing';
      break;
  }

  return (
    <Paper
      elevation={1}
      className={className}
      sx={{
        p: 2,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box display="flex" flexDirection="column" width="100%">
        {/* Status header */}
        <Box display="flex" alignItems="center" mb={1}>
          <Box color={statusColor} display="flex" alignItems="center" mr={1}>
            {statusIcon}
          </Box>
          <Typography variant="subtitle1" color={statusColor} fontWeight="medium">
            {job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - {statusText}
          </Typography>
        </Box>

        {/* Progress bar */}
        {job.status === JobStatus.PROCESSING && (
          <Box width="100%" mb={2}>
            <Box
              sx={{
                height: 8,
                width: '100%',
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${progress}%`,
                  bgcolor: 'primary.main',
                  transition: 'width 0.3s ease-in-out',
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              {progress}% complete
            </Typography>
          </Box>
        )}

        {/* Error message */}
        {job.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {job.error}
          </Alert>
        )}

        {/* Job details */}
        {showDetails && (
          <Box mt={1} mb={2}>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Job ID:</strong> {job.id}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}
            </Typography>
            {job.startedAt && (
              <Typography variant="caption" color="text.secondary" component="div">
                <strong>Started:</strong> {new Date(job.startedAt).toLocaleString()}
              </Typography>
            )}
            {job.completedAt && (
              <Typography variant="caption" color="text.secondary" component="div">
                <strong>Completed:</strong> {new Date(job.completedAt).toLocaleString()}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Priority:</strong> {job.priority}
            </Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Box display="flex" justifyContent="flex-end" mt={1}>
          {job.status === JobStatus.PROCESSING && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
          )}
          {job.status === JobStatus.FAILED && onRetry && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleRetry}
              sx={{ ml: 1 }}
            >
              Retry
            </Button>
          )}
          {isComplete && job.result?.url && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              href={job.result.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </Button>
          )}
          <Button variant="text" color="inherit" size="small" onClick={refreshJob} sx={{ ml: 1 }}>
            Refresh
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default JobProgressIndicator;
