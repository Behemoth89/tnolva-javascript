import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  type Project,
  createProject,
  deleteProject,
  listProjects,
  makeDefaultProject,
  updateProject,
} from '../api/projects';
import { type AvailableModel, listAvailableModels } from '../api/chats';
import styles from './Projects.module.css';

const NAME_MAX_LENGTH = 80;
const PROMPT_MAX_LENGTH = 1000;

interface ProjectRowProps {
  project: Project;
  onStartRename: (p: Project) => void;
  onCancelRename: () => void;
  onCommitRename: (p: Project, next: string) => void;
  onSetDefault: (p: Project) => Promise<void>;
  onDelete: (p: Project) => Promise<void>;
  pendingDeleteId: number | null;
  pendingDefaultId: number | null;
  renameDraft: string;
  setRenameDraft: (s: string) => void;
  renamePending: boolean;
  renameTarget: Project | null;
}

function ProjectRow(props: ProjectRowProps) {
  const {
    project,
    onStartRename,
    onCancelRename,
    onCommitRename,
    onSetDefault,
    onDelete,
    pendingDeleteId,
    pendingDefaultId,
    renameDraft,
    setRenameDraft,
    renamePending,
    renameTarget,
  } = props;
  const isEditing = renameTarget?.id === project.id;
  const isDefault = project.is_user_default === 1;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void onCommitRename(project, event.currentTarget.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelRename();
    }
  }

  return (
    <tr data-testid="projects-row" data-project-id={project.id}>
      <td>
        {isEditing ? (
          <input
            type="text"
            data-testid="projects-rename-input"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              if (e.currentTarget.value.trim() !== project.name) {
                void onCommitRename(project, e.currentTarget.value);
              } else {
                onCancelRename();
              }
            }}
            maxLength={NAME_MAX_LENGTH}
            disabled={renamePending}
            autoFocus
          />
        ) : (
          <button
            type="button"
            data-testid="projects-name"
            onClick={() => onStartRename(project)}
            disabled={isDefault}
            title={isDefault ? 'Default project cannot be renamed' : 'Click to rename'}
          >
            {project.name}
          </button>
        )}
        {isDefault && (
          <span data-testid="projects-default-badge" className={styles.badge}>
            Default
          </span>
        )}
      </td>
      <td>
        {project.system_prompt && project.system_prompt.length > 0
          ? project.system_prompt
          : '(none)'}
      </td>
      <td>{project.default_llm_provider_model}</td>
      <td>
        <div className={styles.rowActions}>
          {!isDefault && (
            <button
              type="button"
              data-testid="projects-set-default"
              onClick={() => void onSetDefault(project)}
              disabled={pendingDefaultId === project.id}
            >
              {pendingDefaultId === project.id ? 'Updating…' : 'Set as default'}
            </button>
          )}
          {!isDefault && (
            <button
              type="button"
              data-testid="projects-delete"
              className={styles.danger}
              onClick={() => void onDelete(project)}
              disabled={pendingDeleteId === project.id}
            >
              {pendingDeleteId === project.id ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: '', system_prompt: '', model: '' });
  const [submitting, setSubmitting] = useState(false);

  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renamePending, setRenamePending] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingDefaultId, setPendingDefaultId] = useState<number | null>(null);

  const [models, setModels] = useState<AvailableModel[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    void listAvailableModels()
      .then((list) => {
        if (cancelled) return;
        setModels(list);
        if (list.length > 0) {
          setForm((prev) => (prev.model ? prev : { ...prev, model: list[0]!.provider_model }));
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProject({
        name: form.name.trim(),
        system_prompt: form.system_prompt.trim() === '' ? null : form.system_prompt,
        default_llm_provider_model: form.model,
      });
      setForm({ name: '', system_prompt: '', model: form.model });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartRename(p: Project) {
    if (p.is_user_default === 1) return;
    setRenameTarget(p);
    setRenameDraft(p.name);
  }

  function handleCancelRename() {
    setRenameTarget(null);
    setRenameDraft('');
  }

  async function handleCommitRename(p: Project, rawValue: string) {
    const trimmed = rawValue.trim();
    if (trimmed === p.name) {
      handleCancelRename();
      return;
    }
    setRenamePending(true);
    setError(null);
    try {
      await updateProject(p.id, { name: trimmed });
      handleCancelRename();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      handleCancelRename();
    } finally {
      setRenamePending(false);
    }
  }

  async function handleSetDefault(p: Project) {
    setPendingDefaultId(p.id);
    setError(null);
    try {
      await makeDefaultProject(p.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default project');
    } finally {
      setPendingDefaultId(null);
    }
  }

  async function handleDelete(p: Project) {
    setPendingDeleteId(p.id);
    setError(null);
    try {
      await deleteProject(p.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <section
      aria-labelledby="projects-title"
      data-testid="projects-page"
      className={styles.page}
    >
      <h1 id="projects-title" className={styles.title}>Projects</h1>

      <form
        onSubmit={handleCreate}
        data-testid="projects-create-form"
        className={styles.form}
      >
        <label>
          <span>Name</span>
          <input
            type="text"
            data-testid="projects-create-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={NAME_MAX_LENGTH}
            required
          />
        </label>
        <label>
          <span>System prompt</span>
          <input
            type="text"
            data-testid="projects-create-system-prompt"
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder="(optional)"
          />
        </label>
        <label>
          <span>Default model</span>
          <select
            data-testid="projects-create-model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          >
            {models.length === 0 && <option value="" disabled>Loading…</option>}
            {models.map((m) => (
              <option key={m.provider_model} value={m.provider_model}>
                {m.provider_model}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          data-testid="projects-create-submit"
          disabled={submitting || models.length === 0}
        >
          {submitting ? 'Creating…' : 'New project'}
        </button>
      </form>

      <h2 className={styles.subtitle}>Your projects</h2>
      {loading && (
        <p data-testid="projects-loading" className={styles.loading}>Loading projects…</p>
      )}
      {error && (
        <p role="alert" data-testid="projects-error" className={styles.error}>
          {error}
        </p>
      )}
      {projects && !loading && !error && projects.length === 0 && (
        <p data-testid="projects-empty" className={styles.loading}>No projects yet.</p>
      )}
      {projects && !loading && !error && projects.length > 0 && (
        <table data-testid="projects-table" className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>System prompt</th>
              <th>Default model</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                onStartRename={handleStartRename}
                onCancelRename={handleCancelRename}
                onCommitRename={handleCommitRename}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                pendingDeleteId={pendingDeleteId}
                pendingDefaultId={pendingDefaultId}
                renameTarget={renameTarget}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                renamePending={renamePending}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Projects;
