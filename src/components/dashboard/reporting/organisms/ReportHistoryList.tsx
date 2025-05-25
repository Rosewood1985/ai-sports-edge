import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ReportHistory, ReportFormat, ReportType } from '../../../../types/reporting';
import { ReportHistoryCard } from '../molecules';
import { DateRangePicker } from '../atoms';

interface ReportHistoryListProps {
  history: ReportHistory[];
  loading: boolean;
  error: Error | null;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  onFilter: (filters: ReportHistoryFilters) => void;
  className?: string;
}

interface ReportHistoryFilters {
  startDate: string;
  endDate: string;
  status: 'all' | 'success' | 'failed';
  format: 'all' | ReportFormat;
  reportType: 'all' | ReportType;
}

/**
 * Component for displaying a list of report history items with filtering and pagination
 */
export const ReportHistoryList: React.FC<ReportHistoryListProps> = ({
  history,
  loading,
  error,
  onDownload,
  onView,
  onFilter,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ReportHistoryFilters>({
    startDate: '',
    endDate: '',
    status: 'all',
    format: 'all',
    reportType: 'all',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 6;

  // Filter history based on search term and filters
  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.templateName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesFormat = filters.format === 'all' || item.format === filters.format;
    const matchesReportType =
      filters.reportType === 'all' || item.reportType === filters.reportType;

    const matchesDateRange =
      (!filters.startDate || new Date(item.runAt) >= new Date(filters.startDate)) &&
      (!filters.endDate || new Date(item.runAt) <= new Date(filters.endDate));

    return matchesSearch && matchesStatus && matchesFormat && matchesReportType && matchesDateRange;
  });

  // Paginate history
  const paginatedHistory = filteredHistory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handleFilterChange = (key: keyof ReportHistoryFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filter changes
  };

  const handleApplyFilters = () => {
    onFilter(filters);
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      format: 'all',
      reportType: 'all',
    });
    setPage(1);
  };

  return (
    <Box className={className}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Report History
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search reports..."
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {showFilters && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filters
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date Range
            </Typography>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={date => handleFilterChange('startDate', date)}
              onEndDateChange={date => handleFilterChange('endDate', date)}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                label="Status"
                onChange={(e: SelectChangeEvent) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="format-filter-label">Format</InputLabel>
              <Select
                labelId="format-filter-label"
                value={filters.format}
                label="Format"
                onChange={(e: SelectChangeEvent) => handleFilterChange('format', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel id="type-filter-label">Report Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={filters.reportType}
                label="Report Type"
                onChange={(e: SelectChangeEvent) =>
                  handleFilterChange('reportType', e.target.value)
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="analytics">Analytics</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleResetFilters}>
              Reset
            </Button>
          </Box>
        </Box>
      )}

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

      {!loading && !error && filteredHistory.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No report history found.{' '}
          {searchTerm || Object.values(filters).some(v => v !== 'all' && v !== '')
            ? 'Try adjusting your filters.'
            : ''}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {paginatedHistory.map(item => (
          <Box key={item.id}>
            <ReportHistoryCard history={item} onDownload={onDownload} onView={onView} />
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
