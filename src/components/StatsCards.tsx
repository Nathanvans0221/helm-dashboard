import { Box, Card, Typography } from '@mui/material';
import {
  FolderOpen, Task, PlayCircle, CheckCircle, Schedule, Block,
} from '@mui/icons-material';
import { BRAND } from '../theme/theme';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ p: 2.5, flex: 1, minWidth: 140, position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
          bgcolor: color, borderRadius: '4px 0 0 4px',
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 0.5 }}>
        <Box sx={{ color, display: 'flex', opacity: 0.9 }}>{icon}</Box>
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1, fontWeight: 700 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
        </Box>
      </Box>
    </Card>
  );
}

interface StatsCardsProps {
  totalProjects: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  readyTasks: number;
  blockedTasks: number;
  completionRate: number;
}

export default function StatsCards(props: StatsCardsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <StatCard label="Projects" value={props.totalProjects} icon={<FolderOpen />} color={BRAND.fern} />
      <StatCard label="Total Tasks" value={props.totalTasks} icon={<Task />} color={BRAND.stirling} />
      <StatCard label="In Progress" value={props.activeTasks} icon={<PlayCircle />} color={BRAND.fern} />
      <StatCard label="Ready" value={props.readyTasks} icon={<Schedule />} color="#6296BC" />
      <StatCard label="Completed" value={props.completedTasks} icon={<CheckCircle />} color="#63B76B" />
      <StatCard label="Blocked" value={props.blockedTasks} icon={<Block />} color="#BA3636" />
      <StatCard label="Completion" value={`${props.completionRate}%`} icon={<CheckCircle />} color={BRAND.spring} />
    </Box>
  );
}
