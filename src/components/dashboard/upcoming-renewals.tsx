'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Renewal {
  id: string;
  renewalDate: string;
  renewalStatus: string;
  contractValue?: number;
  currency?: string;
  organization?: { name: string };
}

export function UpcomingRenewals() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revenue/renewals?limit=6&days=30')
      .then((r) => r.json())
      .then((res) => { setRenewals(res.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const daysUntil = (date: string) => differenceInDays(new Date(date), new Date());

  const badgeColor = (days: number) => {
    if (days < 0) return 'bg-red-500/10 text-red-600 dark:text-red-400';
    if (days <= 7) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    if (days <= 14) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Upcoming Renewals</h3>
          <p className="text-xs text-muted-foreground">Next 30 days</p>
        </div>
        <Link href="/revenue/renewals" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-10 rounded-lg" />)}
        </div>
      ) : renewals.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No upcoming renewals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {renewals.map((r) => {
            const days = daysUntil(r.renewalDate);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.organization?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.renewalDate), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {r.contractValue && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {r.currency ?? '$'}{r.contractValue.toLocaleString()}
                    </span>
                  )}
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badgeColor(days))}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
