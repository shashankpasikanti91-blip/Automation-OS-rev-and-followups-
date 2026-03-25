import { cn } from '@/lib/utils';

export function RiskScoreBadge({ score }: { score: number }) {
  const className =
    score >= 80 ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
    score >= 60 ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
    score >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

  const label =
    score >= 80 ? 'Critical' :
    score >= 60 ? 'High' :
    score >= 40 ? 'Medium' : 'Low';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      <span className="tabular-nums font-bold">{score}</span>
      <span className="font-normal">{label}</span>
    </span>
  );
}
