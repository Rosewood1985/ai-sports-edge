/**
 * ReportTemplateForm Component
 *
 * This component provides a form for creating and editing report templates.
 * It allows users to select widgets, set filters, and configure report options.
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Typography,
  Paper,
  Divider,
  Grid,
  IconButton,
  SelectChangeEvent,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { ReportTemplate, ReportType } from '../../../types/reporting';

// Available widgets for reports
const AVAILABLE_WIDGETS = [
  { id: 'bet-slip-performance', name: 'Bet Slip Performance' },
  { id: 'subscription-analytics', name: 'Subscription Analytics' },
  { id: 'system-health', name: 'System Health' },
  { id: 'conversion-funnel', name: 'Conversion Funnel' },
  { id: 'user-engagement', name: 'User Engagement' },
  { id: 'fraud-detection', name: 'Fraud Detection' },
  { id: 'revenue-forecast', name: 'Revenue Forecast' },
  { id: 'churn-prediction', name: 'Churn Prediction' },
];

// Available filter fields
const FILTER_FIELDS = [
  { id: 'date', name: 'Date' },
  { id: 'user_id', name: 'User ID' },
  { id: 'subscription_type', name: 'Subscription Type' },
  { id: 'payment_status', name: 'Payment Status' },
  { id: 'region', name: 'Region' },
  { id: 'platform', name: 'Platform' },
];

// Filter operators
const FILTER_OPERATORS = [
  { id: 'equals', name: 'Equals' },
  { id: 'not_equals', name: 'Not Equals' },
  { id: 'greater_than', name: 'Greater Than' },
  { id: 'less_than', name: 'Less Than' },
  { id: 'contains', name: 'Contains' },
  { id: 'not_contains', name: 'Not Contains' },
  { id: 'in', name: 'In' },
  { id: 'not_in', name: 'Not In' },
];

interface ReportTemplateFormProps {
  initialTemplate?: ReportTemplate;
  onSave: (template: Omit<ReportTemplate, 'id'>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

/**
 * Component for creating and editing report templates
 */
const ReportTemplateForm: React.FC<ReportTemplateFormProps> = ({
  initialTemplate,
  onSave,
  onCancel,
  className = '',
}) => {
  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<ReportType>(ReportType.STANDARD);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with initial template if provided
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description || '');
      setType(initialTemplate.type || ReportType.STANDARD);
      setSelectedWidgets((initialTemplate.widgets as string[]) || []);
      // Ensure filters is always an array
      setFilters(Array.isArray(initialTemplate.filters) ? initialTemplate.filters : []);
    } else {
      // Default empty filter
      setFilters([{ field: '', operator: '', value: '' }]);
    }
  }, [initialTemplate]);

  // Handle widget selection change
  const handleWidgetChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedWidgets(typeof value === 'string' ? value.split(',') : value);
  };

  // Handle filter field change
  const handleFilterFieldChange = (index: number, field: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], field };
    setFilters(newFilters);
  };

  // Handle filter operator change
  const handleFilterOperatorChange = (index: number, operator: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], operator };
    setFilters(newFilters);
  };

  // Handle filter value change
  const handleFilterValueChange = (index: number, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], value };
    setFilters(newFilters);
  };

  // Add a new filter
  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: '', value: '' }]);
  };

  // Remove a filter
  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (selectedWidgets.length === 0) {
      newErrors.widgets = 'At least one widget must be selected';
    }

    // Validate filters
    const validFilters = filters.filter(filter => filter.field && filter.operator && filter.value);

    if (validFilters.length !== filters.length) {
      newErrors.filters = 'All filters must be complete or removed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out incomplete filters
      const validFilters = filters.filter(
        filter => filter.field && filter.operator && filter.value
      );

      const templateData: Omit<ReportTemplate, 'id'> = {
        name,
        description,
        type,
        widgets: selectedWidgets,
        filters: validFilters,
        createdAt: initialTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(templateData);
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ submit: 'Failed to save template. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} className={className} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        {initialTemplate ? 'Edit Report Template' : 'Create New Report Template'}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Basic Information
            </Typography>
          </Grid>

          {/* Name */}
          <Grid item xs={12} md={6} component="div">
            <TextField
              fullWidth
              label="Template Name"
              value={name}
              onChange={e => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          {/* Type */}
          <Grid item xs={12} md={6} component="div">
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={type}
                onChange={e => setType(e.target.value as ReportType)}
                label="Report Type"
              >
                <MenuItem value={ReportType.STANDARD}>Standard</MenuItem>
                <MenuItem value={ReportType.ANALYTICS}>Analytics</MenuItem>
                <MenuItem value={ReportType.PERFORMANCE}>Performance</MenuItem>
                <MenuItem value={ReportType.CUSTOM}>Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item xs={12} component="div">
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Grid>

          {/* Widgets */}
          <Grid item xs={12} component="div">
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Report Widgets
            </Typography>
          </Grid>

          <Grid item xs={12} component="div">
            <FormControl fullWidth error={!!errors.widgets}>
              <InputLabel>Select Widgets</InputLabel>
              <Select
                multiple
                value={selectedWidgets}
                onChange={handleWidgetChange}
                input={<OutlinedInput label="Select Widgets" />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => {
                      const widget = AVAILABLE_WIDGETS.find(w => w.id === value);
                      return <Chip key={value} label={widget ? widget.name : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {AVAILABLE_WIDGETS.map(widget => (
                  <MenuItem key={widget.id} value={widget.id}>
                    <Checkbox checked={selectedWidgets.indexOf(widget.id) > -1} />
                    <ListItemText primary={widget.name} />
                  </MenuItem>
                ))}
              </Select>
              {errors.widgets && <FormHelperText>{errors.widgets}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Filters */}
          <Grid item xs={12} component="div">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Filters
              </Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddFilter} size="small">
                Add Filter
              </Button>
            </Box>
          </Grid>

          {filters.map((filter, index) => (
            <Grid item xs={12} key={index} component="div">
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={filter.field}
                    onChange={e => handleFilterFieldChange(index, e.target.value)}
                    label="Field"
                  >
                    {FILTER_FIELDS.map(field => (
                      <MenuItem key={field.id} value={field.id}>
                        {field.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filter.operator}
                    onChange={e => handleFilterOperatorChange(index, e.target.value)}
                    label="Operator"
                  >
                    {FILTER_OPERATORS.map(operator => (
                      <MenuItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  sx={{ flex: 1 }}
                  label="Value"
                  value={filter.value}
                  onChange={e => handleFilterValueChange(index, e.target.value)}
                />

                <IconButton
                  color="error"
                  onClick={() => handleRemoveFilter(index)}
                  disabled={filters.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}

          {errors.filters && (
            <Grid item xs={12} component="div">
              <FormHelperText error>{errors.filters}</FormHelperText>
            </Grid>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <Grid item xs={12} component="div">
              <Typography color="error">{errors.submit}</Typography>
            </Grid>
          )}

          {/* Form Actions */}
          <Grid item xs={12} component="div">
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : initialTemplate
                    ? 'Update Template'
                    : 'Create Template'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ReportTemplateForm;
