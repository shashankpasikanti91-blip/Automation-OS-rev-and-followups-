import { cn } from '@/lib/utils';

const statusMap: Record<string, { label: string; className: string }> = {
  UPCOMING:       { label: 'Upcoming',    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  DUE:            { label: 'Due',         className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  OVERDUE:        { label: 'Overdue',     className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  RENEWED:        { label: 'Renewed',     className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  CANCELLED:      { label: 'Cancelled',   className: 'bg-muted text-muted-foreground' },
  NOT_APPLICABLE: { label: 'N/A',         className: 'bg-muted text-muted-foreground' },
};

export function RenewalStatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? statusMap.NOT_APPLICABLE;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', s.className)}>
      {s.label}
    </span>
  );
}
