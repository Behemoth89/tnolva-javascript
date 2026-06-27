import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  type LLMProvider,
  type LLMProviderModel,
  createModel,
  deleteModel,
  listModels,
  listProviders,
  updateModel,
} from '../api/llmProviders';
import styles from './AdminLLMProviderModels.module.css';

const ALL_PROVIDERS = '__all__';

export function AdminLLMProviderModels() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin === 1;

  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [models, setModels] = useState<LLMProviderModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterProviderId, setFilterProviderId] = useState<string>(ALL_PROVIDERS);

  const [createForm, setCreateForm] = useState({ llm_provider_id: '', name: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ llm_provider_id: '', name: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const providerNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of providers) {
      map.set(p.id, p.name);
    }
    return map;
  }, [providers]);

  const refreshModels = useCallback(async (providerId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const list = providerId === undefined ? await listModels() : await listModels(providerId);
      setModels(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listProviders();
        if (cancelled) return;
        setProviders(list);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load providers');
      }
    })();
    void refreshModels();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshModels]);

  async function handleFilterChange(value: string) {
    setFilterProviderId(value);
    if (value === ALL_PROVIDERS) {
      await refreshModels();
    } else {
      await refreshModels(Number(value));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSubmitting(true);
    setError(null);
    try {
      await createModel({
        llm_provider_id: Number(createForm.llm_provider_id),
        name: createForm.name.trim(),
      });
      setCreateForm({ llm_provider_id: '', name: '' });
      if (filterProviderId === ALL_PROVIDERS) {
        await refreshModels();
      } else {
        await refreshModels(Number(filterProviderId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model');
    } finally {
      setCreateSubmitting(false);
    }
  }

  function startEdit(model: LLMProviderModel) {
    setEditingId(model.id);
    setEditForm({
      llm_provider_id: String(model.llm_provider_id),
      name: model.name,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditSubmitting(true);
    setError(null);
    try {
      await updateModel(editingId, {
        llm_provider_id: Number(editForm.llm_provider_id),
        name: editForm.name.trim(),
      });
      setEditingId(null);
      if (filterProviderId === ALL_PROVIDERS) {
        await refreshModels();
      } else {
        await refreshModels(Number(filterProviderId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setPendingDeleteId(id);
    setError(null);
    try {
      await deleteModel(id);
      if (editingId === id) {
        setEditingId(null);
      }
      if (filterProviderId === ALL_PROVIDERS) {
        await refreshModels();
      } else {
        await refreshModels(Number(filterProviderId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (!isAdmin) {
    return (
      <section aria-labelledby="llm-models-title" data-testid="llm-models-denied" className={styles.page}>
        <h1 id="llm-models-title" className={styles.title}>LLM provider models</h1>
        <p role="alert" data-testid="llm-models-denied-message" className={styles.denied}>
          Admin privileges required.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="llm-models-title" data-testid="llm-models-page" className={styles.page}>
      <h1 id="llm-models-title" className={styles.title}>LLM provider models</h1>

      <div className={styles.filterRow}>
        <label htmlFor="llm-models-filter">Filter by provider</label>
        <select
          id="llm-models-filter"
          data-testid="llm-models-filter"
          value={filterProviderId}
          onChange={(e) => void handleFilterChange(e.target.value)}
        >
          <option value={ALL_PROVIDERS}>All providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleCreate} data-testid="llm-models-create-form" className={styles.form}>
        <label>
          <span>Provider</span>
          <select
            data-testid="llm-models-create-provider"
            value={createForm.llm_provider_id}
            onChange={(e) => setCreateForm({ ...createForm, llm_provider_id: e.target.value })}
            required
          >
            <option value="" disabled>Select…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Name</span>
          <input
            type="text"
            data-testid="llm-models-create-name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            maxLength={128}
            required
          />
        </label>
        <button type="submit" data-testid="llm-models-create-submit" disabled={createSubmitting || providers.length === 0}>
          {createSubmitting ? 'Creating…' : 'New model'}
        </button>
      </form>

      <h2 className={styles.subtitle}>Configured models</h2>
      {loading && (
        <p data-testid="llm-models-loading" className={styles.loading}>Loading models…</p>
      )}
      {error && (
        <p role="alert" data-testid="llm-models-error" className={styles.error}>
          {error}
        </p>
      )}
      {models && !loading && !error && models.length === 0 && (
        <p data-testid="llm-models-empty" className={styles.loading}>No models yet.</p>
      )}
      {models && !loading && !error && models.length > 0 && (
        <table data-testid="llm-models-table" className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Provider</th>
              <th>Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} data-testid="llm-models-row">
                <td>{m.id}</td>
                <td>{providerNameById.get(m.llm_provider_id) ?? `#${m.llm_provider_id}`}</td>
                <td>{m.name}</td>
                <td>{m.created_at}</td>
                <td>
                  {editingId === m.id ? (
                    <form onSubmit={handleUpdate} data-testid="llm-models-edit-form" className={styles.inlineEdit}>
                      <select
                        data-testid="llm-models-edit-provider"
                        value={editForm.llm_provider_id}
                        onChange={(e) => setEditForm({ ...editForm, llm_provider_id: e.target.value })}
                      >
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        data-testid="llm-models-edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        maxLength={128}
                        required
                      />
                      <div className={styles.inlineActions}>
                        <button
                          type="submit"
                          data-testid="llm-models-edit-save"
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          data-testid="llm-models-edit-cancel"
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
                        data-testid="llm-models-edit"
                        onClick={() => startEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid="llm-models-delete"
                        className={styles.danger}
                        onClick={() => void handleDelete(m.id)}
                        disabled={pendingDeleteId === m.id}
                      >
                        {pendingDeleteId === m.id ? 'Deleting…' : 'Delete'}
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

export default AdminLLMProviderModels;
