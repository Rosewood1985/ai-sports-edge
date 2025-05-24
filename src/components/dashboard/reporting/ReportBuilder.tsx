import React, { useState, useEffect } from 'react';
import { useReportTemplates } from '../../../hooks/useReporting';
import { ReportTemplate, ReportType } from '../../../types/reporting';
import { EnhancedWidget } from '../widgets/EnhancedWidget';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

export interface ReportBuilderProps {
  initialTemplate?: ReportTemplate | null;
  onSave?: (template: ReportTemplate) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Component for creating and editing report templates
 */
export function ReportBuilder({
  initialTemplate,
  onSave,
  onCancel,
  className = '',
}: ReportBuilderProps) {
  const { createTemplate, updateTemplate, isLoading } = useReportTemplates();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReportType>(ReportType.STANDARD);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Initialize form with template data if provided
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description || '');
      setType(initialTemplate.type || ReportType.STANDARD);
      setSelectedWidgets(initialTemplate.widgets || []);
      // Handle filters which could be an array or an object
      if (initialTemplate.filters) {
        if (Array.isArray(initialTemplate.filters)) {
          setFilters(initialTemplate.filters);
        } else {
          // Convert object to array if needed
          setFilters(
            Object.entries(initialTemplate.filters).map(([key, value]) => ({ field: key, value }))
          );
        }
      } else {
        setFilters([]);
      }
    }
  }, [initialTemplate]);

  const handleSave = async () => {
    try {
      setError(null);

      // Validate form
      if (!name.trim()) {
        setError(new Error('Template name is required'));
        return;
      }

      const templateData = {
        name,
        description,
        type,
        widgets: selectedWidgets,
        filters,
        updatedAt: new Date().toISOString(),
      };

      let result;

      if (initialTemplate && initialTemplate.id !== 'new') {
        // Update existing template
        result = await updateTemplate({
          ...templateData,
          id: initialTemplate.id,
          createdAt: initialTemplate.createdAt,
        });
      } else {
        // Create new template
        result = await createTemplate({
          ...templateData,
          createdAt: new Date().toISOString(),
        });
      }

      if (onSave) {
        onSave(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('An error occurred while saving the template')
      );
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const handleFilterChange = (index: number, field: string, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const handleWidgetToggle = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      setSelectedWidgets(selectedWidgets.filter(id => id !== widgetId));
    } else {
      setSelectedWidgets([...selectedWidgets, widgetId]);
    }
  };

  // Mock data for available widgets
  const availableWidgets = [
    { id: 'bet-slip-performance', name: 'Bet Slip Performance' },
    { id: 'subscription-analytics', name: 'Subscription Analytics' },
    { id: 'system-health', name: 'System Health' },
    { id: 'conversion-funnel', name: 'Conversion Funnel' },
    { id: 'fraud-detection', name: 'Fraud Detection' },
  ];

  return (
    <EnhancedWidget
      title={
        initialTemplate && initialTemplate.id !== 'new'
          ? 'Edit Report Template'
          : 'Create Report Template'
      }
      subtitle="Configure your report template"
      size="extra-large"
      isLoading={isLoading}
      error={error}
      className={className}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Basic Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={e => setType(e.target.value as ReportType)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={ReportType.STANDARD}>Standard</option>
                  <option value={ReportType.ANALYTICS}>Analytics</option>
                  <option value={ReportType.PERFORMANCE}>Performance</option>
                  <option value={ReportType.CUSTOM}>Custom</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Widgets Selection */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Widgets</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Select widgets to include in the report
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableWidgets.map(widget => (
                <div
                  key={widget.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedWidgets.includes(widget.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleWidgetToggle(widget.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedWidgets.includes(widget.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {widget.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Filters</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Add filters to customize the report data
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {filters.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No filters added yet. Add a filter to customize the report data.
                </p>
                <Button onClick={handleAddFilter} variant="secondary" size="sm">
                  Add Filter
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={filter.field}
                      onChange={e => handleFilterChange(index, 'field', e.target.value)}
                      className="block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select field</option>
                      <option value="date">Date</option>
                      <option value="user">User</option>
                      <option value="subscription">Subscription</option>
                      <option value="platform">Platform</option>
                    </select>
                    <select
                      value={filter.operator}
                      onChange={e => handleFilterChange(index, 'operator', e.target.value)}
                      className="block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater than</option>
                      <option value="less_than">Less than</option>
                      <option value="between">Between</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={e => handleFilterChange(index, 'value', e.target.value)}
                      className="block w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(index)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="pt-2">
                  <Button onClick={handleAddFilter} variant="secondary" size="sm">
                    Add Filter
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" isLoading={isLoading}>
            Save Template
          </Button>
        </div>
      </div>
    </EnhancedWidget>
  );
}
