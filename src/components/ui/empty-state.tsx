'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <Button size="sm" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button size="sm" onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
