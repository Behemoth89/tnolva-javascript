import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/auth/AuthContext';
import ChatPanel from '../src/components/ChatPanel';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

interface ChatFixture {
  id: number;
  user_id: number;
  project_id: number;
  project_name: string;
  title: string | null;
  default_llm_provider_model: string;
  created_at: string;
}

interface MessageFixture {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  provider_model: string;
  created_at: string;
}

interface State {
  chats: ChatFixture[];
  byChat: Map<number, MessageFixture[]>;
  availableModels: Array<{
    provider_model: string;
    provider_name: string;
    model_name: string;
    type: string;
  }>;
  projects: Array<{
    id: number;
    user_id: number;
    name: string;
    system_prompt: string | null;
    default_llm_provider_model: string;
    is_user_default: number;
    created_at: string;
    updated_at: string;
  }>;
}

function renderChatPanel(state: State, overrides: Partial<{
  user: { id: number; email: string; is_admin: number };
  fetchSpy: FetchSpy;
  sendResponse: 'ok' | 'fail';
  patchResponse: 'ok' | 'fail';
  initialModel?: string;
}> = {}) {
  const fetchSpy =
    overrides.fetchSpy ?? vi.spyOn(globalThis, 'fetch') as unknown as FetchSpy;
  const user = overrides.user ?? { id: 1, email: 'a@example.com', is_admin: 0 };
  const sendResponse = overrides.sendResponse ?? 'ok';
  const patchResponse = overrides.patchResponse ?? 'ok';

  fetchSpy.mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = (init as RequestInit | undefined)?.method ?? 'GET';
    if (url === '/api/auth/me') {
      return jsonResponse({ user });
    }
    if (url === '/api/chats') {
      if (method === 'POST') {
        const body = JSON.parse((init as RequestInit).body as string) as {
          title?: string;
          default_llm_provider_model: string;
        };
        const newId = 100 + (state.chats.length % 100);
        const newChat: ChatFixture = {
          id: newId,
          user_id: user.id,
          project_id: 1,
          project_name: 'Default',
          title: body.title ?? null,
          default_llm_provider_model: body.default_llm_provider_model,
          created_at: new Date().toISOString(),
        };
        state.chats = [newChat, ...state.chats];
        return jsonResponse(newChat);
      }
      return jsonResponse([...state.chats]);
    }
    if (url === '/api/chats/models') {
      return jsonResponse([...state.availableModels]);
    }
    if (url === '/api/projects') {
      return jsonResponse([...state.projects]);
    }
    const chatMatch = url.match(/^\/api\/chats\/(\d+)$/);
    if (chatMatch && method === 'GET') {
      const id = Number(chatMatch[1]);
      const chat = state.chats.find((c) => c.id === id);
      if (!chat) {
        return jsonResponse({ error: 'Chat not found' }, 404);
      }
      return jsonResponse({
        chat,
        messages: state.byChat.get(id) ?? [],
      });
    }
    const sendMatch = url.match(/^\/api\/chats\/(\d+)\/messages$/);
    if (sendMatch) {
      const id = Number(sendMatch[1]);
      const lastUserId = -(Date.now() % 100000);
      const userMsg: MessageFixture = {
        id: lastUserId,
        chat_id: id,
        role: 'user',
        content: 'hi',
        provider_model: state.chats.find((c) => c.id === id)?.default_llm_provider_model ?? '',
        created_at: new Date().toISOString(),
      };
      if (sendResponse === 'fail') {
        return jsonResponse(
          {
            error: 'Upstream LLM failed: http',
            chat: {
              chat: state.chats.find((c) => c.id === id),
              messages: [userMsg],
            },
          },
          502,
        );
      }
      const reply: MessageFixture = {
        id: 999,
        chat_id: id,
        role: 'assistant',
        content: 'hello there',
        provider_model: state.chats.find((c) => c.id === id)?.default_llm_provider_model ?? '',
        created_at: new Date().toISOString(),
      };
      return jsonResponse({
        chat: state.chats.find((c) => c.id === id),
        messages: [userMsg, reply],
      });
    }
    const patchMatch = url.match(/^\/api\/chats\/(\d+)$/);
    if (patchMatch && method === 'PATCH') {
      const id = Number(patchMatch[1]);
      const existing = state.chats.find((c) => c.id === id);
      if (patchResponse === 'fail') {
        return jsonResponse({ error: 'Invalid model' }, 400);
      }
      const body = JSON.parse((init as RequestInit).body as string) as {
        default_llm_provider_model?: string;
        title?: string | null;
      };
      const updated: ChatFixture = {
        ...(existing as ChatFixture),
        default_llm_provider_model:
          body.default_llm_provider_model ??
          (existing as ChatFixture).default_llm_provider_model,
        title:
          body.title === undefined
            ? (existing as ChatFixture).title
            : body.title,
      };
      const idx = state.chats.findIndex((c) => c.id === id);
      state.chats[idx] = updated;
      return jsonResponse(updated);
    }
    return jsonResponse({ error: `Unhandled ${url} ${method}` }, 500);
  });

  return render(
    <MemoryRouter initialEntries={['/chat']}>
      <AuthProvider>
        <Routes>
          <Route path="/chat" element={<ChatPanel />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ChatPanel page (component)', () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('fetches the chat list and the available models on mount', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map(),
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
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
      ],
    };
    renderChatPanel(state, { fetchSpy });
    await waitFor(() =>
      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('chat-model-select')).toBeInTheDocument(),
    );
    const calls = fetchSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain('/api/chats');
    expect(calls).toContain('/api/chats/models');
    expect(calls).toContain('/api/chats/11');
  });

  it('shows the sidebar empty state when the user has no chats', async () => {
    const state: State = {
      chats: [],
      byChat: new Map(),
      availableModels: [],
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
      ],
    };
    renderChatPanel(state, { fetchSpy });
    expect(await screen.findByTestId('chat-sidebar-empty')).toBeInTheDocument();
  });

  it('shows the message-area empty state for an active chat with no messages', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    expect(await screen.findByTestId('chat-empty-state')).toBeInTheDocument();
  });

  it('sends a message: happy path renders user + assistant bubbles', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy, sendResponse: 'ok' });
    await waitFor(() =>
      expect(screen.getByTestId('chat-composer-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('chat-composer-input'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByTestId('chat-composer-submit'));
    await waitFor(() => {
      const bubbles = screen.queryAllByTestId('chat-message');
      const roles = bubbles.map((b) => b.getAttribute('data-message-role'));
      expect(roles).toContain('user');
      expect(roles).toContain('assistant');
    });
  });

  it('on 502 the user bubble persists and the error banner is shown', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy, sendResponse: 'fail' });
    await waitFor(() =>
      expect(screen.getByTestId('chat-composer-input')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByTestId('chat-composer-input'), {
      target: { value: 'will fail' },
    });
    fireEvent.click(screen.getByTestId('chat-composer-submit'));
    const banner = await screen.findByTestId('chat-error-banner');
    expect(banner).toHaveTextContent('Upstream LLM failed: http');
    const userBubbles = screen
      .queryAllByTestId('chat-message')
      .filter((b) => b.getAttribute('data-message-role') === 'user');
    expect(userBubbles.length).toBeGreaterThan(0);
  });

  it('changing the model selector calls PATCH /api/chats/:id and updates the value', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
        {
          provider_model: 'anthropic:claude-x',
          provider_name: 'anthropic',
          model_name: 'claude-x',
          type: 'anthropic',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy, patchResponse: 'ok' });
    const select = await screen.findByTestId('chat-model-select');
    fireEvent.change(select, { target: { value: 'anthropic:claude-x' } });
    await waitFor(() => {
      const patch = fetchSpy.mock.calls.find(
        ([u, init]) =>
          u === '/api/chats/11' &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patch).toBeDefined();
    });
  });

  it('create-chat button calls POST /api/chats and switches to the new chat', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    const newBtn = await screen.findByTestId('chat-new');
    fireEvent.click(newBtn);
    await waitFor(() => {
      const post = fetchSpy.mock.calls.find(
        ([u, init]) =>
          u === '/api/chats' &&
          (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(post).toBeDefined();
    });
  });

  it('clicking the title enters edit mode and shows an input', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    const titleBtn = await screen.findByTestId('chat-title');
    fireEvent.click(titleBtn);
    const input = await screen.findByTestId('chat-title-input');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('first');
  });

  it('pressing Enter on the title input saves via PATCH /api/chats/:id', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    fireEvent.click(await screen.findByTestId('chat-title'));
    const input = await screen.findByTestId('chat-title-input');
    fireEvent.change(input, { target: { value: 'renamed chat' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      const patch = fetchSpy.mock.calls.find(
        ([u, init]) =>
          u === '/api/chats/11' &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      expect(patch).toBeDefined();
      const body = JSON.parse(
        (patch?.[1] as RequestInit).body as string,
      ) as { title?: string | null };
      expect(body.title).toBe('renamed chat');
    });
  });

  it('pressing Escape on the title input cancels without calling PATCH', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    fireEvent.click(await screen.findByTestId('chat-title'));
    const input = await screen.findByTestId('chat-title-input');
    fireEvent.change(input, { target: { value: 'wont be saved' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    const patchCall = fetchSpy.mock.calls.find(
      ([u, init]) =>
        u === '/api/chats/11' &&
        (init as RequestInit | undefined)?.method === 'PATCH',
    );
    expect(patchCall).toBeUndefined();
    expect(await screen.findByTestId('chat-title')).toBeInTheDocument();
  });

  it('clearing the title saves null and the placeholder is shown', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    fireEvent.click(await screen.findByTestId('chat-title'));
    const input = await screen.findByTestId('chat-title-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      const patch = fetchSpy.mock.calls.find(
        ([u, init]) =>
          u === '/api/chats/11' &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      );
      const body = JSON.parse(
        (patch?.[1] as RequestInit).body as string,
      ) as { title?: string | null };
      expect(body.title).toBeNull();
    });
  });

  it('a failed PATCH for the title reverts the displayed title', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy, patchResponse: 'fail' });
    const titleBtn = await screen.findByTestId('chat-title');
    await waitFor(() => {
      expect(titleBtn).toHaveTextContent('first');
      expect(titleBtn).not.toBeDisabled();
    });
    fireEvent.click(titleBtn);
    const input = await screen.findByTestId('chat-title-input');
    fireEvent.change(input, { target: { value: 'bad name' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByTestId('chat-error-banner')).toBeInTheDocument();
    });
    const revertedBtn = await screen.findByTestId('chat-title');
    expect(revertedBtn).toHaveTextContent('first');
  });

  it('renders the chat panel, the message list, and the composer without forcing a min-height of 100vh on the panel', async () => {
    const state: State = {
      chats: [
        {
          id: 11,
          user_id: 1,
          project_id: 1,
          project_name: 'Default',
          title: 'first',
          default_llm_provider_model: 'openai:gpt-x',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      byChat: new Map([[11, []]]),
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
      ],
      availableModels: [
        {
          provider_model: 'openai:gpt-x',
          provider_name: 'openai',
          model_name: 'gpt-x',
          type: 'openai_completions',
        },
      ],
    };
    renderChatPanel(state, { fetchSpy });
    const panel = await screen.findByTestId('chat-panel');
    const list = await screen.findByTestId('chat-message-list');
    const composer = await screen.findByTestId('chat-composer');
    expect(panel).toBeInTheDocument();
    expect(list).toBeInTheDocument();
    expect(composer).toBeInTheDocument();
  });
});
