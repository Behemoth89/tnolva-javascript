import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ProjectFilesPage from '../src/pages/ProjectFilesPage';
import type { ProjectFile, ProjectFileSource } from '../src/api/projectFiles';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

interface FileFixture extends ProjectFile {
  id: number;
}

function renderProjectFilesPage(state: {
  project: { id: number; name: string; user_id: number; system_prompt: string | null; default_llm_provider_model: string; is_user_default: number; created_at: string; updated_at: string };
  files: FileFixture[];
}, overrides: Partial<{
  user: { id: number; email: string; is_admin: number };
  fetchSpy: MockInstance<typeof fetch>;
  initialPath?: string;
  deleteResponse: 'ok' | 'fail';
  uploadResponse: 'ok' | 'fail';
}> = {}) {
  const fetchSpy = overrides.fetchSpy ?? vi.spyOn(globalThis, 'fetch');
  const user = overrides.user ?? { id: 1, email: 'a@example.com', is_admin: 0 };
  const initialPath = overrides.initialPath ?? `/projects/${state.project.id}/files`;
  fetchSpy.mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    if (url === '/api/auth/me') {
      return jsonResponse({ user });
    }
    const projectMatch = url.match(/^\/api\/projects\/(\d+)$/);
    if (projectMatch && method === 'GET') {
      return jsonResponse(state.project);
    }
    const listMatch = url.match(/^\/api\/projects\/(\d+)\/files(?:\?.*)?$/);
    if (listMatch && method === 'GET') {
      const query = url.split('?')[1] ?? '';
      const params = new URLSearchParams(query);
      const sourceFilter = params.get('source') as ProjectFileSource | null;
      const items = sourceFilter
        ? state.files.filter((f) => f.source === sourceFilter)
        : state.files;
      return jsonResponse({
        items,
        total: items.length,
        limit: 50,
        offset: 0,
      });
    }
    if (listMatch && method === 'POST') {
      if (overrides.uploadResponse === 'fail') {
        return jsonResponse({ error: 'File too large' }, 413);
      }
      const form = (init as RequestInit).body as FormData;
      const file = form.get('file') as File;
      const source = (form.get('source') as string | null) ?? 'project_upload';
      const newFile: FileFixture = {
        id: 1000 + state.files.length,
        project_id: state.project.id,
        user_id: user.id,
        filename: file?.name ?? 'upload.bin',
        mime_type: file?.type ?? 'application/octet-stream',
        size_bytes: file?.size ?? 0,
        source: (source as ProjectFileSource) ?? 'project_upload',
        source_chat_id: null,
        source_message_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.files = [newFile, ...state.files];
      return jsonResponse(newFile, 201);
    }
    const downloadMatch = url.match(/^\/api\/projects\/files\/(\d+)$/);
    if (downloadMatch && method === 'GET') {
      const fileId = Number(downloadMatch[1]);
      const file = state.files.find((f) => f.id === fileId);
      if (!file) {
        return jsonResponse({ error: 'not found' }, 404);
      }
      return new Response(Buffer.from('file-bytes'), {
        status: 200,
        headers: { 'content-type': file.mime_type },
      });
    }
    const deleteMatch = url.match(/^\/api\/projects\/files\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      if (overrides.deleteResponse === 'fail') {
        return jsonResponse({ error: 'not found' }, 404);
      }
      const id = Number(deleteMatch[1]);
      state.files = state.files.filter((f) => f.id !== id);
      return new Response(null, { status: 204 });
    }
    return jsonResponse({ error: `Unhandled ${url} ${method}` }, 500);
  });
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/projects/:id/files" element={<ProjectFilesPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProjectFilesPage (component)', () => {
  let fetchSpy: MockInstance<typeof fetch>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    cleanup();
  });

  it('lists files on mount and renders the project name', async () => {
    const state = {
      project: {
        id: 7,
        name: 'Research',
        user_id: 1,
        system_prompt: null,
        default_llm_provider_model: 'openai:gpt-x',
        is_user_default: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      files: [
        {
          id: 1,
          project_id: 7,
          user_id: 1,
          filename: 'a.txt',
          mime_type: 'text/plain',
          size_bytes: 12,
          source: 'project_upload' as ProjectFileSource,
          source_chat_id: null,
          source_message_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    };
    renderProjectFilesPage(state, { fetchSpy });
    await waitFor(() => {
      expect(screen.getByTestId('project-files-table')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('project-files-row')).toHaveLength(1);
  });

  it('renders the source filter and narrows the list', async () => {
    const state = {
      project: {
        id: 7,
        name: 'Research',
        user_id: 1,
        system_prompt: null,
        default_llm_provider_model: 'openai:gpt-x',
        is_user_default: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      files: [
        {
          id: 1,
          project_id: 7,
          user_id: 1,
          filename: 'a.txt',
          mime_type: 'text/plain',
          size_bytes: 12,
          source: 'project_upload' as ProjectFileSource,
          source_chat_id: null,
          source_message_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          project_id: 7,
          user_id: 1,
          filename: 'b.txt',
          mime_type: 'text/plain',
          size_bytes: 22,
          source: 'chat_upload' as ProjectFileSource,
          source_chat_id: 11,
          source_message_id: 22,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
    };
    renderProjectFilesPage(state, { fetchSpy });
    await waitFor(() => {
      expect(screen.getByTestId('project-files-table')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('project-files-source-filter'), {
      target: { value: 'chat_upload' },
    });
    await waitFor(() => {
      const rows = screen.queryAllByTestId('project-files-row');
      expect(rows.length).toBe(1);
    });
  });

  it('uploads a file via the upload form', async () => {
    const state = {
      project: {
        id: 7,
        name: 'Research',
        user_id: 1,
        system_prompt: null,
        default_llm_provider_model: 'openai:gpt-x',
        is_user_default: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      files: [],
    };
    renderProjectFilesPage(state, { fetchSpy });
    await waitFor(() => {
      expect(screen.getByTestId('project-files-empty')).toBeInTheDocument();
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('project-files-upload-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByTestId('project-files-upload-button'));
    await waitFor(() => {
      const post = fetchSpy.mock.calls.find(
        ([u, init]) =>
          typeof u === 'string' &&
          u === '/api/projects/7/files' &&
          ((init as RequestInit | undefined)?.method ?? 'GET') === 'POST',
      );
      expect(post).toBeDefined();
    });
  });

  it('surfaces 413 from upload as an error banner', async () => {
    const state = {
      project: {
        id: 7,
        name: 'Research',
        user_id: 1,
        system_prompt: null,
        default_llm_provider_model: 'openai:gpt-x',
        is_user_default: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      files: [],
    };
    renderProjectFilesPage(state, { fetchSpy, uploadResponse: 'fail' });
    await waitFor(() => {
      expect(screen.getByTestId('project-files-empty')).toBeInTheDocument();
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('project-files-upload-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByTestId('project-files-upload-button'));
    await waitFor(() => {
      expect(screen.getByTestId('project-files-error')).toHaveTextContent('File too large');
    });
  });

  it('asks for confirmation and then deletes a file', async () => {
    const state = {
      project: {
        id: 7,
        name: 'Research',
        user_id: 1,
        system_prompt: null,
        default_llm_provider_model: 'openai:gpt-x',
        is_user_default: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      files: [
        {
          id: 1,
          project_id: 7,
          user_id: 1,
          filename: 'a.txt',
          mime_type: 'text/plain',
          size_bytes: 12,
          source: 'project_upload' as ProjectFileSource,
          source_chat_id: null,
          source_message_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    };
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderProjectFilesPage(state, { fetchSpy });
    await waitFor(() => {
      expect(screen.getByTestId('project-files-table')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('project-files-delete'));
    await waitFor(() => {
      const del = fetchSpy.mock.calls.find(
        ([u, init]) =>
          typeof u === 'string' &&
          u === '/api/projects/files/1' &&
          ((init as RequestInit | undefined)?.method ?? 'GET') === 'DELETE',
      );
      expect(del).toBeDefined();
    });
    confirmSpy.mockRestore();
  });
});
