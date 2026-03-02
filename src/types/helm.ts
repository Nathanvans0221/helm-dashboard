export type HelmTaskStatus = 'INITIALIZED' | 'READY' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'DENIED';
export type HelmTaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface HelmProject {
  id: string;
  projectName: string;
  clickUpTaskId?: string | null;
  clickUpTaskUrl?: string | null;
  techLeadEmail: string;
  productLeadEmail: string;
  order?: number | null;
  createDate: string;
  lastUpdate: string;
}

export interface HelmTask {
  id: string;
  projectId: string;
  repo: string;
  gitWorktree?: string | null;
  title: string;
  details?: string;
  definitionOfDone?: string | null;
  status: HelmTaskStatus;
  priority: string;
  assignee?: string | null;
  blockedBy: string[];
  statusNotes?: string | null;
  taskNotes?: string | null;
  taskOutcome?: string | null;
  aiAtlasNotes?: string | null;
  pullRequestId?: string | null;
  pullRequestUrl?: string | null;
  completionDate?: string | null;
  createDate: string;
  lastUpdate: string;
}

export interface HelmTaskSummary {
  id: string;
  projectId: string;
  repo: string;
  gitWorktree?: string | null;
  title: string;
  status: HelmTaskStatus;
  priority: string;
  assignee?: string | null;
  blockedBy: string[];
}

export interface TaskStatusCounts {
  initialized: number;
  ready: number;
  inProgress: number;
  pending: number;
  completed: number;
  denied: number;
}

export interface ProjectWithTasks extends HelmProject {
  tasks: HelmTaskSummary[];
  statusCounts?: TaskStatusCounts;
}
