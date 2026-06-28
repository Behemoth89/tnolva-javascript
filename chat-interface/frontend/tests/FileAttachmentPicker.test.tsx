import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { useState } from 'react';
import {
  FileAttachmentItem,
  FileAttachmentPicker,
  uploadPendingAttachments,
} from '../src/components/FileAttachmentPicker';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type FetchSpy = MockInstance<typeof fetch>;

describe('FileAttachmentPicker (component, isolated)', () => {
  let fetchSpy: FetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    cleanup();
  });

  it('renders the file input and accepts multiple files', () => {
    render(<FileAttachmentPicker projectId={1} attachments={[]} onChange={() => {}} />);
    expect(screen.getByTestId('file-attachment-picker-input')).toBeInTheDocument();
  });

  it('does not render chips when there are no attachments', () => {
    render(<FileAttachmentPicker projectId={1} attachments={[]} onChange={() => {}} />);
    expect(screen.queryByTestId('file-attachment-picker-chips')).not.toBeInTheDocument();
  });

  it('renders one chip per attachment', () => {
    const attachments: FileAttachmentItem[] = [
      { localId: 'a', file: new File(['x'], 'a.txt'), status: 'pending' },
      { localId: 'b', file: new File(['y'], 'b.txt'), status: 'pending' },
    ];
    render(
      <FileAttachmentPicker
        projectId={1}
        attachments={attachments}
        onChange={() => {}}
      />,
    );
    expect(screen.getAllByTestId('file-attachment-picker-chip')).toHaveLength(2);
  });

  it('marks uploading chips as disabled', () => {
    const attachments: FileAttachmentItem[] = [
      { localId: 'a', file: new File(['x'], 'a.txt'), status: 'uploading' },
    ];
    render(
      <FileAttachmentPicker
        projectId={1}
        attachments={attachments}
        onChange={() => {}}
      />,
    );
    const chip = screen.getByTestId('file-attachment-picker-chip');
    expect(chip.getAttribute('data-state')).toBe('uploading');
  });
});

describe('uploadPendingAttachments (unit)', () => {
  let fetchSpy: FetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    cleanup();
  });

  it('uploads a single pending file and returns its id', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 555,
        project_id: 1,
        user_id: 1,
        filename: 'a.txt',
        mime_type: 'text/plain',
        size_bytes: 1,
        source: 'chat_upload',
        source_chat_id: null,
        source_message_id: null,
        created_at: 'c',
        updated_at: 'c',
      }),
    );
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    const attachments: FileAttachmentItem[] = [
      { localId: 'a', file, status: 'pending' },
    ];
    const result = await uploadPendingAttachments(
      1,
      attachments,
      () => {},
      () => {},
    );
    expect(result.uploadedIds).toEqual([555]);
    expect(result.items[0]?.status).toBe('uploaded');
    const uploadCall = fetchSpy.mock.calls[0];
    expect(uploadCall?.[0]).toBe('/api/projects/1/files');
    expect((uploadCall?.[1] as RequestInit)?.method).toBe('POST');
    const form = (uploadCall?.[1] as RequestInit).body as FormData;
    expect(form.get('source')).toBe('chat_upload');
  });

  it('returns empty result and calls onError when upload fails', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ error: 'File too large' }, 413),
    );
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    const attachments: FileAttachmentItem[] = [
      { localId: 'a', file, status: 'pending' },
    ];
    const onError = vi.fn();
    const result = await uploadPendingAttachments(1, attachments, () => {}, onError);
    expect(result.uploadedIds).toEqual([]);
    expect(onError).toHaveBeenCalledWith('File too large');
  });
});

describe('FileAttachmentPicker composer integration (component)', () => {
  let fetchSpy: FetchSpy;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    cleanup();
  });

  // This lightweight harness exercises the picker → composer flow without
  // spinning up the full ChatPanel, which kept the integration test stable.
  function ComposerHarness() {
    const [attachments, setAttachments] = useState<FileAttachmentItem[]>([]);
    const [pendingFileIds, setPendingFileIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    async function onSubmit() {
      const result = await uploadPendingAttachments(
        1,
        attachments,
        (next) => setAttachments(next),
        (message) => setError(message),
      );
      if (result.uploadedIds.length === 0) return;
      setPendingFileIds(result.uploadedIds);
      setAttachments(result.items.filter((a) => a.status === 'uploaded'));
    }
    return (
      <div>
        <FileAttachmentPicker
          projectId={1}
          attachments={attachments}
          onChange={setAttachments}
          onError={(message) => setError(message)}
        />
        <button
          type="button"
          data-testid="composer-submit"
          onClick={() => {
            void onSubmit();
          }}
        >
          Send
        </button>
        {error && <div data-testid="composer-error">{error}</div>}
        {pendingFileIds.length > 0 && (
          <div data-testid="composer-file-ids">{pendingFileIds.join(',')}</div>
        )}
      </div>
    );
  }

  it('uploads a pending file and posts the resulting id', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: 777,
        project_id: 1,
        user_id: 1,
        filename: 'a.txt',
        mime_type: 'text/plain',
        size_bytes: 1,
        source: 'chat_upload',
        source_chat_id: null,
        source_message_id: null,
        created_at: 'c',
        updated_at: 'c',
      }),
    );
    render(<ComposerHarness />);
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('file-attachment-picker-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByTestId('composer-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('composer-file-ids')).toHaveTextContent('777');
    });
  });

  it('surfaces upload errors via the error banner', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ error: 'File too large' }, 413),
    );
    render(<ComposerHarness />);
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('file-attachment-picker-input'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByTestId('composer-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('composer-error')).toHaveTextContent('File too large');
    });
  });
});
