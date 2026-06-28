export type ProjectFileSource = 'project_upload' | 'chat_upload' | 'llm_generated';

export interface ProjectFile {
  id: number;
  project_id: number;
  user_id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  source: ProjectFileSource;
  source_chat_id: number | null;
  source_message_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFileListResponse {
  items: ProjectFile[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListProjectFilesOptions {
  source?: ProjectFileSource;
  limit?: number;
  offset?: number;
}

export interface UploadProjectFileOptions {
  source?: 'project_upload' | 'chat_upload';
}

export interface SaveLlmGeneratedFileInput {
  chat_id: number;
  message_id: number;
  attachment_index: number;
}

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
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}

function buildListQuery(opts: ListProjectFilesOptions = {}): string {
  const params = new URLSearchParams();
  if (opts.source) {
    params.set('source', opts.source);
  }
  if (typeof opts.limit === 'number') {
    params.set('limit', String(opts.limit));
  }
  if (typeof opts.offset === 'number') {
    params.set('offset', String(opts.offset));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function listProjectFiles(
  projectId: number,
  opts: ListProjectFilesOptions = {},
): Promise<ProjectFileListResponse> {
  return request<ProjectFileListResponse>(
    `/api/projects/${projectId}/files${buildListQuery(opts)}`,
  );
}

export function uploadProjectFile(
  projectId: number,
  file: File,
  opts: UploadProjectFileOptions = {},
): Promise<ProjectFile> {
  const form = new FormData();
  form.append('file', file);
  if (opts.source) {
    form.append('source', opts.source);
  }
  return request<ProjectFile>(`/api/projects/${projectId}/files`, {
    method: 'POST',
    body: form,
  });
}

export function downloadProjectFileUrl(fileId: number): string {
  return `/api/projects/files/${fileId}`;
}

export function openProjectFileDownload(fileId: number): void {
  const url = downloadProjectFileUrl(fileId);
  void fetch(url, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((body: { error?: string }) => {
          throw new Error(body.error ?? `Request failed with status ${res.status}`);
        });
      }
      return res.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      URL.revokeObjectURL(objectUrl);
    })
    .catch(() => {
      // ignore: error is reported via the caller; the download path is best-effort
    });
}

export function deleteProjectFile(fileId: number): Promise<void> {
  return requestNoContent(`/api/projects/files/${fileId}`, { method: 'DELETE' });
}

export function saveLlmGeneratedFile(
  projectId: number,
  input: SaveLlmGeneratedFileInput,
): Promise<ProjectFile> {
  return request<ProjectFile>(`/api/projects/${projectId}/files/from-message`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}
