/**
 * TemplateList Component
 *
 * An organism component that displays a list of report templates and provides
 * functionality to create, edit, and delete templates.
 */

import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import { useReportGeneration } from '../../../../hooks/useJobQueue';
import { ReportTemplate, ReportType } from '../../../../types/reporting';
import JobProgressIndicator from '../JobProgressIndicator';
import ReportTemplateForm from '../ReportTemplateForm';
import TemplateActions from '../molecules/TemplateActions';
import TemplateCard from '../molecules/TemplateCard';

// Mock API for now - will be replaced with real API calls
const mockApi = {
  getReportTemplates: async (): Promise<ReportTemplate[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
      {
        id: 'template-001',
        name: 'Monthly Performance Report',
        description: 'Comprehensive monthly performance analysis',
        type: ReportType.ANALYTICS,
        createdAt: '2025-05-01T10:00:00Z',
        updatedAt: '2025-05-15T14:30:00Z',
        widgets: ['bet-slip-performance', 'subscription-analytics', 'system-health'],
        filters: [
          { field: 'date', operator: 'greater_than', value: '2025-04-01' },
          { field: 'date', operator: 'less_than', value: '2025-05-01' },
        ],
      },
      {
        id: 'template-002',
        name: 'Weekly Subscription Summary',
        description: 'Weekly summary of subscription metrics',
        type: ReportType.STANDARD,
        createdAt: '2025-05-05T09:15:00Z',
        updatedAt: '2025-05-20T11:45:00Z',
        widgets: ['subscription-analytics'],
        filters: [
          { field: 'date', operator: 'greater_than', value: '2025-05-13' },
          { field: 'date', operator: 'less_than', value: '2025-05-20' },
        ],
      },
      {
        id: 'template-003',
        name: 'System Health Check',
        description: 'Daily system health monitoring report',
        type: ReportType.PERFORMANCE,
        createdAt: '2025-05-10T08:30:00Z',
        updatedAt: '2025-05-22T16:20:00Z',
        widgets: ['system-health'],
        filters: [{ field: 'date', operator: 'equals', value: '2025-05-22' }],
      },
    ];
  },

  createReportTemplate: async (template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      ...template,
      id: `template-${Math.floor(Math.random() * 1000)}`,
    };
  },

  updateReportTemplate: async (template: ReportTemplate): Promise<ReportTemplate> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      ...template,
      updatedAt: new Date().toISOString(),
    };
  },

  deleteReportTemplate: async (id: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  },
};

interface TemplateListProps {
  className?: string;
}

/**
 * Component for displaying a list of report templates
 */
const TemplateList: React.FC<TemplateListProps> = ({ className = '' }): React.ReactElement => {
  // State
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Hooks
  const { generateReport } = useReportGeneration();

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await mockApi.getReportTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle create template
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  // Handle edit template
  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  // Handle delete template
  const handleDeleteTemplate = (templateId: string) => {
    setDeletingTemplateId(templateId);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingTemplateId) return;

    try {
      await mockApi.deleteReportTemplate(deletingTemplateId);
      setTemplates(templates.filter(t => t.id !== deletingTemplateId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingTemplateId(null);
    }
  };

  // Handle save template
  const handleSaveTemplate = async (templateData: Omit<ReportTemplate, 'id'>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate = await mockApi.updateReportTemplate({
          ...templateData,
          id: editingTemplate.id,
        });

        setTemplates(templates.map(t => (t.id === updatedTemplate.id ? updatedTemplate : t)));
      } else {
        // Create new template
        const newTemplate = await mockApi.createReportTemplate(templateData);
        setTemplates([...templates, newTemplate]);
      }

      setIsFormOpen(false);
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  // Handle generate report
  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      const job = await generateReport(template.id, template.filters as any[], 'pdf');

      setGeneratingReportId(job.id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (template: ReportTemplate) => {
    try {
      const { id, createdAt, updatedAt, ...templateData } = template;

      const newTemplate = await mockApi.createReportTemplate({
        ...templateData,
        name: `${templateData.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setTemplates([...templates, newTemplate]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Handle report generation complete
  const handleReportComplete = (result: any) => {
    setGeneratingReportId(null);
    // In a real app, we might show a notification or redirect to the report
    console.log('Report generation complete:', result);
  };

  // Render loading state
  if (isLoading && templates.length === 0) {
    return (
      <Box className={className} display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error && templates.length === 0) {
    return (
      <Box className={className} p={2}>
        <Alert severity="error">Error loading templates: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box className={className}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Report Templates</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      {/* Templates grid */}
      <Grid container spacing={3} component="div">
        {templates.map(template => (
          <Grid item xs={12} md={6} lg={4} key={template.id} component="div">
            <TemplateCard
              template={template}
              onEdit={handleEditTemplate}
              onGenerate={handleGenerateReport}
              onMenuOpen={(e, id) => {
                // This is handled by TemplateActions, but we need to pass it to TemplateCard
                // In a real app, we might use a context or state management library
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {templates.length === 0 && !isLoading && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="h6" gutterBottom>
            No Report Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first report template to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
        </Paper>
      )}

      {/* Template form dialog */}
      <Dialog open={isFormOpen} onClose={handleCancelForm} maxWidth="md" fullWidth>
        <DialogContent>
          <ReportTemplateForm
            initialTemplate={editingTemplate || undefined}
            onSave={handleSaveTemplate}
            onCancel={handleCancelForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report generation progress */}
      {generatingReportId && (
        <Dialog
          open={!!generatingReportId}
          onClose={() => setGeneratingReportId(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Generating Report</DialogTitle>
          <DialogContent>
            <JobProgressIndicator
              jobId={generatingReportId}
              onComplete={handleReportComplete}
              showDetails
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default TemplateList;
