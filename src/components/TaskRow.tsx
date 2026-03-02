import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { STATUS_COLORS, PRIORITY_COLORS, BRAND } from '../theme/theme';
import type { HelmTaskSummary } from '../types/helm';

interface TaskRowProps {
  task: HelmTaskSummary;
  onCopyPrompt: () => void;
  onClick: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  INITIALIZED: 'Init',
  READY: 'Ready',
  IN_PROGRESS: 'Active',
  PENDING: 'Pending',
  COMPLETED: 'Done',
  DENIED: 'Denied',
};

export default function TaskRow({ task, onCopyPrompt, onClick }: TaskRowProps) {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5,
        borderRadius: 1, cursor: 'pointer',
        borderLeft: `3px solid ${STATUS_COLORS[task.status] ?? BRAND.stirling}`,
        '&:hover': { bgcolor: `${BRAND.fern}0A` },
      }}
    >
      <Box onClick={onClick} sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
          <Chip
            label={STATUS_LABELS[task.status] ?? task.status}
            size="small"
            sx={{
              bgcolor: (STATUS_COLORS[task.status] ?? BRAND.stirling) + '22',
              color: STATUS_COLORS[task.status] ?? BRAND.stirling,
              height: 20, fontSize: '0.7rem',
            }}
          />
          {task.priority && task.priority !== 'NORMAL' && (
            <Chip
              label={task.priority}
              size="small"
              sx={{
                bgcolor: (PRIORITY_COLORS[task.priority] ?? BRAND.stirling) + '22',
                color: PRIORITY_COLORS[task.priority] ?? BRAND.stirling,
                height: 20, fontSize: '0.7rem',
              }}
            />
          )}
          <Typography variant="caption" color="text.secondary">{task.repo}</Typography>
          {task.assignee && (
            <Typography variant="caption" color="text.secondary">
              @{task.assignee.split('@')[0]}
            </Typography>
          )}
          {task.blockedBy.length > 0 && (
            <Chip label={`Blocked (${task.blockedBy.length})`} size="small" sx={{ bgcolor: '#BA363622', color: '#BA3636', height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
      </Box>

      <Tooltip title="Copy Claude prompt to start this task">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onCopyPrompt(); }}
          sx={{ color: 'text.secondary', '&:hover': { color: BRAND.fern } }}
        >
          <ContentCopy sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
