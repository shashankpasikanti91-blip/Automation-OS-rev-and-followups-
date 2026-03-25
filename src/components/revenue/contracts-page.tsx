'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Search, Plus, AlertCircle } from 'lucide-react';
import { RenewalStatusBadge } from '@/components/crm/renewal-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';

interface ContractRecord {
  id: string;
  contractValue: number;
  currency?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  renewalStatus?: string;
  name: string;
  industry?: string;
}

export function ContractsPage() {
  const [items, setItems] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', hasContract: 'true' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`/api/crm/organizations?${params}`);
    const json = await res.json();
    const data = (json.data?.data ?? []).map((o: Record<string, unknown>) => ({
      id: o.id,
      contractValue: o.contractValue ?? 0,
      currency: o.currency ?? 'USD',
      contractStartDate: o.contractStartDate,
      contractEndDate: o.contractEndDate,
      renewalStatus: o.renewalStatus,
      name: o.name,
      industry: o.industry,
    }));
    setItems(data);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalARR = items.reduce((s, i) => s + (i.contractValue ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Contracts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">All client contracts and revenue records</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Contracts</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total ARR</p>
          <p className="text-2xl font-bold text-emerald-400">${totalARR.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contracts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Start</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">End</th>
                <th className="text-left px-4 py-3 font-medium">Value</th>
                <th className="text-left px-4 py-3 font-medium">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No contracts found</p>
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.industry && <p className="text-xs text-muted-foreground">{item.industry}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                    {item.contractStartDate ? format(new Date(item.contractStartDate), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-muted-foreground">
                    {item.contractEndDate ? format(new Date(item.contractEndDate), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.contractValue
                      ? <Badge variant="success">{item.currency ?? '$'}{item.contractValue.toLocaleString()}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {item.renewalStatus ? <RenewalStatusBadge status={item.renewalStatus} /> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
