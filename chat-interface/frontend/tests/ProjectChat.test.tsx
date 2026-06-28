import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ProjectChat from '../src/pages/ProjectChat';
import type { Project } from '../src/api/projects';
import type { Chat, AvailableModel } from '../src/api/chats';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

const DEFAULT_PROJECT: Project = {
  id: 7,
  user_id: 1,
  name: 'Research',
  system_prompt: 'You are concise.',
  default_llm_provider_model: 'openai:gpt-x',
  is_user_default: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const OTHER_PROJECT: Project = {
  ...DEFAULT_PROJECT,
  id: 8,
  name: 'Other',
  is_user_default: 0,
};

const CHAT_IN_PROJECT: Chat = {
  id: 11,
  user_id: 1,
  project_id: 7,
  project_name: 'Research',
  title: 'first',
  default_llm_provider_model: 'openai:gpt-x',
  created_at: '2024-01-01T00:00:00Z',
};

const CHAT_IN_OTHER: Chat = {
  ...CHAT_IN_PROJECT,
  id: 22,
  project_id: 8,
  project_name: 'Other',
};

const MODELS: AvailableModel[] = [
  {
    provider_model: 'openai:gpt-x',
    provider_name: 'openai',
    model_name: 'gpt-x',
    type: 'openai_completions',
  },
];

interface Harness {
  project: Project;
  chats: Chat[];
}

function renderProjectChat(
  harness: Harness,
  overrides: Partial<{
    user: { id: number; email: string; is_admin: number };
    fetchSpy: FetchSpy;
    projectNotFound: boolean;
    patchResponse: 'ok' | 'fail';
  }> = {},
) {
  const fetchSpy =
    overrides.fetchSpy ?? vi.spyOn(globalThis, 'fetch') as unknown as FetchSpy;
  const user = overrides.user ?? { id: 1, email: 'a@example.com', is_admin: 0 };

  fetchSpy.mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    if (url === '/api/auth/me') {
      return jsonResponse({ user });
    }
    const projectMatch = url.match(/^\/api\/projects\/(\d+)$/);
    if (projectMatch && method === 'GET') {
      if (overrides.projectNotFound) {
        return jsonResponse({ error: 'Project not found' }, 404);
      }
      const id = Number(projectMatch[1]);
      if (id === harness.project.id) {
        return jsonResponse(harness.project);
      }
      return jsonResponse({ error: 'Project not found' }, 404);
    }
    if (projectMatch && method === 'PATCH') {
      if (overrides.patchResponse === 'fail') {
        return jsonResponse({ error: 'Patch failed' }, 400);
      }
      const body = JSON.parse((init as RequestInit).body as string) as {
        name?: string;
        system_prompt?: string | null;
      };
      const updated: Project = { ...harness.project, ...body };
      harness.project = updated;
      return jsonResponse(updated);
    }
    if (url === `/api/projects/${harness.project.id}/make-default` && method === 'POST') {
      const updated: Project = { ...harness.project, is_user_default: 1 };
      harness.project = updated;
      return jsonResponse(updated);
    }
    if (url === `/api/projects/${harness.project.id}` && method === 'DELETE') {
      return new Response(null, { status: 204 });
    }
    if (url === '/api/chats') {
      return jsonResponse(harness.chats);
    }
    if (url === '/api/chats/models') {
      return jsonResponse(MODELS);
    }
    const chatMatch = url.match(/^\/api\/chats\/(\d+)$/);
    if (chatMatch && method === 'GET') {
      const id = Number(chatMatch[1]);
      const chat = harness.chats.find((c) => c.id === id);
      if (!chat) {
        return jsonResponse({ error: 'Chat not found' }, 404);
      }
      return jsonResponse({ chat, messages: [] });
    }
    return jsonResponse({ error: `Unhandled ${url} ${method}` }, 500);
  });

  return render(
    <MemoryRouter initialEntries={[`/projects/${harness.project.id}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/projects" element={<div data-testid="projects-grid-stub" />} />
          <Route path="/projects/:id" element={<ProjectChat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProjectChat page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the project hero with name, system prompt, model, and the chat panel', async () => {
    const harness: Harness = { project: { ...DEFAULT_PROJECT }, chats: [] };
    renderProjectChat(harness, { fetchSpy });
    const hero = await screen.findByTestId('project-hero');
    expect(hero).toHaveTextContent('Research');
    expect(hero).toHaveTextContent('You are concise.');
    expect(hero).toHaveTextContent('openai:gpt-x');
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown project id', async () => {
    const harness: Harness = { project: DEFAULT_PROJECT, chats: [] };
    renderProjectChat(harness, { fetchSpy, projectNotFound: true });
    expect(await screen.findByTestId('project-chat-not-found')).toBeInTheDocument();
  });

  it('renames the project inline via the hero name button', async () => {
    const harness: Harness = { project: { ...OTHER_PROJECT }, chats: [] };
    renderProjectChat(harness, { fetchSpy });
    const nameBtn = await screen.findByTestId('project-hero-name');
    fireEvent.click(nameBtn);
    const input = screen.getByTestId('project-hero-name-input');
    fireEvent.change(input, { target: { value: 'Renamed' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      const patch = fetchSpy.mock.calls.find(
        ([u, init]) =>
          /\/api\/projects\/\d+/.test(u as string) &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patch).toBeDefined();
      const body = JSON.parse((patch?.[1] as RequestInit).body as string) as {
        name?: string;
      };
      expect(body.name).toBe('Renamed');
    });
  });

  it('calls make-default on the hero button and updates the badge', async () => {
    const harness: Harness = { project: { ...OTHER_PROJECT }, chats: [] };
    renderProjectChat(harness, { fetchSpy });
    const btn = await screen.findByTestId('project-hero-make-default');
    fireEvent.click(btn);
    await waitFor(() => {
      const post = fetchSpy.mock.calls.find(
        ([u, init]) =>
          (u as string).endsWith('/make-default') &&
          (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(post).toBeDefined();
    });
  });

  it('hides name rename and delete for the user default project', async () => {
    const harness: Harness = { project: { ...DEFAULT_PROJECT }, chats: [] };
    renderProjectChat(harness, { fetchSpy });
    await screen.findByTestId('project-hero');
    const nameBtn = screen.getByTestId('project-hero-name');
    expect(nameBtn).toBeDisabled();
    expect(screen.queryByTestId('project-hero-delete')).toBeNull();
    expect(screen.queryByTestId('project-hero-make-default')).toBeNull();
    expect(screen.getByTestId('project-hero-default-badge')).toBeInTheDocument();
  });

  it('passes only this project\'s chats down to the chat panel', async () => {
    const harness: Harness = {
      project: { ...DEFAULT_PROJECT },
      chats: [CHAT_IN_PROJECT, CHAT_IN_OTHER],
    };
    renderProjectChat(harness, { fetchSpy });
    const items = await screen.findAllByTestId('sidebar-chat-item');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('first');
  });

  it('back link points to /projects', async () => {
    const harness: Harness = { project: { ...DEFAULT_PROJECT }, chats: [] };
    renderProjectChat(harness, { fetchSpy });
    const back = await screen.findByTestId('project-chat-back');
    expect(back.getAttribute('href')).toBe('/projects');
  });
});
