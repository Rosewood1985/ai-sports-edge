/**
 * TemplateCard Component
 *
 * A molecule component that displays a report template as a card.
 */

import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Card, CardContent, CardActions, Typography, Box, IconButton, Button } from '@mui/material';
import React from 'react';

import { ReportTemplate, ReportType } from '../../../../types/reporting';
import TemplateStatusBadge from '../atoms/TemplateStatusBadge';
import WidgetChip from '../atoms/WidgetChip';

interface TemplateCardProps {
  template: ReportTemplate;
  onEdit: (template: ReportTemplate) => void;
  onGenerate: (template: ReportTemplate) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, templateId: string) => void;
  className?: string;
}

/**
 * Component for displaying a template card
 */
const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onGenerate,
  onMenuOpen,
  className = '',
}) => {
  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" gutterBottom>
            {template.name}
          </Typography>
          <IconButton
            size="small"
            onClick={e => onMenuOpen(e, template.id)}
            aria-label="template options"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box mb={2}>
          <TemplateStatusBadge type={template.type || ReportType.STANDARD} />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '40px',
          }}
        >
          {template.description || 'No description provided.'}
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Widgets:
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mb: 2,
          }}
        >
          {(template.widgets as string[]).map(widgetId => (
            <WidgetChip key={widgetId} widgetId={widgetId} />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block">
          Last updated: {new Date(template.updatedAt).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Button size="small" startIcon={<EditIcon />} onClick={() => onEdit(template)}>
          Edit
        </Button>
        <Button
          size="small"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={() => onGenerate(template)}
        >
          Generate
        </Button>
      </CardActions>
    </Card>
  );
};

export default TemplateCard;
