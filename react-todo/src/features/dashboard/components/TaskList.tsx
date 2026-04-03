import type { Task } from '../../../types/task';
import type { Category } from '../../../types/category';
import type { Priority } from '../../../types/priority';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  priorities: Priority[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, categories, priorities, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No tasks yet. Click "Add Task" to create one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          categories={categories}
          priorities={priorities}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
