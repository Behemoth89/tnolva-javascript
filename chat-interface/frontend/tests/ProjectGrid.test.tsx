import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ProjectGrid from '../src/pages/ProjectGrid';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

interface ProjectFixture {
  id: number;
  user_id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_user_default: number;
  created_at: string;
  updated_at: string;
}

interface ModelFixture {
  provider_model: string;
  provider_name: string;
  model_name: string;
  type: string;
}

function renderProjectGrid(
  state: {
    projects: ProjectFixture[];
    models: ModelFixture[];
  },
  overrides: Partial<{
    user: { id: number; email: string; is_admin: number };
    fetchSpy: FetchSpy;
    initialPath?: string;
    createResponse: 'ok' | 'fail';
  }> = {},
) {
  const fetchSpy =
    overrides.fetchSpy ?? vi.spyOn(globalThis, 'fetch') as unknown as FetchSpy;
  const user = overrides.user ?? { id: 1, email: 'a@example.com', is_admin: 0 };
  const initialPath = overrides.initialPath ?? '/projects';

  fetchSpy.mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    if (url === '/api/auth/me') {
      return jsonResponse({ user });
    }
    if (url === '/api/projects' && method === 'GET') {
      return jsonResponse([...state.projects]);
    }
    if (url === '/api/projects' && method === 'POST') {
      if (overrides.createResponse === 'fail') {
        return jsonResponse({ error: 'Failed' }, 400);
      }
      const body = JSON.parse((init as RequestInit).body as string) as {
        name: string;
        default_llm_provider_model: string;
      };
      const newProject: ProjectFixture = {
        id: 100 + state.projects.length,
        user_id: user.id,
        name: body.name,
        system_prompt: null,
        default_llm_provider_model: body.default_llm_provider_model,
        is_user_default: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.projects = [...state.projects, newProject];
      return jsonResponse(newProject);
    }
    if (url === '/api/chats/models') {
      return jsonResponse([...state.models]);
    }
    return jsonResponse({ error: `Unhandled ${url} ${method}` }, 500);
  });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/projects" element={<ProjectGrid />} />
          <Route path="/projects/manage" element={<div data-testid="projects-manage-stub" />} />
          <Route path="/projects/:id" element={<div data-testid="project-chat-stub" />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProjectGrid page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders one card per project with name, model, and default badge', async () => {
    const state = {
      projects: [
        {
          id: 1,
          user_id: 1,
          name: 'Research',
          system_prompt: 'You are concise.',
          default_llm_provider_model: 'openai:gpt-x',
          is_user_default: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          name: 'Trip ideas',
          system_prompt: null,
          default_llm_provider_model: 'anthropic:claude-x',
          is_user_default: 0,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ] as ProjectFixture[],
      models: [] as ModelFixture[],
    };
    renderProjectGrid(state, { fetchSpy });
    const cards = await screen.findAllByTestId('project-grid-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Research');
    expect(cards[0]).toHaveTextContent('openai:gpt-x');
    expect(cards[0]).toHaveTextContent('Default');
    expect(cards[1]).toHaveTextContent('Trip ideas');
    expect(cards[1]).not.toHaveTextContent('Default');
  });

  it('shows an empty state when the user has no projects', async () => {
    const state = { projects: [] as ProjectFixture[], models: [] as ModelFixture[] };
    renderProjectGrid(state, { fetchSpy });
    expect(await screen.findByTestId('project-grid-empty')).toBeInTheDocument();
  });

  it('navigates to /projects/:id when a card is clicked', async () => {
    const state = {
      projects: [
        {
          id: 5,
          user_id: 1,
          name: 'Whatever',
          system_prompt: null,
          default_llm_provider_model: 'openai:gpt-x',
          is_user_default: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ] as ProjectFixture[],
      models: [] as ModelFixture[],
    };
    renderProjectGrid(state, { fetchSpy });
    const card = await screen.findByTestId('project-grid-card');
    fireEvent.click(card);
    expect(await screen.findByTestId('project-chat-stub')).toBeInTheDocument();
  });

  it('shows a Manage link that points to /projects/manage', async () => {
    const state = {
      projects: [
        {
          id: 1,
          user_id: 1,
          name: 'X',
          system_prompt: null,
          default_llm_provider_model: 'openai:gpt-x',
          is_user_default: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ] as ProjectFixture[],
      models: [] as ModelFixture[],
    };
    renderProjectGrid(state, { fetchSpy });
    const link = await screen.findByTestId('project-grid-manage');
    expect(link.getAttribute('href')).toBe('/projects/manage');
  });

  it('renders a + New project form and submits it', async () => {
    const state = {
      projects: [
        {
          id: 1,
          user_id: 1,
          name: 'Default',
          system_prompt: null,
          default_llm_provider_model: 'openai:gpt-x',
          is_user_default: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ] as ProjectFixture[],
      models: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ] as ModelFixture[],
    };
    renderProjectGrid(state, { fetchSpy });
    const newBtn = await screen.findByTestId('project-grid-new');
    fireEvent.click(newBtn);
    const form = await screen.findByTestId('project-grid-create-form');
    const nameInput = screen.getByTestId('project-grid-create-name');
    fireEvent.change(nameInput, { target: { value: 'New thing' } });
    fireEvent.submit(form);
    await waitFor(() => {
      const post = fetchSpy.mock.calls.find(
        ([u, init]) =>
          u === '/api/projects' &&
          (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(post).toBeDefined();
      const body = JSON.parse((post?.[1] as RequestInit).body as string) as {
        name?: string;
        default_llm_provider_model?: string;
      };
      expect(body.name).toBe('New thing');
      expect(body.default_llm_provider_model).toBe('openai:gpt-x');
    });
  });
});
