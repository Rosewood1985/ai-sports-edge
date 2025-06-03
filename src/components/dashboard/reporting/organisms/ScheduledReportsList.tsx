import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  SelectChangeEvent,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import React, { useState } from 'react';

import { ScheduledReport } from '../../../../types/reporting';
import { ScheduledReportCard } from '../molecules';

interface ScheduledReportsListProps {
  reports: ScheduledReport[];
  loading: boolean;
  error: Error | null;
  onRun: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  className?: string;
}

/**
 * Component for displaying a list of scheduled reports with filtering and pagination
 */
export const ScheduledReportsList: React.FC<ScheduledReportsListProps> = ({
  reports,
  loading,
  error,
  onRun,
  onPause,
  onResume,
  onDelete,
  onEdit,
  onAdd,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const reportsPerPage = 6;

  // Filter reports based on search term and status filter
  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      report.templateName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginate reports
  const paginatedReports = filteredReports.slice(
    (page - 1) * reportsPerPage,
    page * reportsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  return (
    <Box className={className}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Scheduled Reports
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onAdd}>
          New Report
        </Button>
      </Box>

      <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
        <TextField
          placeholder="Search reports..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      {!loading && !error && filteredReports.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No scheduled reports found.{' '}
          {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : ''}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {paginatedReports.map(report => (
          <Box key={report.id}>
            <ScheduledReportCard
              report={report}
              onRun={onRun}
              onPause={onPause}
              onResume={onResume}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </Box>
        ))}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Box>
  );
};
