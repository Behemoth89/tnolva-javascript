import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  LLM_PROVIDER_TYPES,
  type LLMProvider,
  type LLMProviderType,
  createProvider,
  deleteProvider,
  listProviders,
  updateProvider,
} from '../api/llmProviders';
import styles from './AdminLLMProviders.module.css';

const EMPTY_FORM = { name: '', url: '', api_key: '', type: 'openai_completions' as LLMProviderType };

export function AdminLLMProviders() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin === 1;

  const [providers, setProviders] = useState<LLMProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '', api_key: '', type: 'openai_completions' as LLMProviderType });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProviders();
      setProviders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void refresh();
  }, [isAdmin, refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProvider({
        name: form.name.trim(),
        url: form.url.trim(),
        api_key: form.api_key,
        type: form.type,
      });
      setForm({ ...EMPTY_FORM });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(provider: LLMProvider) {
    setEditingId(provider.id);
    setEditForm({
      name: provider.name,
      url: provider.url,
      api_key: '',
      type: provider.type,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const update: { name?: string; url?: string; api_key?: string; type?: LLMProviderType } = {
        name: editForm.name.trim(),
        url: editForm.url.trim(),
        type: editForm.type,
      };
      if (editForm.api_key.length > 0) {
        update.api_key = editForm.api_key;
      }
      await updateProvider(editingId, update);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setPendingDeleteId(id);
    setError(null);
    try {
      await deleteProvider(id);
      if (editingId === id) {
        setEditingId(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (!isAdmin) {
    return (
      <section aria-labelledby="llm-providers-title" data-testid="llm-providers-denied" className={styles.page}>
        <h1 id="llm-providers-title" className={styles.title}>LLM providers</h1>
        <p role="alert" data-testid="llm-providers-denied-message" className={styles.denied}>
          Admin privileges required.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="llm-providers-title" data-testid="llm-providers-page" className={styles.page}>
      <h1 id="llm-providers-title" className={styles.title}>LLM providers</h1>

      <form onSubmit={handleCreate} data-testid="llm-providers-create-form" className={styles.form}>
        <label>
          <span>Name</span>
          <input
            type="text"
            data-testid="llm-providers-create-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={128}
            required
          />
        </label>
        <label>
          <span>URL</span>
          <input
            type="text"
            data-testid="llm-providers-create-url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            maxLength={512}
            required
          />
        </label>
        <label>
          <span>API key</span>
          <input
            type="password"
            data-testid="llm-providers-create-api-key"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            maxLength={512}
            required
          />
        </label>
        <label>
          <span>Type</span>
          <select
            data-testid="llm-providers-create-type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as LLMProviderType })}
          >
            {LLM_PROVIDER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button type="submit" data-testid="llm-providers-create-submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'New provider'}
        </button>
      </form>

      <h2 className={styles.subtitle}>Configured providers</h2>
      {loading && (
        <p data-testid="llm-providers-loading" className={styles.loading}>Loading providers…</p>
      )}
      {error && (
        <p role="alert" data-testid="llm-providers-error" className={styles.error}>
          {error}
        </p>
      )}
      {providers && !loading && !error && providers.length === 0 && (
        <p data-testid="llm-providers-empty" className={styles.loading}>No providers yet.</p>
      )}
      {providers && !loading && !error && providers.length > 0 && (
        <table data-testid="llm-providers-table" className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>URL</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} data-testid="llm-providers-row">
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.url}</td>
                <td>{p.created_at}</td>
                <td>
                  {editingId === p.id ? (
                    <form onSubmit={handleUpdate} data-testid="llm-providers-edit-form" className={styles.inlineEdit}>
                      <input
                        type="text"
                        data-testid="llm-providers-edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        maxLength={128}
                        required
                      />
                      <input
                        type="text"
                        data-testid="llm-providers-edit-url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        maxLength={512}
                        required
                      />
                      <input
                        type="password"
                        data-testid="llm-providers-edit-api-key"
                        placeholder="Leave blank to keep"
                        value={editForm.api_key}
                        onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })}
                        maxLength={512}
                      />
                      <select
                        data-testid="llm-providers-edit-type"
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value as LLMProviderType })}
                      >
                        {LLM_PROVIDER_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className={styles.inlineActions}>
                        <button
                          type="submit"
                          data-testid="llm-providers-edit-save"
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          data-testid="llm-providers-edit-cancel"
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
                        data-testid="llm-providers-edit"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid="llm-providers-delete"
                        className={styles.danger}
                        onClick={() => void handleDelete(p.id)}
                        disabled={pendingDeleteId === p.id}
                      >
                        {pendingDeleteId === p.id ? 'Deleting…' : 'Delete'}
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

export default AdminLLMProviders;
