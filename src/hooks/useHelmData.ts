import { useState, useCallback } from 'react';
import { searchProjects, searchTasks, getTaskStatusCounts, getTask } from '../services/helmApi';
import type { HelmTaskSummary, HelmTask, TaskStatusCounts, ProjectWithTasks } from '../types/helm';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (searchText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const projs = await searchProjects(searchText);
      const withTasks: ProjectWithTasks[] = await Promise.all(
        projs.map(async (p) => {
          try {
            const [tasks, statusCounts] = await Promise.all([
              searchTasks({ projectId: p.id }),
              getTaskStatusCounts(p.id),
            ]);
            return { ...p, tasks, statusCounts };
          } catch {
            return { ...p, tasks: [], statusCounts: undefined };
          }
        })
      );
      setProjects(withTasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  return { projects, loading, error, load };
}

export function useTaskDetail() {
  const [task, setTask] = useState<HelmTask | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const t = await getTask(taskId);
      setTask(t);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setTask(null), []);

  return { task, loading, load, clear };
}

export function useAllTasks() {
  const [tasks, setTasks] = useState<HelmTaskSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (filters?: Parameters<typeof searchTasks>[0]) => {
    setLoading(true);
    try {
      const t = await searchTasks(filters ?? {});
      setTasks(t);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tasks, loading, load };
}

export function useDashboardStats(projects: ProjectWithTasks[]) {
  const totalProjects = projects.length;
  // Exclude DENIED tasks from all counts — they're rejected/cancelled and shouldn't affect metrics
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.filter((t) => t.status !== 'DENIED').length, 0);
  const activeTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    0
  );
  const completedTasks = projects.reduce(
    (sum, p) => sum + (p.statusCounts?.completed ?? 0),
    0
  );
  const readyTasks = projects.reduce(
    (sum, p) => sum + (p.statusCounts?.ready ?? 0),
    0
  );
  const pendingTasks = projects.reduce(
    (sum, p) => sum + (p.statusCounts?.pending ?? 0),
    0
  );
  const blockedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status !== 'DENIED' && t.blockedBy.length > 0).length,
    0
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusBreakdown = projects.reduce(
    (acc, p) => {
      if (p.statusCounts) {
        acc.initialized += p.statusCounts.initialized;
        acc.ready += p.statusCounts.ready;
        acc.inProgress += p.statusCounts.inProgress;
        acc.pending += p.statusCounts.pending;
        acc.completed += p.statusCounts.completed;
        acc.denied += p.statusCounts.denied;
      }
      return acc;
    },
    { initialized: 0, ready: 0, inProgress: 0, pending: 0, completed: 0, denied: 0 } as TaskStatusCounts
  );

  return {
    totalProjects,
    totalTasks,
    activeTasks,
    completedTasks,
    readyTasks,
    pendingTasks,
    blockedTasks,
    completionRate,
    statusBreakdown,
  };
}
