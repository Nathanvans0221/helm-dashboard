import { Box, Typography, LinearProgress } from '@mui/material';
import { STATUS_COLORS, BRAND } from '../theme/theme';
import type { TaskStatusCounts } from '../types/helm';

interface StatusChartProps {
  counts: TaskStatusCounts;
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  initialized: 'Initialized',
  ready: 'Ready',
  inProgress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
  denied: 'Denied',
};

const STATUS_MAP: Record<string, string> = {
  initialized: 'INITIALIZED',
  ready: 'READY',
  inProgress: 'IN_PROGRESS',
  pending: 'PENDING',
  completed: 'COMPLETED',
  denied: 'DENIED',
};

export default function StatusChart({ counts, total }: StatusChartProps) {
  if (total === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Object.entries(counts).map(([key, count]) => {
        if (count === 0) return null;
        const pct = Math.round((count / total) * 100);
        const color = STATUS_COLORS[STATUS_MAP[key]] ?? BRAND.stirling;
        return (
          <Box key={key}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{STATUS_LABELS[key]}</Typography>
              <Typography variant="body2" color="text.secondary">
                {count} ({pct}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
