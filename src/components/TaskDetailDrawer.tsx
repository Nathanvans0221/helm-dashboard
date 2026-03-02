import { useEffect } from 'react';
import {
  Drawer, Box, Typography, Chip, IconButton, Divider, Button, CircularProgress,
} from '@mui/material';
import { Close, ContentCopy, OpenInNew } from '@mui/icons-material';
import { STATUS_COLORS, PRIORITY_COLORS, BRAND } from '../theme/theme';
import { useTaskDetail } from '../hooks/useHelmData';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
  const { task, loading, load, clear } = useTaskDetail();

  useEffect(() => {
    if (taskId) load(taskId);
    else clear();
  }, [taskId, load, clear]);

  const copyBranchPrompt = () => {
    if (!task) return;
    const lines = [
      `I need to work on AI Helm task "${task.title}" (ID: ${task.id}) in the ${task.repo} repo.`,
      task.gitWorktree ? `Worktree: ${task.gitWorktree}` : '',
      task.pullRequestUrl ? `PR: ${task.pullRequestUrl}` : '',
      '',
      'Please fetch the full task details from AI Helm using helm_get_task, set it to IN_PROGRESS, and begin working on it.',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
  };

  return (
    <Drawer anchor="right" open={!!taskId} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 520 }, bgcolor: 'background.default' } }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: BRAND.fern }} /></Box>
      )}
      {task && !loading && (
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1, pr: 1 }}>{task.title}</Typography>
            <IconButton onClick={onClose} sx={{ color: BRAND.stirling }}><Close /></IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={task.status.replace('_', ' ')}
              sx={{ bgcolor: (STATUS_COLORS[task.status] ?? BRAND.stirling) + '22', color: STATUS_COLORS[task.status] }}
            />
            {task.priority && task.priority !== 'NORMAL' && (
              <Chip
                label={task.priority}
                sx={{ bgcolor: (PRIORITY_COLORS[task.priority] ?? BRAND.stirling) + '22', color: PRIORITY_COLORS[task.priority] }}
              />
            )}
            <Chip label={task.repo} variant="outlined" size="small" />
            {task.assignee && <Chip label={`@${task.assignee.split('@')[0]}`} variant="outlined" size="small" />}
          </Box>

          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={copyBranchPrompt}
            fullWidth
            sx={{ mb: 2, bgcolor: BRAND.fern, '&:hover': { bgcolor: BRAND.fernDark } }}
          >
            Copy Claude Prompt
          </Button>

          {task.pullRequestUrl && (
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              href={task.pullRequestUrl}
              target="_blank"
              fullWidth
              sx={{ mb: 2 }}
            >
              Open Pull Request
            </Button>
          )}

          <Divider sx={{ my: 2 }} />

          <Section label="Status Notes" content={task.statusNotes} />
          <Section label="Task Outcome" content={task.taskOutcome} />
          <Section label="Definition of Done" content={task.definitionOfDone} />

          {task.details && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Details</Typography>
              <Box
                sx={{
                  p: 1.5, bgcolor: 'action.hover', borderRadius: 1,
                  border: 1, borderColor: 'divider',
                  maxHeight: 300, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'text.secondary',
                }}
              >
                {task.details}
              </Box>
            </Box>
          )}

          <Section label="Task Notes" content={task.taskNotes} />
          <Section label="AI Atlas Notes" content={task.aiAtlasNotes} />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <InfoChip label="Created" value={new Date(task.createDate).toLocaleDateString()} />
            <InfoChip label="Updated" value={new Date(task.lastUpdate).toLocaleDateString()} />
            {task.completionDate && <InfoChip label="Completed" value={new Date(task.completionDate).toLocaleDateString()} />}
            {task.blockedBy.length > 0 && <InfoChip label="Blocked by" value={`${task.blockedBy.length} task(s)`} />}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            ID: {task.id}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}

function Section({ label, content }: { label: string; content?: string | null }) {
  if (!content) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{content}</Typography>
    </Box>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
