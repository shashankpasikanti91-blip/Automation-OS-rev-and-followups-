'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Policy {
  id: string;
  policyNumber: string;
  insurer: string;
  type: string;
  startDate: string;
  endDate: string;
  premium: number;
  currency: string;
  status: string;
  organization?: { name: string };
}

const STATUS_VARIANTS: Record<string, string> = {
  ACTIVE: 'success', PENDING: 'info', LAPSED: 'danger', CANCELLED: 'danger', EXPIRED: 'warning', RENEWED: 'success',
};

export function InsureFlowPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/packs/insure/policies?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setPolicies(json.data?.data ?? []);
    setTotal(json.data?.meta?.total ?? 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const active = policies.filter((p) => p.status === 'ACTIVE').length;
  const totalPremium = policies.reduce((sum, p) => sum + (p.premium ?? 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            InsureFlow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Policy & claims management</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Policy</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Policies</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground">Total Premium (loaded)</p>
          <p className="text-2xl font-bold">{formatCurrency(totalPremium)}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search policies…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Policy #</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Insurer</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Premium</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Ends</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton-pulse h-4 rounded" /></td>)}
                  </tr>
                ))
              ) : policies.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center"><AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No policies found</p></td></tr>
              ) : policies.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{p.policyNumber}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">{p.insurer}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-right">{formatCurrency(p.premium, p.currency)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{format(new Date(p.endDate), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[p.status] as 'ghost' | 'success' | 'danger' | 'warning' | 'info' | undefined}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
