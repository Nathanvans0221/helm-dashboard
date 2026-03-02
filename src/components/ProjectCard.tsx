import { useState } from 'react';
import {
  Card, Box, Typography, Chip, IconButton, Collapse, Divider, LinearProgress,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, OpenInNew, Person, Engineering,
} from '@mui/icons-material';
import { STATUS_COLORS, BRAND } from '../theme/theme';
import type { ProjectWithTasks, HelmTaskSummary } from '../types/helm';
import TaskRow from './TaskRow';

interface ProjectCardProps {
  project: ProjectWithTasks;
  onTaskClick: (taskId: string) => void;
}

function completionPct(p: ProjectWithTasks): number {
  const total = p.tasks.length;
  if (!total) return 0;
  const done = p.statusCounts?.completed ?? p.tasks.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((done / total) * 100);
}

function activeStatusLabel(p: ProjectWithTasks): { label: string; color: string } {
  const active = p.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const ready = p.tasks.filter((t) => t.status === 'READY').length;
  const pending = p.tasks.filter((t) => t.status === 'PENDING').length;
  if (active > 0) return { label: `${active} active`, color: STATUS_COLORS.IN_PROGRESS };
  if (ready > 0) return { label: `${ready} ready`, color: STATUS_COLORS.READY };
  if (pending > 0) return { label: `${pending} pending`, color: STATUS_COLORS.PENDING };
  const pct = completionPct(p);
  if (pct === 100) return { label: 'Complete', color: STATUS_COLORS.COMPLETED };
  return { label: 'No activity', color: BRAND.stirling };
}

export default function ProjectCard({ project: p, onTaskClick }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = completionPct(p);
  const status = activeStatusLabel(p);

  const copyPrompt = (task: HelmTaskSummary) => {
    const prompt = `I need to work on AI Helm task "${task.title}" (ID: ${task.id}) in the ${task.repo} repo.${task.gitWorktree ? ` The worktree is at: ${task.gitWorktree}` : ''} Please fetch the full task details from AI Helm using helm_get_task, set it to IN_PROGRESS, and begin working on it.`;
    navigator.clipboard.writeText(prompt);
  };

  return (
    <Card sx={{ overflow: 'visible' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
          '&:hover': { bgcolor: `${BRAND.fern}08` },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>{p.projectName}</Typography>
            <Chip label={status.label} size="small" sx={{ bgcolor: status.color + '22', color: status.color, height: 22 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person sx={{ fontSize: 14 }} />
              <Typography variant="caption">{p.productLeadEmail?.split('@')[0]}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Engineering sx={{ fontSize: 14 }} />
              <Typography variant="caption">{p.techLeadEmail?.split('@')[0]}</Typography>
            </Box>
            <Typography variant="caption">
              {p.tasks.length} task{p.tasks.length !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="caption">
              Updated {new Date(p.lastUpdate).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: 120, mr: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" fontWeight={600}>{pct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 6, borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                bgcolor: pct === 100 ? STATUS_COLORS.COMPLETED : pct > 0 ? STATUS_COLORS.PENDING : BRAND.stirling,
                borderRadius: 3,
              },
            }}
          />
        </Box>
        <IconButton size="small" sx={{ color: BRAND.stirling }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {p.clickUpTaskUrl && (
            <Box sx={{ mb: 1.5 }}>
              <Chip
                label="ClickUp"
                size="small"
                icon={<OpenInNew sx={{ fontSize: 14 }} />}
                component="a"
                href={p.clickUpTaskUrl}
                target="_blank"
                clickable
                sx={{ mr: 1, borderColor: `${BRAND.fern}44`, color: BRAND.spring }}
              />
            </Box>
          )}

          {p.tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No tasks yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {p.tasks
                .sort((a, b) => {
                  const order = ['IN_PROGRESS', 'READY', 'PENDING', 'INITIALIZED', 'COMPLETED', 'DENIED'];
                  return order.indexOf(a.status) - order.indexOf(b.status);
                })
                .map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onCopyPrompt={() => copyPrompt(task)}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}
