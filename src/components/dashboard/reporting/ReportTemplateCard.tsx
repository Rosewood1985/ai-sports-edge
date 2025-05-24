import React from 'react';
import { ReportTemplate } from '../../../types/reporting';
import { formatDateTime } from '../../../utils/dateUtils';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { IconButton } from '../../ui/IconButton';

export interface ReportTemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

/**
 * Card component for displaying a report template
 */
export function ReportTemplateCard({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  className = '',
}: ReportTemplateCardProps) {
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'analytics':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'performance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'custom':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
      } ${className}`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {template.name}
          </h3>
          {template.type && (
            <Badge className={getTypeColor(template.type)}>
              {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
            </Badge>
          )}
        </div>

        {template.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {template.widgets?.map(widget => (
            <Badge
              key={widget}
              className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              {widget}
            </Badge>
          ))}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Created: {formatDateTime(template.createdAt)}</div>
          <div>Updated: {formatDateTime(template.updatedAt)}</div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-800/50">
        <IconButton
          icon="edit"
          variant="ghost"
          size="sm"
          onClick={() => {
            // Using a wrapper function without parameters
            onEdit();
          }}
          aria-label="Edit template"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        />
        <IconButton
          icon="trash"
          variant="ghost"
          size="sm"
          onClick={() => {
            // Using a wrapper function without parameters
            onDelete();
          }}
          aria-label="Delete template"
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        />
      </div>
    </Card>
  );
}
