import { GraphQLClient } from 'graphql-request';
import type { HelmProject, HelmTask, HelmTaskSummary, TaskStatusCounts } from '../types/helm';

let client: GraphQLClient | null = null;

export function initClient(token: string) {
  const base = window.location.origin;
  client = new GraphQLClient(`${base}/api/graphql`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getClient(): GraphQLClient {
  if (!client) throw new Error('Not authenticated');
  return client;
}

// --- Auth helpers ---

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getStoredAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem('helm_auth');
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function storeAuth(session: AuthSession) {
  localStorage.setItem('helm_auth', JSON.stringify(session));
}

export function clearAuth() {
  localStorage.removeItem('helm_auth');
  localStorage.removeItem('helm_token'); // clean up old format
  client = null;
}

export async function startDeviceAuth(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}> {
  const res = await fetch('/api/device-auth', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start device auth');
  return res.json();
}

export async function pollDeviceToken(deviceCode: string): Promise<{
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}> {
  const res = await fetch('/api/device-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_code: deviceCode }),
  });
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthSession | null> {
  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;
    const session: AuthSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    storeAuth(session);
    return session;
  } catch {
    return null;
  }
}

// --- GraphQL queries ---

export async function searchProjects(searchText?: string): Promise<HelmProject[]> {
  const c = getClient();
  const data = await c.request<{ searchHelmProjects: { projects: HelmProject[] | null; errors: { message: string }[] | null } }>(`
    query SearchProjects($input: SearchProjectsInput!) {
      searchHelmProjects(input: $input) {
        projects {
          id projectName clickUpTaskId clickUpTaskUrl
          techLeadEmail productLeadEmail order createDate lastUpdate
        }
        errors { message }
      }
    }
  `, { input: { searchText } });
  if (data.searchHelmProjects.errors?.length) {
    throw new Error(data.searchHelmProjects.errors[0].message);
  }
  return data.searchHelmProjects.projects ?? [];
}

export async function getProject(projectId: string): Promise<HelmProject> {
  const c = getClient();
  const data = await c.request<{ helmProject: { project: HelmProject | null; errors: { message: string }[] | null } }>(`
    query GetProject($input: GetProjectInput!) {
      helmProject(input: $input) {
        project {
          id projectName clickUpTaskId clickUpTaskUrl
          techLeadEmail productLeadEmail order createDate lastUpdate
        }
        errors { message }
      }
    }
  `, { input: { projectId } });
  if (data.helmProject.errors?.length) throw new Error(data.helmProject.errors[0].message);
  if (!data.helmProject.project) throw new Error('Project not found');
  return data.helmProject.project;
}

export async function searchTasks(filters: {
  projectId?: string;
  status?: string;
  searchText?: string;
  priority?: string;
  assignee?: string;
  repo?: string;
}): Promise<HelmTaskSummary[]> {
  const c = getClient();
  const data = await c.request<{ searchHelmTasks: { helmTasks: HelmTaskSummary[] | null; errors: { message: string }[] | null } }>(`
    query SearchTasks($input: SearchHelmTasksInput!) {
      searchHelmTasks(input: $input) {
        helmTasks {
          id projectId repo gitWorktree title status priority assignee blockedBy
        }
        errors { message }
      }
    }
  `, { input: filters });
  if (data.searchHelmTasks.errors?.length) throw new Error(data.searchHelmTasks.errors[0].message);
  return data.searchHelmTasks.helmTasks ?? [];
}

export async function getTask(taskId: string): Promise<HelmTask> {
  const c = getClient();
  const data = await c.request<{ helmTask: { helmTask: HelmTask | null; errors: { message: string }[] | null } }>(`
    query GetTask($input: GetHelmTaskInput!) {
      helmTask(input: $input) {
        helmTask {
          id projectId repo gitWorktree title details definitionOfDone
          status priority assignee blockedBy statusNotes taskNotes
          taskOutcome aiAtlasNotes pullRequestId pullRequestUrl
          completionDate createDate lastUpdate
        }
        errors { message }
      }
    }
  `, { input: { taskId } });
  if (data.helmTask.errors?.length) throw new Error(data.helmTask.errors[0].message);
  if (!data.helmTask.helmTask) throw new Error('Task not found');
  return data.helmTask.helmTask;
}

export async function getTaskStatusCounts(projectId: string): Promise<TaskStatusCounts> {
  const c = getClient();
  const data = await c.request<{ helmTaskStatusCounts: TaskStatusCounts & { errors: { message: string }[] | null } }>(`
    query GetStatusCounts($input: GetHelmTaskStatusCountsInput!) {
      helmTaskStatusCounts(input: $input) {
        initialized ready inProgress pending completed denied
        errors { message }
      }
    }
  `, { input: { projectId } });
  if (data.helmTaskStatusCounts.errors?.length) throw new Error(data.helmTaskStatusCounts.errors[0].message);
  const { errors: _, ...counts } = data.helmTaskStatusCounts;
  return counts;
}
