/**
 * TemplateActions Component
 *
 * A molecule component that provides actions for a report template.
 */

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Menu, MenuItem, Divider, IconButton, ListItemIcon, ListItemText } from '@mui/material';
import React from 'react';

import { ReportTemplate } from '../../../../types/reporting';

interface TemplateActionsProps {
  template: ReportTemplate;
  onEdit: (template: ReportTemplate) => void;
  onGenerate: (template: ReportTemplate) => void;
  onDuplicate: (template: ReportTemplate) => void;
  onDelete: (templateId: string) => void;
  onSchedule?: (template: ReportTemplate) => void;
  className?: string;
}

/**
 * Component for template actions menu
 */
const TemplateActions: React.FC<TemplateActionsProps> = ({
  template,
  onEdit,
  onGenerate,
  onDuplicate,
  onDelete,
  onSchedule,
  className = '',
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle menu open
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="template options"
        aria-controls={open ? 'template-actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="small"
        className={className}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        id="template-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'template-actions-button',
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onEdit(template);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            onGenerate(template);
          }}
        >
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Report</ListItemText>
        </MenuItem>

        {onSchedule && (
          <MenuItem
            onClick={() => {
              handleClose();
              onSchedule(template);
            }}
          >
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Schedule</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleClose();
            onDuplicate(template);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            handleClose();
            onDelete(template.id);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default TemplateActions;
