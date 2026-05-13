import { useState, useEffect } from 'react';
import type { CreateTaskPayload, UpdateTaskPayload } from '../../../types/task';
import { useModalStore } from '../../../stores/useModalStore';
import { useCategoryStore } from '../../../stores/useCategoryStore';
import { usePriorityStore } from '../../../stores/usePriorityStore';
import { useTaskStore } from '../../../stores/useTaskStore';

interface FormErrors {
  taskName?: string;
}

export function TaskModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const editingTask = useModalStore((state) => state.editingTask);
  const closeModal = useModalStore((state) => state.closeModal);

  const categories = useCategoryStore((state) => state.categories);
  const priorities = usePriorityStore((state) => state.priorities);
  const isLoading = useTaskStore((state) => state.isLoading);
  const createTask = useTaskStore((state) => state.createTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const [taskName, setTaskName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priorityId, setPriorityId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  const isEditMode = editingTask !== undefined;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTask) {
      setTaskName(editingTask.taskName || '');
      setCategoryId(editingTask.todoCategoryId || '');
      setPriorityId(editingTask.todoPriorityId || '');
      setDueDate(editingTask.dueDt ? editingTask.dueDt.split('T')[0] : '');
    } else {
      setTaskName('');
      setCategoryId('');
      setPriorityId('');
      setDueDate('');
    }
    setErrors({});
    setTouched(false);
  }, [editingTask, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!taskName.trim()) {
      newErrors.taskName = 'Task name is required';
    } else if (taskName.trim().length > 100) {
      newErrors.taskName = 'Task name must be 100 characters or less';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validate()) return;

    if (isEditMode && editingTask) {
      const payload: UpdateTaskPayload = {
        id: editingTask.id,
        taskName: taskName.trim(),
        dueDt: dueDate || null,
        todoCategoryId: categoryId || null,
        todoPriorityId: priorityId || null,
      };
      await updateTask(payload);
    } else {
      const payload: CreateTaskPayload = {
        taskName: taskName.trim(),
        dueDt: dueDate || null,
        todoCategoryId: categoryId || null,
        todoPriorityId: priorityId || null,
      };
      await createTask(payload);
    }

    closeModal();
  };

  const handleClose = () => {
    setTaskName('');
    setCategoryId('');
    setPriorityId('');
    setDueDate('');
    setErrors({});
    setTouched(false);
    closeModal();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value);
    if (touched && errors.taskName) {
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          {isEditMode ? 'Edit Task' : 'Create Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task name */}
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-zinc-400 mb-1">
              Task name
            </label>
            <input
              id="taskName"
              type="text"
              value={taskName}
              onChange={handleNameChange}
              onBlur={() => setTouched(true)}
              placeholder="Enter task name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              autoFocus
            />
            {touched && errors.taskName && (
              <p className="mt-1 text-xs text-red-500">{errors.taskName}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-400 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-zinc-400 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priorityId}
              onChange={(e) => setPriorityId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="">No priority</option>
              {priorities.map((pri) => (
                <option key={pri.id} value={pri.id}>
                  {pri.priorityName}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-400 mb-1">
              Due date
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-zinc-400 rounded-lg px-4 py-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !taskName.trim()}
              className="flex-1 bg-amber-500 text-zinc-900 font-medium rounded-lg px-4 py-2 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
