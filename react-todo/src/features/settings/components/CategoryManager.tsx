import { useEffect, useState } from 'react';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import type { Category, UpdateCategoryPayload } from '../../../types/category';

export function CategoryManager() {
  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  } = useCategoryStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSort, setNewSort] = useState(0);
  const MAX_NAME_LENGTH = 50;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createCategory({ categoryName: trimmed, categorySort: newSort });
    setNewName('');
    setNewSort(0);
    setIsAdding(false);
  };

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setNewName(category.categoryName);
    setNewSort(category.categorySort);
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    await updateCategory({ id: editingId, categoryName: trimmed, categorySort: newSort } as UpdateCategoryPayload);
    setEditingId(null);
    setNewName('');
    setNewSort(0);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewName('');
    setNewSort(0);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      await deleteCategory(id);
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
            placeholder="Category name"
            maxLength={MAX_NAME_LENGTH}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            autoFocus
          />
          <p className="text-xs text-zinc-500 mt-1">{newName.length}/{MAX_NAME_LENGTH}</p>
          <div className="mt-2">
            <label className="text-xs text-zinc-400 mb-1 block">Sort order</label>
            <input
              type="number"
              value={newSort}
              onChange={(e) => setNewSort(Number(e.target.value))}
              className="w-24 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
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
          Add Category
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

      {/* Category list */}
      {!isLoading && categories.length === 0 && !isAdding && (
        <p className="text-zinc-400 text-sm py-4">No categories yet. Add one to get started.</p>
      )}

      <div className="space-y-2">
        {[...categories]
          .sort((a, b) => a.categorySort - b.categorySort)
          .map((category) =>
          editingId === category.id ? (
            <div key={category.id} className="p-3 bg-zinc-900 border border-amber-500/30 rounded-lg">
              <input
                type="text"
                value={newName}
                onChange={(e) => handleChange(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <p className="text-xs text-zinc-500 mt-1">{newName.length}/{MAX_NAME_LENGTH}</p>
              <div className="mt-2">
                <label className="text-xs text-zinc-400 mb-1 block">Sort order</label>
                <input
                  type="number"
                  value={newSort}
                  onChange={(e) => setNewSort(Number(e.target.value))}
                  className="w-24 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
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
              key={category.id}
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3"
            >
              <span className="text-zinc-100">{category.categoryName}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditStart(category)}
                  className="text-zinc-400 hover:text-amber-500 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.categoryName)}
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
