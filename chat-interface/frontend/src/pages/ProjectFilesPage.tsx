import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  type ProjectFile,
  type ProjectFileListResponse,
  type ProjectFileSource,
  deleteProjectFile,
  downloadProjectFileUrl,
  listProjectFiles,
  uploadProjectFile,
} from '../api/projectFiles';
import { getProject } from '../api/projects';
import styles from './ProjectFilesPage.module.css';

const SOURCE_OPTIONS: ReadonlyArray<{ value: '' | ProjectFileSource; label: string }> = [
  { value: '', label: 'All' },
  { value: 'project_upload', label: 'Project upload' },
  { value: 'chat_upload', label: 'Chat upload' },
  { value: 'llm_generated', label: 'LLM generated' },
];

function humanFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function ProjectFilesPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'' | ProjectFileSource>('');
  const [data, setData] = useState<ProjectFileListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setError('Invalid project id');
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listProjectFiles(projectId, {
        ...(sourceFilter ? { source: sourceFilter } : {}),
      });
      setData(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, sourceFilter]);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return;
    }
    void getProject(projectId)
      .then((project) => {
        if (cancelled) return;
        setProjectName(project.name);
      })
      .catch(() => {
        if (cancelled) return;
        setProjectName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function handleSourceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === 'project_upload' || value === 'chat_upload' || value === 'llm_generated') {
      setSourceFilter(value);
    } else {
      setSourceFilter('');
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setUploadFile(file);
  }

  async function handleUpload() {
    if (!uploadFile || uploadPending) return;
    setUploadPending(true);
    setError(null);
    try {
      await uploadProjectFile(projectId, uploadFile);
      setUploadFile(null);
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[data-testid="project-files-upload-input"]',
      );
      if (fileInput) {
        fileInput.value = '';
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadPending(false);
    }
  }

  async function handleDownload(file: ProjectFile) {
    try {
      const res = await fetch(downloadProjectFileUrl(file.id), {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }

  async function handleDelete(file: ProjectFile) {
    if (deletePendingId !== null) return;
    const confirmed = window.confirm(`Delete file "${file.filename}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletePendingId(file.id);
    setError(null);
    try {
      await deleteProjectFile(file.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletePendingId(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <section
      aria-labelledby="project-files-title"
      data-testid="project-files-page"
      className={styles.page}
    >
      <Link
        to={`/projects/${projectId}`}
        data-testid="project-files-back"
        className={styles.backLink}
      >
        ← Back to project
      </Link>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 id="project-files-title" className={styles.title}>
            {projectName ? `${projectName} — Files` : 'Project files'}
          </h1>
        </div>
      </header>

      {error && (
        <p role="alert" data-testid="project-files-error" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.controls}>
        <label className={styles.filterLabel}>
          Source
          <select
            data-testid="project-files-source-filter"
            className={styles.filterSelect}
            value={sourceFilter}
            onChange={handleSourceChange}
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.uploadForm}>
          <input
            type="file"
            data-testid="project-files-upload-input"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={uploadPending}
          />
          <button
            type="button"
            data-testid="project-files-upload-button"
            className={styles.uploadButton}
            onClick={() => {
              void handleUpload();
            }}
            disabled={uploadPending || !uploadFile}
          >
            {uploadPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {loading && (
        <p data-testid="project-files-loading" className={styles.status}>
          Loading files…
        </p>
      )}

      {!loading && items.length === 0 && (
        <p data-testid="project-files-empty" className={styles.empty}>
          No files in this project yet.
        </p>
      )}

      {!loading && items.length > 0 && (
        <table data-testid="project-files-table" className={styles.table}>
          <thead>
            <tr>
              <th>Filename</th>
              <th>MIME</th>
              <th>Size</th>
              <th>Source</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((file) => (
              <tr key={file.id} data-testid="project-files-row" data-file-id={file.id}>
                <td>{file.filename}</td>
                <td>{file.mime_type}</td>
                <td>{humanFileSize(file.size_bytes)}</td>
                <td>
                  <span
                    data-testid="project-files-source-badge"
                    data-source={file.source}
                    className={styles.badge}
                  >
                    {file.source}
                  </span>
                </td>
                <td>{formatTimestamp(file.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      data-testid="project-files-download"
                      className={styles.iconButton}
                      onClick={() => {
                        void handleDownload(file);
                      }}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      data-testid="project-files-delete"
                      className={styles.dangerButton}
                      onClick={() => {
                        void handleDelete(file);
                      }}
                      disabled={deletePendingId === file.id}
                    >
                      {deletePendingId === file.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ProjectFilesPage;
