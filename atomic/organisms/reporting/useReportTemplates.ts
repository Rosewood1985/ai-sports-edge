/**
 * Atomic Organism: useReportTemplates Hook
 * Complex business logic for report template management
 * Location: /atomic/organisms/reporting/useReportTemplates.ts
 */
import { useState, useCallback, useEffect } from 'react';
import { ReportTemplate } from '../../../src/types/reporting';

/**
 * Hook for managing report templates
 * @returns Object with templates state and CRUD operations
 */
export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock data for now - replace with actual API call
      const mockTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: 'Daily Analytics Report',
          description: 'Daily overview of key metrics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'analytics' as any,
          widgets: ['subscriptions', 'revenue', 'users'],
          filters: [],
          format: 'pdf' as any,
          isSystem: false,
        },
        {
          id: '2',
          name: 'Weekly Performance Report',
          description: 'Weekly performance metrics',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'performance' as any,
          widgets: ['performance', 'errors', 'uptime'],
          filters: [],
          format: 'excel' as any,
          isSystem: false,
        }
      ];
      setTemplates(mockTemplates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch report templates'));
      console.error('Error fetching report templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (template: Partial<ReportTemplate>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock implementation - replace with actual API call
      const newTemplate: ReportTemplate = {
        id: `template-${Date.now()}`,
        name: template.name || 'New Template',
        description: template.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: template.type || 'standard' as any,
        widgets: template.widgets || [],
        filters: template.filters || [],
        format: template.format || 'pdf' as any,
        isSystem: false,
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create report template'));
      console.error('Error creating report template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<ReportTemplate>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock implementation - replace with actual API call
      setTemplates(prev => prev.map(template => 
        template.id === id 
          ? { ...template, ...updates, updatedAt: new Date().toISOString() }
          : template
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update report template'));
      console.error('Error updating report template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock implementation - replace with actual API call
      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete report template'));
      console.error('Error deleting report template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}