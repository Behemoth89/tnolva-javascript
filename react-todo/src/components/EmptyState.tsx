import type { ElementType } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="h-12 w-12 text-zinc-500" />
      <p className="text-lg font-medium text-zinc-300 mt-4">{title}</p>
      {subtitle && (
        <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
