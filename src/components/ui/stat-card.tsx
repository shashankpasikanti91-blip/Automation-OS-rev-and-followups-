import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  href?: string;
  subtitle?: string;
}

const variantMap = {
  default: { icon: 'bg-primary/10 text-primary', value: 'text-foreground' },
  success: { icon: 'bg-emerald-500/10 text-emerald-500', value: 'text-emerald-600 dark:text-emerald-400' },
  warning: { icon: 'bg-amber-500/10 text-amber-500', value: 'text-amber-600 dark:text-amber-400' },
  danger: { icon: 'bg-red-500/10 text-red-500', value: 'text-red-600 dark:text-red-400' },
};

export function StatCard({ title, value, icon: Icon, variant = 'default', loading, href, subtitle }: StatCardProps) {
  const styles = variantMap[variant];

  const inner = (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-lg p-2', styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        {href && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-md bg-muted p-1">
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-3 space-y-1.5">
          <div className="skeleton-pulse h-7 w-20" />
          <div className="skeleton-pulse h-3.5 w-24" />
        </div>
      ) : (
        <div className="mt-3">
          <p className={cn('text-2xl font-bold tabular-nums', styles.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          {subtitle && <p className="text-2xs text-muted-foreground/60 mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
