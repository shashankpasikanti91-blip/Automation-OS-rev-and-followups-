'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Search, Wand2, TrendingDown } from 'lucide-react';
import { RiskScoreBadge } from '@/components/crm/risk-score-badge';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiGenerateDialog } from '@/components/revenue/ai-generate-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface RiskOrg {
  id: string;
  name: string;
  riskScore: number;
  renewalStatus?: string;
  contractValue?: number;
  industry?: string;
  city?: string;
  country?: string;
}

export function AtRiskPage() {
  const [orgs, setOrgs] = useState<RiskOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<{ id: string; name: string } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', minRisk: '60', sortBy: 'riskScore', sortOrder: 'desc' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`/api/crm/organizations?${params}`);
    const json = await res.json();
    setOrgs(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const critical = orgs.filter((o) => o.riskScore >= 80).length;
  const high = orgs.filter((o) => o.riskScore >= 60 && o.riskScore < 80).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            At-Risk Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Clients with high churn risk requiring immediate action</p>
        </div>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total At-Risk</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Critical (80+)</p>
          <p className="text-2xl font-bold text-red-400">{critical}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">High (60–79)</p>
          <p className="text-2xl font-bold text-amber-400">{high}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Revenue at Risk</p>
          <p className="text-2xl font-bold text-orange-400">
            ${orgs.reduce((s, o) => s + (o.contractValue ?? 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <TrendingDown className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-sm">No at-risk clients found</p>
          <p className="text-xs text-muted-foreground mt-1">Clients with risk score ≥ 60 will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className={cn(
                'rounded-xl border bg-card p-4 space-y-3 hover:border-amber-500/40 transition-colors',
                org.riskScore >= 80 && 'border-red-500/30 bg-red-500/5'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.industry ?? 'Unknown industry'} · {org.city ?? org.country ?? '—'}</p>
                </div>
                <RiskScoreBadge score={org.riskScore} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {org.renewalStatus && <RenewalStatusBadge status={org.renewalStatus} />}
                {org.contractValue && (
                  <span className="text-xs text-muted-foreground">${org.contractValue.toLocaleString()}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs"
                onClick={() => { setAiTarget({ id: org.id, name: org.name }); setAiOpen(true); }}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Explain Risk & Actions
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next</Button>
          </div>
        </div>
      )}

      {aiTarget && (
        <AiGenerateDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          type="risk_explanation"
          entityId={aiTarget.id}
          entityName={aiTarget.name}
        />
      )}
    </div>
  );
}
