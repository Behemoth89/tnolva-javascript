import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  type Project,
  createProject,
  listProjects,
} from '../api/projects';
import { type AvailableModel, listAvailableModels } from '../api/chats';
import styles from './ProjectGrid.module.css';

const NAME_MAX_LENGTH = 80;
const PROMPT_MAX_LENGTH = 1000;
const PROMPT_PREVIEW_LENGTH = 140;

export function ProjectGrid() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState<AvailableModel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', system_prompt: '', model: '' });
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjects();
      setProjects(Array.isArray(list) ? list : []);
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
        setCreateForm((prev) => (prev.model ? prev : { ...prev, model: list[0]?.provider_model ?? '' }));
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleOpenProject(id: number) {
    navigate(`/projects/${id}`);
  }

  function handleStartCreate() {
    setShowCreate(true);
    setCreateError(null);
  }

  function handleCancelCreate() {
    setShowCreate(false);
    setCreateForm({ name: '', system_prompt: '', model: createForm.model });
    setCreateError(null);
  }

  async function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreatePending(true);
    setCreateError(null);
    try {
      const created = await createProject({
        name: createForm.name.trim(),
        system_prompt: createForm.system_prompt.trim() === '' ? null : createForm.system_prompt,
        default_llm_provider_model: createForm.model,
      });
      setShowCreate(false);
      setCreateForm({ name: '', system_prompt: '', model: createForm.model });
      await refresh();
      navigate(`/projects/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreatePending(false);
    }
  }

  function truncate(text: string | null, max: number): string {
    if (!text) return '';
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
  }

  return (
    <section
      aria-labelledby="project-grid-title"
      data-testid="project-grid-page"
      className={styles.page}
    >
      <header className={styles.header}>
        <h1 id="project-grid-title" className={styles.title}>Projects</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            data-testid="project-grid-new"
            className={styles.primaryButton}
            onClick={handleStartCreate}
            disabled={showCreate || models.length === 0}
          >
            + New project
          </button>
          <Link
            to="/projects/manage"
            data-testid="project-grid-manage"
            className={styles.manageLink}
          >
            Manage projects
          </Link>
        </div>
      </header>

      {loading && (
        <p data-testid="project-grid-loading" className={styles.status}>Loading projects…</p>
      )}
      {error && (
        <p role="alert" data-testid="project-grid-error" className={styles.error}>{error}</p>
      )}

      {showCreate && (
        <form
          onSubmit={handleSubmitCreate}
          data-testid="project-grid-create-form"
          className={styles.createCard}
        >
          <h2 className={styles.createTitle}>New project</h2>
          <label>
            <span>Name</span>
            <input
              type="text"
              data-testid="project-grid-create-name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              required
              autoFocus
            />
          </label>
          <label>
            <span>System prompt</span>
            <textarea
              data-testid="project-grid-create-system-prompt"
              value={createForm.system_prompt}
              onChange={(e) => setCreateForm({ ...createForm, system_prompt: e.target.value })}
              maxLength={PROMPT_MAX_LENGTH}
              rows={3}
              placeholder="(optional)"
            />
          </label>
          <label>
            <span>Default model</span>
            <select
              data-testid="project-grid-create-model"
              value={createForm.model}
              onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
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
          {createError && (
            <p role="alert" data-testid="project-grid-create-error" className={styles.error}>
              {createError}
            </p>
          )}
          <div className={styles.createActions}>
            <button
              type="submit"
              data-testid="project-grid-create-submit"
              className={styles.primaryButton}
              disabled={createPending}
            >
              {createPending ? 'Creating…' : 'Create project'}
            </button>
            <button
              type="button"
              data-testid="project-grid-create-cancel"
              className={styles.secondaryButton}
              onClick={handleCancelCreate}
              disabled={createPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects && !loading && !error && projects.length === 0 && (
        <p data-testid="project-grid-empty" className={styles.status}>
          You have no projects yet. Create one to get started.
        </p>
      )}

      {projects && projects.length > 0 && (
        <ul data-testid="project-grid-list" className={styles.grid}>
          {projects.map((p) => {
            const promptText = p.system_prompt && p.system_prompt.length > 0
              ? truncate(p.system_prompt, PROMPT_PREVIEW_LENGTH)
              : null;
            return (
              <li key={p.id} className={styles.gridItem}>
                <button
                  type="button"
                  data-testid="project-grid-card"
                  data-project-id={p.id}
                  onClick={() => handleOpenProject(p.id)}
                  className={styles.card}
                  aria-label={`Open project ${p.name}`}
                >
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{p.name}</h2>
                    {p.is_user_default === 1 && (
                      <span
                        data-testid="project-grid-card-default-badge"
                        className={styles.badge}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  {promptText ? (
                    <p className={styles.cardPrompt}>{promptText}</p>
                  ) : (
                    <p className={styles.cardPromptMuted}>(no system prompt)</p>
                  )}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardModel} title={p.default_llm_provider_model}>
                      {p.default_llm_provider_model}
                    </span>
                  </div>
                </button>
                <div className={styles.cardLinks}>
                  <Link
                    to={`/projects/${p.id}/files`}
                    data-testid="project-grid-card-files-link"
                    data-project-id={p.id}
                    className={styles.cardLink}
                  >
                    Files
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ProjectGrid;
