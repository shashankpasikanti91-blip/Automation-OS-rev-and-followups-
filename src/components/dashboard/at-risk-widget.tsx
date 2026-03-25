'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgAtRisk {
  id: string;
  name: string;
  riskScore: number;
  industry?: string;
  nextFollowUpAt?: string;
}

export function AtRiskWidget() {
  const [orgs, setOrgs] = useState<OrgAtRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/organizations?limit=5&minRisk=70')
      .then((r) => r.json())
      .then((res) => { setOrgs(res.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const riskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10';
    return 'text-amber-500 bg-amber-500/10';
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Risk Monitor</h3>
          <p className="text-xs text-muted-foreground">High-risk clients requiring attention</p>
        </div>
        <Link href="/revenue/at-risk" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-10 rounded-lg" />)}
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No high-risk clients detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/crm/organizations/${org.id}`}
              className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                {org.industry && <p className="text-xs text-muted-foreground">{org.industry}</p>}
              </div>
              <div className={cn('rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ml-2', riskColor(org.riskScore))}>
                {org.riskScore}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
