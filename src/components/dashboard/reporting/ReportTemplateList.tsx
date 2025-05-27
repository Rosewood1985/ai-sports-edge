import React, { useState } from 'react';
import { ReportTemplate, ReportType } from '../../../types/reporting';
import { EnhancedWidget } from '../widgets/EnhancedWidget';
import { Button } from '../../ui/Button';
import { ReportTemplateCard } from './ReportTemplateCard';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { AdminDashboardService } from '../../../services/adminDashboardService';

export interface ReportTemplateListProps {
  className?: string;
  onEditTemplate?: (template: ReportTemplate) => void;
}

/**
 * Component for displaying and managing report templates
 */
export function ReportTemplateList({ className = '', onEditTemplate }: ReportTemplateListProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Mock data for development
  React.useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real implementation, this would be:
        // const data = await AdminDashboardService.getReportTemplates();

        // For now, use mock data
        const mockTemplates: ReportTemplate[] = [
          {
            id: 'template-001',
            name: 'Monthly Performance Report',
            description: 'Comprehensive report of system performance metrics',
            type: ReportType.PERFORMANCE,
            createdAt: '2025-05-01T10:30:00Z',
            updatedAt: '2025-05-15T14:45:00Z',
            widgets: ['system-health', 'bet-slip-performance'],
          },
          {
            id: 'template-002',
            name: 'User Engagement Analytics',
            description: 'Detailed analytics on user engagement and retention',
            type: ReportType.ANALYTICS,
            createdAt: '2025-05-05T09:15:00Z',
            updatedAt: '2025-05-18T11:20:00Z',
            widgets: ['conversion-funnel', 'subscription-analytics'],
          },
          {
            id: 'template-003',
            name: 'Executive Summary',
            description: 'High-level overview for executive stakeholders',
            type: ReportType.STANDARD,
            createdAt: '2025-05-10T16:00:00Z',
            updatedAt: '2025-05-10T16:00:00Z',
            widgets: ['bet-slip-performance', 'subscription-analytics', 'system-health'],
          },
        ];

        setTemplates(mockTemplates);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
        console.error('Error fetching templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId === selectedTemplate ? null : templateId);
  };

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && onEditTemplate) {
      onEditTemplate(template);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        // In a real implementation, this would be:
        // await AdminDashboardService.deleteReportTemplate(templateId);

        // For now, just update the state
        setTemplates(templates.filter(template => template.id !== templateId));
        if (selectedTemplate === templateId) {
          setSelectedTemplate(null);
        }
      } catch (err) {
        console.error('Error deleting template:', err);
      }
    }
  };

  const handleCreateTemplate = () => {
    if (onEditTemplate) {
      onEditTemplate({ id: 'new' } as ReportTemplate);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Report Templates</h3>
        {onEditTemplate && (
          <Button variant="primary" onClick={handleCreateTemplate}>
            Create Template
          </Button>
        )}
      </div>

      <EnhancedWidget
        title="Available Templates"
        subtitle="Select a template to generate a report"
        size="large"
        isLoading={isLoading}
        error={error}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500 dark:text-gray-400">
              No templates found. Create a new template to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {templates.map(template => (
              <ReportTemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={() => handleSelectTemplate(template.id)}
                onEdit={() => handleEditTemplate(template.id)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}
          </div>
        )}
      </EnhancedWidget>

      {selectedTemplate && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => console.log('Generate report from template:', selectedTemplate)}
          >
            Generate Report
          </Button>
        </div>
      )}
    </div>
  );
}
