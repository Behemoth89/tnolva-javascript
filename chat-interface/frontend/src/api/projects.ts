export interface Project {
  id: number;
  user_id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_user_default: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplate {
  id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  system_prompt?: string | null;
  default_llm_provider_model: string;
}

export interface UpdateProjectInput {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
}

export interface CreateProjectTemplateInput {
  name: string;
  system_prompt?: string | null;
  default_llm_provider_model: string;
  is_default?: boolean;
}

export interface UpdateProjectTemplateInput {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
  is_default?: boolean;
}

const JSON_HEADERS: HeadersInit = {
  'content-type': 'application/json',
};

const FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // fall through
  }
  return `Request failed with status ${res.status}`;
}

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    ...FETCH_OPTIONS,
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as T;
}

async function requestNoContent(input: string, init: RequestInit = {}): Promise<void> {
  const res = await fetch(input, {
    ...FETCH_OPTIONS,
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}

export async function listProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export async function getProject(id: number): Promise<Project> {
  return request<Project>(`/api/projects/${id}`);
}

export async function getDefaultProject(): Promise<Project> {
  return request<Project>('/api/projects/default');
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function makeDefaultProject(id: number): Promise<Project> {
  return request<Project>(`/api/projects/${id}/make-default`, {
    method: 'POST',
  });
}

export async function deleteProject(id: number): Promise<void> {
  await requestNoContent(`/api/projects/${id}`, { method: 'DELETE' });
}

export async function listProjectTemplates(): Promise<ProjectTemplate[]> {
  return request<ProjectTemplate[]>('/api/admin/project-templates');
}

export async function createProjectTemplate(
  input: CreateProjectTemplateInput,
): Promise<ProjectTemplate> {
  return request<ProjectTemplate>('/api/admin/project-templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProjectTemplate(
  id: number,
  input: UpdateProjectTemplateInput,
): Promise<ProjectTemplate> {
  return request<ProjectTemplate>(`/api/admin/project-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteProjectTemplate(id: number): Promise<void> {
  await requestNoContent(`/api/admin/project-templates/${id}`, { method: 'DELETE' });
}
