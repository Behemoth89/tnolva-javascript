import { useEffect, useState } from 'react';
import { usePriorityStore } from '../../../stores/usePriorityStore';
import type { Priority, UpdatePriorityPayload } from '../../../types/priority';

export function PriorityManager() {
  const {
    priorities,
    isLoading,
    error,
    fetchPriorities,
    createPriority,
    updatePriority,
    deletePriority,
    clearError,
  } = usePriorityStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const MAX_NAME_LENGTH = 50;

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createPriority({ priorityName: trimmed });
    setNewName('');
    setIsAdding(false);
  };

  const handleEditStart = (priority: Priority) => {
    setEditingId(priority.id);
    setNewName(priority.priorityName);
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    await updatePriority({ id: editingId, priorityName: trimmed } as UpdatePriorityPayload);
    setEditingId(null);
    setNewName('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewName('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete priority "${name}"?`)) {
      await deletePriority(id);
    }
  };

  const handleChange = (value: string) => {
    if (value.length <= MAX_NAME_LENGTH) {
      setNewName(value);
      if (error) clearError();
    }
  };

  return (
    <div>
      {/* Add button / inline form */}
      {isAdding ? (
        <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Priority name"
            maxLength={MAX_NAME_LENGTH}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            autoFocus
          />
          <p className="text-xs text-zinc-500 mt-1">{newName.length}/{MAX_NAME_LENGTH}</p>
          {error && (
            <p className="text-sm text-red-500 mt-2 bg-red-500/10 border border-red-500/20 rounded px-3 py-1">
              {error}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={isLoading || !newName.trim()}
              className="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded text-sm font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-4 px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          Add Priority
        </button>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error banner (outside of form) */}
      {error && !isAdding && !editingId && (
        <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Priority list */}
      {!isLoading && priorities.length === 0 && !isAdding && (
        <p className="text-zinc-400 text-sm py-4">No priorities yet. Add one to get started.</p>
      )}

      <div className="space-y-2">
        {priorities.map((priority) =>
          editingId === priority.id ? (
            <div key={priority.id} className="p-3 bg-zinc-900 border border-amber-500/30 rounded-lg">
              <input
                type="text"
                value={newName}
                onChange={(e) => handleChange(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <p className="text-xs text-zinc-500 mt-1">{newName.length}/{MAX_NAME_LENGTH}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleEditSave}
                  disabled={isLoading || !newName.trim()}
                  className="px-3 py-1.5 bg-amber-500 text-zinc-950 rounded text-sm font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-100 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={priority.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3"
            >
              <span className="text-zinc-100">{priority.priorityName}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditStart(priority)}
                  className="text-zinc-400 hover:text-amber-500 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(priority.id, priority.priorityName)}
                  className="text-zinc-400 hover:text-red-500 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
