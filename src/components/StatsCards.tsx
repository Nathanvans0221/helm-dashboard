import { Box, Card, Typography } from '@mui/material';
import {
  FolderOpen, Task, PlayCircle, CheckCircle, Schedule, Block,
} from '@mui/icons-material';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ p: 2.5, flex: 1, minWidth: 140 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
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
      <StatCard label="Projects" value={props.totalProjects} icon={<FolderOpen />} color="#60a5fa" />
      <StatCard label="Total Tasks" value={props.totalTasks} icon={<Task />} color="#a78bfa" />
      <StatCard label="In Progress" value={props.activeTasks} icon={<PlayCircle />} color="#fbbf24" />
      <StatCard label="Ready" value={props.readyTasks} icon={<Schedule />} color="#38bdf8" />
      <StatCard label="Completed" value={props.completedTasks} icon={<CheckCircle />} color="#34d399" />
      <StatCard label="Blocked" value={props.blockedTasks} icon={<Block />} color="#f87171" />
      <StatCard label="Completion" value={`${props.completionRate}%`} icon={<CheckCircle />} color="#34d399" />
    </Box>
  );
}
