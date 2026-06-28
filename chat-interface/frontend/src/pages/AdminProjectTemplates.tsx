import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  type ProjectTemplate,
  createProjectTemplate,
  deleteProjectTemplate,
  listProjectTemplates,
  updateProjectTemplate,
} from '../api/projects';
import { type AvailableModel, listAvailableModels } from '../api/chats';
import styles from './AdminProjectTemplates.module.css';

const NAME_MAX_LENGTH = 128;
const PROMPT_MAX_LENGTH = 1000;

export function AdminProjectTemplates() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin === 1;

  const [templates, setTemplates] = useState<ProjectTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState<AvailableModel[]>([]);

  const [form, setForm] = useState({ name: '', system_prompt: '', model: '', isDefault: false });
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    system_prompt: '',
    model: '',
    isDefault: false,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProjectTemplates();
      setTemplates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void refresh();
  }, [isAdmin, refresh]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void listAvailableModels()
      .then((list) => {
        if (cancelled) return;
        setModels(list);
        setForm((prev) =>
          prev.model ? prev : { ...prev, model: list[0]?.provider_model ?? '' },
        );
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProjectTemplate({
        name: form.name.trim(),
        system_prompt: form.system_prompt.trim() === '' ? null : form.system_prompt,
        default_llm_provider_model: form.model,
        is_default: form.isDefault,
      });
      setForm({ name: '', system_prompt: '', model: form.model, isDefault: false });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(tpl: ProjectTemplate) {
    setEditingId(tpl.id);
    setEditForm({
      name: tpl.name,
      system_prompt: tpl.system_prompt ?? '',
      model: tpl.default_llm_provider_model,
      isDefault: tpl.is_default === 1,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditSubmitting(true);
    setError(null);
    try {
      await updateProjectTemplate(editingId, {
        name: editForm.name.trim(),
        system_prompt: editForm.system_prompt.trim() === '' ? null : editForm.system_prompt,
        default_llm_provider_model: editForm.model,
        is_default: editForm.isDefault,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleSetDefault(tpl: ProjectTemplate) {
    setError(null);
    try {
      await updateProjectTemplate(tpl.id, { is_default: true });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default');
    }
  }

  async function handleDelete(tpl: ProjectTemplate) {
    const confirmed = window.confirm(`Delete template "${tpl.name}"?`);
    if (!confirmed) return;
    setPendingDeleteId(tpl.id);
    setError(null);
    try {
      await deleteProjectTemplate(tpl.id);
      if (editingId === tpl.id) {
        setEditingId(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (!isAdmin) {
    return (
      <section
        aria-labelledby="project-templates-title"
        data-testid="project-templates-denied"
        className={styles.page}
      >
        <h1 id="project-templates-title" className={styles.title}>Project templates</h1>
        <p role="alert" data-testid="project-templates-denied-message" className={styles.denied}>
          Admin privileges required.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="project-templates-title"
      data-testid="project-templates-page"
      className={styles.page}
    >
      <h1 id="project-templates-title" className={styles.title}>Project templates</h1>

      <form
        onSubmit={handleCreate}
        data-testid="project-templates-create-form"
        className={styles.form}
      >
        <label>
          <span>Name</span>
          <input
            type="text"
            data-testid="project-templates-create-name"
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
            data-testid="project-templates-create-system-prompt"
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            maxLength={PROMPT_MAX_LENGTH}
            placeholder="(optional)"
          />
        </label>
        <label>
          <span>Default model</span>
          <select
            data-testid="project-templates-create-model"
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
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            data-testid="project-templates-create-is-default"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          <span>Set as default template</span>
        </label>
        <button
          type="submit"
          data-testid="project-templates-create-submit"
          disabled={submitting || models.length === 0}
        >
          {submitting ? 'Creating…' : 'New template'}
        </button>
      </form>

      <h2 className={styles.subtitle}>Configured templates</h2>
      {loading && (
        <p data-testid="project-templates-loading" className={styles.loading}>
          Loading templates…
        </p>
      )}
      {error && (
        <p role="alert" data-testid="project-templates-error" className={styles.error}>
          {error}
        </p>
      )}
      {templates && !loading && !error && templates.length === 0 && (
        <p data-testid="project-templates-empty" className={styles.loading}>
          No templates yet.
        </p>
      )}
      {templates && !loading && !error && templates.length > 0 && (
        <table data-testid="project-templates-table" className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>System prompt</th>
              <th>Default model</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.id} data-testid="project-templates-row">
                <td>{tpl.id}</td>
                <td>
                  {tpl.name}
                  {tpl.is_default === 1 && (
                    <span
                      data-testid="project-templates-default-badge"
                      className={styles.badge}
                    >
                      Default
                    </span>
                  )}
                </td>
                <td>
                  {tpl.system_prompt && tpl.system_prompt.length > 0
                    ? tpl.system_prompt
                    : '(none)'}
                </td>
                <td>{tpl.default_llm_provider_model}</td>
                <td>
                  {editingId === tpl.id ? (
                    <form
                      onSubmit={handleUpdate}
                      data-testid="project-templates-edit-form"
                      className={styles.inlineEdit}
                    >
                      <input
                        type="text"
                        data-testid="project-templates-edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        maxLength={NAME_MAX_LENGTH}
                        required
                      />
                      <input
                        type="text"
                        data-testid="project-templates-edit-system-prompt"
                        value={editForm.system_prompt}
                        onChange={(e) =>
                          setEditForm({ ...editForm, system_prompt: e.target.value })
                        }
                        maxLength={PROMPT_MAX_LENGTH}
                        placeholder="(optional)"
                      />
                      <select
                        data-testid="project-templates-edit-model"
                        value={editForm.model}
                        onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                        required
                      >
                        {models.map((m) => (
                          <option key={m.provider_model} value={m.provider_model}>
                            {m.provider_model}
                          </option>
                        ))}
                      </select>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          data-testid="project-templates-edit-is-default"
                          checked={editForm.isDefault}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isDefault: e.target.checked })
                          }
                        />
                        <span>Set as default template</span>
                      </label>
                      <div className={styles.inlineActions}>
                        <button
                          type="submit"
                          data-testid="project-templates-edit-save"
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          data-testid="project-templates-edit-cancel"
                          className={styles.cancel}
                          onClick={() => setEditingId(null)}
                          disabled={editSubmitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        data-testid="project-templates-edit"
                        onClick={() => startEdit(tpl)}
                      >
                        Edit
                      </button>
                      {tpl.is_default !== 1 && (
                        <button
                          type="button"
                          data-testid="project-templates-set-default"
                          onClick={() => void handleSetDefault(tpl)}
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        type="button"
                        data-testid="project-templates-delete"
                        className={styles.danger}
                        onClick={() => void handleDelete(tpl)}
                        disabled={pendingDeleteId === tpl.id}
                      >
                        {pendingDeleteId === tpl.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default AdminProjectTemplates;
