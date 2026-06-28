import { KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  type Project,
  deleteProject,
  getProject,
  makeDefaultProject,
  updateProject,
} from '../api/projects';
import ChatPanel from '../components/ChatPanel';
import styles from './ProjectChat.module.css';

const NAME_MAX_LENGTH = 80;
const PROMPT_MAX_LENGTH = 1000;

export function ProjectChat() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [namePending, setNamePending] = useState(false);

  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const [promptPending, setPromptPending] = useState(false);

  const [makeDefaultPending, setMakeDefaultPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const refresh = useCallback(async () => {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const next = await getProject(projectId);
      if (!next) {
        setNotFound(true);
        setProject(null);
      } else {
        setProject(next);
      }
    } catch (err) {
      if (err instanceof Error && /not found/i.test(err.message)) {
        setNotFound(true);
        setProject(null);
      } else {
        setLoadError(err instanceof Error ? err.message : 'Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function handleStartEditName() {
    if (!project) return;
    setNameDraft(project.name);
    setEditingName(true);
  }

  function handleCancelEditName() {
    setEditingName(false);
    setNameDraft('');
  }

  async function handleSaveName() {
    if (!project || namePending) return;
    const trimmed = nameDraft.trim();
    if (trimmed === project.name) {
      handleCancelEditName();
      return;
    }
    setNamePending(true);
    setActionError(null);
    try {
      const updated = await updateProject(project.id, { name: trimmed });
      setProject(updated);
      handleCancelEditName();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update project name');
      handleCancelEditName();
    } finally {
      setNamePending(false);
    }
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSaveName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditName();
    }
  }

  function handleStartEditPrompt() {
    if (!project) return;
    setPromptDraft(project.system_prompt ?? '');
    setEditingPrompt(true);
  }

  function handleCancelEditPrompt() {
    setEditingPrompt(false);
    setPromptDraft('');
  }

  async function handleSavePrompt() {
    if (!project || promptPending) return;
    const trimmed = promptDraft.trim();
    const current = project.system_prompt ?? '';
    if (trimmed === current) {
      handleCancelEditPrompt();
      return;
    }
    setPromptPending(true);
    setActionError(null);
    try {
      const updated = await updateProject(project.id, {
        system_prompt: trimmed.length === 0 ? null : trimmed,
      });
      setProject(updated);
      handleCancelEditPrompt();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update system prompt');
      handleCancelEditPrompt();
    } finally {
      setPromptPending(false);
    }
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSavePrompt();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditPrompt();
    }
  }

  async function handleMakeDefault() {
    if (!project || makeDefaultPending) return;
    setMakeDefaultPending(true);
    setActionError(null);
    try {
      const updated = await makeDefaultProject(project.id);
      setProject(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to set default project');
    } finally {
      setMakeDefaultPending(false);
    }
  }

  async function handleDelete() {
    if (!project || deletePending) return;
    const confirmed = window.confirm(
      `Delete project "${project.name}"? All chats in this project will be removed.`,
    );
    if (!confirmed) return;
    setDeletePending(true);
    setActionError(null);
    try {
      await deleteProject(project.id);
      navigate('/projects');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project');
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <section
        aria-labelledby="project-chat-title"
        data-testid="project-chat-loading"
        className={styles.page}
      >
        <p className={styles.status}>Loading project…</p>
      </section>
    );
  }

  if (notFound) {
    return (
      <section
        aria-labelledby="project-chat-title"
        data-testid="project-chat-not-found"
        className={styles.page}
      >
        <p className={styles.error}>Project not found.</p>
        <Link
          to="/projects"
          data-testid="project-chat-back-from-not-found"
          className={styles.backLink}
        >
          ← Back to projects
        </Link>
      </section>
    );
  }

  if (!project) {
    return (
      <section
        aria-labelledby="project-chat-title"
        data-testid="project-chat-error"
        className={styles.page}
      >
        {loadError && (
          <p role="alert" className={styles.error}>{loadError}</p>
        )}
      </section>
    );
  }

  const isDefault = project.is_user_default === 1;

  return (
    <section
      aria-labelledby="project-chat-title"
      data-testid="project-chat-page"
      className={styles.page}
    >
      <Link
        to="/projects"
        data-testid="project-chat-back"
        className={styles.backLink}
      >
        ← Back to projects
      </Link>

      <header
        data-testid="project-hero"
        className={styles.hero}
        aria-label="Project details"
      >
        <div className={styles.heroHeader}>
          {editingName ? (
            <input
              type="text"
              data-testid="project-hero-name-input"
              className={styles.heroNameInput}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={() => void handleSaveName()}
              maxLength={NAME_MAX_LENGTH}
              disabled={namePending}
              autoFocus
              aria-label="Project name"
            />
          ) : (
            <button
              type="button"
              data-testid="project-hero-name"
              className={styles.heroName}
              onClick={handleStartEditName}
              disabled={isDefault}
              title={isDefault ? 'Default project cannot be renamed' : 'Click to rename'}
            >
              {project.name}
            </button>
          )}
          {isDefault && (
            <span data-testid="project-hero-default-badge" className={styles.badge}>
              Default
            </span>
          )}
        </div>

        <div className={styles.heroPromptRow}>
          <span className={styles.heroLabel}>System prompt</span>
          {editingPrompt ? (
            <textarea
              data-testid="project-hero-prompt-input"
              className={styles.heroPromptInput}
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              onKeyDown={handlePromptKeyDown}
              onBlur={() => void handleSavePrompt()}
              maxLength={PROMPT_MAX_LENGTH}
              rows={3}
              disabled={promptPending}
              autoFocus
              aria-label="System prompt"
            />
          ) : (
            <button
              type="button"
              data-testid="project-hero-prompt"
              className={
                project.system_prompt && project.system_prompt.length > 0
                  ? styles.heroPromptValue
                  : styles.heroPromptEmpty
              }
              onClick={handleStartEditPrompt}
              title="Click to edit"
            >
              {project.system_prompt && project.system_prompt.length > 0
                ? project.system_prompt
                : '(none — click to set)'}
            </button>
          )}
        </div>

        <div className={styles.heroMetaRow}>
          <div className={styles.heroMeta}>
            <span className={styles.heroLabel}>Default model</span>
            <span className={styles.heroMetaValue} title={project.default_llm_provider_model}>
              {project.default_llm_provider_model}
            </span>
          </div>
          <div className={styles.heroActions}>
            {!isDefault && (
              <button
                type="button"
                data-testid="project-hero-make-default"
                className={styles.heroSecondary}
                onClick={() => void handleMakeDefault()}
                disabled={makeDefaultPending}
              >
                {makeDefaultPending ? 'Updating…' : 'Make default'}
              </button>
            )}
            {!isDefault && (
              <button
                type="button"
                data-testid="project-hero-delete"
                className={styles.heroDanger}
                onClick={() => void handleDelete()}
                disabled={deletePending}
              >
                {deletePending ? 'Deleting…' : 'Delete project'}
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <p role="alert" data-testid="project-hero-error" className={styles.error}>
            {actionError}
          </p>
        )}
      </header>

      <ChatPanel project={project} />
    </section>
  );
}

export default ProjectChat;
