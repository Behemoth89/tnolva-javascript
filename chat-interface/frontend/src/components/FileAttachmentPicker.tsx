import { ChangeEvent, useRef } from 'react';
import { deleteProjectFile, uploadProjectFile } from '../api/projectFiles';
import styles from './FileAttachmentPicker.module.css';

const ACCEPT_LIST =
  'text/*,image/*,application/pdf,application/json,application/xml,application/javascript,text/markdown,text/csv';

export interface FileAttachmentPickerProps {
  projectId: number;
  attachments: FileAttachmentItem[];
  onChange: (next: FileAttachmentItem[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export interface FileAttachmentItem {
  localId: string;
  file?: File;
  fileId?: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
}

function makeLocalId(): string {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FileAttachmentPicker({
  projectId: _projectId,
  attachments,
  onChange,
  disabled = false,
  onError,
}: FileAttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const next: FileAttachmentItem[] = [...attachments];
    for (const file of Array.from(files)) {
      next.push({
        localId: makeLocalId(),
        file,
        status: 'pending',
      });
    }
    onChange(next);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function handleRemove(item: FileAttachmentItem) {
    const next = attachments.filter((a) => a.localId !== item.localId);
    onChange(next);
    if (item.status === 'uploaded' && item.fileId) {
      try {
        await deleteProjectFile(item.fileId);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Failed to remove uploaded file');
      }
    }
  }

  return (
    <div className={styles.wrapper} data-testid="file-attachment-picker">
      <div className={styles.controls}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_LIST}
          className={styles.fileInput}
          data-testid="file-attachment-picker-input"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>
      {attachments.length > 0 && (
        <div className={styles.chips} data-testid="file-attachment-picker-chips">
          {attachments.map((item) => {
            const name = item.file?.name ?? `file-${item.fileId ?? '?'}`;
            const state = item.status === 'uploading' ? 'uploading' : 'ready';
            return (
              <span
                key={item.localId}
                className={styles.chip}
                data-state={state}
                data-testid="file-attachment-picker-chip"
                data-file-status={item.status}
              >
                <span>{item.status === 'uploading' ? 'uploading…' : name}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  data-testid="file-attachment-picker-chip-remove"
                  aria-label={`Remove ${name}`}
                  onClick={() => {
                    void handleRemove(item);
                  }}
                  disabled={item.status === 'uploading'}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export async function uploadPendingAttachments(
  projectId: number,
  attachments: FileAttachmentItem[],
  onProgress: (next: FileAttachmentItem[]) => void,
  onError: (message: string) => void,
): Promise<{ items: FileAttachmentItem[]; uploadedIds: number[] }> {
  const next: FileAttachmentItem[] = attachments.map((a) => ({ ...a }));
  const uploadedIds: number[] = [];
  for (const item of next) {
    if (item.status !== 'pending' || !item.file) {
      if (item.fileId) {
        uploadedIds.push(item.fileId);
      }
      continue;
    }
    item.status = 'uploading';
    onProgress(next.map((a) => ({ ...a })));
    try {
      const file = await uploadProjectFile(projectId, item.file, { source: 'chat_upload' });
      item.fileId = file.id;
      item.status = 'uploaded';
      item.file = undefined;
      uploadedIds.push(file.id);
      onProgress(next.map((a) => ({ ...a })));
    } catch (err) {
      item.status = 'failed';
      item.error = err instanceof Error ? err.message : 'Upload failed';
      onProgress(next.map((a) => ({ ...a })));
      onError(item.error);
      return { items: next.map((a) => ({ ...a })), uploadedIds: [] };
    }
  }
  return { items: next.map((a) => ({ ...a })), uploadedIds };
}
