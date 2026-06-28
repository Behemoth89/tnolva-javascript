import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LlmFileAttachmentCard from '../src/components/LlmFileAttachmentCard';
import type { AssistantAttachment } from '../src/chat/types';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

const ATTACHMENT: AssistantAttachment = {
  filename: 'spec.md',
  mime_type: 'text/markdown',
  content_text: '# Hello',
};

function renderCard(props: { saveResult: 'ok' | 'fail' }, fetchSpy: FetchSpy) {
  fetchSpy.mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    if (url === '/api/projects/1/files/from-message') {
      if (props.saveResult === 'fail') {
        return jsonResponse({ error: 'Forbidden' }, 403);
      }
      return jsonResponse({
        id: 555,
        project_id: 1,
        user_id: 1,
        filename: 'spec.md',
        mime_type: 'text/markdown',
        size_bytes: 8,
        source: 'llm_generated',
        source_chat_id: 7,
        source_message_id: 9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });
    }
    return jsonResponse({ error: 'unhandled' }, 500);
  });
  return render(
    <MemoryRouter>
      <LlmFileAttachmentCard
        attachment={ATTACHMENT}
        attachmentIndex={0}
        chatId={7}
        messageId={9}
        projectId={1}
      />
    </MemoryRouter>,
  );
}

describe('LlmFileAttachmentCard (component)', () => {
  let fetchSpy: FetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the filename, MIME type, and the initial save button', () => {
    renderCard({ saveResult: 'ok' }, fetchSpy);
    expect(screen.getByText('spec.md')).toBeInTheDocument();
    expect(screen.getByText('text/markdown')).toBeInTheDocument();
    expect(screen.getByTestId('llm-file-attachment-save')).toBeInTheDocument();
  });

  it('does not auto-invoke save on mount', () => {
    renderCard({ saveResult: 'ok' }, fetchSpy);
    const calls = fetchSpy.mock.calls.filter(
      ([u]) => typeof u === 'string' && u === '/api/projects/1/files/from-message',
    );
    expect(calls).toHaveLength(0);
  });

  it('replaces the button with a Saved badge and a download link on success', async () => {
    renderCard({ saveResult: 'ok' }, fetchSpy);
    fireEvent.click(screen.getByTestId('llm-file-attachment-save'));
    await waitFor(() => {
      expect(screen.getByTestId('llm-file-attachment-saved-badge')).toBeInTheDocument();
    });
    expect(screen.getByTestId('llm-file-attachment-download')).toBeInTheDocument();
  });

  it('surfaces a server error and shows a Retry button', async () => {
    renderCard({ saveResult: 'fail' }, fetchSpy);
    fireEvent.click(screen.getByTestId('llm-file-attachment-save'));
    await waitFor(() => {
      expect(screen.getByTestId('llm-file-attachment-error')).toHaveTextContent('Forbidden');
    });
    expect(screen.getByTestId('llm-file-attachment-save')).toBeInTheDocument();
  });
});
